/**
 * Lightweight LocalStorage wrapper for UI preferences and settings.
 * Adheres to rule: large structured entities live in IndexedDB; lightweight
 * flags and settings live in localStorage.
 */

const STORAGE_KEYS = {
  THEME: "almanac_theme",
  NOTIFICATIONS_ENABLED: "almanac_notifications_enabled",
  NOTIFICATIONS_PROMPTED: "almanac_notifications_prompted",
  LAST_ACTIVE_TAB: "almanac_active_learn_tab",
  RECENT_SEARCHES: "almanac_recent_searches",
};

export function getPreference(key, defaultValue = null) {
  if (typeof window === "undefined") return defaultValue;
  try {
    const val = localStorage.getItem(key);
    return val !== null ? JSON.parse(val) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setPreference(key, value) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // LocalStorage full or blocked
  }
}

export function getNotificationPreference() {
  return getPreference(STORAGE_KEYS.NOTIFICATIONS_ENABLED, false);
}

export function setNotificationPreference(enabled) {
  setPreference(STORAGE_KEYS.NOTIFICATIONS_ENABLED, Boolean(enabled));
  setPreference(STORAGE_KEYS.NOTIFICATIONS_PROMPTED, true);
}

export function hasBeenPromptedForNotifications() {
  return getPreference(STORAGE_KEYS.NOTIFICATIONS_PROMPTED, false);
}
