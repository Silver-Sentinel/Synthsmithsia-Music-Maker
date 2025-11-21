import { Tooltip } from './Tooltip.js';

export class InstrumentEditor {
    constructor(container, engine) {
        this.container = container;
        this.engine = engine;
        this.selectedInstrumentIndex = 0;
        this.render();
    }

    selectInstrument(index) {
        this.selectedInstrumentIndex = index;
        this.render();
    }

    render() {
        this.container.innerHTML = '';

        // --- Master Effects Section ---
        const fxHeader = document.createElement('h3');
        fxHeader.style.margin = '0 0 10px 0';
        fxHeader.style.color = 'var(--accent-secondary)';
        fxHeader.innerText = 'Master Effects';
        Tooltip.attach(fxHeader, "Global effects applied to the final output.");
        this.container.appendChild(fxHeader);

        if (this.engine.effects) {
            this.createSlider('Distortion', 0, 100, 0, 1, (val) => {
                this.engine.effects.distortion.setAmount(parseFloat(val));
                this.engine.effects.distortion.setWet(val > 0 ? 1 : 0); // Simple mix
            }, "Adds grit and saturation.");
            this.createSlider('Delay Mix', 0, 1, 0.2, 0.01, (val) => {
                this.engine.effects.delay.setWet(parseFloat(val));
            }, "Echo effect volume.");
            this.createSlider('Reverb Mix', 0, 1, 0.3, 0.01, (val) => {
                this.engine.effects.reverb.setWet(parseFloat(val));
            }, "Room ambience volume.");

            const vibeHeader = document.createElement('h4');
            vibeHeader.style.margin = '10px 0 5px 0';
            vibeHeader.style.color = 'var(--accent-secondary)';
            vibeHeader.innerText = 'Vibe LFO';
            Tooltip.attach(vibeHeader, "Low Frequency Oscillator for dynamic modulation.");
            this.container.appendChild(vibeHeader);

            this.createSlider('Vibe Rate', 0.01, 5, 0.1, 0.01, (val) => {
                this.engine.vibeManager.setRate(parseFloat(val));
            }, "Speed of the modulation.");
            this.createSlider('Vibe Depth', 0, 1, 0.2, 0.01, (val) => {
                this.engine.vibeManager.setDepth(parseFloat(val));
            }, "Intensity of the modulation.");
        }

        const hr = document.createElement('hr');
        hr.style.borderColor = '#333';
        hr.style.margin = '20px 0';
        this.container.appendChild(hr);

        // --- Instrument Section ---
        if (this.selectedInstrumentIndex < 0 || this.selectedInstrumentIndex >= this.engine.instruments.length) {
            const msg = document.createElement('div');
            msg.style.color = 'var(--text-dim)';
            msg.innerText = 'No instrument selected';
            this.container.appendChild(msg);
            return;
        }

        const instrument = this.engine.instruments[this.selectedInstrumentIndex];
        const name = this.getInstrumentName(this.selectedInstrumentIndex);

        const header = document.createElement('h3');
        header.style.margin = '0 0 10px 0';
        header.style.color = 'var(--accent-primary)';
        header.innerText = `Editing: ${name}`;
        this.container.appendChild(header);

        // Preset Selector
        const presets = this.getPresetsForInstrument(instrument);
        if (presets.length > 0) {
            this.createSelect('Preset', presets, instrument.preset, (val) => {
                instrument.setPreset(val);
                // Refresh header name
                header.innerText = `Editing: ${instrument.name}`;
                // Refresh Rack UI (hacky but needed to update name in list)
                // Ideally Rack observes changes.
                // For now, we might need to trigger a rack refresh if we had access.
            });
        }

        // Generate Controls based on Instrument Type
        if (instrument.constructor.name === 'AnalogSynth') {
            this.createSelect('Waveform', ['sawtooth', 'square', 'triangle', 'sine'], instrument.type, (val) => {
                instrument.type = val;
            });
        } else if (instrument.constructor.name === 'StringInstrument') {
            this.createInfo('Physical Model: Karplus-Strong');
        } else if (instrument.constructor.name === 'WindInstrument') {
            this.createInfo('Physical Model: Clarinet (Single Reed)');
        } else if (instrument.constructor.name === 'GranularInstrument') {
            this.createInfo('Granular Cloud Generator');

            const wrapper = document.createElement('div');
            wrapper.style.marginTop = '10px';

            const label = document.createElement('label');
            label.innerText = 'Load Sample:';
            label.style.display = 'block';
            label.style.fontSize = '0.8rem';
            label.style.color = 'var(--text-dim)';
            Tooltip.attach(label, "Upload a custom audio file for granular synthesis.");

            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'audio/*';
            fileInput.style.color = 'var(--text-color)';

            fileInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const arrayBuffer = await file.arrayBuffer();
                    try {
                        const audioBuffer = await this.engine.ctx.decodeAudioData(arrayBuffer);
                        instrument.setBuffer(audioBuffer);
                        this.createInfo(`Loaded: ${file.name}`);
                    } catch (err) {
                        console.error('Error decoding audio:', err);
                        this.createInfo('Error loading file');
                    }
                }
            });

            wrapper.appendChild(label);
            wrapper.appendChild(fileInput);
            this.container.appendChild(wrapper);
        }
    }

    getInstrumentName(index) {
        const names = [
            '1. Analog Kick',
            '2. String Pluck',
            '3. Clarinet',
            '4. Marimba',
            '5. Granular Cloud'
        ];
        return names[index] || `Instrument ${index + 1}`;
    }

    getPresetsForInstrument(inst) {
        const type = inst.constructor.name;
        switch (type) {
            case 'StringInstrument':
                return ['Acoustic Guitar', 'Electric Guitar', 'Bass Guitar', 'Harp'];
            case 'WindInstrument':
                return ['Clarinet', 'Flute', 'Saxophone', 'Trumpet'];
            case 'PercussionInstrument':
                return ['Marimba', 'Vibraphone', 'Drum Kit'];
            case 'AnalogSynth':
                return ['Lead', 'Pad', 'Bass', 'FX']; // Need to implement these in AnalogSynth
            default:
                return [];
        }
    }

    createSlider(label, min, max, value, step, callback, tooltipText) {
        const wrapper = document.createElement('div');
        wrapper.style.marginBottom = '10px';

        const labelEl = document.createElement('label');
        labelEl.innerText = `${label}: ${value}`;
        labelEl.style.display = 'inline-block';
        labelEl.style.fontSize = '0.8rem';
        labelEl.style.color = 'var(--text-dim)';

        if (tooltipText) {
            Tooltip.attach(labelEl, tooltipText);
        }

        const input = document.createElement('input');
        input.type = 'range';
        input.min = min;
        input.max = max;
        input.step = step;
        input.value = value;
        input.style.width = '100%';

        input.addEventListener('input', (e) => {
            labelEl.innerText = `${label}: ${e.target.value}`;
            callback(e.target.value);
        });

        wrapper.appendChild(labelEl);
        wrapper.appendChild(input);
        this.container.appendChild(wrapper);
    }

    createSelect(label, options, value, callback) {
        const wrapper = document.createElement('div');
        wrapper.style.marginBottom = '10px';

        const labelEl = document.createElement('label');
        labelEl.innerText = label;
        labelEl.style.display = 'block';
        labelEl.style.fontSize = '0.8rem';
        labelEl.style.color = 'var(--text-dim)';

        const select = document.createElement('select');
        select.style.width = '100%';
        select.style.background = '#333';
        select.style.color = 'white';
        select.style.border = '1px solid #444';
        select.style.padding = '4px';

        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.innerText = opt;
            if (opt === value) option.selected = true;
            select.appendChild(option);
        });

        select.addEventListener('change', (e) => {
            callback(e.target.value);
        });

        wrapper.appendChild(labelEl);
        wrapper.appendChild(select);
        this.container.appendChild(wrapper);
    }

    createInfo(text) {
        const div = document.createElement('div');
        div.innerText = text;
        div.style.color = 'var(--text-dim)';
        div.style.fontSize = '0.8rem';
        div.style.fontStyle = 'italic';
        this.container.appendChild(div);
    }
}
