export function formatTimer(durationSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(durationSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatDurationHuman(durationSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(durationSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours === 0 && minutes === 0) {
    return `${seconds}s`;
  }
  if (hours === 0) {
    return `${minutes}m`;
  }
  if (minutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${minutes}m`;
}

export function formatHourlyRate(
  earnings: number,
  durationSeconds: number,
  currency: string = "kr"
): string {
  if (!durationSeconds || durationSeconds <= 0 || earnings <= 0) {
    return `0 ${currency}/h`;
  }
  const hours = durationSeconds / 3600;
  const rate = Math.round(earnings / hours);
  if (!Number.isFinite(rate) || Number.isNaN(rate)) {
    return `0 ${currency}/h`;
  }
  return `${rate} ${currency}/h`;
}

export function calculateHourlyRateNumber(
  earnings: number,
  durationSeconds: number
): number {
  if (!durationSeconds || durationSeconds <= 0 || earnings <= 0) return 0;
  const hours = durationSeconds / 3600;
  const rate = Math.round(earnings / hours);
  return Number.isFinite(rate) && !Number.isNaN(rate) ? rate : 0;
}

export function calculateDoorsPerHour(
  doors: number,
  durationSeconds: number
): number {
  if (!durationSeconds || durationSeconds <= 0 || doors <= 0) return 0;
  const hours = durationSeconds / 3600;
  const rate = Math.round(doors / hours);
  return Number.isFinite(rate) && !Number.isNaN(rate) ? rate : 0;
}

export function formatDateCaps(dateString: string | Date | number): string {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  const day = d.getDate();
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatDateNice(dateString: string | Date | number): string {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";

  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`;
}

export function formatTimeShort(dateString: string | Date | number): string {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");
  return `${hours}:${mins}`;
}

export function formatRelativeTime(timestamp: number): string {
  const elapsed = Math.floor((Date.now() - timestamp) / 1000);
  if (elapsed < 30) return "Just now";
  if (elapsed < 60) return `${elapsed}s ago`;
  const mins = Math.floor(elapsed / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}
