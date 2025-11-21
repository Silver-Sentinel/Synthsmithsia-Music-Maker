import { Effect } from './Effect.js';

export class Distortion extends Effect {
    constructor(ctx) {
        super(ctx);
        this.shaper = ctx.createWaveShaper();
        this.shaper.curve = this.makeDistortionCurve(0); // Init with 0 amount
        this.shaper.oversample = '4x';

        this.wet.disconnect();
        this.wet.connect(this.shaper);
        this.shaper.connect(this.output);
    }

    setAmount(amount) {
        // Amount 0 to 100
        this.shaper.curve = this.makeDistortionCurve(amount);
    }

    makeDistortionCurve(amount) {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;

        for (let i = 0; i < n_samples; ++i) {
            const x = i * 2 / n_samples - 1;
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }
}
