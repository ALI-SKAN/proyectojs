import { Injectable } from '@angular/core';

// Singleton Pattern: Un único punto de verdad para el estado de la aplicación
@Injectable({
  providedIn: 'root'
})
export class AppStateSingleton {
  private static instance: AppStateSingleton;
  
  private lastAction: string = '';
  private notificationMessage: string = '';

  constructor() {
    if (AppStateSingleton.instance) {
      return AppStateSingleton.instance;
    }
    AppStateSingleton.instance = this;
  }

  setLastAction(action: string) {
    this.lastAction = action;
  }

  getLastAction(): string {
    return this.lastAction;
  }

  setNotification(msg: string) {
    this.notificationMessage = msg;
    // Auto-clear notification after 3 seconds
    setTimeout(() => {
      this.notificationMessage = '';
    }, 3000);
  }

  getNotification(): string {
    return this.notificationMessage;
  }
}
