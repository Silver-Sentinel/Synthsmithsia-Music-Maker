import { Tooltip } from './Tooltip.js';

export class InstrumentRack {
    constructor(container, engine, onSelect) {
        this.container = container;
        this.engine = engine;
        this.onSelect = onSelect;
        this.categories = {
            'Synths': ['AnalogSynth', 'GranularInstrument'],
            'Strings': ['StringInstrument'],
            'Winds': ['WindInstrument'],
            'Brass': [], // To be implemented
            'Percussion': ['PercussionInstrument']
        };
        this.expandedCategories = new Set(['Synths', 'Strings', 'Winds', 'Percussion']); // Default open
        this.render();
    }

    render() {
        this.container.innerHTML = '';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.gap = '10px';
        this.container.style.padding = '10px';
        this.container.style.overflowY = 'auto';

        Object.keys(this.categories).forEach(category => {
            const catDiv = document.createElement('div');
            catDiv.className = 'rack-category';
            catDiv.style.background = 'rgba(255, 255, 255, 0.05)';
            catDiv.style.borderRadius = '8px';
            catDiv.style.overflow = 'hidden';

            // Header
            const header = document.createElement('div');
            header.style.padding = '10px';
            header.style.background = 'rgba(255, 255, 255, 0.1)';
            header.style.cursor = 'pointer';
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';

            const titleContainer = document.createElement('div');
            titleContainer.innerHTML = `<strong>${category}</strong>`;
            // Add Tooltip
            Tooltip.attach(titleContainer, `Instruments in the ${category} family.`);

            const arrow = document.createElement('span');
            arrow.innerText = this.expandedCategories.has(category) ? '▼' : '▶';

            header.appendChild(titleContainer);
            header.appendChild(arrow);

            header.onclick = (e) => {
                // Prevent tooltip click from toggling if possible, but header click is fine
                if (e.target.className === 'tooltip-icon') return;
                if (this.expandedCategories.has(category)) {
                    this.expandedCategories.delete(category);
                } else {
                    this.expandedCategories.add(category);
                }
                this.render();
            };
            catDiv.appendChild(header);

            // Content
            if (this.expandedCategories.has(category)) {
                const content = document.createElement('div');
                content.style.padding = '5px';

                // List Instruments in this category
                this.engine.instruments.forEach((inst, index) => {
                    if (this.isInCategory(inst, category)) {
                        const item = document.createElement('div');
                        item.className = 'instrument-item';
                        item.style.padding = '8px';
                        item.style.margin = '5px 0';
                        item.style.background = 'rgba(0, 0, 0, 0.3)';
                        item.style.borderRadius = '4px';
                        item.style.cursor = 'pointer';
                        item.style.borderLeft = '3px solid var(--accent-primary)';
                        item.style.display = 'flex';
                        item.style.justifyContent = 'space-between';
                        item.style.alignItems = 'center';

                        const nameSpan = document.createElement('span');
                        nameSpan.innerText = this.getInstrumentName(inst, index);
                        item.appendChild(nameSpan);

                        // Controls Container
                        const controls = document.createElement('div');
                        controls.style.display = 'flex';
                        controls.style.gap = '5px';

                        // Mute Button
                        const muteBtn = document.createElement('button');
                        muteBtn.innerText = 'M';
                        muteBtn.style.fontSize = '0.7rem';
                        muteBtn.style.padding = '2px 5px';
                        muteBtn.style.background = inst.muted ? '#f00' : '#444';
                        muteBtn.style.border = 'none';
                        muteBtn.style.color = 'white';
                        muteBtn.style.cursor = 'pointer';
                        muteBtn.onclick = (e) => {
                            e.stopPropagation();
                            inst.muted = !inst.muted;
                            // Apply mute logic (handled in Instrument or Engine)
                            if (inst.output) inst.output.gain.value = inst.muted ? 0 : 1;
                            this.render(); // Re-render to update color
                        };
                        controls.appendChild(muteBtn);

                        // Solo Button
                        const soloBtn = document.createElement('button');
                        soloBtn.innerText = 'S';
                        soloBtn.style.fontSize = '0.7rem';
                        soloBtn.style.padding = '2px 5px';
                        soloBtn.style.background = inst.solo ? '#ff0' : '#444';
                        soloBtn.style.color = inst.solo ? 'black' : 'white';
                        soloBtn.style.border = 'none';
                        soloBtn.style.cursor = 'pointer';
                        soloBtn.onclick = (e) => {
                            e.stopPropagation();
                            // Toggle Solo
                            inst.solo = !inst.solo;
                            // Logic: If any instrument is soloed, mute all non-soloed.
                            this.engine.updateSoloState();
                            this.render();
                        };
                        controls.appendChild(soloBtn);

                        // Randomizer Dice
                        const diceBtn = document.createElement('button');
                        diceBtn.innerText = '🎲';
                        diceBtn.style.fontSize = '0.7rem';
                        diceBtn.style.padding = '2px 5px';
                        diceBtn.style.background = '#444';
                        diceBtn.style.border = 'none';
                        diceBtn.style.cursor = 'pointer';
                        diceBtn.title = "Randomize Pattern";
                        diceBtn.onclick = (e) => {
                            e.stopPropagation();
                            this.randomizePattern(index);
                        };
                        controls.appendChild(diceBtn);

                        item.appendChild(controls);

                        item.onclick = () => {
                            // Visual selection
                            this.container.querySelectorAll('.instrument-item').forEach(el => el.style.background = 'rgba(0, 0, 0, 0.3)');
                            item.style.background = 'rgba(255, 255, 255, 0.1)';
                            if (this.onSelect) this.onSelect(index);
                        };

                        content.appendChild(item);
                    }
                });

                // "Add" Button (Placeholder for now)
                const addBtn = document.createElement('button');
                addBtn.innerText = '+ Add Track';
                addBtn.style.width = '100%';
                addBtn.style.padding = '5px';
                addBtn.style.marginTop = '5px';
                addBtn.style.background = 'transparent';
                addBtn.style.border = '1px dashed #555';
                addBtn.style.color = '#888';
                addBtn.style.cursor = 'pointer';
                addBtn.onclick = () => {
                    alert('Track addition not yet implemented');
                };
                content.appendChild(addBtn);

                catDiv.appendChild(content);
            }

            this.container.appendChild(catDiv);
        });
    }

