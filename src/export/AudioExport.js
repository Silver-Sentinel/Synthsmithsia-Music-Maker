import { AnalogSynth } from '../audio/instruments/AnalogSynth.js';
import { StringInstrument } from '../audio/instruments/StringInstrument.js';
import { WindInstrument } from '../audio/instruments/WindInstrument.js';
import { PercussionInstrument } from '../audio/instruments/PercussionInstrument.js';
import { GranularInstrument } from '../audio/instruments/GranularInstrument.js';

export class AudioExport {
    constructor(sequence, tempo) {
        this.sequence = sequence;
        this.tempo = tempo;
    }

    async renderWav() {
        // Calculate duration
        // Find last step
        let lastStep = 0;
        this.sequence.tracks.forEach(track => {
            Object.keys(track.steps).forEach(s => {
                const step = parseInt(s);
                const duration = track.steps[s].duration; // in 16ths
                if (step + duration > lastStep) lastStep = step + duration;
            });
        });

        // Add 1 bar tail for reverb/release
        lastStep += 16;

        const secondsPerBeat = 60.0 / this.tempo;
        const durationSeconds = (lastStep / 4) * secondsPerBeat;

        // Offline Context
        const sampleRate = 44100;
        const offlineCtx = new OfflineAudioContext(2, durationSeconds * sampleRate, sampleRate);

        // Load Worklets (Must be loaded again for OfflineCtx)
        // Note: This might be tricky if paths are relative. 
        // We might need to duplicate the worklet loading logic or make it shared.
        // For now, let's try loading them.
        try {
            await offlineCtx.audioWorklet.addModule('src/audio/worklets/string-processor.js');
            await offlineCtx.audioWorklet.addModule('src/audio/worklets/clarinet-processor.js');
            await offlineCtx.audioWorklet.addModule('src/audio/worklets/modal-processor.js');
            await offlineCtx.audioWorklet.addModule('src/audio/worklets/granular-processor.js');
        } catch (e) {
            console.error("Failed to load worklets for offline export:", e);
            return null;
        }

        // Setup Instruments
        const instruments = [
            new AnalogSynth(offlineCtx, offlineCtx.destination, 'square'),
            new StringInstrument(offlineCtx, offlineCtx.destination),
            new WindInstrument(offlineCtx, offlineCtx.destination),
            new PercussionInstrument(offlineCtx, offlineCtx.destination),
            new GranularInstrument(offlineCtx, offlineCtx.destination)
        ];

        // Schedule Events
        this.sequence.tracks.forEach((track, i) => {
            if (!instruments[i]) return;
            Object.keys(track.steps).forEach(s => {
                const step = parseInt(s);
                const noteData = track.steps[s];
                const time = (step / 4) * secondsPerBeat;
                const duration = (noteData.duration / 4) * secondsPerBeat;

                instruments[i].trigger(noteData.note, time, duration);
            });
        });

        // Render
        const renderedBuffer = await offlineCtx.startRendering();
        return this.bufferToWav(renderedBuffer);
    }

    bufferToWav(buffer) {
        const numOfChan = buffer.numberOfChannels;
        const length = buffer.length * numOfChan * 2 + 44;
        const bufferArr = new ArrayBuffer(length);
        const view = new DataView(bufferArr);
        const channels = [];
        let i;
        let sample;
        let offset = 0;
        let pos = 0;

        // write WAVE header
        setUint32(0x46464952); // "RIFF"
        setUint32(length - 8); // file length - 8
        setUint32(0x45564157); // "WAVE"

        setUint32(0x20746d66); // "fmt " chunk
        setUint32(16); // length = 16
        setUint16(1); // PCM (uncompressed)
        setUint16(numOfChan);
        setUint32(buffer.sampleRate);
        setUint32(buffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
        setUint16(numOfChan * 2); // block-align
        setUint16(16); // 16-bit (hardcoded in this demo)

        setUint32(0x61746164); // "data" - chunk
        setUint32(length - pos - 4); // chunk length

        // write interleaved data
        for (i = 0; i < buffer.numberOfChannels; i++)
            channels.push(buffer.getChannelData(i));

        while (pos < buffer.length) {
            for (i = 0; i < numOfChan; i++) { // interleave channels
                sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
                sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
                view.setInt16(44 + offset, sample, true); // write 16-bit sample
                offset += 2;
            }
            pos++;
        }

        return new Blob([bufferArr], { type: 'audio/wav' });

        function setUint16(data) {
            view.setUint16(pos, data, true);
            pos += 2;
        }

        function setUint32(data) {
            view.setUint32(pos, data, true);
            pos += 4;
        }
    }
}
