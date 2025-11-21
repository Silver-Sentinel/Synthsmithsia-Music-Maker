export class Instrument {
    constructor(ctx, destination) {
        this.ctx = ctx;
        this.output = ctx.createGain();
        this.output.connect(destination);
        this.name = this.constructor.name;
        this.preset = 'Default';
    }

    trigger(note, time, duration) {
        // Override in subclasses
    }

    setPreset(presetName) {
        this.preset = presetName;
        // Override to apply params
    }
}
