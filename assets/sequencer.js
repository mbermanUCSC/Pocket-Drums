document.addEventListener('DOMContentLoaded', function () {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const playButton = document.getElementById('play');
    const bpmInput = document.getElementById('bpm');
    const sequences = document.querySelectorAll('.sequence');
    let isPlaying = false;
    let currentBeat = -1; // Start at -1 to handle initial increment
    let timer;
    let interval = calculateInterval();

    
    // stop audio context when the window is closed or not focused
    window.addEventListener('blur', function() {
        audioCtx.suspend();
    });

    // start audio context when the window is focused
    window.addEventListener('focus', function() {
        audioCtx.resume();
    });

    sequences.forEach(sequence => {
        sequence.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', function() {
                this.classList.toggle('button-active'); // Toggle active class on click
            });
        });
    });
    

    playButton.addEventListener('click', function() {
        if (isPlaying) {
            stopSequencer();
        } else {
            startSequencer();
        }
    });

    bpmInput.addEventListener('input', function() {
        interval = calculateInterval();
        if (isPlaying) {
            restartSequencer(); // Restart the sequencer with the new BPM
        }
    });

    // reset button
    document.getElementById('reset').addEventListener('click', function() {
        sequences.forEach(sequence => {
            sequence.querySelectorAll('button').forEach(button => {
                button.classList.remove('button-active');
            });
        });
    });

    function calculateInterval() {
        const bpm = parseInt(bpmInput.value);
        return (60 / bpm) * 1000 / 4; // Calculate interval for each beat, assuming 4 beats per measure
    }

    // Sound synthesis functions
    function playKick() {
        let oscillator = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

        gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5);
    }

    function playSnare() {
        let noiseBuffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.2, audioCtx.sampleRate);
        let output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < output.length; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        let noise = audioCtx.createBufferSource();
        noise.buffer = noiseBuffer;

        let noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.value = 1000;
        noise.connect(noiseFilter);

        let noiseEnvelope = audioCtx.createGain();
        noiseFilter.connect(noiseEnvelope);
        noiseEnvelope.connect(audioCtx.destination);

        noiseEnvelope.gain.setValueAtTime(1, audioCtx.currentTime);
        noiseEnvelope.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

        noise.start();
        noise.stop(audioCtx.currentTime + 0.2);
    }

    function playHiHat() {
        let highPassFilter = audioCtx.createBiquadFilter();
        highPassFilter.type = 'highpass';
        highPassFilter.frequency.value = 5000;

        let whiteNoise = audioCtx.createBufferSource();
        let bufferSize = audioCtx.sampleRate;
        let buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        let output = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        whiteNoise.buffer = buffer;
        whiteNoise.loop = true;
        whiteNoise.start(0);
        whiteNoise.connect(highPassFilter);

        let gainNode = audioCtx.createGain();
        highPassFilter.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);

        whiteNoise.stop(audioCtx.currentTime + 0.05);
    }

    function playTom() {
        let oscillator = audioCtx.createOscillator();
        let gainNode = audioCtx.createGain();
    
        // Use a lowpass filter to simulate the drum body resonance
        let lowpassFilter = audioCtx.createBiquadFilter();
        lowpassFilter.type = "lowpass";
        lowpassFilter.frequency.value = 800; // Adjust for desired tom "body" resonance
        lowpassFilter.Q.value = 1; // Q value adjusts the resonance sharpness
    
        oscillator.connect(lowpassFilter);
        lowpassFilter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
    
        // Set initial frequency for tom - adjust based on desired tom pitch
        let startFrequency = 120; // Example starting frequency for a tom sound
        let endFrequency = 80; // End frequency after the pitch drop
        oscillator.frequency.setValueAtTime(startFrequency, audioCtx.currentTime);
        // Slight pitch drop to mimic the natural behavior of a tom drum
        oscillator.frequency.exponentialRampToValueAtTime(endFrequency, audioCtx.currentTime + 0.5);
    
        // Set the amplitude envelope for the tom
        gainNode.gain.setValueAtTime(1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.5); // Stop oscillator after 0.5 seconds
    }
    

    function startSequencer() {
        isPlaying = true;
        playButton.textContent = '⏸';
        moveNextBeat();
        timer = setInterval(moveNextBeat, interval);
    }

    function stopSequencer() {
        isPlaying = false;
        playButton.textContent = '▶';
        clearInterval(timer);
    }

    function restartSequencer() {
        clearInterval(timer);
        timer = setInterval(moveNextBeat, interval);
    }

    function moveNextBeat() {
        currentBeat = (currentBeat + 1) % 8;

        sequences.forEach((sequence, seqIndex) => {
            const buttons = sequence.querySelectorAll('button');
            buttons.forEach((button, index) => {
                button.classList.remove('current-beat');
                if (index === currentBeat) {
                    button.classList.add('current-beat');
                    if (button.classList.contains('button-active')) {
                        // Decide which sound to play based on the sequence index
                        switch (seqIndex) {
                            case 0: playKick(); break;
                            case 1: playSnare(); break;
                            case 2: playHiHat(); break;
                            case 3: playTom(); break;
                            default: break;
                        }
                    }
                }
            });
        });
    }
});
