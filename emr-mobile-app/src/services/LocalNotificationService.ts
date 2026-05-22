import { LocalNotifications } from '@capacitor/local-notifications';

class LocalNotificationServiceImpl {
  public async requestPermissions() {
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  }

  public async schedulePillReminder(title: string, body: string, delayMs: number = 5000) {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: new Date().getTime(),
          schedule: { at: new Date(Date.now() + delayMs) }
        }
      ]
    });
  }

  public async cancelAll() {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending);
    }
  }
}

export const LocalNotificationService = new LocalNotificationServiceImpl();
