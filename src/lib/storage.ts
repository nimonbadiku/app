import { ActiveSession, SessionRecord, UserSettingsConfig } from "@/types";

const ACTIVE_SESSION_KEY = "doortrack_active_session_v1";
const SETTINGS_KEY = "doortrack_settings_v1";
const OFFLINE_QUEUE_KEY = "doortrack_offline_queue_v1";

export function loadStoredActiveSession(): ActiveSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.startedAt === "number") {
      return parsed as ActiveSession;
    }
  } catch (err) {
    console.error("Failed to parse stored active session", err);
  }
  return null;
}

export function saveActiveSession(session: ActiveSession | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!session) {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
    } else {
      localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
    }
  } catch (err) {
    console.error("Failed to save active session to localStorage", err);
  }
}

export function loadStoredSettings(): UserSettingsConfig {
  const fallback: UserSettingsConfig = {
    earningsPerItem: 20,
    pricePerItem: 50,
    currency: "kr",
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return {
      earningsPerItem: Number(parsed.earningsPerItem) || 20,
      pricePerItem: Number(parsed.pricePerItem) || 50,
      currency: parsed.currency || "kr",
    };
  } catch {
    return fallback;
  }
}

export function saveStoredSettings(settings: UserSettingsConfig): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to save settings", err);
  }
}

export function getOfflineQueue(): SessionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SessionRecord[];
  } catch {
    return [];
  }
}

export function addToOfflineQueue(record: SessionRecord): void {
  if (typeof window === "undefined") return;
  try {
    const queue = getOfflineQueue();
    // Avoid duplicate IDs
    const filtered = queue.filter((item) => item.id !== record.id);
    filtered.push(record);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error("Failed to queue offline session", err);
  }
}

export function clearOfflineQueue(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch (err) {
    console.error("Failed to clear offline queue", err);
  }
}
