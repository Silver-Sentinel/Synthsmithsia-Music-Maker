import { Effect } from './Effect.js';

export class Delay extends Effect {
    constructor(ctx) {
        super(ctx);
        this.delayNode = ctx.createDelay(5.0);
        this.feedbackNode = ctx.createGain();
        this.filterNode = ctx.createBiquadFilter();

        this.delayNode.delayTime.value = 0.5;
        this.feedbackNode.gain.value = 0.4;
        this.filterNode.type = 'lowpass';
        this.filterNode.frequency.value = 2000;

        this.wet.disconnect();
        this.wet.connect(this.delayNode);
        this.delayNode.connect(this.feedbackNode);
        this.feedbackNode.connect(this.filterNode);
        this.filterNode.connect(this.delayNode); // Loop
        this.delayNode.connect(this.output);
    }

    setTime(time) {
        this.delayNode.delayTime.setValueAtTime(time, this.ctx.currentTime);
    }

    setFeedback(amount) {
        this.feedbackNode.gain.setValueAtTime(amount, this.ctx.currentTime);
    }
}
