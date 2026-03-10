let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch (e) {
  console.warn('expo-notifications not installed. Notifications will not work until installed.');
  Notifications = {
    setNotificationHandler: () => {},
    requestPermissionsAsync: async () => ({ status: 'denied' }),
    scheduleNotificationAsync: async () => null,
  };
}

import { API_URL, getAuthToken } from './api';

// Configure notification handler (if available)
if (Notifications && Notifications.setNotificationHandler) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Request user permission for notifications
 */
export const requestNotificationPermissions = async () => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Schedule a local notification
 */
export const scheduleLocalNotification = async (
  title,
  body,
  scheduledDate
) => {
  try {
    const notification = await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        sound: 'default',
        badge: 1,
      },
      trigger: {
        date: scheduledDate,
      },
    });
    console.log('Notification scheduled:', notification);
    return notification;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

/**
 * Send immediate notification
 */
export const sendImmediateNotification = async (title, body) => {
  try {
    const notification = await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        sound: 'default',
        badge: 1,
      },
      trigger: {
        seconds: 1,
      },
    });
    console.log('Immediate notification sent:', notification);
    return notification;
  } catch (error) {
    console.error('Error sending immediate notification:', error);
    return null;
  }
};

/**
 * Check and send pending notifications for a farmer
 * Should be called periodically or on app startup
 */
export const checkAndSendPendingNotifications = async (farmerId) => {
  try {
    const token = await getAuthToken();
    if (!token) return;

    // Fetch pending notifications from backend
    const response = await fetch(
      `${API_URL}/farmers/${farmerId}/notifications/pending`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await response.json();
    const notifications = data.notifications || [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const notif of notifications) {
      const notifDate = new Date(notif.scheduled_date);
      notifDate.setHours(0, 0, 0, 0);

      // Check if notification should be sent today or already passed
      if (notifDate <= today) {
        // Send the notification
        const scheduledTime = notif.scheduled_time || '09:00';
        const [hours, minutes] = scheduledTime.split(':').map(Number);

        const sendDate = new Date();
        sendDate.setHours(hours, minutes, 0, 0);

        // If it's already past the time, send immediately
        if (sendDate <= new Date()) {
          await sendImmediateNotification(
            notif.notification_type === 'water' ? '💧 Water Time' : '🌱 Fertilizer Time',
            notif.message
          );
        } else {
          await scheduleLocalNotification(
            notif.notification_type === 'water' ? '💧 Water Time' : '🌱 Fertilizer Time',
            notif.message,
            sendDate
          );
        }

        // Mark as sent in backend
        await markNotificationAsSent(farmerId, notif.id, token);
      }
    }
  } catch (error) {
    console.error('Error checking pending notifications:', error);
  }
};

/**
 * Mark a notification as sent in the backend
 */
const markNotificationAsSent = async (farmerId, notificationId, token) => {
  try {
    await fetch(
      `${API_URL}/farmers/${farmerId}/notification/${notificationId}/sent`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error marking notification as sent:', error);
  }
};

/**
 * Get next notification time for UI display
 */
export const getNextNotificationTime = (notifications) => {
  if (!notifications || notifications.length === 0) {
    return null;
  }

  const pending = notifications.filter((n) => !n.is_sent);
  if (pending.length === 0) return null;

  // Sort by date and get the earliest
  const sorted = pending.sort(
    (a, b) =>
      new Date(a.scheduled_date) - new Date(b.scheduled_date)
  );

  return sorted[0];
};

export default {
  requestNotificationPermissions,
  scheduleLocalNotification,
  sendImmediateNotification,
  checkAndSendPendingNotifications,
  getNextNotificationTime,
};
