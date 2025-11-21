// --- DSP Helpers ---
class OnePole {
    constructor() { this.z1 = 0; }
    process(x, a) {
        return this.z1 = x * (1.0 - a) + this.z1 * a;
    }
}

// 2. Clarinet Processor (Single Reed)
class ClarinetProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.delayLine = new Float32Array(2048);
        this.ptr = 0;
        this.filter = new OnePole();
    }

    static get parameterDescriptors() {
        return [
            { name: 'frequency', defaultValue: 440 },
            { name: 'pressure', defaultValue: 0.0 } // Breath pressure
        ];
    }

    reedTable(deltaP) {
        // Polynomial approximation of reed: y = x - x^3
        // Clamped to -1..1
        const x = Math.max(-1, Math.min(1, deltaP));
        const slope = 0.8;
        return slope * (x - 0.5 * x * x * x);
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0][0];

        const freq = parameters.frequency[0];
        const pressure = parameters.pressure[0]; // Control signal

        // Clarinet is a closed-open tube, fundamental is c/4L
        // Delay line represents round trip (2L), so delay = sampleRate / (2 * freq)
        const delaySamples = sampleRate / (2 * freq);
        const intDelay = Math.floor(delaySamples);

        for (let i = 0; i < output.length; i++) {
            // Read from bore (incoming wave from bell)
            const readPtr = (this.ptr - intDelay + 2048) % 2048;
            const boreOut = this.delayLine[readPtr];

            // Reflection at bell (Lowpass + Inversion)
            // R = -1 for open end
            const reflected = -1 * this.filter.process(boreOut, 0.2);

            // Reed Interaction
            // DeltaP = Breath - BorePressure
            const deltaP = pressure - reflected;
            const reedFlow = this.reedTable(deltaP);

            // New wave entering bore = ReedFlow + Reflected
            const boreIn = reedFlow + reflected;

            this.delayLine[this.ptr] = boreIn;
            output[i] = boreOut; // Output sound radiating from bell

            this.ptr = (this.ptr + 1) % 2048;
        }
        return true;
    }
}

registerProcessor('clarinet-processor', ClarinetProcessor);
