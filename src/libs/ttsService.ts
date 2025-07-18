import { ttsAPI } from './api';

interface TTSRequest {
  counterId: number;
  ticketNumber: number;
  callAttempt: number; // 1, 2, hoặc 3
  timestamp: string; // ISO timestamp từ called_at hoặc WebSocket
  source: 'manual' | 'ai'; // Để tracking, không dùng cho priority
}

interface TTSResponse {
  audioUrl: string;
  success: boolean;
  error?: string;
}

interface SeatInfo {
  id: number;
  status: boolean; // true = occupied, false = empty
  type: string;
  counter_id: number;
}

export class TTSService {
  private static instance: TTSService | null = null;
  private audioQueue: TTSRequest[] = [];
  private isPlaying: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;
  private maxRetries: number = 3;
  private audioGap: number = 2000; // 2 giây giữa các lần phát
  private apiBaseUrl: string;

  static getInstance(): TTSService {
    if (!this.instance) {
      this.instance = new TTSService();
    }
    return this.instance;
  }

  private constructor() {
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    // ✅ Only setup WebSocket on client-side to prevent SSR error
    if (typeof window !== 'undefined') {
      this.setupWebSocketListener();
    }
  }

  private setupWebSocketListener() {
    // ✅ Double check for browser environment
    if (typeof window === 'undefined') {
      console.warn('🔇 WebSocket setup skipped on server-side');
      return;
    }
    
    try {
      // Listen for ticket_called events từ WebSocket với timestamp
      const handleTicketCalled = (event: Event) => {
        const customEvent = event as CustomEvent;
        const { ticket_number, counter_name, timestamp } = customEvent.detail;
      
        // Extract counter_id từ counter_name hoặc mapping logic
        const counterId = this.extractCounterIdFromName(counter_name);
        
        this.queueAnnouncement(counterId, ticket_number, 1, 'ai', timestamp);
      };

      window.addEventListener('ticketCalledWithTimestamp', handleTicketCalled);
    } catch (error) {
      console.warn('⚠️ WebSocket setup failed:', error);
    }
  }

  private extractCounterIdFromName(counterName: string): number {
    // Mapping logic từ counter_name → counter_id
    const counterMapping: { [key: string]: number } = {
      'Tư pháp': 1,
      'Kinh tế - Hạ tầng - Đô thị': 2,
      'Văn phòng đăng ký đất đai': 3,
      'Văn hóa - Xã hội': 4
    };
    
    return counterMapping[counterName] || 1;
  }

  async queueAnnouncement(
    counterId: number, 
    ticketNumber: number, 
    callAttempt: number = 1,
    source: 'manual' | 'ai' = 'manual',
    timestamp?: string
  ): Promise<void> {
    // Check call limit
    if (callAttempt > this.maxRetries) {
      console.warn(`🔊 Ticket ${ticketNumber} exceeded max calls (${this.maxRetries})`);
      return;
    }

    // Check seat status từ lần gọi thứ 2
    if (callAttempt >= 2) {
      const seatStatus = await this.checkSeatStatus(counterId);
      if (!seatStatus.hasEmptySeats) {
        console.log(`🔊 No empty seats for counter ${counterId}, skipping call ${callAttempt}`);
        return;
      }
    }

    const request: TTSRequest = {
      counterId,
      ticketNumber,
      callAttempt,
      timestamp: timestamp || new Date().toISOString(),
      source
    };

    // Insert vào queue theo timestamp (FIFO based on called_at time)
    this.insertToQueueByTimestamp(request);
    
    // Process queue nếu không đang phát
    if (!this.isPlaying) {
      this.processQueue();
    }
  }

  private insertToQueueByTimestamp(request: TTSRequest): void {
    // Sort purely by timestamp - không có priority level
    this.audioQueue.push(request);
    this.audioQueue.sort((a, b) => {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });

    console.log(`🔊 Queued announcement: Counter ${request.counterId}, Ticket ${request.ticketNumber}, Timestamp: ${request.timestamp}`);
    console.log(`🔊 Queue order:`, this.audioQueue.map(r => `T${r.ticketNumber}@${new Date(r.timestamp).toLocaleTimeString()}`));
  }

  private async processQueue(): Promise<void> {
    if (this.audioQueue.length === 0 || this.isPlaying) {
      return;
    }

    this.isPlaying = true;
    const request = this.audioQueue.shift()!;

    try {
      console.log(`🔊 Processing TTS: Counter ${request.counterId}, Ticket ${request.ticketNumber}, Source: ${request.source}`);
      
      // Call TTS API
      const response = await this.callTTSAPI(request.counterId, request.ticketNumber);
      
      if (response.success) {
        // Play audio
        await this.playAudio(response.audioUrl, request);
        
        // Update UI với announcement info
        this.updateAnnouncementUI(request);
      } else {
        console.error('🔊 TTS API failed:', response.error);
      }

    } catch (error) {
      console.error('🔊 TTS processing error:', error);
    } finally {
      this.isPlaying = false;
      
      // 2 giây gap giữa các announcement
      setTimeout(() => this.processQueue(), this.audioGap);
    }
  }

