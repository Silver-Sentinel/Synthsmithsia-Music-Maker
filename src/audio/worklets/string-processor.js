// --- DSP Helpers ---
// Simple One-Pole Lowpass
class OnePole {
    constructor() { this.z1 = 0; }
    process(x, a) {
        // y[n] = x[n] * (1-a) + y[n-1] * a
        // a is feedback coeff (0..1)
        return this.z1 = x * (1.0 - a) + this.z1 * a;
    }
}

// 1. Karplus-Strong String Processor
class StringProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.delayLine = new Float32Array(2048);
        this.ptr = 0;
        this.filter = new OnePole();
    }

    static get parameterDescriptors() {
        return [
            { name: 'frequency', defaultValue: 440 },
            { name: 'decay', defaultValue: 0.996 }
        ];
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0][0];
        const input = inputs[0][0] || new Float32Array(output.length);

        const freq = parameters.frequency[0];
        const decay = parameters.decay[0];

        // Tuning
        const delaySamples = sampleRate / freq;
        const intDelay = Math.floor(delaySamples);

        for (let i = 0; i < output.length; i++) {
            const readPtr = (this.ptr - intDelay + 2048) % 2048;
            const delayed = this.delayLine[readPtr];

            // Lowpass filter in feedback loop simulates energy loss
            const filtered = this.filter.process(delayed, 0.5);

            // Excitation (Input) + Feedback
            const next = input[i] + (filtered * decay);

            this.delayLine[this.ptr] = next;
            output[i] = next;

            this.ptr = (this.ptr + 1) % 2048;
        }
        return true;
    }
}

registerProcessor('string-processor', StringProcessor);
