import { Instrument } from './Instrument.js';

export class AnalogSynth extends Instrument {
    constructor(ctx, destination, type = 'sawtooth') {
        super(ctx, destination);
        this.type = type;
        this.name = 'Analog Synth';
    }

    setPreset(name) {
        this.preset = name;
        this.name = name;
        switch (name) {
            case 'Lead':
                this.type = 'sawtooth';
                break;
            case 'Pad':
                this.type = 'triangle'; // Softer
                break;
            case 'Bass':
                this.type = 'square'; // Punchy
                break;
            case 'FX':
                this.type = 'sawtooth'; // Placeholder
                break;
            default:
                this.type = 'sawtooth';
        }
    }

    trigger(note, time, duration) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
    }
}
