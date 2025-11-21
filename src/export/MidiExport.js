export class MidiExport {
    constructor(sequence, tempo) {
        this.sequence = sequence;
        this.tempo = tempo;
        this.ticksPerBeat = 480;
    }

    generate() {
        // Header Chunk
        const header = [
            0x4D, 0x54, 0x68, 0x64, // MThd
            0x00, 0x00, 0x00, 0x06, // Chunk size
            0x00, 0x01,             // Format 1 (multi-track)
            0x00, this.sequence.tracks.length + 1, // Tracks (Conductor + Instruments)
            (this.ticksPerBeat >> 8) & 0xFF, this.ticksPerBeat & 0xFF // Division
        ];

        const chunks = [new Uint8Array(header)];

        // Conductor Track (Tempo)
        const conductorTrack = this.createConductorTrack();
        chunks.push(conductorTrack);

        // Instrument Tracks
        this.sequence.tracks.forEach((track, i) => {
            chunks.push(this.createTrack(track, i));
        });

        // Combine
        const blob = new Blob(chunks, { type: 'audio/midi' });
        return blob;
    }

    createConductorTrack() {
        let events = [];
        // Set Tempo
        const microsecondsPerBeat = Math.round(60000000 / this.tempo);
        events.push({
            delta: 0,
            type: 0xFF,
            subType: 0x51,
            data: [
                (microsecondsPerBeat >> 16) & 0xFF,
                (microsecondsPerBeat >> 8) & 0xFF,
                microsecondsPerBeat & 0xFF
            ]
        });
        // End of Track
        events.push({ delta: 0, type: 0xFF, subType: 0x2F, data: [] });
        return this.encodeTrack(events);
    }

    createTrack(trackData, channel) {
        let events = [];
        let lastTick = 0;

        // Sort steps by time
        const steps = [];
        Object.keys(trackData.steps).forEach(stepIndex => {
            const step = trackData.steps[stepIndex];
            if (step) {
                steps.push({ ...step, stepIndex: parseInt(stepIndex) });
            }
        });
        steps.sort((a, b) => a.stepIndex - b.stepIndex);

        steps.forEach(step => {
            const startTick = step.stepIndex * (this.ticksPerBeat / 4); // 16th notes
            const durationTicks = step.duration * (this.ticksPerBeat / 4); // Duration in 16ths
            const endTick = startTick + durationTicks;

            // Note On
            events.push({
                tick: startTick,
                type: 0x90 | (channel & 0x0F),
                data: [step.note, Math.floor(step.velocity * 127)]
            });

            // Note Off
            events.push({
                tick: endTick,
                type: 0x80 | (channel & 0x0F),
                data: [step.note, 0]
            });
        });

        // Sort events by tick
        events.sort((a, b) => a.tick - b.tick);

        // Convert to delta times
        let deltaEvents = [];
        let currentTick = 0;
        events.forEach(e => {
            const delta = e.tick - currentTick;
            currentTick = e.tick;
            deltaEvents.push({ delta, type: e.type, data: e.data });
        });

        // End of Track
        deltaEvents.push({ delta: 0, type: 0xFF, subType: 0x2F, data: [] });

        return this.encodeTrack(deltaEvents);
    }

    encodeTrack(events) {
        let bytes = [];
        events.forEach(e => {
            // Delta Time (Variable Length)
            bytes.push(...this.writeVarInt(e.delta));

            // Event Type
            if (e.type >= 0xF0) {
                // Meta Event
                bytes.push(e.type);
                bytes.push(e.subType);
                bytes.push(...this.writeVarInt(e.data.length));
                bytes.push(...e.data);
            } else {
                // MIDI Event
                bytes.push(e.type);
                bytes.push(...e.data);
            }
        });

        // Track Header
        const trackHeader = [
            0x4D, 0x54, 0x72, 0x6B, // MTrk
            (bytes.length >> 24) & 0xFF,
            (bytes.length >> 16) & 0xFF,
            (bytes.length >> 8) & 0xFF,
            bytes.length & 0xFF
        ];

        return new Uint8Array([...trackHeader, ...bytes]);
    }

    writeVarInt(value) {
        let buffer = value & 0x7F;
        let bytes = [];
        while ((value >>= 7)) {
            buffer <<= 8;
            buffer |= ((value & 0x7F) | 0x80);
        }
        while (true) {
            bytes.push(buffer & 0xFF);
            if (buffer & 0x80) buffer >>= 8;
            else break;
        }
        return bytes;
    }
}
