// utils/datetime.ts
export function toISOWithToday(time: Date): string {
  const now = new Date();
  const dt = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    time.getHours(),
    time.getMinutes(),
    0,
    0
  );
  return dt.toISOString(); // ISO en UTC (…Z)
}
