import { Instrument } from './Instrument.js';

export class PercussionInstrument extends Instrument {
    constructor(ctx, destination) {
        super(ctx, destination);
        this.type = 'marimba';
        this.name = 'Marimba';
    }

    setPreset(name) {
        this.preset = name;
        this.name = name;
        switch (name) {
            case 'Marimba':
                this.type = 'marimba';
                break;
            case 'Vibraphone':
                this.type = 'vibraphone';
                break;
            case 'Drum Kit':
                this.type = 'drumkit'; // Special handling for mapping
                break;
            default:
                this.type = 'marimba';
        }
    }

    trigger(note, time, duration) {
        if (this.type === 'drumkit') {
            this.triggerDrum(note, time);
            return;
        }

        const node = new AudioWorkletNode(this.ctx, 'modal-processor');
        const frequency = 440 * Math.pow(2, (note - 69) / 12);

        const freqParam = node.parameters.get('frequency');
        freqParam.setValueAtTime(frequency, time);

        // Adjust ratios for Vibe vs Marimba
        // This would ideally be a parameter on the worklet

        node.connect(this.output);
        setTimeout(() => node.disconnect(), duration * 1000 + 1000);
    }

    triggerDrum(note, time) {
        // Simple FM/Noise synthesis for drums
        // Kick (36), Snare (38), HiHat (42)

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.output);

        if (note === 36) { // Kick
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
            gain.gain.setValueAtTime(1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
            osc.start(time);
            osc.stop(time + 0.5);
        } else if (note === 38) { // Snare
            // Noise burst + Tone
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, time);
            gain.gain.setValueAtTime(0.5, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
            osc.start(time);
            osc.stop(time + 0.2);

            // Add Noise (Simplified)
            // In a real app, we'd use a noise buffer
        } else if (note === 42) { // HiHat
            // High frequency noise
            // Placeholder: High square
            osc.type = 'square';
            osc.frequency.setValueAtTime(8000, time); // Metallic
            gain.gain.setValueAtTime(0.3, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
            osc.start(time);
            osc.stop(time + 0.05);
        }
    }
}
