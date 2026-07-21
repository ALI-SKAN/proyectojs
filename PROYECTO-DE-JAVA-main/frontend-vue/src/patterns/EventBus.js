import { reactive } from 'vue';

// Observer Pattern (Pub/Sub): EventBus para notificaciones globales en Vue 3
class EventBus {
  constructor() {
    this.events = reactive({});
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  emit(event, payload) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(payload));
    }
  }

  off(event, callback) {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    }
  }
}

export const globalEventBus = new EventBus();
