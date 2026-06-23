import api from '../api';

class MockSocket {
  constructor() {
    this.listeners = {};
    this.pollingInterval = null;
    this.previousQueues = [];
    this.rooms = new Set();
  }

  emit(event, data) {
    console.log(`[Mock Socket] emit: ${event}`, data);
    if (event === 'join:queue-monitor' || event === 'join:cashier') {
      this.rooms.add(event);
      this.startPolling();
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    this.startPolling();
  }

  off(event, callback) {
    if (!event) {
      this.listeners = {};
      return;
    }
    if (!callback) {
      delete this.listeners[event];
    } else if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
    
    if (Object.keys(this.listeners).length === 0) {
      this.stopPolling();
    }
  }

  disconnect() {
    this.stopPolling();
    this.listeners = {};
    this.rooms.clear();
    console.log('[Mock Socket] disconnected');
  }

  trigger(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (e) {
          console.error(`[Mock Socket] Error in callback for ${event}:`, e);
        }
      });
    }
  }

  startPolling() {
    if (this.pollingInterval) return;
    
    console.log('[Mock Socket] Started polling queues...');
    this.fetchAndCompare();
    
    this.pollingInterval = setInterval(() => {
      this.fetchAndCompare();
    }, 5000);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('[Mock Socket] Stopped polling queues.');
    }
  }

  async fetchAndCompare() {
    try {
      const response = await api.get('/queues');
      const currentQueues = response.data.data || [];
      
      if (this.previousQueues.length > 0) {
        for (const q of currentQueues) {
          const matched = this.previousQueues.find(prev => prev.id === q.id);
          if (!matched) {
            console.log('[Mock Socket] New queue detected:', q);
            this.trigger('queue:new', q);
          } else if (matched.status !== q.status || matched.updatedAt !== q.updatedAt) {
            console.log('[Mock Socket] Queue updated:', q);
            this.trigger('queue:updated', q);
          }
        }
      }
      
      this.previousQueues = currentQueues;
    } catch (error) {
      console.error('[Mock Socket] Polling error:', error);
    }
  }
}

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = new MockSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};