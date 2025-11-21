export class VibeManager {
    constructor(ctx, effects) {
        this.ctx = ctx;
        this.effects = effects;
        this.lfo = ctx.createOscillator();
        this.lfoGain = ctx.createGain();

        this.lfo.type = 'sine';
        this.lfo.frequency.value = 0.1; // Slow vibe
        this.lfoGain.gain.value = 0.0; // Depth

        this.lfo.connect(this.lfoGain);
        this.lfo.start();

        this.isConnected = false;
    }

    connectModulation() {
        if (this.isConnected) return;

        // Modulate Delay Feedback for "Dub" vibe
        // We need to connect LFO Gain to the AudioParam
        // Note: AudioParams are read-only, but we can connect nodes to them.

        // Since our Effect classes encapsulate nodes, we need access to the internal params.
        // This is a bit hacky, but we'll access them directly if possible or add methods.

        // Let's assume we want to modulate the Delay Feedback Gain
        if (this.effects.delay && this.effects.delay.feedbackNode) {
            this.lfoGain.connect(this.effects.delay.feedbackNode.gain);
            this.isConnected = true;
        }
    }

    setRate(rate) {
        this.lfo.frequency.setValueAtTime(rate, this.ctx.currentTime);
    }

    setDepth(depth) {
        this.lfoGain.gain.setValueAtTime(depth, this.ctx.currentTime);
    }
}
