// --- DSP Helpers ---
class OnePole {
    constructor() { this.z1 = 0; }
    process(x, a) {
        return this.z1 = x * (1.0 - a) + this.z1 * a;
    }
}

// 3. Modal Processor (Percussion)
class ModalProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        // Bank of 4 Resonators
        this.filters = [new OnePole(), new OnePole(), new OnePole(), new OnePole()];
        this.gains = [1.0, 0.5, 0.3, 0.2];
        this.ratios = [1.0, 3.99, 9.2, 13.5]; // Marimba-ish
        this.decays = [0.998, 0.995, 0.992, 0.990];
        this.phases = [0, 0, 0, 0];
    }

    static get parameterDescriptors() {
        return [{ name: 'frequency', defaultValue: 440 }];
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0][0];
        const input = inputs[0][0] || new Float32Array(output.length);
        const freq = parameters.frequency[0];

        for (let i = 0; i < output.length; i++) {
            let outSample = 0;
            const exciter = input[i];

            // Simple Modal Summation (Sine approximation for efficiency)
            // In a real modal filter, we'd use Biquads, but for this demo we use decaying sines
            // triggered by the input impulse.

            // Actually, let's use the input to "ping" the resonators.
            // Since we don't have full Biquads in this snippet, we'll simulate 
            // modal resonance by adding energy to the phase accumulators when input > 0

            if (Math.abs(exciter) > 0.01) {
                for (let m = 0; m < 4; m++) this.gains[m] = 1.0 / (m + 1); // Reset energy
            }

            for (let m = 0; m < 4; m++) {
                const f = freq * this.ratios[m];
                const phaseInc = (f * 2 * Math.PI) / sampleRate;
                this.phases[m] += phaseInc;
                if (this.phases[m] > 2 * Math.PI) this.phases[m] -= 2 * Math.PI;

                // Decay amplitude
                this.gains[m] *= this.decays[m];

                outSample += Math.sin(this.phases[m]) * this.gains[m] * 0.3;
            }

            output[i] = outSample;
        }
        return true;
    }
}

registerProcessor('modal-processor', ModalProcessor);
