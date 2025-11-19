import { io, Socket } from 'socket.io-client';
import { Request } from './api';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export class WebSocketClient {
  private socket: Socket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(token?: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(WS_URL, {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      // Always join admin room (no auth required)
      this.socket?.emit('join:admin');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    // Register existing listeners
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket?.on(event, callback as any);
      });
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: 'request:created' | 'request:updated' | 'request:resolved', callback: (data: Request) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
    this.socket?.off(event, callback as any);
  }

  emit(event: string, data: any) {
    this.socket?.emit(event, data);
  }
}

export const wsClient = new WebSocketClient();

