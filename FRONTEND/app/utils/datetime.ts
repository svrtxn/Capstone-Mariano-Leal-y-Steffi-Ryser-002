export function formatTime(d: Date) {
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

export function toISOWithToday(time: Date) {
  const now = new Date();
  const d = new Date(
    now.getFullYear(), now.getMonth(), now.getDate(),
    time.getHours(), time.getMinutes(), 0, 0
  );
  return d.toISOString();
}
