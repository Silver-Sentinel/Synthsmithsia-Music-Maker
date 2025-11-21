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

        osc.type = this.type;
        osc.frequency.setValueAtTime(440 * Math.pow(2, (note - 69) / 12), time);

        osc.connect(gain);
        gain.connect(this.output);

        // Envelope
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.5, time + 0.01); // Attack
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration); // Decay/Release

        osc.start(time);
        osc.stop(time + duration + 0.1);
    }
}
