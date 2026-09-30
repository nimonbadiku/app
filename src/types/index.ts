export type DoorActionType = "YES" | "NO" | "NOT_HOME";

export interface DoorAction {
  id: string;
  type: DoorActionType;
  items: number;
  timestamp: number;
  tag?: string; // Optional objection or context tag e.g. "Price", "Not interested", "Has competitor", "Callback"
}

export interface ActiveSession {
  id: string;
  startedAt: number; // Exact timestamp in ms
  isPaused?: boolean;
  pausedAt?: number;
  totalPausedMs?: number;
  doors: number;
  yesCount: number;
  noCount: number;
  notHomeCount: number;
  itemsSold: number;
  experiment?: string;
  territory?: string;
  targetDoors?: number;
  targetEarnings?: number;
  actionHistory: DoorAction[];
}

export interface SessionRecord {
  id: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  doors: number;
  yesCount: number;
  noCount: number;
  notHomeCount: number;
  itemsSold: number;
  earnings: number;
  currency: string;
  earningsPerItem: number;
  note?: string | null;
  experiment?: string | null;
  territory?: string | null;
  createdAt: string;
}

export interface UserSettingsConfig {
  earningsPerItem: number;
  pricePerItem: number;
  currency: string;
  soundEnabled?: boolean;
  hapticsEnabled?: boolean;
  theme?: "light" | "dark" | "system";
  defaultTargetDoors?: number;
  focusPresets?: string[];
}
