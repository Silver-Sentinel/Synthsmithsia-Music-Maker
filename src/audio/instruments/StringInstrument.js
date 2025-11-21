import { Instrument } from './Instrument.js';

export class StringInstrument extends Instrument {
    constructor(ctx, destination) {
        super(ctx, destination);
        this.decay = 0.99;
        this.brightness = 0.5;
        this.name = 'String Pluck';
    }

    setPreset(name) {
        this.preset = name;
        this.name = name;
        switch (name) {
            case 'Acoustic Guitar':
                this.decay = 0.996;
                this.brightness = 0.8;
                break;
            case 'Electric Guitar':
                this.decay = 0.999; // Long sustain
                this.brightness = 0.9;
                break;
            case 'Bass Guitar':
                this.decay = 0.995;
                this.brightness = 0.3;
                break;
            case 'Harp':
                this.decay = 0.998;
                this.brightness = 0.6;
                break;
            default:
                this.decay = 0.99;
                this.brightness = 0.5;
        }
    }

    trigger(note, time, duration) {
        const node = new AudioWorkletNode(this.ctx, 'string-processor');
        const frequency = 440 * Math.pow(2, (note - 69) / 12);

        // Adjust frequency for Bass
        const finalFreq = this.preset.includes('Bass') ? frequency / 2 : frequency;

        const freqParam = node.parameters.get('frequency');
        freqParam.setValueAtTime(finalFreq, time);

        const decayParam = node.parameters.get('decay');
        decayParam.setValueAtTime(this.decay, time);

        node.connect(this.output);

        // Excitation (Pluck)
        // We can send a message or use a parameter to trigger the pluck
        // The processor should handle the noise burst on start

        // Cleanup
        setTimeout(() => node.disconnect(), duration * 1000 + 1000); // Allow tail
    }
}
