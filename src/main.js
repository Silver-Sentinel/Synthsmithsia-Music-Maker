import { AudioEngine } from './audio/AudioEngine.js';
import { Grid } from './ui/Grid.js';
import { InstrumentEditor } from './ui/InstrumentEditor.js';
import { InstrumentRack } from './ui/InstrumentRack.js';
import { MidiExport } from './export/MidiExport.js';
import { AudioExport } from './export/AudioExport.js';
import { Tooltip } from './ui/Tooltip.js';

import { TutorialManager } from './ui/TutorialManager.js';
import { HistoryManager } from './logic/HistoryManager.js';
import { InputManager } from './ui/InputManager.js';

const engine = new AudioEngine();

// UI Elements
const startBtn = document.getElementById('start-btn');
const overlay = document.getElementById('overlay');
const playBtn = document.getElementById('play-btn');
const stopBtn = document.getElementById('stop-btn');
const vizCanvas = document.getElementById('viz-canvas');
const vizCtx = vizCanvas.getContext('2d');
const gridCanvas = document.getElementById('grid-canvas');
const paramsArea = document.getElementById('params-area');
const instrumentListContainer = document.getElementById('instrument-list');
const bpmInput = document.querySelector('#transport-controls input');
const header = document.querySelector('header');

let grid = null;
let editor = null;
let rack = null;
let tutorial = null;

// Add Export Buttons
const exportDiv = document.createElement('div');
exportDiv.style.marginLeft = 'auto';
exportDiv.style.marginRight = '20px';

const btnMidi = document.createElement('button');
btnMidi.className = 'btn';
btnMidi.innerText = 'Export MIDI';
btnMidi.style.marginRight = '10px';
Tooltip.attach(btnMidi, "Download sequence as MIDI file.");
btnMidi.onclick = () => {
    if (!engine.sequence) return;
    const exporter = new MidiExport(engine.sequence, engine.scheduler ? engine.scheduler.tempo : 120);
    const blob = exporter.generate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'synthsmithsia_project.mid';
    a.click();
};

const btnWav = document.createElement('button');
btnWav.className = 'btn';
btnWav.innerText = 'Export WAV';
Tooltip.attach(btnWav, "Render high-quality audio file.");
btnWav.onclick = async () => {
    if (!engine.sequence) return;
    btnWav.innerText = 'Rendering...';
    const exporter = new AudioExport(engine.sequence, engine.scheduler ? engine.scheduler.tempo : 120);
    const blob = await exporter.renderWav();
    if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'synthsmithsia_project.wav';
        a.click();
    }
    btnWav.innerText = 'Export WAV';
};

exportDiv.appendChild(btnMidi);
exportDiv.appendChild(btnWav);

// Tutorial Button
const tutBtn = document.createElement('button');
tutBtn.className = 'btn';
tutBtn.innerText = '🎓 Tutorial';
tutBtn.style.marginRight = '10px';
tutBtn.style.background = '#6a0dad'; // Purple for academy
Tooltip.attach(tutBtn, "Start the interactive guided tour.");
tutBtn.onclick = () => {
    if (tutorial) {
        if (tutorial.isActive) {
            tutorial.stop();
        } else {
            tutorial.start();
        }
    }
};

// Scale Selector
const scaleDiv = document.createElement('div');
scaleDiv.style.display = 'flex';
scaleDiv.style.alignItems = 'center';
scaleDiv.style.marginLeft = '20px';
scaleDiv.style.color = 'var(--text-dim)';
scaleDiv.style.fontSize = '0.9rem';
scaleDiv.innerHTML = '<span style="margin-right:5px">Key:</span>';

const scaleSelect = document.createElement('select');
scaleSelect.style.background = '#222';
scaleSelect.style.color = 'white';
scaleSelect.style.border = '1px solid #444';
scaleSelect.style.padding = '4px';
['Chromatic', 'C Major'].forEach(s => {
    const opt = document.createElement('option');
    opt.value = s;
    opt.innerText = s;
    scaleSelect.appendChild(opt);
});
scaleSelect.onchange = (e) => {
    if (grid) grid.setScale(e.target.value);
};
Tooltip.attach(scaleDiv, "Highlight notes in the selected key.");
scaleDiv.appendChild(scaleSelect);

if (header) {
    header.insertBefore(tutBtn, document.getElementById('cpu-meter'));
    header.insertBefore(exportDiv, document.getElementById('cpu-meter'));
    header.insertBefore(scaleDiv, document.getElementById('cpu-meter'));
}

// Save Project
const saveBtn = document.createElement('button');
saveBtn.className = 'btn';
saveBtn.innerText = '💾 Save';
saveBtn.style.marginRight = '10px';
Tooltip.attach(saveBtn, "Save project to JSON file.");
saveBtn.onclick = () => {
    const state = engine.getState();
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'synthsmithsia_project.json';
    a.click();
};

