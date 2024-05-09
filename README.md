# [Pocket Drums: A Real-Time Audio Synthesizer](https://mbermanucsc.github.io/Pocket-Drums/)

**Developer:** Miles Berman
**Date:** March 18, 2024

## Introduction

This is a simple, real-time audio sequencer developed in JavaScript, designed to run directly in web browsers. It enables users to create drum patterns with the combination of kicks, snares, hi-hats, and toms, and can also accept sample audio files. There is a synthesizer with an accompanied algoryhtm to generate chords, melodies, and basslines. Also included is a sampler and looper, which adds recording to the sequencer; both internally and for outside sources.
## Implementation

The synth was originally developed to meet specific criteria:

- **Playback** Generates audible signals directly within the browser.
- **Responds to Input:** Offers controls to start, stop, and modify sound parameters in real time.
- **Non-Trivial:** Features at least 3 operators for sound generation (kicks, snares, hi-hats, and tom), surpassing the complexity of generating a single sine wave tone.

### Running the Synthesizer

To start using the synth, simply visit [the site](https://mbermanucsc.github.io/Pocket-Drums/). The synthesizer will load automatically in your browser, requiring no additional installation.

### Controls

- **Start/Stop Sound:** [Press the play/pause button]
- **Modify Parameters:** [Change the BPM for different speeds for your sequences]
- **Sequencing:** [Simply click on the squares that you want to enable, and sounds will play]

