export class Grid {
    constructor(canvas, sequence, scheduler) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.sequence = sequence;
        this.scheduler = scheduler;

        this.cellWidth = 40;
        this.cellHeight = 30;
        this.scrollX = 0;
        this.scrollY = 0;

        this.colors = {
            bg: '#111',
            line: '#333',
            beatLine: '#555',
            note: '#00ff9d',
            playhead: 'rgba(255, 255, 255, 0.2)'
        };

        this.scale = 'Chromatic'; // Default scale
        this.highlightedCell = null;

        this.initInteraction();
        this.draw();
    }

    initInteraction() {
        let isDragging = false;
        let lastCell = { x: -1, y: -1 };

        const getCell = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left + this.scrollX;
            const y = e.clientY - rect.top + this.scrollY;
            return {
                col: Math.floor(x / this.cellWidth),
                row: Math.floor(y / this.cellHeight)
            };
        };

        this.canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            const cell = getCell(e);
            this.toggleCell(cell.col, cell.row);
            lastCell = cell;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const cell = getCell(e);
            if (cell.col !== lastCell.col || cell.row !== lastCell.row) {
                this.toggleCell(cell.col, cell.row);
                lastCell = cell;
            }
        });

        window.addEventListener('mouseup', () => {
            isDragging = false;
            lastCell = { x: -1, y: -1 };
        });

        // Animation Loop for Playhead
        const loop = () => {
            this.draw();
            requestAnimationFrame(loop);
        };
        loop();
    }

    toggleCell(col, row) {
        if (row < 0 || row >= this.sequence.tracks.length) return;
        if (col < 0) return;

        // Push History State BEFORE change
        if (this.history) {
            this.history.pushState();
        }

        // Emit event for Tutorial
        window.dispatchEvent(new CustomEvent('grid-cell-click', { detail: { col, row } }));

        // Ensure track is long enough
        const track = this.sequence.tracks[row];
        if (!track.steps[col]) track.steps[col] = null;

        // Toggle: If null, set note. If note, set null.
        if (track.steps[col]) {
            track.steps[col] = null;
        } else {
            track.steps[col] = { note: 60, velocity: 0.8, duration: 1 };
        }
    }

    setHighlight(col, row) {
        this.highlightedCell = { col, row };
        this.draw();
    }

    draw() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, w, h);

        // Draw Grid
        const startCol = Math.floor(this.scrollX / this.cellWidth);
        const endCol = startCol + Math.ceil(w / this.cellWidth);
        const startRow = Math.floor(this.scrollY / this.cellHeight);
        const endRow = startRow + Math.ceil(h / this.cellHeight);

        this.ctx.lineWidth = 1;

        // Draw Rows (Notes) with Scale Highlighting
        for (let r = startRow; r <= endRow; r++) {
            const y = r * this.cellHeight - this.scrollY;

            // Scale Highlighting Logic
            const note = 84 - r;
            const isRoot = (note % 12) === 0; // C
            const isInKey = this.checkScale(note);

            if (isInKey) {
                this.ctx.fillStyle = isRoot ? 'rgba(255, 255, 255, 0.05)' : 'transparent';
            } else {
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; // Dim out of key
            }
            this.ctx.fillRect(0, y, w, this.cellHeight);

            this.ctx.strokeStyle = this.colors.line;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(w, y);
            this.ctx.stroke();
        }

        // Draw Cols (Time)
        for (let c = startCol; c <= endCol; c++) {
            const x = c * this.cellWidth - this.scrollX;
            this.ctx.strokeStyle = c % 4 === 0 ? this.colors.beatLine : this.colors.line;
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, h);
            this.ctx.stroke();
        }

        // Draw Notes
        this.sequence.tracks.forEach((track, r) => {
            if (r < startRow || r > endRow) return;
            const y = r * this.cellHeight - this.scrollY;

            Object.keys(track.steps).forEach(c => {
                const step = track.steps[c];
                if (step && c >= startCol && c <= endCol) {
                    const x = c * this.cellWidth - this.scrollX;
                    this.ctx.fillStyle = this.colors.note;
                    this.ctx.fillRect(x + 2, y + 2, this.cellWidth - 4, this.cellHeight - 4);
                }
            });
        });

        // Draw Tutorial Highlight
        if (this.highlightedCell && this.highlightedCell.col >= 0) {
            const { col, row } = this.highlightedCell;
            const x = col * this.cellWidth - this.scrollX;
            const y = row * this.cellHeight - this.scrollY;

            this.ctx.strokeStyle = '#ff00ff';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(x, y, this.cellWidth, this.cellHeight);

            // Pulsing fill
            this.ctx.fillStyle = `rgba(255, 0, 255, ${0.2 + Math.sin(Date.now() / 200) * 0.1})`;
            this.ctx.fillRect(x, y, this.cellWidth, this.cellHeight);
        }

        // Draw Playhead
        if (this.scheduler) {
            const currentStep = this.scheduler.current16thNote; // This is 0-15 loop
            const x = currentStep * this.cellWidth - this.scrollX;

            // Glow effect
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = this.colors.note;

            this.ctx.fillStyle = 'rgba(0, 255, 157, 0.1)';
            this.ctx.fillRect(x, 0, this.cellWidth, h);

            // Bright line
            this.ctx.fillStyle = 'rgba(0, 255, 157, 0.5)';
            this.ctx.fillRect(x, 0, 2, h); // Left edge highlight

            this.ctx.shadowBlur = 0; // Reset
        }
    }

    checkScale(note) {
        // Simple C Major / Chromatic switch for now
        if (!this.scale || this.scale === 'Chromatic') return true;

        const pc = note % 12;
        // C Major: C, D, E, F, G, A, B
        // Indices: 0, 2, 4, 5, 7, 9, 11
        const majorScale = [0, 2, 4, 5, 7, 9, 11];

        if (this.scale === 'C Major') {
            return majorScale.includes(pc);
        }
        return true;
    }

    setScale(scaleName) {
        this.scale = scaleName;
        this.draw();
    }
}
