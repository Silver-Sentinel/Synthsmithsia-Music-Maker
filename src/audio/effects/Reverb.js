import { Effect } from './Effect.js';

export class Reverb extends Effect {
    constructor(ctx) {
        super(ctx);
        this.convolver = ctx.createConvolver();
        this.generateImpulse(2.0, 2.0); // Default 2s decay

        this.wet.disconnect();
        this.wet.connect(this.convolver);
        this.convolver.connect(this.output);
    }

    generateImpulse(duration, decay) {
        const length = this.ctx.sampleRate * duration;
        const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const n = i;
            // Simple exponential decay noise
            const val = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
            left[i] = val;
            right[i] = val;
        }
        this.convolver.buffer = impulse;
    }
}
