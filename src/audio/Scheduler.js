export class Scheduler {
    constructor(audioCtx, sequence, tempo = 120) {
        this.ctx = audioCtx;
        this.sequence = sequence;
        this.tempo = tempo;
        this.lookahead = 25.0; // ms
        this.scheduleAheadTime = 0.1; // s
        this.nextNoteTime = 0.0;
        this.current16thNote = 0;
        this.timerID = null;
        this.isRunning = false;
        this.instruments = []; // List of active instruments
    }

    nextNote() {
        const secondsPerBeat = 60.0 / this.tempo;
        this.nextNoteTime += 0.25 * secondsPerBeat; // Advance by 1/16th note
        this.current16thNote++;
        if (this.current16thNote === 16) {
            this.current16thNote = 0;
        }
    }

    scheduleNote(beatNumber, time) {
        if (this.instruments.length > 0 && this.sequence) {
            this.sequence.tracks.forEach((track, index) => {
                if (this.instruments[index]) {
                    const step = track.steps[beatNumber];
                    if (step) {
                        this.instruments[index].trigger(step.note, time, step.duration * 0.2);
                    }
                }
            });
        }
        this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
    }

    scheduler() {
        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.scheduleNote(this.current16thNote, this.nextNoteTime);
            this.nextNote();
        }
        this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.nextNoteTime = this.ctx.currentTime + 0.05;
        this.current16thNote = 0;
        this.scheduler();
    }

    stop() {
        this.isRunning = false;
        window.clearTimeout(this.timerID);
    }
}
