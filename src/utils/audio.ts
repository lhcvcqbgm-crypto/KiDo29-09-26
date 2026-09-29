const VOICE_SETTINGS_KEY = "KIDO_VOICE_SETTINGS_V1";

const DEFAULT_VOICE_SETTINGS = {
  bilingual: true,
  englishGender: "female",
  vietnameseGender: "female",
  rate: 0.9,
};

export function getVoiceSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(VOICE_SETTINGS_KEY) || "{}");
    return { ...DEFAULT_VOICE_SETTINGS, ...s };
  } catch {
    return DEFAULT_VOICE_SETTINGS;
  }
}

export function saveVoiceSettings(s: any) {
  try {
    localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(s));
  } catch (e) {
    console.warn("Failed to save voice settings", e);
  }
}

export const getVoicePreferences = getVoiceSettings;
export const saveVoicePreferences = saveVoiceSettings;

export function resolveAudioUrl(linkOrId: string | undefined | null): string | null {
  if (!linkOrId) return null;
  const trimmed = linkOrId.trim();
  if (!trimmed) return null;

  // Check if it's already a full direct URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // If it's a Google Drive link, extract the file ID and convert to direct streaming link
    const driveMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/id=([a-zA-Z0-9_-]+)/) ||
      trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (driveMatch && driveMatch[1]) {
      return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(driveMatch[1])}`;
    }
    return trimmed;
  }

  // If it's a Drive ID (alphanumeric string without slashes or protocols)
  if (/^[a-zA-Z0-9_-]{10,128}$/.test(trimmed)) {
    return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(trimmed)}`;
  }

  return trimmed;
}

export class AudioService {
  private audioCtx: AudioContext | null = null;
  private musicOsc1: OscillatorNode | null = null;
  private musicGain: GainNode | null = null;
  private isMusicPlaying: boolean = false;
  private musicVolume: number = 0.5;
  private speechSequence: number = 0;
  private currentAudioElement: HTMLAudioElement | null = null;

  public getContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = typeof window !== 'undefined' ? (window.AudioContext || (window as any).webkitAudioContext) : null;
      if (!AudioCtxClass) throw new Error("Web Audio API not supported");
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public pickVoice(lang: string): SpeechSynthesisVoice | undefined {
    if (typeof window === 'undefined' || !window.speechSynthesis) return undefined;
    const voices = window.speechSynthesis.getVoices().filter((m) =>
      m.lang.toLowerCase().startsWith(lang === "vi" ? "vi" : "en")
    );
    const settings = getVoiceSettings();
    const gender = (lang === "vi" ? settings.vietnameseGender : settings.englishGender) === "female"
      ? /female|woman|nữ|linh|an|hoai|mai|samantha|zira|aria|jenny/i
      : /male|man|nam|minh|son|david|guy|ryan|daniel/i;

    if (lang === "vi") {
      return (
        voices.find((m) => /saigon|sài gòn|southern|miền nam|nam bộ/i.test(m.name) && gender.test(m.name)) ||
        voices.find((m) => gender.test(m.name) && m.lang.toLowerCase() === "vi-vn") ||
        voices.find((m) => /saigon|sài gòn|southern|miền nam|nam bộ/i.test(m.name)) ||
        voices.find((m) => m.lang.toLowerCase() === "vi-vn" && m.localService) ||
        voices.find((m) => m.lang.toLowerCase() === "vi-vn") ||
        voices[0]
      );
    } else {
      return (
        voices.find((m) => gender.test(m.name) && m.lang.toLowerCase() === "en-us") ||
        voices.find((m) => m.lang.toLowerCase() === "en-us" && m.localService) ||
        voices.find((m) => m.lang.toLowerCase() === "en-us") ||
        voices[0]
      );
    }
  }

  public speakSegments(segments: Array<{ text: string; lang: string }>, rate: number) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const seq = ++this.speechSequence;
    const synth = window.speechSynthesis;
    synth.cancel();

