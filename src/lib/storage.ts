import { ActiveSession, SessionRecord, UserSettingsConfig } from "@/types";

const ACTIVE_SESSION_KEY = "doortrack_active_session_v2";
const SETTINGS_KEY = "doortrack_settings_v2";
const OFFLINE_QUEUE_KEY = "doortrack_offline_queue_v2";
const LOCAL_SESSIONS_BACKUP_KEY = "doortrack_sessions_local_v2";

const DEFAULT_FOCUS_PRESETS = [
  "Direct Hook",
  "Problem First",
  "Friendly Neighbor",
  "Shorter Pitch",
  "Weekend Special",
  "2-Item Bundle",
];

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
    soundEnabled: true,
    hapticsEnabled: true,
    theme: "light",
    defaultTargetDoors: 40,
    focusPresets: DEFAULT_FOCUS_PRESETS,
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
      soundEnabled: parsed.soundEnabled !== undefined ? Boolean(parsed.soundEnabled) : true,
      hapticsEnabled: parsed.hapticsEnabled !== undefined ? Boolean(parsed.hapticsEnabled) : true,
      theme: parsed.theme === "dark" || parsed.theme === "light" || parsed.theme === "system" ? parsed.theme : "light",
      defaultTargetDoors: Number(parsed.defaultTargetDoors) || 40,
      focusPresets: Array.isArray(parsed.focusPresets) && parsed.focusPresets.length > 0 ? parsed.focusPresets : DEFAULT_FOCUS_PRESETS,
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

export function loadLocalSessions(): SessionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_SESSIONS_BACKUP_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SessionRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveLocalSessions(sessions: SessionRecord[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_SESSIONS_BACKUP_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error("Failed to save local sessions backup", err);
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
