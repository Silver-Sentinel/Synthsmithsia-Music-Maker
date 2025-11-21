export class HistoryManager {
    constructor(grid) {
        this.grid = grid;
        this.undoStack = [];
        this.redoStack = [];
        this.maxHistory = 50;
    }

    // Call this BEFORE making a change
    pushState() {
        const state = this.getSnapshot();
        this.undoStack.push(state);
        if (this.undoStack.length > this.maxHistory) {
            this.undoStack.shift();
        }
        this.redoStack = []; // Clear redo on new action
    }

    undo() {
        if (this.undoStack.length === 0) return;

        // Save current state to redo stack
        const currentState = this.getSnapshot();
        this.redoStack.push(currentState);

        // Restore previous state
        const prevState = this.undoStack.pop();
        this.restoreSnapshot(prevState);
    }

    redo() {
        if (this.redoStack.length === 0) return;

        // Save current state to undo stack
        const currentState = this.getSnapshot();
        this.undoStack.push(currentState);

        // Restore next state
        const nextState = this.redoStack.pop();
        this.restoreSnapshot(nextState);
    }

    getSnapshot() {
        // Deep copy of the sequence tracks
        // We assume grid.sequence is the source of truth
        return JSON.parse(JSON.stringify(this.grid.sequence));
    }

    restoreSnapshot(sequenceData) {
        // We need to update the sequence object in place or replace it
        // Since Grid and Scheduler hold references, we should update the content
        // of the existing sequence object if possible, or update references.
        // For simplicity, let's update the tracks array content.

        // Verify structure
        if (!sequenceData || !sequenceData.tracks) return;

        // Update grid sequence
        this.grid.sequence.tracks = sequenceData.tracks;

        // Redraw
        this.grid.draw();
    }
}