    isInCategory(inst, category) {
        const type = inst.constructor.name;
        return this.categories[category].includes(type);
    }

    randomizePattern(trackIndex) {
        if (!this.engine.sequence || !this.engine.sequence.tracks[trackIndex]) return;

        const track = this.engine.sequence.tracks[trackIndex];
        // Clear track
        track.steps = {};

        // Generate random steps (Euclidean-ish or just random density)
        const density = 0.3 + Math.random() * 0.4; // 30-70% density
        for (let i = 0; i < 16; i++) {
            if (Math.random() < density) {
                // Note selection could be scale-aware if we had access to grid scale, 
                // but for now let's stick to root note or simple variation.
                // Base note depends on instrument type?
                // Let's just use a default note for now (e.g. 60 or 36 for drums)
                // Ideally we check instrument type.
                let note = 60;
                const inst = this.engine.instruments[trackIndex];
                if (inst.constructor.name === 'AnalogSynth' && inst.type === 'square') note = 36; // Kick
                if (inst.constructor.name === 'PercussionInstrument') note = 36; // Drum base

                track.steps[i] = { note: note, velocity: 0.7 + Math.random() * 0.3, duration: 1 };
            }
        }

        // Force redraw of grid if available (we don't have direct ref here, but main loop might catch it? 
        // Actually Grid needs manual redraw call usually. 
        // We can dispatch an event or assume user will click grid. 
        // Better: pass a callback for redraw or use an event bus.
        // For this MVP, we'll just let it be updated on next interaction or rely on visualizer loop if it redrew grid (it doesn't).
        // We need to trigger a grid redraw.
        // Let's dispatch a custom event on window.
        window.dispatchEvent(new CustomEvent('pattern-changed'));
    }

    getInstrumentName(inst, index) {
        // Use a name property if available, else fallback
        if (inst.name) return inst.name;
        return `${index + 1}. ${inst.constructor.name.replace('Instrument', '').replace('Analog', '')}`;
    }
}
