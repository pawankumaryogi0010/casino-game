// ============================================
// EMERALD KING CASINO - ZERO-FILE AUDIO ENGINE
// Programmatically Generated Sounds
// No external audio files needed
// File: js/audio.js
// Version: 1.0.0
// ============================================

class SoundManager {
    constructor() {
        this.audioContext = null;
        this.isInitialized = false;
        this.isMuted = false;
        this.isMusicPlaying = false;
        this.userInteracted = false;
        
        this.volume = { master: 0.7, sfx: 0.8, music: 0.3 };
        
        // Background music oscillators
        this.bgOscillators = [];
        this.bgGain = null;
        
        this._loadPreferences();
        this._setupAutoInit();
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    init() {
        if (this.isInitialized) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) { console.warn('⚠️ Audio not supported'); return; }
            
            this.audioContext = new AudioContext();
            this.isInitialized = true;
            console.log('✅ Audio Engine Ready (Zero-File Mode)');
        } catch (e) { console.error('Audio init failed:', e.message); }
    }

    _setupAutoInit() {
        ['click', 'touchstart', 'keydown'].forEach(evt => {
            document.addEventListener(evt, () => {
                if (!this.isInitialized) this.init();
                this.userInteracted = true;
            }, { once: true });
        });
    }

    // ============================================
    // SOUND GENERATORS (No Files Needed)
    // ============================================

    /**
     * Generate a tone with envelope
     */
    _playTone(frequency, type, duration, volume = 1, detune = 0) {
        if (!this.isInitialized || this.isMuted) return;
        if (this.audioContext.state === 'suspended') this.audioContext.resume();

        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = type;
        osc.frequency.value = frequency;
        osc.detune.value = detune;
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume * this.volume.sfx * this.volume.master, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + duration + 0.05);
    }

    /**
     * Generate a noise burst
     */
    _playNoise(duration, volume = 0.3) {
        if (!this.isInitialized || this.isMuted) return;
        if (this.audioContext.state === 'suspended') this.audioContext.resume();

        const ctx = this.audioContext;
        const now = ctx.currentTime;
        const sampleRate = ctx.sampleRate;
        const length = sampleRate * duration;
        
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
        }
        
        const source = ctx.createBufferSource();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        source.buffer = buffer;
        filter.type = 'highpass';
        filter.frequency.value = 3000;
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume * this.volume.sfx * this.volume.master, now + 0.003);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        source.start(now);
        source.stop(now + duration + 0.05);
    }

    // ============================================
    // GAME EVENT SOUNDS
    // ============================================

    playClick() {
        this._playTone(800, 'sine', 0.06, 0.3);
        setTimeout(() => this._playTone(1200, 'sine', 0.04, 0.2), 30);
    }

    playWin() {
        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this._playTone(freq, 'square', 0.2, 0.25);
            }, i * 100);
        });
        setTimeout(() => {
            this._playTone(1047, 'triangle', 0.5, 0.3);
        }, 450);
    }

    playLose() {
        this._playTone(200, 'sawtooth', 0.3, 0.2);
        setTimeout(() => this._playTone(150, 'sawtooth', 0.4, 0.15), 150);
    }

    playDeal() {
        this._playNoise(0.05, 0.15);
        setTimeout(() => this._playNoise(0.04, 0.1), 60);
    }

    playSpin() {
        for (let i = 0; i < 8; i++) {
            setTimeout(() => {
                this._playTone(200 + Math.random() * 400, 'triangle', 0.05, 0.1);
            }, i * 50);
        }
    }

    playCoin() {
        this._playTone(1500, 'sine', 0.1, 0.4);
        setTimeout(() => this._playTone(2000, 'sine', 0.08, 0.3), 80);
    }

    playLevelUp() {
        const fanfare = [523, 659, 784, 1047, 1319, 1568];
        fanfare.forEach((freq, i) => {
            setTimeout(() => this._playTone(freq, 'triangle', 0.25, 0.3), i * 120);
        });
    }

    // ============================================
    // BACKGROUND MUSIC (Generated Loop)
    // ============================================

    toggleBackgroundMusic() {
        if (!this.isInitialized) { console.warn('Audio not ready'); return false; }
        if (this.isMusicPlaying) { this._stopBgMusic(); } else { this._startBgMusic(); }
        return this.isMusicPlaying;
    }

    _startBgMusic() {
        if (this.isMusicPlaying) return;
        if (this.audioContext.state === 'suspended') this.audioContext.resume();

        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        this.bgGain = ctx.createGain();
        this.bgGain.gain.value = 0;
        this.bgGain.gain.linearRampToValueAtTime(this.volume.music * this.volume.master * 0.5, now + 2);
        this.bgGain.connect(ctx.destination);
        
        this.bgOscillators = [];
        
        // Ambient chord progression
        const chords = [
            [130.81, 164.81, 196.00],  // C3, E3, G3
            [146.83, 174.61, 220.00],  // D3, F3, A3
            [196.00, 246.94, 293.66],  // G3, B3, D4
            [174.61, 220.00, 261.63],  // F3, A3, C4
        ];

        let chordIndex = 0;
        
        const playNextChord = () => {
            if (!this.isMusicPlaying) return;
            
            // Stop previous
            this.bgOscillators.forEach(o => { try { o.stop(); } catch(e) {} });
            this.bgOscillators = [];
            
            const chord = chords[chordIndex % chords.length];
            chord.forEach(freq => {
                const osc = ctx.createOscillator();
                const noteGain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.value = freq;
                noteGain.gain.value = 0.15 / chord.length;
                osc.connect(noteGain);
                noteGain.connect(this.bgGain);
                osc.start();
                this.bgOscillators.push(osc);
            });
            
            chordIndex++;
            this._bgTimer = setTimeout(playNextChord, 4000);
        };
        
        playNextChord();
        this.isMusicPlaying = true;
        console.log('🎵 Background music started');
    }

    _stopBgMusic() {
        if (this.bgOscillators.length > 0) {
            const now = this.audioContext.currentTime;
            this.bgGain.gain.linearRampToValueAtTime(0, now + 1);
            setTimeout(() => {
                this.bgOscillators.forEach(o => { try { o.stop(); } catch(e) {} });
                this.bgOscillators = [];
            }, 1100);
        }
        if (this._bgTimer) clearTimeout(this._bgTimer);
        this.isMusicPlaying = false;
        console.log('🔇 Background music stopped');
    }

    // ============================================
    // VOLUME & MUTE
    // ============================================

    toggleMute() { this.isMuted = !this.isMuted; this._savePreferences(); return this.isMuted; }
    setMasterVolume(v) { this.volume.master = Math.max(0, Math.min(1, v)); this._savePreferences(); }
    setSFXVolume(v) { this.volume.sfx = Math.max(0, Math.min(1, v)); this._savePreferences(); }
    setMusicVolume(v) { this.volume.music = Math.max(0, Math.min(1, v)); this._savePreferences(); }

    // ============================================
    // LOCAL STORAGE
    // ============================================

    _loadPreferences() {
        try {
            const m = localStorage.getItem('emerald_audio_muted');
            if (m !== null) this.isMuted = m === 'true';
            const v = localStorage.getItem('emerald_audio_volume');
            if (v) this.volume = { ...this.volume, ...JSON.parse(v) };
        } catch(e) {}
    }

    _savePreferences() {
        try {
            localStorage.setItem('emerald_audio_muted', this.isMuted.toString());
            localStorage.setItem('emerald_audio_volume', JSON.stringify(this.volume));
        } catch(e) {}
    }

    isReady() { return this.isInitialized; }
    getState() { return { isInitialized: this.isInitialized, isMuted: this.isMuted, isMusicPlaying: this.isMusicPlaying, volume: { ...this.volume } }; }

    destroy() {
        this._stopBgMusic();
        if (this.audioContext) this.audioContext.close().catch(() => {});
        this.isInitialized = false;
    }
}

// Singleton
const Sound = new SoundManager();
window.Sound = Sound;
window.SoundManager = Sound;

console.log('🔉 Zero-File Audio Engine Loaded');
console.log('🎵 window.Sound.playClick() | playWin() | playLose() | toggleBackgroundMusic()');
