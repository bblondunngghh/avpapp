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

      // Play urgent multi-tone alarm sequence
      await this.playUrgentAlarmSequence(volume);

      console.log('[SOUND] Urgent notification alarm played');
    } catch (error) {
      console.error('[SOUND] Failed to play notification sound:', error);
    }
  }

  private async playUrgentAlarmSequence(volume: number = 1.0): Promise<void> {
    if (!this.audioContext) return;

    // URGENT: High-intensity alarm pattern - siren-like wail
    const frequencies = [1200, 800, 1400, 700, 1500, 600, 1200, 800];
    const toneDuration = 150; // Quick 150ms per tone for urgency
    
    for (let i = 0; i < frequencies.length; i++) {
      await this.playUrgentTone(frequencies[i], toneDuration, volume);
      if (i < frequencies.length - 1) {
        await this.delay(30); // Very short 30ms gap for rapid-fire effect
      }
    }
  }

  private async playUrgentTone(frequency: number, duration: number, volume: number): Promise<void> {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const compressor = this.audioContext.createDynamicsCompressor();

    // Chain: oscillator -> gain -> compressor -> output
    oscillator.connect(gainNode);
    gainNode.connect(compressor);
    compressor.connect(this.audioContext.destination);

    // Use square wave for more piercing, urgent sound
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = 'square';

    // Maximum volume with sharp attack
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + (duration / 1000));

    // Aggressive compression for maximum loudness
    compressor.threshold.setValueAtTime(-10, this.audioContext.currentTime);
    compressor.knee.setValueAtTime(40, this.audioContext.currentTime);
    compressor.ratio.setValueAtTime(12, this.audioContext.currentTime);
    compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
    compressor.release.setValueAtTime(0.05, this.audioContext.currentTime);

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