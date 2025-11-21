import { Instrument } from './Instrument.js';

export class WindInstrument extends Instrument {
    constructor(ctx, destination) {
        super(ctx, destination);
        this.type = 'clarinet'; // Default
        this.name = 'Clarinet';
    }

    setPreset(name) {
        this.preset = name;
        this.name = name;
        switch (name) {
            case 'Flute':
                this.type = 'flute'; // Will map to specific processor logic or param
                break;
            case 'Clarinet':
                this.type = 'clarinet';
                break;
            case 'Saxophone':
                this.type = 'sax';
                break;
            case 'Trumpet':
                this.type = 'trumpet';
                break;
            default:
                this.type = 'clarinet';
        }
    }

    trigger(note, time, duration) {
        // We currently have 'clarinet-processor'. We might need more or make it generic.
        // For now, let's reuse clarinet-processor but change parameters if possible.
        // Or, if we want distinct models, we need distinct processors.
        // Given the constraint, let's use the existing processor but modulate it.

        const node = new AudioWorkletNode(this.ctx, 'clarinet-processor');
        const frequency = 440 * Math.pow(2, (note - 69) / 12);

        const freqParam = node.parameters.get('frequency');
        freqParam.setValueAtTime(frequency, time);

        // Simulate different timbres via envelope and noise
        // This is a simplification.

        node.connect(this.output);

        // Envelope
        this.output.gain.cancelScheduledValues(time);
        this.output.gain.setValueAtTime(0, time);

        if (this.type === 'flute') {
            // Slower attack
            this.output.gain.linearRampToValueAtTime(0.8, time + 0.1);
        } else if (this.type === 'trumpet') {
            // Fast attack, brassy
            this.output.gain.linearRampToValueAtTime(1.0, time + 0.02);
            this.output.gain.exponentialRampToValueAtTime(0.7, time + 0.1);
        } else {
            // Clarinet/Sax
            this.output.gain.linearRampToValueAtTime(1.0, time + 0.05);
        }

        this.output.gain.setValueAtTime(0, time + duration);

        setTimeout(() => node.disconnect(), duration * 1000 + 200);
    }
}
