# Synthsmithsia Music Maker 🎵

**Synthsmithsia Music Maker** is a powerful, web-based music creation tool designed to bridge the gap between simple trackers like *Bosca Ceoil* and deep creative tools like *Dreams*. It runs entirely in your browser using the Web Audio API, offering a rich, interactive experience for both beginners and experienced musicians.

![Synthsmithsia Screenshot](https://via.placeholder.com/800x450?text=Synthsmithsia+Music+Maker) *Note: Replace with actual screenshot*

## 🚀 Features

### 🎹 Creative Tools
*   **Tracker-Style Grid**: Intuitive grid interface for composing melodies and beats.
*   **Multi-Instrument Support**:
    *   **Analog Synths**: Classic waveforms (Saw, Square, Triangle) with presets (Lead, Pad, Bass).
    *   **FM Synths**: Complex, metallic tones.
    *   **Strings & Winds**: Physical modeling for realistic acoustic sounds.
    *   **Percussion**: Modal synthesis for bells, drums, and chimes.
    *   **Granular Engine**: Textural soundscapes.
*   **Pattern Randomizer**: Stuck? Click the 🎲 "Magic Dice" to instantly generate rhythmic patterns.
*   **Scale Highlighting**: Select a key (e.g., C Major) to dim out-of-key notes, making it impossible to hit a wrong note.

### 🎓 Interactive Academy
*   **Guided Tutorials**: Includes a step-by-step interactive guide to creating your first song ("Mary Had a Little Lamb").
*   **Spotlight System**: The UI dims and highlights exactly what you need to click, ensuring you never get lost.

### 🛠️ Professional Workflow
*   **Undo/Redo**: Full history support (`Ctrl+Z` / `Ctrl+Y`) for grid edits.
*   **Keyboard Piano**: Play melodies live using your computer keyboard (`Z`, `X`, `C`...).
*   **Project Persistence**: Save your projects to `.json` files and load them back anytime.
*   **Export**: Render your masterpieces to **WAV** (High Quality Audio) or **MIDI** (Sequence Data).

### 🎛️ Effects & Polish
*   **Audio Effects**: Integrated Reverb, Delay, and Distortion.
*   **Visualizers**: Real-time oscilloscope and spectrum analysis.
*   **Performance**: Optimized with AudioWorklets for low-latency audio processing.

## 🛠️ Technology Stack

*   **Core**: Vanilla JavaScript (ES6+)
*   **Audio**: Web Audio API + AudioWorklets
*   **UI**: HTML5 Canvas + CSS3 Variables
*   **No External Dependencies**: Built from scratch without heavy frameworks like React or Vue.

## 🏃‍♂️ How to Run

Since this project uses **AudioWorklets**, it must be served over a local web server (browsers block Worklets from `file://` URLs due to CORS).

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/synthsmithsia.git
    cd synthsmithsia
    ```

2.  **Start a local server**:
    *   **VS Code**: Install the "Live Server" extension and click "Go Live".
    *   **Python**:
        ```bash
        python -m http.server 8000
        ```
    *   **Node.js**:
        ```bash
        npx http-server
        ```

3.  **Open in Browser**:
    Navigate to `http://localhost:8000` (or whatever port your server uses).

4.  **Click "Start Audio"** and make some noise!

## 🎮 Controls

*   **Spacebar**: Play/Stop
*   **Click Grid**: Place/Remove notes
*   **Right-Click Grid**: Remove note (or toggle)
*   **Ctrl+Z / Ctrl+Y**: Undo / Redo
*   **Keyboard (Z, S, X...)**: Play notes live

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Created with ❤️ by Lytton & Antigravity*
