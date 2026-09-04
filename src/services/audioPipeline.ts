/**
 * Real-time Audio Pipeline for Arushi Gemini Live
 * Handles 16kHz microphone capture (PCM 16-bit LE) and 24kHz gapless model playback
 */

export class AudioPipeline {
  private inputContext: AudioContext | null = null;
  private outputContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;

  // Analysers for visualization
  private inputAnalyser: AnalyserNode | null = null;
  private outputAnalyser: AnalyserNode | null = null;

  // Output queue state
  private nextStartTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isPlaying = false;
  private onAudioProcessCallback: ((base64: string) => void) | null = null;

  constructor() {}

  /**
   * Start microphone capture at 16,000 Hz
   */
  async startRecording(onAudioChunk: (base64Pcm: string) => void): Promise<void> {
    this.onAudioProcessCallback = onAudioChunk;

    if (!this.inputContext || this.inputContext.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.inputContext = new AudioCtx({ sampleRate: 16000 });
    }

    if (this.inputContext.state === 'suspended') {
      await this.inputContext.resume();
    }

    if (!this.outputContext || this.outputContext.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.outputContext = new AudioCtx({ sampleRate: 24000 });
    }

    if (this.outputContext.state === 'suspended') {
      await this.outputContext.resume();
    }

    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        sampleRate: 16000,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.sourceNode = this.inputContext.createMediaStreamSource(this.mediaStream);
    this.inputAnalyser = this.inputContext.createAnalyser();
    this.inputAnalyser.fftSize = 256;
    this.inputAnalyser.smoothingTimeConstant = 0.8;

    this.scriptProcessor = this.inputContext.createScriptProcessor(4096, 1, 1);

    this.scriptProcessor.onaudioprocess = (e) => {
      if (!this.onAudioProcessCallback) return;
      const channelData = e.inputBuffer.getChannelData(0);
      const base64 = this.floatTo16BitPCMBase64(channelData);
      if (base64) {
        this.onAudioProcessCallback(base64);
      }
    };

    this.sourceNode.connect(this.inputAnalyser);
    this.sourceNode.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.inputContext.destination);
  }

  /**
   * Stop microphone capture
   */
  stopRecording(): void {
    if (this.scriptProcessor) {
      this.scriptProcessor.onaudioprocess = null;
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.inputContext && this.inputContext.state !== 'closed') {
      this.inputContext.close().catch(() => {});
      this.inputContext = null;
    }

    this.onAudioProcessCallback = null;
  }

  /**
   * Enqueue a 24kHz PCM chunk from Gemini Live for smooth gapless playback
   */
  enqueueAudioChunk(base64Pcm: string): void {
    if (!this.outputContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.outputContext = new AudioCtx({ sampleRate: 24000 });
    }

    if (this.outputContext.state === 'suspended') {
      this.outputContext.resume();
    }

    if (!this.outputAnalyser) {
      this.outputAnalyser = this.outputContext.createAnalyser();
      this.outputAnalyser.fftSize = 256;
      this.outputAnalyser.smoothingTimeConstant = 0.8;
      this.outputAnalyser.connect(this.outputContext.destination);
    }

    const floatData = this.base64PCMToFloat(base64Pcm);
    if (!floatData || floatData.length === 0) return;

    const buffer = this.outputContext.createBuffer(1, floatData.length, 24000);
    buffer.copyToChannel(floatData, 0);

    const source = this.outputContext.createBufferSource();
    source.buffer = buffer;

    // Gain node for soft de-clicking edge smoothing
    const gainNode = this.outputContext.createGain();
    source.connect(gainNode);
    gainNode.connect(this.outputAnalyser);

    const currentTime = this.outputContext.currentTime;
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime + 0.015; // 15ms lead buffer to prevent underruns
    }

    source.start(this.nextStartTime);
    this.isPlaying = true;
    this.activeSources.push(source);

    source.onended = () => {
      const idx = this.activeSources.indexOf(source);
      if (idx !== -1) this.activeSources.splice(idx, 1);
      if (this.activeSources.length === 0) {
        this.isPlaying = false;
      }
    };

    this.nextStartTime += buffer.duration;
  }

  /**
   * Interrupt: immediately stops all scheduled and playing audio buffers
   */
  stopPlayback(): void {
    for (const source of this.activeSources) {
      try {
        source.stop();
        source.disconnect();
      } catch (_) {}
    }
    this.activeSources = [];
    this.nextStartTime = 0;
    this.isPlaying = false;
  }

  /**
   * Get real-time audio energy level (0 - 1)
   */
  getEnergyLevels(): { inputEnergy: number; outputEnergy: number } {
    let inputEnergy = 0;
    let outputEnergy = 0;

    if (this.inputAnalyser) {
      const dataArray = new Uint8Array(this.inputAnalyser.frequencyBinCount);
      this.inputAnalyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      inputEnergy = Math.min(1, (sum / dataArray.length) / 100);
    }

    if (this.outputAnalyser && this.isPlaying) {
      const dataArray = new Uint8Array(this.outputAnalyser.frequencyBinCount);
      this.outputAnalyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      outputEnergy = Math.min(1, (sum / dataArray.length) / 100);
    }

    return { inputEnergy, outputEnergy };
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Helpers to convert between Float32Array and 16-bit PCM Base64
   */
  private floatTo16BitPCMBase64(float32: Float32Array): string {
    const buffer = new ArrayBuffer(float32.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(
        null,
        Array.from(bytes.subarray(i, i + chunkSize))
      );
    }
    return btoa(binary);
  }

  private base64PCMToFloat(base64: string): Float32Array | null {
    try {
      const binary = atob(base64);
      const len = binary.length;
      const buffer = new ArrayBuffer(len);
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const dataView = new DataView(buffer);
      const numSamples = Math.floor(len / 2);
      const float32 = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        const int16 = dataView.getInt16(i * 2, true);
        float32[i] = int16 / 32768.0;
      }
      return float32;
    } catch (e) {
      console.error('Error decoding audio chunk:', e);
      return null;
    }
  }

  cleanup(): void {
    this.stopPlayback();
    this.stopRecording();
    if (this.outputContext && this.outputContext.state !== 'closed') {
      this.outputContext.close().catch(() => {});
      this.outputContext = null;
    }
  }
}
