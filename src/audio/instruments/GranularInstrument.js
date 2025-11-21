import { Instrument } from './Instrument.js';

export class GranularInstrument extends Instrument {
    constructor(ctx, destination) {
        super(ctx, destination);
        this.bufferData = null;
        this.initBuffer();
    }

    setBuffer(audioBuffer) {
        // Extract channel data (mono for now)
        this.bufferData = audioBuffer.getChannelData(0);
    }

    initBuffer() {
        // Create a rich texture buffer (2 seconds)
        const length = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        // Generate a harmonic texture (Sawtooths + Sine FM)
        for (let i = 0; i < length; i++) {
            const t = i / this.ctx.sampleRate;
            // Base drone
            let sample = 0;
            sample += Math.sin(2 * Math.PI * 220 * t) * 0.5;
            sample += Math.sin(2 * Math.PI * 330 * t) * 0.3; // 5th
            sample += Math.sin(2 * Math.PI * 440 * t) * 0.2; // Octave
            sample += Math.sin(2 * Math.PI * 554.37 * t) * 0.1; // Major 3rd

            // Add some FM modulation for texture
            const mod = Math.sin(2 * Math.PI * 5 * t);
            sample *= (1 + 0.3 * mod);

            data[i] = sample * Math.exp(-1 * t / 2); // Slight decay over the buffer
        }

        this.bufferData = data;
    }

    trigger(note, time, duration) {
        const node = new AudioWorkletNode(this.ctx, 'granular-processor');

        // Send buffer to worklet
        node.port.postMessage({ type: 'buffer', buffer: this.bufferData });

        // Map note to pitch speed (relative to base 220Hz)
        // If we play C3 (48), we want lower pitch. Base buffer is A3 (220Hz) approx.
        // Let's assume C4 (60) is our "normal" playback rate of 1.0 for simplicity, 
        // but since buffer is A3 based, maybe A3 (57) is 1.0.
        // Let's just map standard semitones.
        const pitch = Math.pow(2, (note - 57) / 12); // 57 is A3

        const pitchParam = node.parameters.get('pitch');
        pitchParam.setValueAtTime(pitch, time);

        // Dynamic parameters based on velocity or random could go here
        // node.parameters.get('density').setValueAtTime(20, time);

        node.connect(this.output);

        // Amplitude Envelope for the "Cloud"
        this.output.gain.cancelScheduledValues(time);
        this.output.gain.setValueAtTime(0, time);
        this.output.gain.linearRampToValueAtTime(1.0, time + 0.1);
        this.output.gain.linearRampToValueAtTime(0, time + duration);

        // Cleanup
        setTimeout(() => node.disconnect(), duration * 1000 + 200);
    }
}
