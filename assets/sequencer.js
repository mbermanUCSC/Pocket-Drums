document.addEventListener('DOMContentLoaded', function () {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const playButton = document.getElementById('play');
    const bpmInput = document.getElementById('bpm');
    const sequences = document.querySelectorAll('.sequence');
    let isPlaying = false;
    let nextNoteTime = audioCtx.currentTime;
    let currentBeat = 0;
    let bpm = 120;
    let division = 2;
    const notesInQueue = []; // tracks the notes that are scheduled
    let requestID;
    let bpmLocked = false;

    let samples = {};
    let activeSources = [];
    let currentDrumType = null;

    let waveform = 'sine';
    let keys = [];

    // Master gain for overall volume control
    const masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.value = 0.8; // master volume here


    

    function playSound(sound, time) {
        if (samples[sound]) { // check if sound is in samples
            playSample(samples[sound], time);
            return;
        }
        if (sound === "kick") playKick(time);
        else if (sound === "snare") playSnare(time);
        else if (sound === "hihat") playHiHat(time);
        else if (sound === "tom") playTom(time);
        else if (sound === "bell") playBell(time);
    }

    // highlight the current beat
    function updateCurrentBeatIndicator() {
        document.querySelectorAll('.sequence button').forEach(button => {
            button.classList.remove('current-beat');
        });
    
        sequences.forEach(sequence => {
            const buttons = sequence.querySelectorAll('button');
            if (buttons[currentBeat]) {
                buttons[currentBeat].classList.add('current-beat');
            }
        });
    }
    
    // NOTE SCHEDULING FUNCTIONS //

    function scheduleNote() {
        sequences.forEach((seq, index) => {
            const soundButtons = seq.querySelectorAll('button');
            const sound = soundButtons[currentBeat].classList.contains('button-active') ? seq.dataset.sound : null;
            if (sound) {
                playSound(sound, nextNoteTime);
            }
        });

        // if there are notes in the key list, play a random note
        if (keys.length > 0) {
            const note = keys[Math.floor(Math.random() * keys.length)];
            playNote (note, nextNoteTime);
        }
    

        updateCurrentBeatIndicator();

        const secondsPerBeat = 60.0 / bpm/division;
        nextNoteTime += secondsPerBeat;
        currentBeat = (currentBeat + 1) % sequences[0].querySelectorAll('button').length;
    }

    function scheduler() {
        if (!isPlaying) return;
        while (nextNoteTime < audioCtx.currentTime + 0.1) {
            scheduleNote();
        }
        requestAnimationFrame(scheduler);
    }

    // Handle window focus and blur for audio context
    window.addEventListener('blur', function() {
        audioCtx.suspend();
    });

    window.addEventListener('focus', function() {
        audioCtx.resume();
    });

    sequences.forEach(sequence => {
        sequence.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', function() {
                this.classList.toggle('button-active');
            });
        });
    });


    // SEQUENCER CONTROLS //

    function startSequencer() {
        if (!isPlaying) {
            isPlaying = true;
            currentBeat = 0;
            nextNoteTime = audioCtx.currentTime + 0.05; // short delay before starting for accuracy (idk why)
            scheduler();
        }
    }

    function stopSequencer() {
        if (isPlaying) {
            isPlaying = false;
            cancelAnimationFrame(requestID);
            currentBeat = 0; 
            updateCurrentBeatIndicator(); 
        }
    }
    
    // play/pause button
    playButton.addEventListener('click', function() {
        if (isPlaying) {
            // set the text to ||
            playButton.textContent = '▶';
            stopSequencer();
        } else {
            playButton.textContent = '||';
            startSequencer();
        }
    });

    // bpm input
    bpmInput.addEventListener('input', function() {
        if (bpmInput.value <1) return;
        bpm = Number(bpmInput.value);
    });

    // reset button
    document.getElementById('reset').addEventListener('click', function() {
        sequences.forEach(sequence => {
            sequence.querySelectorAll('button').forEach(button => {
                button.classList.remove('button-active');
            });
            // clear bpm
            if (!bpmLocked){
                bpmInput.value = 120;
            }
            
            // clear division
            document.getElementById('division').checked = false;

            // clear any current sound in the buffer (dont close the audio context)
            activeSources.forEach(source => {
                source.stop();
            });
            activeSources = [];

            samples = {};
            // clear the sample buttons
            document.querySelectorAll('.add-sample-button').forEach(button => {
                button.textContent = 'file';
            });
        });
    });

    // master volume control
    document.getElementById('master').addEventListener('input', function() {
        const value = this.value;
        masterGain.gain.value = value / 100; // Convert percentage to a value between 0 and 1
    });

    // shuffle button
    document.getElementById('shuffle').addEventListener('click', function() {
        // randomly set the bpm between 60 and 140
        if (!bpmLocked){
            bpm = Math.floor(Math.random() * 80) + 60;
            bpmInput.value = bpm;
        }
        // reset all buttons
        sequences.forEach(sequence => {
            sequence.querySelectorAll('button').forEach(button => {
                button.classList.remove('button-active');
            });
        });

        // randomly activate buttons (favor hihat)
        sequences.forEach(sequence => {
            let i = 0;
            sequence.querySelectorAll('button').forEach(button => {
                // if class is hi hat, activate 50% of the time
                if (button.classList.contains('hihat')) {
                    if (Math.random() > 0.3) {
                        button.classList.add('button-active');
                    }
                }
                else if (button.classList.contains('tom')) {
                    if (Math.random() > 0.9) {
                        button.classList.add('button-active');
                    }
                }
                else if (button.classList.contains('kick')) {
                    if (Math.random() > 0.9) {
                        button.classList.add('button-active');
                    }
                    // bar %4
                    if (i % 4 === 0) {
                        if (Math.random() > 0.7) {
                            button.classList.add('button-active');
                        }
                    }
                    if (i === 0) {
                        if (Math.random() > 0.8) {
                            button.classList.add('button-active');
                        }
                    }
                }
                else if (button.classList.contains('snare')) {
                    if (Math.random() > 0.9) {
                        button.classList.add('button-active');
                    }
                    // bar %2
                    if (i % 2 === 0) {
                        if (Math.random() > 0.7) {
                            button.classList.add('button-active');
                        }
                    }
                }
                else if (button.classList.contains('tom')){
                    if (Math.random() > 1) {
                        button.classList.add('button-active');
                    }
                    // i % 2,4 != 0 
                    if (i % 2 !== 0 && i % 4 !== 0) {
                        if (Math.random() > 0.8) {
                            button.classList.add('button-active');
                        }
                    }
                }
                
                i += 1;
            });
        });
    });
    

    // bpm lock checkbox
    document.getElementById('bpm-lock').addEventListener('change', function() {
        bpmInput.disabled = this.checked;
        bpmLocked = this.checked;
    });

    // checkbox for division
    document.getElementById('division').addEventListener('change', function() {
        division = this.checked ? 4 : 2;
    });


    // SAMPLER FUNCTIONS //


    document.querySelectorAll('.add-sample-button').forEach(button => {
        button.addEventListener('click', function() {
            let currentButton = this;
            currentDrumType = Array.from(this.classList).find(cls => cls !== 'add-sample-button');
            
            // Create and trigger the file input
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'audio/*';
            input.onchange = e => {
                const file = e.target.files[0];
                currentButton.textContent = file.name;
                const reader = new FileReader();
                reader.onload = fileEvent => {
                    const arrayBuffer = fileEvent.target.result;
                    audioCtx.decodeAudioData(arrayBuffer, decodedData => {
                        // Store the decoded buffer with the current drum type as the key
                        samples[currentDrumType] = decodedData;
                    }, error => {
                        console.error("Error decoding audio data: ", error);
                        // Reset the button + give the user a message
                        currentButton.textContent = 'file';
                        alert('Error decoding audio data. Please try a different file.');
                    });
                };
                reader.readAsArrayBuffer(file);
            };
            input.click();
        });
    });


    // <img src="assets/drum_icon.png" class="page-button" alt="Drums" id="drum-icon">
    // <img src="assets/synth_icon.png" class="page-button" alt="Synth" id="synth-icon">

    document.querySelectorAll('.page-button').forEach(button => {
        button.addEventListener('click', function() {
            // get id of button
            const id = this.id;
            if (id === 'drum-icon') {
                document.querySelector('.sequencer').style.display = 'block';
                document.querySelector('.synth').style.display = 'none';
            } else if (id === 'synth-icon') {
                document.querySelector('.sequencer').style.display = 'none';
                document.querySelector('.synth').style.display = 'block';
            }
            // set opacity to 1
            document.querySelectorAll('.page-button').forEach(button => {
                button.style.opacity = '0.5';
            });
            this.style.opacity = '1';
        });
    });

    // all the synth stuff

    function resetActiveKeys() {
        document.querySelectorAll('.key, .black-key').forEach(button => {
            button.classList.remove('button-active');
        });
    }
    
    document.querySelectorAll('.key, .black-key').forEach(button => {
        button.addEventListener('click', function() {
            this.classList.add('button-active');
            const note = this.id;
            keys.push(note);
        });
    });
    
    // <img class='waveform' id='sine' src="assets/sine.png" alt="sine">
    // <img class="waveform" id="square" src="assets/square.png" alt="square">
    // <img class="waveform" id="sawtooth" src="assets/sawtooth.png" alt="sawtooth">
    // <img class="waveform" id="triangle" src="assets/triangle.png" alt="triangle">

    document.querySelectorAll('.waveform').forEach(waveformButton => {
        // initially set all but the first button to 0.5 opacity
        if (waveformButton.id !== 'sine') {
            waveformButton.style.opacity = '0.5';
        }
        waveformButton.addEventListener('click', function() {
            waveform = this.id;
            // make all other buttons opacity 0.5
            document.querySelectorAll('.waveform').forEach(button => {
                button.style.opacity = '0.5';
            });
            this.style.opacity = '1';
        });
    });




    // SOUNDS FUNCTIONS //
    // c, c#, d, d#, e, f, f#, g, g#, a, a#, b
    function getFrequency(note) {
        const notes = {
            c: 261.63,
            'c#': 277.18,
            d: 293.66,
            'd#': 311.13,
            e: 329.63,
            f: 349.23,
            'f#': 369.99,
            g: 392.00,
            'g#': 415.30,
            a: 440.00,
            'a#': 466.16,
            b: 493.88
        };
        return notes[note];
    }


    // play note with scheduling
    function playNote(note, time) {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(masterGain);
        oscillator.type = waveform;
        oscillator.frequency.setValueAtTime(getFrequency(note), time);
        gainNode.gain.setValueAtTime(0.1, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 1);
        oscillator.start(time);
        oscillator.stop(time + 1);
    }


    function playKick(time) {
        let oscillator = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
    
        oscillator.connect(gainNode);
        gainNode.connect(masterGain); 
    
        oscillator.frequency.setValueAtTime(150, time); // initial frequency
        oscillator.frequency.exponentialRampToValueAtTime(0.01, time + 0.2); // rapid pitch drop for the kick sound
    
        gainNode.gain.setValueAtTime(1, time); // Start at full volume
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.45); 
    
        oscillator.start(time);
        oscillator.stop(time + 0.5);
    
        // Addition for smoother ending (may not need)
        gainNode.gain.setValueAtTime(0.01, time + 0.45);
        gainNode.gain.linearRampToValueAtTime(0.001, time + 0.5);
    }

    
    function playSnare(time) {
        let noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.2, audioCtx.sampleRate);
        let output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < output.length; i++) {
            output[i] = Math.random() * 2 - 1; // fill buffer with white noise
        }
        
        let noise = audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;
    
        let noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000;
        noise.connect(noiseFilter);
    
        let noiseEnvelope = audioCtx.createGain();
        noiseFilter.connect(noiseEnvelope);
        noiseEnvelope.connect(masterGain); 
    
        noiseEnvelope.gain.setValueAtTime(1, time);
        noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    
        noise.start(time);
        noise.stop(time + 0.2);
    }
    
    function playHiHat(time) {
        let highPassFilter = audioCtx.createBiquadFilter();
        highPassFilter.type = 'highpass';
        highPassFilter.frequency.value = 5000;
    
        let whiteNoise = audioCtx.createBufferSource();
        let bufferSize = audioCtx.sampleRate; // 1 second of noise
        let buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        let output = buffer.getChannelData(0);
    
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1; // white noise
        }
    
        whiteNoise.buffer = buffer;
        whiteNoise.loop = true;
        whiteNoise.connect(highPassFilter);
    
        let gainNode = audioCtx.createGain();
        highPassFilter.connect(gainNode);
        gainNode.connect(masterGain); 
    
        gainNode.gain.setValueAtTime(1, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.05); // quick decay for the sharp "hit" sound
    
        whiteNoise.start(time);
        whiteNoise.stop(time + 0.05);
    }
    
    function playTom(time) {
        let oscillator = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
    
        let lowpassFilter = audioCtx.createBiquadFilter();
        lowpassFilter.type = "lowpass";
        lowpassFilter.frequency.value = 800; // tom "body" resonance
    
        oscillator.connect(lowpassFilter);
        lowpassFilter.connect(gainNode);
        gainNode.connect(masterGain);
        oscillator.frequency.setValueAtTime(120, time); // start frequency
        oscillator.frequency.exponentialRampToValueAtTime(80, time + 0.2); // end frequency for pitch drop
    
        gainNode.gain.setValueAtTime(1, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.4); // volume decay
    
        oscillator.start(time);
        oscillator.stop(time + 0.45); 
    
        gainNode.gain.setValueAtTime(0.01, time + 0.4);
        gainNode.gain.linearRampToValueAtTime(0.001, time + 0.45); // smooth fade out to prevent clicking
    }

    function playBell(time) {
        // 90s drum machine sound effect
        let oscillator = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
        let highpassFilter = audioCtx.createBiquadFilter();
        let lowpassFilter = audioCtx.createBiquadFilter();

        highpassFilter.type = 'highpass';
        highpassFilter.frequency.value = 1000;

        lowpassFilter.type = 'lowpass';
        lowpassFilter.frequency.value = 1000;

        oscillator.connect(highpassFilter);
        highpassFilter.connect(lowpassFilter);
        lowpassFilter.connect(gainNode);
        gainNode.connect(masterGain);
        
        oscillator.frequency.setValueAtTime(500, time);
        oscillator.frequency.exponentialRampToValueAtTime(100, time + 1);

        gainNode.gain.setValueAtTime(0.1, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 1);

        oscillator.start(time);
        oscillator.stop(time + 1);

        gainNode.gain.setValueAtTime(0.01, time + 1);
        gainNode.gain.linearRampToValueAtTime(0.001, time + 1.1);
    }
    
    function playSample(buffer, time) {
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(masterGain); 
        source.start(time);
    
        activeSources.push(source);
    
        source.onended = function() {
            activeSources = activeSources.filter(s => s !== source);
        };
    }

});
