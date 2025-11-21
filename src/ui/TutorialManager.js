export class TutorialManager {
    constructor(engine, grid, rack, editor) {
        this.engine = engine;
        this.grid = grid;
        this.rack = rack;
        this.editor = editor;
        this.isActive = false;
        this.currentStepIndex = 0;
        this.steps = this.getScript();

        this.overlay = this.createOverlay();
        this.messageBox = this.createMessageBox();
        this.highlightBox = this.createHighlightBox();

        document.body.appendChild(this.overlay);
        document.body.appendChild(this.highlightBox);
        document.body.appendChild(this.messageBox);

        // Bind events
        window.addEventListener('resize', () => {
            if (this.isActive) this.showStep(this.currentStepIndex);
        });
    }

    createOverlay() {
        const el = document.createElement('div');
        el.style.position = 'fixed';
        el.style.top = '0';
        el.style.left = '0';
        el.style.width = '100%';
        el.style.height = '100%';
        el.style.background = 'rgba(0, 0, 0, 0.7)'; // Dim background
        el.style.zIndex = '9998';
        el.style.pointerEvents = 'auto'; // Block clicks on non-highlighted areas
        el.style.display = 'none';
        // Allow clicking through to the highlighted element? 
        // Actually, we want to block everything EXCEPT the target.
        // We can use a "cutout" or just high z-index for target?
        // Easier: The overlay blocks everything. The highlight box is transparent but has a high z-index 
        // and "pointer-events: none" so clicks pass through IT.
        // BUT the target element is BEHIND the overlay.
        // Solution: We clone the target or bring it to front? Bringing to front breaks layout.
        // Better Solution: The overlay is a path with a hole (SVG) or we use 4 divs.
        // Simplest Solution: `pointer-events: none` on overlay, but that allows clicking anywhere.
        // Correct Solution: Overlay captures all clicks. We check if click is within target rect.
        el.onclick = (e) => {
            e.stopPropagation();
            // Maybe flash the target?
            this.highlightBox.style.boxShadow = '0 0 20px 10px rgba(255, 0, 0, 0.5)';
            setTimeout(() => this.highlightBox.style.boxShadow = '0 0 15px 5px rgba(0, 255, 157, 0.8)', 200);
        };
        return el;
    }

    createHighlightBox() {
        const el = document.createElement('div');
        el.style.position = 'fixed';
        el.style.border = '3px solid #00ff9d';
        el.style.borderRadius = '4px';
        el.style.boxShadow = '0 0 15px 5px rgba(0, 255, 157, 0.5)';
        el.style.zIndex = '9999'; // Above overlay
        el.style.pointerEvents = 'none'; // Let clicks pass through to the element below?
        // Wait, if overlay is 9998 and blocks clicks, we need to punch a hole.
        // Actually, we can set the target element's z-index to 10000 temporarily?
        // That might break stacking contexts.
        // Let's try: Overlay uses `clip-path`? No, click events still blocked by full rect usually.
        // Let's go with: Overlay is transparent. We rely on "Honor System" + Visual Dimming?
        // No, user asked for "disabled and grayed out".
        // Robust way: 4 divs for top, bottom, left, right of target.
        el.style.display = 'none';
        return el;
    }

    createMessageBox() {
        const el = document.createElement('div');
        el.style.position = 'fixed';
        el.style.background = 'white';
        el.style.color = 'black';
        el.style.padding = '20px';
        el.style.borderRadius = '8px';
        el.style.maxWidth = '300px';
        el.style.zIndex = '10000';
        el.style.boxShadow = '0 5px 20px rgba(0,0,0,0.5)';
        el.style.fontFamily = 'sans-serif';
        el.style.display = 'none';
        return el;
    }

    start() {
        this.isActive = true;
        this.currentStepIndex = 0;
        this.overlay.style.display = 'block';
        this.highlightBox.style.display = 'block';
        this.messageBox.style.display = 'block';
        this.showStep(0);
    }

    stop() {
        this.isActive = false;
        this.overlay.style.display = 'none';
        this.highlightBox.style.display = 'none';
        this.messageBox.style.display = 'none';
        this.cleanupStep();
    }

    getScript() {
        return [
            {
                target: '#start-btn',
                message: "Welcome to Synthsmithsia Academy! 🎓<br>Let's make 'Mary Had a Little Lamb'.<br><br>First, click <b>Start Audio</b> to wake up the engine.",
                trigger: 'click'
            },
            {
                target: '#instrument-list .rack-category:nth-child(1) div', // Synths header
                message: "Great! Now let's pick an instrument.<br>Open the <b>Synths</b> category.",
                trigger: 'click',
                action: () => {
                    // Ensure it's closed first? Or just wait for click.
                    // If already open, we might skip or ask to close.
                    // For simplicity, assume default state.
                }
            },
            {
                target: '.instrument-item', // First instrument (Analog Kick/Lead)
                message: "Select the first instrument.<br>We'll use this for our melody.",
                trigger: 'click'
            },
            {
                target: '#params-area select', // Preset selector (if available) or Waveform
                message: "Let's make it sound like a flute.<br>Change the Waveform to <b>Triangle</b>.",
                trigger: 'change',
                validate: (val) => val === 'triangle'
            },
            {
                target: '#grid-canvas',
                message: "Now the fun part: The Melody! 🎵<br>Click here to place the first note (E).",
                highlightGrid: { col: 0, row: 14 }, // Approx E4 if C6 is top? Need to calibrate.
                trigger: 'grid-click',
                validate: (col, row) => col === 0
            },
            {
                target: '#grid-canvas',
                message: "Next note (D).",
                highlightGrid: { col: 1, row: 16 },
                trigger: 'grid-click',
                validate: (col, row) => col === 1
            },
            {
                target: '#grid-canvas',
                message: "Next note (C).",
                highlightGrid: { col: 2, row: 18 },
                trigger: 'grid-click',
                validate: (col, row) => col === 2
            },
            {
                target: '#grid-canvas',
                message: "Back up to (D).",
                highlightGrid: { col: 3, row: 16 },
                trigger: 'grid-click',
                validate: (col, row) => col === 3
            },
            {
                target: '#play-btn',
                message: "You've got the start! Let's hear it.<br>Click <b>Play</b>.",
                trigger: 'click'
            },
            {
                target: '#stop-btn',
                message: "Nice! Click <b>Stop</b> to finish.",
                trigger: 'click'
            },
            {
                target: null, // Center screen
                message: "🎉 Congratulations!<br>You've graduated.<br>Now go make some music!",
                trigger: 'finish'
            }
        ];
    }

    showStep(index) {
        if (index >= this.steps.length) {
            this.stop();
            return;
        }

        const step = this.steps[index];
        this.cleanupStep(); // Remove old listeners

        let targetEl = null;

        if (step.target) {
            if (typeof step.target === 'string') {
                targetEl = document.querySelector(step.target);
            }
        }

        // Handle Grid Highlighting specially
        if (step.highlightGrid) {
            targetEl = this.grid.canvas;
            this.grid.setHighlight(step.highlightGrid.col, step.highlightGrid.row);
        } else {
            if (this.grid) this.grid.setHighlight(-1, -1); // Clear
        }

        if (targetEl) {
            const rect = targetEl.getBoundingClientRect();

            // Position Highlight Box
            this.highlightBox.style.left = rect.left + 'px';
            this.highlightBox.style.top = rect.top + 'px';
            this.highlightBox.style.width = rect.width + 'px';
            this.highlightBox.style.height = rect.height + 'px';
            this.highlightBox.style.display = 'block';

            // Position Message Box (Right or Bottom)
            this.messageBox.innerHTML = step.message + '<br><br><button id="tut-next-btn" style="float:right">Skip Step</button>';
            this.messageBox.style.left = (rect.right + 20) + 'px';
            this.messageBox.style.top = rect.top + 'px';

            // Adjust if off screen
            if (rect.right + 320 > window.innerWidth) {
                this.messageBox.style.left = (rect.left - 320) + 'px';
            }

            // Set up trigger
            this.currentTriggerHandler = (e) => {
                // Validation
                if (step.validate) {
                    // For grid clicks, we need coords
                    if (step.trigger === 'grid-click') {
                        // Grid emits event with detail?
                        // We'll assume e.detail contains col/row
                        if (!step.validate(e.detail.col, e.detail.row)) return;
                    } else if (e.target.value) {
                        if (!step.validate(e.target.value)) return;
                    }
                }

                // Advance
                this.currentStepIndex++;
                setTimeout(() => this.showStep(this.currentStepIndex), 500); // Delay for effect
            };

            if (step.trigger === 'click') {
                targetEl.addEventListener('click', this.currentTriggerHandler, { once: true });
            } else if (step.trigger === 'change') {
                targetEl.addEventListener('change', this.currentTriggerHandler, { once: true });
            } else if (step.trigger === 'grid-click') {
                window.addEventListener('grid-cell-click', this.currentTriggerHandler, { once: true });
            }

            // "Cutout" effect: We need to allow clicks on target.
            // Since overlay covers everything, we can't click target.
            // We need to implement the "4-divs" approach or `clip-path`.
            // Let's use `clip-path` on the overlay!
            // polygon(0% 0%, 0% 100%, 0% rectTop, rectLeft rectTop, rectLeft rectBottom, rectRight rectBottom, rectRight rectTop, 0% rectTop, 100% 0%, 100% 100%)
            // Actually simpler: `clip-path: polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%, left top, left bottom, right bottom, right top, left top)`
            // where inner rect is counter-clockwise to create hole?
            // Easier: `mask-image` or just 4 divs.
            // Let's use the 4-div approach for robustness.
            this.updateOverlayHole(rect);

        } else {
            // No target (Center message)
            this.highlightBox.style.display = 'none';
            this.messageBox.innerHTML = step.message + '<br><br><button id="tut-finish-btn">Finish</button>';
            this.messageBox.style.left = '50%';
            this.messageBox.style.top = '50%';
            this.messageBox.style.transform = 'translate(-50%, -50%)';
            this.clearOverlayHole(); // Full cover

            document.getElementById('tut-finish-btn').onclick = () => this.stop();
        }

        // Skip button logic
        const skipBtn = document.getElementById('tut-next-btn');
        if (skipBtn) {
            skipBtn.onclick = () => {
                this.currentStepIndex++;
                this.showStep(this.currentStepIndex);
            };
        }
    }

    cleanupStep() {
        // Remove listeners if stored
        if (this.currentTriggerHandler) {
            // Hard to remove generic listeners without ref, but we used {once:true} mostly.
            // For grid-click on window, we should remove.
            window.removeEventListener('grid-cell-click', this.currentTriggerHandler);
            this.currentTriggerHandler = null;
        }
    }

    updateOverlayHole(rect) {
        // We can't easily punch a hole in a single div that allows clicks to pass through ONLY the hole 
        // while blocking elsewhere, unless we use `pointer-events: none` on overlay (which unblocks everything).
        // So we use 4 divs to surround the target.

        if (!this.blockers) {
            this.blockers = [];
            for (let i = 0; i < 4; i++) {
                const b = document.createElement('div');
                b.style.position = 'fixed';
                b.style.background = 'rgba(0, 0, 0, 0.7)';
                b.style.zIndex = '9998';
                this.blockers.push(b);
                document.body.appendChild(b);
            }
            this.overlay.style.display = 'none'; // Hide main overlay
        }

        const [top, bottom, left, right] = this.blockers;

        // Top
        top.style.top = '0';
        top.style.left = '0';
        top.style.width = '100%';
        top.style.height = rect.top + 'px';
        top.style.display = 'block';

        // Bottom
        bottom.style.top = rect.bottom + 'px';
        bottom.style.left = '0';
        bottom.style.width = '100%';
        bottom.style.height = (window.innerHeight - rect.bottom) + 'px';
        bottom.style.display = 'block';

        // Left
        left.style.top = rect.top + 'px';
        left.style.left = '0';
        left.style.width = rect.left + 'px';
        left.style.height = rect.height + 'px';
        left.style.display = 'block';

        // Right
        right.style.top = rect.top + 'px';
        right.style.left = rect.right + 'px';
        right.style.width = (window.innerWidth - rect.right) + 'px';
        right.style.height = rect.height + 'px';
        right.style.display = 'block';
    }

    clearOverlayHole() {
        if (this.blockers) {
            this.blockers.forEach(b => b.style.display = 'none');
        }
        this.overlay.style.display = 'block';
    }
}
