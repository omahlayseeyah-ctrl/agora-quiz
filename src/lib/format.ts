export function formatDuration(startedAt: string, submittedAt: string) {
  if (!startedAt || !submittedAt) return "—";
  const ms = new Date(submittedAt).getTime() - new Date(startedAt).getTime();
  if (ms <= 0) return "—";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

export function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
}