    const speakNext = (idx: number) => {
      if (seq !== this.speechSequence || idx >= segments.length) return;
      const { text, lang } = segments[idx];
      const voice = this.pickVoice(lang);
      if (lang === "vi" && !voice) return;

      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = lang === "vi" ? "vi-VN" : "en-US";
      if (voice) utter.voice = voice;
      utter.rate = rate;
      utter.pitch = 1;
      utter.onend = () => speakNext(idx + 1);
      utter.onerror = () => {};
      synth.speak(utter);
    };

    speakNext(0);
  }

  public speakBilingual(enText: string, viText: string, defaultRate: number = 0.9) {
    const settings = getVoiceSettings();
    const segments = [{ text: enText.trim(), lang: "en" }];
    if (settings.bilingual && viText.trim()) {
      segments.push({ text: viText.trim(), lang: "vi" });
    }
    this.speakSegments(segments, settings.rate || defaultRate);
  }

  public speakDetected(text: string, rate: number = 0.9) {
    const isVi = /[ăâđêôơưáàảãạấầẩẫậắằẳẵặéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵ]/i.test(text);
    this.speakSegments([{ text, lang: isVi ? "vi" : "en" }], rate);
  }

  public playClickSound() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {
      console.warn("Audio click disabled", e);
    }
  }

  public playSuccessSound() {
    try {
      const ctx = this.getContext();
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.07 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.07);
        osc.stop(ctx.currentTime + i * 0.07 + 0.25);
      });
    } catch (e) {
      console.warn("Audio success failed", e);
    }
  }

  public playApplauseSound() {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;
      for (let i = 0; i < 24; i++) {
        const time = now + i * 0.045 + Math.random() * 0.02;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.type = i % 2 === 0 ? "square" : "triangle";
        osc.frequency.setValueAtTime(320 + Math.random() * 850, time);
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1400 + Math.random() * 1600, time);
        filter.Q.setValueAtTime(1.8, time);
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.14 + Math.random() * 0.08, time + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05 + Math.random() * 0.03);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(time);
        osc.stop(time + 0.08);
      }
      this.playFanfareSound();
    } catch (e) {
      console.warn("Audio applause failed", e);
    }
  }

  public playErrorSound() {
    try {
      const ctx = this.getContext();
      [329.63, 261.63, 220].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.15);
      });
    } catch (e) {
      console.warn("Audio error failed", e);
    }
  }

  public playCoinSound() {
    try {
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(987.77, ctx.currentTime);
      osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.28);
    } catch (e) {
      console.warn("Audio coin failed", e);
    }
  }

  public playStreakSound() {
    try {
      const ctx = this.getContext();
      [440, 554.37, 659.25, 880].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.05);
        gain.gain.setValueAtTime(0.22, ctx.currentTime + i * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.05);
        osc.stop(ctx.currentTime + i * 0.05 + 0.2);
      });
    } catch (e) {
      console.warn("Audio streak failed", e);
    }
  }

  public playFanfareSound() {
    try {
      const ctx = this.getContext();
      const notes = [
        { f: 523.25, d: 0.12 },
        { f: 523.25, d: 0.12 },
        { f: 523.25, d: 0.12 },
        { f: 659.25, d: 0.25 },
        { f: 783.99, d: 0.15 },
        { f: 1046.5, d: 0.4 },
      ];
      let now = ctx.currentTime;
      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(note.f, now);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + note.d);
        now += note.d + 0.03;
      });
    } catch (e) {
      console.warn("Audio fanfare failed", e);
    }
  }

  public playTimerAlarm() {
    try {
      const ctx = this.getContext();
      [523.25, 659.25, 783.99, 1046.5, 1046.5].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.18);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.18 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.18);
        osc.stop(ctx.currentTime + i * 0.18 + 0.25);
      });
    } catch (e) {
      console.warn("Audio timer alarm failed", e);
    }
  }

  public stopActiveAudio() {
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch (e) {
        // ignore
      }
      this.currentAudioElement = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }

  public async playCustomAudio(options: {
    url?: string | null;
    fallbackText?: string;
    lang?: 'en' | 'vi';
    rate?: number;
  }): Promise<boolean> {
    const { url, fallbackText, lang = 'en', rate = 0.9 } = options;
    const resolved = resolveAudioUrl(url);

    this.stopActiveAudio();

    if (resolved) {
      try {
        const audio = new Audio(resolved);
        this.currentAudioElement = audio;

        return await new Promise<boolean>((resolve) => {
          let resolvedAlready = false;

          audio.onended = () => {
            if (!resolvedAlready) {
              resolvedAlready = true;
              this.currentAudioElement = null;
              resolve(true);
            }
          };

          audio.onerror = () => {
            if (!resolvedAlready) {
              resolvedAlready = true;
              this.currentAudioElement = null;
              // Fallback to TTS if audio file cannot be played or loaded
              if (fallbackText) {
                if (lang === 'vi') {
                  this.speakVietnamese(fallbackText, rate);
                } else {
                  this.speakEnglish(fallbackText, rate);
                }
              }
              resolve(false);
            }
          };

          audio.play().catch(() => {
            if (!resolvedAlready) {
              resolvedAlready = true;
              this.currentAudioElement = null;
              if (fallbackText) {
                if (lang === 'vi') {
                  this.speakVietnamese(fallbackText, rate);
                } else {
                  this.speakEnglish(fallbackText, rate);
                }
              }
              resolve(false);
            }
          });
        });
      } catch (e) {
        // fallback to TTS
      }
    }

    if (fallbackText) {
      if (lang === 'vi') {
        this.speakVietnamese(fallbackText, rate);
      } else {
        this.speakEnglish(fallbackText, rate);
      }
      return true;
    }

    return false;
  }

  public playEnglishWord(word: string, audioUrl?: string | null) {
    return this.playCustomAudio({
      url: audioUrl,
      fallbackText: word,
      lang: 'en',
    });
  }

  public playVietnameseMeaning(meaning: string, audioUrl?: string | null) {
    return this.playCustomAudio({
      url: audioUrl,
      fallbackText: meaning,
      lang: 'vi',
    });
  }

  public playEnglishSentence(sentence: string, audioUrl?: string | null) {
    return this.playCustomAudio({
      url: audioUrl,
      fallbackText: sentence,
      lang: 'en',
      rate: 0.85,
    });
  }

  public playVietnameseSentence(sentence: string, audioUrl?: string | null) {
    return this.playCustomAudio({
      url: audioUrl,
      fallbackText: sentence,
      lang: 'vi',
      rate: 0.9,
    });
  }

  public speakText(text: string, lang: string = "en") {
    if (lang === "vi") {
      this.speakVietnamese(text);
    } else {
      this.speakEnglish(text);
    }
  }

  public speakEnglish(text: string, rate: number = 0.9) {
    try {
      this.speakSegments([{ text, lang: "en" }], rate);
    } catch (i) {
      console.warn("Speech synthesis disabled or blocked", i);
    }
  }

  public speakVietnamese(text: string, rate: number = 0.9) {
    try {
      this.speakSegments([{ text, lang: "vi" }], rate);
    } catch (i) {
      console.warn("Speech synthesis disabled or blocked", i);
    }
  }

  public toggleStudyMusic(force?: boolean, onStateChange?: (playing: boolean) => void): boolean {
    const shouldPlay = force !== undefined ? force : !this.isMusicPlaying;
    if (shouldPlay) {
      this.startStudyMusic();
    } else {
      this.stopStudyMusic();
    }
    if (onStateChange) onStateChange(this.isMusicPlaying);
    return this.isMusicPlaying;
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = vol;
    if (this.musicGain && this.audioCtx) {
      this.musicGain.gain.setValueAtTime(vol * 0.08, this.audioCtx.currentTime);
    }
  }

  public getIsMusicPlaying(): boolean {
    return this.isMusicPlaying;
  }

  public startStudyMusic() {
    try {
      if (this.isMusicPlaying) return;
      const ctx = this.getContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(this.musicVolume * 0.05, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      this.musicOsc1 = osc;
      this.musicGain = gain;
      this.isMusicPlaying = true;
    } catch (e) {
      console.warn("Study music error", e);
    }
  }

  public stopStudyMusic() {
    try {
      if (this.musicOsc1) {
        this.musicOsc1.stop();
        this.musicOsc1.disconnect();
        this.musicOsc1 = null;
      }
      this.isMusicPlaying = false;
    } catch (e) {
      console.warn("Stop music error", e);
    }
  }
}

export const audioService = new AudioService();
