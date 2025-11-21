import { Scheduler } from './Scheduler.js';
import { AnalogSynth } from './instruments/AnalogSynth.js';
import { StringInstrument } from './instruments/StringInstrument.js';
import { WindInstrument } from './instruments/WindInstrument.js';
import { PercussionInstrument } from './instruments/PercussionInstrument.js';
import { GranularInstrument } from './instruments/GranularInstrument.js';
import { Distortion } from './effects/Distortion.js';
import { Delay } from './effects/Delay.js';
import { Reverb } from './effects/Reverb.js';
import { VibeManager } from './logic/VibeManager.js';

export class AudioEngine {
    constructor() {
        this.ctx = null;
        this.isReady = false;
        this.masterGain = null;
        this.analyser = null;
        this.scheduler = null;
        this.instruments = [];
        this.sequence = null;
        this.effects = {};
        this.vibeManager = null;
    }

    async init() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.8;

        // Effects Chain
        this.effects.distortion = new Distortion(this.ctx);
        this.effects.delay = new Delay(this.ctx);
        this.effects.reverb = new Reverb(this.ctx);

        // Chain: Master -> Dist -> Delay -> Reverb -> Analyser -> Out
        this.masterGain.disconnect();
        this.masterGain.connect(this.effects.distortion.input);
        this.effects.distortion.connect(this.effects.delay.input);
        this.effects.delay.connect(this.effects.reverb.input);

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 2048;

        this.effects.reverb.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);

        // Default Effect Settings
        this.effects.distortion.setWet(0); // Off
        this.effects.delay.setWet(0.2);
        this.effects.reverb.setWet(0.3);

        // Vibe Manager
        this.vibeManager = new VibeManager(this.ctx, this.effects);
        this.vibeManager.connectModulation();
        this.vibeManager.setDepth(0.2); // Default Vibe

        // Load Worklets
        try {
            await this.ctx.audioWorklet.addModule('src/audio/worklets/string-processor.js');
            await this.ctx.audioWorklet.addModule('src/audio/worklets/clarinet-processor.js');
            await this.ctx.audioWorklet.addModule('src/audio/worklets/modal-processor.js');
            await this.ctx.audioWorklet.addModule('src/audio/worklets/granular-processor.js');
            console.log("AudioWorklets loaded successfully.");
            this.isReady = true;
        } catch (e) {
            console.error("Failed to load AudioWorklets:", e);
        }

        // Initialize Sequence Data
        this.sequence = {
            tracks: [
                { steps: {} }, // Kick
                { steps: {} }, // String
                { steps: {} }, // Wind
                { steps: {} }, // Perc
                { steps: {} }  // Granular
            ]
        };

        // Default Pattern
        this.sequence.tracks[0].steps[0] = { note: 36, velocity: 1, duration: 1 };
        this.sequence.tracks[0].steps[4] = { note: 36, velocity: 1, duration: 1 };
        this.sequence.tracks[0].steps[8] = { note: 36, velocity: 1, duration: 1 };
        this.sequence.tracks[0].steps[12] = { note: 36, velocity: 1, duration: 1 };

        this.scheduler = new Scheduler(this.ctx, this.sequence);

        // Create Instruments
        const kickSynth = new AnalogSynth(this.ctx, this.masterGain, 'square'); // Kick-ish
        const stringInst = new StringInstrument(this.ctx, this.masterGain);
        const windInst = new WindInstrument(this.ctx, this.masterGain);
        const percInst = new PercussionInstrument(this.ctx, this.masterGain);
        const granInst = new GranularInstrument(this.ctx, this.masterGain);

        this.instruments.push(kickSynth, stringInst, windInst, percInst, granInst);
        this.scheduler.instruments = this.instruments;
    }

    updateSoloState() {
        const anySolo = this.instruments.some(i => i.solo);
        this.instruments.forEach(inst => {
            if (anySolo) {
                // If any solo, only play if this is solo
                inst.output.gain.value = inst.solo ? 1 : 0;
            } else {
                // No solo, respect mute
                inst.output.gain.value = inst.muted ? 0 : 1;
            }
        });
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    startPlayback() {
        this.resume();
        if (this.scheduler) this.scheduler.start();
    }

    stopPlayback() {
        if (this.scheduler) this.scheduler.stop();
    }

    getState() {
        return {
            tempo: this.scheduler.tempo,
            instruments: this.instruments.map(inst => ({
                type: inst.constructor.name,
                params: {
                    vol: inst.output.gain.value,
                    pan: inst.panner ? inst.panner.pan.value : 0,
                    muted: inst.muted || false,
                    solo: inst.solo || false,
                    preset: inst.preset || null,
                    waveType: inst.type || null
                }
            })),
            effects: {
                distortion: this.effects.distortion.amount,
                delay: this.effects.delay.wet.gain.value,
                reverb: this.effects.reverb.wet.gain.value,
                vibeRate: this.vibeManager.lfo.frequency.value,
                vibeDepth: this.vibeManager.depth.gain.value
            },
            sequence: this.scheduler.sequence
        };
    }

    loadState(state) {
        if (!state) return;

        // Restore Tempo
        if (state.tempo) this.scheduler.tempo = state.tempo;

        // Restore Instruments
        if (state.instruments) {
            state.instruments.forEach((instState, index) => {
                if (index < this.instruments.length) {
                    const inst = this.instruments[index];
                    // Basic params
                    if (instState.params.vol !== undefined) inst.output.gain.value = instState.params.vol;
                    if (instState.params.pan !== undefined && inst.panner) inst.panner.pan.value = instState.params.pan;
                    inst.muted = instState.params.muted;
                    inst.solo = instState.params.solo;

                    // Preset
                    if (instState.params.preset && inst.setPreset) {
                        inst.setPreset(instState.params.preset);
                    }

                    // Specifics
                    if (instState.params.waveType && inst.type !== undefined) inst.type = instState.params.waveType;
                }
            });
            this.updateSoloState();
        }

        // Restore Effects
        if (state.effects) {
            if (this.effects.distortion) {
                this.effects.distortion.setAmount(state.effects.distortion);
                this.effects.distortion.setWet(state.effects.distortion > 0 ? 1 : 0);
            }
            if (this.effects.delay) this.effects.delay.setWet(state.effects.delay);
            if (this.effects.reverb) this.effects.reverb.setWet(state.effects.reverb);
            if (this.vibeManager) {
                this.vibeManager.setRate(state.effects.vibeRate);
                this.vibeManager.setDepth(state.effects.vibeDepth);
            }
        }

        // Restore Sequence
        if (state.sequence) {
            this.scheduler.sequence = state.sequence;
        }
    }
}
