export type DoorActionType = "YES" | "NO" | "NOT_HOME";

export interface DoorAction {
  id: string;
  type: DoorActionType;
  items: number;
  timestamp: number;
}

export interface ActiveSession {
  id: string;
  startedAt: number; // Exact timestamp ms
  doors: number;
  yesCount: number;
  noCount: number;
  notHomeCount: number;
  itemsSold: number;
  experiment?: string;
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
  createdAt: string;
}

export interface UserSettingsConfig {
  earningsPerItem: number;
  pricePerItem: number;
  currency: string;
}
