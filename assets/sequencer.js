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
    const notesInQueue = []; // Tracks the notes that are scheduled
    let requestID;

    // Master gain for overall volume control
    const masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.value = 0.8; // Adjust master volume here


    

    function playSound(sound, time) {
        if (sound === "kick") playKick(time);
        else if (sound === "snare") playSnare(time);
        else if (sound === "hihat") playHiHat(time);
        else if (sound === "tom") playTom(time);
    }

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
    

    function scheduleNote() {
        sequences.forEach((seq, index) => {
            const soundButtons = seq.querySelectorAll('button');
            const sound = soundButtons[currentBeat].classList.contains('button-active') ? seq.dataset.sound : null;
            if (sound) {
                playSound(sound, nextNoteTime);
            }
        });

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

    function startSequencer() {
        if (!isPlaying) {
            isPlaying = true;
            currentBeat = 0;
            nextNoteTime = audioCtx.currentTime + 0.05; // Short delay before starting to ensure timing accuracy
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

    bpmInput.addEventListener('input', function() {
        if (bpmInput.value <1) return;
        bpm = Number(bpmInput.value);
    });

    document.getElementById('reset').addEventListener('click', function() {
        sequences.forEach(sequence => {
            sequence.querySelectorAll('button').forEach(button => {
                button.classList.remove('button-active');
            });
        });
    });

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

    document.getElementById('master').addEventListener('input', function() {
        const value = this.value;
        masterGain.gain.value = value / 100; // Convert percentage to a value between 0 and 1
    });

    // shuffle button
    document.getElementById('shuffle').addEventListener('click', function() {
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
    
    



    // SOUNDS FUNCTIONS //


    function playKick(time) {
        let oscillator = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
    
        oscillator.connect(gainNode);
        gainNode.connect(masterGain); // Connect to masterGain instead of directly to the destination
    
        oscillator.frequency.setValueAtTime(150, time); // Initial frequency for the thump
        oscillator.frequency.exponentialRampToValueAtTime(0.01, time + 0.2); // Rapid pitch drop for the kick sound
    
        gainNode.gain.setValueAtTime(1, time); // Start at full volume
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.45); // Fade out to prevent clicking sound
    
        oscillator.start(time);
        oscillator.stop(time + 0.5); // Stop oscillator after the sound has fully decayed
    
        // Additional line for smoother ending (optional, remove if not necessary)
        gainNode.gain.setValueAtTime(0.01, time + 0.45);
        gainNode.gain.linearRampToValueAtTime(0.001, time + 0.5);
    }

    // Example adjustment for playKick to accept a time parameter
    function playKick2(time) {
        let oscillator = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(masterGain);

        oscillator.frequency.setValueAtTime(150, time);
        oscillator.frequency.exponentialRampToValueAtTime(0.01, time + 0.2);

        gainNode.gain.setValueAtTime(1, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.45);

        oscillator.start(time);
        oscillator.stop(time + 0.5);

        gainNode.gain.setValueAtTime(0.01, time + 0.45);
        gainNode.gain.linearRampToValueAtTime(0.001, time + 0.5);
    }

    
    function playSnare(time) {
        let noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.2, audioCtx.sampleRate);
        let output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < output.length; i++) {
            output[i] = Math.random() * 2 - 1; // Fill buffer with white noise
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
            output[i] = Math.random() * 2 - 1; // Generate white noise
        }
    
        whiteNoise.buffer = buffer;
        whiteNoise.loop = true;
        whiteNoise.connect(highPassFilter);
    
        let gainNode = audioCtx.createGain();
        highPassFilter.connect(gainNode);
        gainNode.connect(masterGain); 
    
        gainNode.gain.setValueAtTime(1, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.05); // Quick decay for the sharp "hit" sound
    
        whiteNoise.start(time);
        whiteNoise.stop(time + 0.05);
    }
    
    function playTom(time) {
        let oscillator = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
    
        let lowpassFilter = audioCtx.createBiquadFilter();
        lowpassFilter.type = "lowpass";
        lowpassFilter.frequency.value = 800; // Adjust for desired tom "body" resonance
    
        oscillator.connect(lowpassFilter);
        lowpassFilter.connect(gainNode);
        gainNode.connect(masterGain);
        oscillator.frequency.setValueAtTime(120, time); // Start frequency
        oscillator.frequency.exponentialRampToValueAtTime(80, time + 0.2); // End frequency for pitch drop
    
        gainNode.gain.setValueAtTime(1, time);
        gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.4); // Volume decay
    
        oscillator.start(time);
        oscillator.stop(time + 0.45); // Ensure the oscillator stops after the sound has decayed
    
        gainNode.gain.setValueAtTime(0.01, time + 0.4);
        gainNode.gain.linearRampToValueAtTime(0.001, time + 0.45); // Smooth fade out to prevent clicking
    }
    
    // checkbox for division
    document.getElementById('division').addEventListener('change', function() {
        division = this.checked ? 4 : 2;
    });

});
