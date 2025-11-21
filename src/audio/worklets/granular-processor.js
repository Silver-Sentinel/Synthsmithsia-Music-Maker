class GranularProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.buffer = null;
        this.grains = [];
        this.maxGrains = 64;
        for (let i = 0; i < this.maxGrains; i++) {
            this.grains.push({
                active: false,
                pos: 0,
                inc: 1,
                life: 0,
                maxLife: 0,
                amp: 0
            });
        }
        this.nextSpawnTime = 0;

        this.port.onmessage = (e) => {
            if (e.data.type === 'buffer') {
                this.buffer = e.data.buffer;
            }
        };
    }

    static get parameterDescriptors() {
        return [
            { name: 'position', defaultValue: 0.5, minValue: 0, maxValue: 1 },
            { name: 'spread', defaultValue: 0.1, minValue: 0, maxValue: 1 },
            { name: 'grainSize', defaultValue: 0.1, minValue: 0.01, maxValue: 1 }, // seconds
            { name: 'density', defaultValue: 20, minValue: 1, maxValue: 100 }, // grains per second
            { name: 'pitch', defaultValue: 1, minValue: 0.1, maxValue: 4 }
        ];
    }

    process(inputs, outputs, parameters) {
        const output = outputs[0];
        const channel = output[0];

        if (!this.buffer) return true;

        const position = parameters.position[0];
        const spread = parameters.spread[0];
        const grainSize = parameters.grainSize[0];
        const density = parameters.density[0];
        const pitch = parameters.pitch[0];

        const spawnInterval = sampleRate / density;

        for (let i = 0; i < channel.length; i++) {
            // Spawn logic
            this.nextSpawnTime--;
            if (this.nextSpawnTime <= 0) {
                this.spawnGrain(position, spread, grainSize, pitch);
                this.nextSpawnTime = spawnInterval * (0.5 + Math.random()); // Randomize slightly
            }

            let sample = 0;
            // Process grains
            for (let g = 0; g < this.maxGrains; g++) {
                const grain = this.grains[g];
                if (grain.active) {
                    // Read from buffer
                    const intPos = Math.floor(grain.pos);
                    if (intPos < this.buffer.length && intPos >= 0) {
                        // Windowing (Hanning)
                        const window = 0.5 * (1 - Math.cos(2 * Math.PI * grain.life / grain.maxLife));
                        sample += this.buffer[intPos] * window * 0.5;
                    }

                    // Advance
                    grain.pos += grain.inc;
                    grain.life++;

                    if (grain.life >= grain.maxLife) {
                        grain.active = false;
                    }
                }
            }
            channel[i] = sample;
        }

        return true;
    }

    spawnGrain(pos, spread, size, pitch) {
        const grain = this.grains.find(g => !g.active);
        if (grain) {
            grain.active = true;
            const randomOffset = (Math.random() * 2 - 1) * spread;
            let startPos = (pos + randomOffset) * this.buffer.length;

            // Wrap or clamp
            if (startPos < 0) startPos = 0;
            if (startPos >= this.buffer.length) startPos = this.buffer.length - 1;

            grain.pos = startPos;
            grain.inc = pitch;
            grain.life = 0;
            grain.maxLife = size * sampleRate;
        }
    }
}
registerProcessor('granular-processor', GranularProcessor);