// Load Project
const loadBtn = document.createElement('button');
loadBtn.className = 'btn';
loadBtn.innerText = '📂 Load';
Tooltip.attach(loadBtn, "Load project from JSON file.");
const loadInput = document.createElement('input');
loadInput.type = 'file';
loadInput.accept = '.json';
loadInput.style.display = 'none';
loadInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        try {
            const state = JSON.parse(evt.target.result);
            engine.loadState(state);
            // Update UI
            if (bpmInput) bpmInput.value = engine.scheduler.tempo;
            // Update Grid Sequence reference if it was replaced
            grid.sequence = engine.scheduler.sequence;
            grid.draw();
            // Update Instrument Rack
            rack.render();
            // Update Editor if open
            editor.render();
            alert('Project Loaded!');
        } catch (err) {
            console.error(err);
            alert('Error loading project');
        }
    };
    reader.readAsText(file);
};
loadBtn.onclick = () => loadInput.click();

// Inject Save/Load into Header
const headerControls = document.getElementById('transport-controls');
headerControls.appendChild(saveBtn);
headerControls.appendChild(loadBtn);
headerControls.appendChild(loadInput); // Hidden input


startBtn.addEventListener('click', async () => {
    startBtn.innerText = "Initializing...";
    await engine.init();

    // Initialize Grid
    grid = new Grid(gridCanvas, engine.sequence, engine.scheduler);

    // Initialize Editor
    editor = new InstrumentEditor(paramsArea, engine);

    // Initialize Rack
    rack = new InstrumentRack(instrumentListContainer, engine, (index) => {
        if (editor) editor.selectInstrument(index);
        // Optional: Scroll grid to track?
    });

    // Initialize Tutorial
    tutorial = new TutorialManager(engine, grid, rack, editor);

    // Initialize History
    const history = new HistoryManager(grid);
    grid.history = history; // Link back for pushState

    // Initialize Input (Keyboard)
    const input = new InputManager(engine, editor);

    // Undo/Redo Shortcuts
    window.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            history.undo();
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
            e.preventDefault();
            history.redo();
        }
    });

    overlay.style.opacity = 0;
    setTimeout(() => overlay.style.display = 'none', 500);

    // Start visualizer loop
    requestAnimationFrame(drawVisualizer);
});

playBtn.addEventListener('click', () => {
    engine.startPlayback();
    playBtn.classList.add('active'); // Visual feedback
});

stopBtn.addEventListener('click', () => {
    engine.stopPlayback();
    playBtn.classList.remove('active');
});

// BPM Control
if (bpmInput) {
    bpmInput.addEventListener('change', (e) => {
        const bpm = parseInt(e.target.value);
        if (bpm > 0 && engine.scheduler) {
            engine.scheduler.tempo = bpm;
        }
    });
}

// Keyboard Shortcuts
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT') {
        e.preventDefault(); // Prevent scrolling
        if (engine.scheduler && engine.scheduler.isPlaying) {
            engine.stopPlayback();
            playBtn.classList.remove('active');
        } else {
            engine.startPlayback();
            playBtn.classList.add('active');
        }
    }
});

function drawVisualizer() {
    requestAnimationFrame(drawVisualizer);

    if (!engine.isReady) return;

    const width = vizCanvas.width;
    const height = vizCanvas.height;
    const bufferLength = engine.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    engine.analyser.getByteTimeDomainData(dataArray);

    vizCtx.fillStyle = '#000';
    vizCtx.fillRect(0, 0, width, height);

    vizCtx.lineWidth = 2;
    vizCtx.strokeStyle = '#00ff9d';
    vizCtx.beginPath();

    const sliceWidth = width * 1.0 / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * height / 2;

        if (i === 0) {
            vizCtx.moveTo(x, y);
        } else {
            vizCtx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    vizCtx.lineTo(vizCanvas.width, vizCanvas.height / 2);
    vizCtx.stroke();
}

// Resize canvases to fit containers
function resizeCanvases() {
    const gridContainer = document.getElementById('grid-container');
    if (gridContainer) {
        gridCanvas.width = gridContainer.clientWidth;
        gridCanvas.height = Math.max(gridContainer.clientHeight, 600); // Min height
    }

    const vizArea = document.getElementById('visualizer-area');
    if (vizArea) {
        vizCanvas.width = vizArea.clientWidth;
        vizCanvas.height = vizArea.clientHeight;
    }
}

window.addEventListener('resize', resizeCanvases);
resizeCanvases(); // Initial call

window.addEventListener('pattern-changed', () => {
    if (grid) grid.draw();
});
