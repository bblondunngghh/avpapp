// Notification Sound Handler
export class NotificationSoundService {
  private audioContext: AudioContext | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      // Initialize AudioContext for sound generation
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.isInitialized = true;
      console.log('[SOUND] Notification sound service initialized');
    } catch (error) {
      console.warn('[SOUND] Failed to initialize audio context:', error);
    }

    // Listen for messages from service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'PLAY_NOTIFICATION_SOUND') {
          this.playLoudNotificationSound(event.data.volume || 1.0, event.data.duration || 1500);
        }
      });
    }
  }

  public async playLoudNotificationSound(volume: number = 1.0, duration: number = 1000): Promise<void> {
    if (!this.isInitialized || !this.audioContext) {
      console.warn('[SOUND] Audio context not available');
      return;
    }

    try {
      // Resume audio context if suspended (required for user interaction)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Force maximum volume regardless of input parameter
      const maxVolume = 1.0;

      // Play urgent multi-tone alarm sequence at MAXIMUM loudness
      await this.playUrgentAlarmSequence(maxVolume);

      console.log('[SOUND] MAXIMUM VOLUME urgent notification alarm played');
    } catch (error) {
      console.error('[SOUND] Failed to play notification sound:', error);
    }
  }

  private async playUrgentAlarmSequence(volume: number = 1.0): Promise<void> {
    if (!this.audioContext) return;

    // MAXIMUM LOUDNESS: Multi-layered alarm with overlapping frequencies
    const primaryFreqs = [1200, 800, 1400, 700, 1500, 600, 1200, 800, 1600, 500];
    const harmonyFreqs = [2400, 1600, 2800, 1400, 3000, 1200]; // Harmonics for extra loudness
    const toneDuration = 120; // Shortened for more aggressive effect
    
    // Play primary alarm sequence
    for (let i = 0; i < primaryFreqs.length; i++) {
      // Play primary frequency
      const primaryPromise = this.playUrgentTone(primaryFreqs[i], toneDuration, volume);
      
      // Overlay harmony frequency for maximum impact
      if (i < harmonyFreqs.length) {
        const harmonyPromise = this.playUrgentTone(harmonyFreqs[i], toneDuration * 0.7, volume * 0.6);
        await Promise.all([primaryPromise, harmonyPromise]);
      } else {
        await primaryPromise;
      }
      
      if (i < primaryFreqs.length - 1) {
        await this.delay(20); // Even shorter gap for rapid-fire effect
      }
    }

    // Add final penetrating blast
    await this.playTripleBlast(volume);
  }

  private async playTripleBlast(volume: number): Promise<void> {
    // Triple-layered final blast for maximum attention
    const blastPromises = [
      this.playUrgentTone(1800, 300, volume),      // High piercing tone
      this.playUrgentTone(900, 300, volume * 0.8), // Mid frequency
      this.playUrgentTone(450, 300, volume * 0.6)  // Low frequency for fullness
    ];
    
    await Promise.all(blastPromises);
  }

  private async playUrgentTone(frequency: number, duration: number, volume: number): Promise<void> {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const compressor = this.audioContext.createDynamicsCompressor();
    const limiter = this.audioContext.createDynamicsCompressor();

    // Chain: oscillator -> gain -> compressor -> limiter -> output
    oscillator.connect(gainNode);
    gainNode.connect(compressor);
    compressor.connect(limiter);
    limiter.connect(this.audioContext.destination);

    // Use sawtooth wave for maximum harmonic content and loudness
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'sawtooth';

    // MAXIMUM volume - no fade out for sustained loudness
    gainNode.gain.setValueAtTime(1.0, this.audioContext.currentTime);
    gainNode.gain.setValueAtTime(1.0, this.audioContext.currentTime + (duration / 1000));

    // EXTREME compression for maximum perceived loudness
    compressor.threshold.setValueAtTime(-6, this.audioContext.currentTime);
    compressor.knee.setValueAtTime(0, this.audioContext.currentTime); // Hard knee
    compressor.ratio.setValueAtTime(20, this.audioContext.currentTime); // Maximum ratio
    compressor.attack.setValueAtTime(0.001, this.audioContext.currentTime); // Instant attack
    compressor.release.setValueAtTime(0.01, this.audioContext.currentTime); // Fast release

    // Brick wall limiter to prevent clipping while maximizing loudness
    limiter.threshold.setValueAtTime(-0.1, this.audioContext.currentTime);
    limiter.knee.setValueAtTime(0, this.audioContext.currentTime);
    limiter.ratio.setValueAtTime(50, this.audioContext.currentTime);
    limiter.attack.setValueAtTime(0.0001, this.audioContext.currentTime);
    limiter.release.setValueAtTime(0.001, this.audioContext.currentTime);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + (duration / 1000));

    return new Promise((resolve) => {
      oscillator.onended = () => resolve();
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public async playUrgentAlertSound(): Promise<void> {
    if (!this.isInitialized || !this.audioContext) {
      console.warn('[SOUND] Audio context not available for urgent alert');
      return;
    }

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create a more urgent, multi-tone alert sound
      const frequencies = [800, 1200, 1000, 1400]; // Multiple tones
      const duration = 0.3; // Duration of each tone
      
      for (let i = 0; i < frequencies.length; i++) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequencies[i], this.audioContext.currentTime);
        oscillator.type = 'square'; // More attention-grabbing than sine
        
        const startTime = this.audioContext.currentTime + (i * duration);
        gainNode.gain.setValueAtTime(0.7, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      }

      console.log('[SOUND] Urgent alert sound played');
    } catch (error) {
      console.error('[SOUND] Failed to play urgent alert sound:', error);
    }
  }

  public async enableSoundForUserInteraction(): Promise<void> {
    // This method can be called after user interaction to enable sound
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('[SOUND] Audio context resumed after user interaction');
      } catch (error) {
        console.warn('[SOUND] Failed to resume audio context:', error);
      }
    }
  }
}

// Global instance
export const notificationSoundService = new NotificationSoundService();