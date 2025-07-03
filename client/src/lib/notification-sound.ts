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
          this.playLoudNotificationSound(event.data.volume || 0.8, event.data.duration || 1000);
        }
      });
    }
  }

  public async playLoudNotificationSound(volume: number = 0.8, duration: number = 1000): Promise<void> {
    if (!this.isInitialized || !this.audioContext) {
      console.warn('[SOUND] Audio context not available');
      return;
    }

    try {
      // Resume audio context if suspended (required for user interaction)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create a loud, attention-grabbing sound
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const compressor = this.audioContext.createDynamicsCompressor();

      // Connect audio nodes
      oscillator.connect(gainNode);
      gainNode.connect(compressor);
      compressor.connect(this.audioContext.destination);

      // Configure oscillator for loud notification sound
      oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime); // High pitch
      oscillator.type = 'sine';

      // Configure gain (volume) with fade out
      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration / 1000);

      // Configure compressor for consistent volume
      compressor.threshold.setValueAtTime(-20, this.audioContext.currentTime);
      compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
      compressor.ratio.setValueAtTime(10, this.audioContext.currentTime);
      compressor.attack.setValueAtTime(0.01, this.audioContext.currentTime);
      compressor.release.setValueAtTime(0.1, this.audioContext.currentTime);

      // Play the sound
      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration / 1000);

      console.log('[SOUND] Loud notification sound played');
    } catch (error) {
      console.error('[SOUND] Failed to play notification sound:', error);
    }
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