  private async callTTSAPI(counterId: number, ticketNumber: number): Promise<TTSResponse> {
    try {
      console.log(`🎵 Calling TTS API for Counter ${counterId}, Ticket ${ticketNumber}`);
      
      // Sử dụng ttsAPI để generate MP3 audio blob
      const audioBlob = await ttsAPI.generateAudio(counterId, ticketNumber);
      
      // Create object URL cho HTML5 audio playback
      const audioUrl = URL.createObjectURL(audioBlob);
      
      console.log(`✅ TTS API success - Generated MP3 blob (${audioBlob.size} bytes)`);
      console.log(`🎵 Audio URL created: ${audioUrl}`);
      
      return { audioUrl, success: true };
      
    } catch (error) {
      console.error(`❌ TTS API failed for Counter ${counterId}, Ticket ${ticketNumber}:`, error);
      
      if (error instanceof Error) {
        if (error.message.includes('Counter not found')) {
          return { 
            audioUrl: '', 
            success: false, 
            error: 'Counter not found' 
          };
        }
        if (error.message.includes('Validation error')) {
          return { 
            audioUrl: '', 
            success: false, 
            error: error.message 
          };
        }
      }
      
      return { 
        audioUrl: '', 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown TTS error'
      };
    }
  }

  private async playAudio(audioUrl: string, request: TTSRequest): Promise<void> {
    return new Promise((resolve, reject) => {
      this.currentAudio = new Audio(audioUrl);
      
      this.currentAudio.onended = () => {
        URL.revokeObjectURL(audioUrl); // Cleanup blob URL
        this.currentAudio = null;
        console.log(`🔊 Audio completed: Counter ${request.counterId}, Ticket ${request.ticketNumber}`);
        resolve();
      };

      this.currentAudio.onerror = () => {
        URL.revokeObjectURL(audioUrl);
        this.currentAudio = null;
        console.error(`🔊 Audio playback failed: Counter ${request.counterId}, Ticket ${request.ticketNumber}`);
        reject(new Error('Audio playback failed'));
      };

      this.currentAudio.play().catch(error => {
        console.error('🔊 Audio play failed:', error);
        reject(error);
      });
    });
  }

  private async checkSeatStatus(counterId: number): Promise<{ hasEmptySeats: boolean }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/seats/counter/${counterId}`);
      if (response.ok) {
        const seats: SeatInfo[] = await response.json();
        // Filter seats với type="client" và status=false (empty)
        const emptyClientSeats = seats.filter(seat => 
          seat.type === 'client' && !seat.status
        );
        return { hasEmptySeats: emptyClientSeats.length > 0 };
      }
      return { hasEmptySeats: false };
    } catch (error) {
      console.error('🔊 Seat status check failed:', error);
      return { hasEmptySeats: false };
    }
  }

  private updateAnnouncementUI(request: TTSRequest): void {
    // Dispatch event để update TV display và other components
    window.dispatchEvent(new CustomEvent('ttsAnnouncement', {
      detail: {
        counterId: request.counterId,
        ticketNumber: request.ticketNumber,
        callAttempt: request.callAttempt,
        source: request.source,
        timestamp: request.timestamp
      }
    }));
  }

  stopCurrentAudio(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
      this.isPlaying = false;
    }
  }

  clearQueue(): void {
    this.audioQueue = [];
    this.stopCurrentAudio();
  }

  getQueueStatus(): { 
    queueLength: number; 
    isPlaying: boolean; 
    currentRequest?: TTSRequest;
    upcomingRequests: TTSRequest[];
  } {
    // ✅ Safe default for SSR
    if (typeof window === 'undefined') {
      return {
        queueLength: 0,
        isPlaying: false,
        upcomingRequests: []
      };
    }

    return {
      queueLength: this.audioQueue.length,
      isPlaying: this.isPlaying,
      currentRequest: this.audioQueue[0],
      upcomingRequests: this.audioQueue.slice(0, 3) // Show next 3 in queue
    };
  }

  // Helper method để download MP3 file từ TTS API
  async downloadAudio(counterId: number, ticketNumber: number): Promise<void> {
    try {
      const audioBlob = await ttsAPI.generateAudio(counterId, ticketNumber);
      
      // Create download link
      const downloadUrl = URL.createObjectURL(audioBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `tts-counter${counterId}-ticket${ticketNumber}.mp3`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Cleanup
      URL.revokeObjectURL(downloadUrl);
      
      console.log(`💾 Downloaded MP3: Counter ${counterId}, Ticket ${ticketNumber}`);
    } catch (error) {
      console.error('❌ Download failed:', error);
      throw error;
    }
  }

  // Helper method để tạo HTML5 audio element
  async createAudioElement(counterId: number, ticketNumber: number): Promise<HTMLAudioElement> {
    try {
      const audioBlob = await ttsAPI.generateAudio(counterId, ticketNumber);
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audio.preload = 'auto';
      
      // Cleanup URL khi audio kết thúc
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(audioUrl);
      });
      
      return audio;
    } catch (error) {
      console.error('❌ Create audio element failed:', error);
      throw error;
    }
  }
}
