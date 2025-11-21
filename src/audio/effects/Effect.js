export class Effect {
    constructor(ctx) {
        this.ctx = ctx;
        this.input = ctx.createGain();
        this.output = ctx.createGain();
        this.wet = ctx.createGain();
        this.dry = ctx.createGain();

        this.input.connect(this.wet);
        this.input.connect(this.dry);

        this.wet.connect(this.output);
        this.dry.connect(this.output);

        this.setWet(0.5);
    }

    setWet(value) {
        this.wet.gain.value = value;
        this.dry.gain.value = 1 - value;
    }

    connect(destination) {
        this.output.connect(destination);
    }
}
