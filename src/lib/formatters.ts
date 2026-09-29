export function formatTimer(durationSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(durationSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function formatDurationHuman(durationSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(durationSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours === 0 && minutes === 0) {
    return `${safeSeconds}s`;
  }
  if (hours === 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
}

export function formatHourlyRate(
  earnings: number,
  durationSeconds: number,
  currency: string = "kr"
): string {
  if (!durationSeconds || durationSeconds <= 0 || earnings <= 0) {
    return `0 ${currency} / hour`;
  }
  const hours = durationSeconds / 3600;
  const rate = Math.round(earnings / hours);
  if (!Number.isFinite(rate) || Number.isNaN(rate)) {
    return `0 ${currency} / hour`;
  }
  return `${rate} ${currency} / hour`;
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

export function formatDateCaps(dateString: string | Date): string {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  const day = d.getDate();
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatTimeShort(dateString: string | Date): string {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  const hours = d.getHours().toString().padStart(2, "0");
  const mins = d.getMinutes().toString().padStart(2, "0");
  return `${hours}:${mins}`;
}
