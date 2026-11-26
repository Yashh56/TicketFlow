import { registerActivityLogListeners } from './listeners/activityLog.listener.js';
import { registerNotificationListeners } from './listeners/notification.listener.js';
import { eventBus } from './eventBus.js';

let initialized = false;

export const initEventBus = (): void => {
  if (initialized) return;
  registerActivityLogListeners();
  registerNotificationListeners();
  initialized = true;
  console.log('Event bus listeners initialized (ActivityLog & Notification workflows).');
};

export { eventBus };
export * from './eventBus.js';
