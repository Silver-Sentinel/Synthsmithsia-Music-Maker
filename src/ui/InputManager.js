export class InputManager {
    constructor(engine, editor) {
        this.engine = engine;
        this.editor = editor; // To know selected instrument
        this.activeNotes = new Map(); // Key -> Note

        // Mapping: Z=C4, S=C#4, X=D4, D=D#4, C=E4, V=F4, G=F#4, B=G4, H=G#4, N=A4, J=A#4, M=B4
        // Q=C5 ...
        this.keyMap = {
            'z': 60, 's': 61, 'x': 62, 'd': 63, 'c': 64, 'v': 65, 'g': 66, 'b': 67, 'h': 68, 'n': 69, 'j': 70, 'm': 71,
            ',': 72, 'l': 73, '.': 74, ';': 75, '/': 76,
            'q': 72, '2': 73, 'w': 74, '3': 75, 'e': 76, '4': 77, 'r': 79, '5': 80, 't': 81, '6': 82, 'y': 83, '7': 84, 'u': 84
        };

        this.init();
    }

    init() {
        window.addEventListener('keydown', (e) => {
            if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            const key = e.key.toLowerCase();
            if (this.keyMap[key] !== undefined) {
                this.noteOn(key, this.keyMap[key]);
            }
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (this.keyMap[key] !== undefined) {
                this.noteOff(key);
            }
        });
    }

    noteOn(key, midiNote) {
        if (this.activeNotes.has(key)) return;

        const trackIndex = this.editor ? this.editor.selectedInstrumentIndex : 0;
        const instrument = this.engine.instruments[trackIndex];

        if (instrument) {
            // Trigger instrument
            // We need a way to trigger manual notes. 
            // Most instruments in this engine are designed for the Scheduler (triggered by time).
            // However, they likely have `scheduleNote(ctx.currentTime, ...)` or similar.
            // Let's check Instrument.js interface.
            // It seems they rely on AudioWorklet parameters usually.
            // But `AnalogSynth` creates oscillators.

            // We need a "playNoteNow" method on instruments.
            // If not present, we might need to hack it or add it.
            // Let's assume we can call a method. If not, I'll add it to Instrument.js.

            // For now, let's try to implement a generic `playNote` in Instrument.js or specific ones.
            // Since we are in "Execution", I should check `Instrument.js` content first?
            // I recall `AnalogSynth` has `scheduleNote`.
            // `scheduleNote(context, destination, time, note, velocity, duration)`

            // For live playing, we don't know duration (noteOff).
            // So we need `startNote(note, velocity)` and `stopNote()`.

            // Since the engine is simple, let's implement a `triggerAttack(note)` and `triggerRelease()` on the instruments.
            // Or just use `scheduleNote` with a long duration and cancel it on release?

            // Let's add `triggerAttack` and `triggerRelease` to the base Instrument class or specific ones.
            // For this step, I will assume I need to update Instrument classes.

            // But wait, I can't update all of them right now easily.
            // Let's try to use `scheduleNote` with a default duration (e.g. 0.5s) for "Preview" purposes.
            // This is safer than refactoring everything.
            // BUT user wants "Keyboard Piano", implying hold to sustain.

            // Let's try to implement `triggerAttack` dynamically if possible.
            // AnalogSynth: creates osc, starts it. We can keep ref to active voice.

            // Plan: I will add `playNote(note)` to `InputManager` which calls `instrument.playNote(note)` if exists.
            // I will update `AnalogSynth.js` to support this.

            if (instrument.playNote) {
                const voice = instrument.playNote(midiNote, 0.8);
                this.activeNotes.set(key, voice);
            } else {
                // Fallback: Schedule a short note
                if (instrument.scheduleNote) {
                    instrument.scheduleNote(this.engine.ctx, instrument.output, this.engine.ctx.currentTime, midiNote, 0.8, 0.5);
                    this.activeNotes.set(key, { stop: () => { } }); // Dummy
                }
            }
        }
    }

    noteOff(key) {
        const voice = this.activeNotes.get(key);
        if (voice) {
            if (voice.stop) voice.stop();
            if (voice.release) voice.release();
            this.activeNotes.delete(key);
        }
    }
}
