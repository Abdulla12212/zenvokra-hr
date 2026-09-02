const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatShortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');

  if (!year || !month || !day) {
    return isoDate;
  }

  const monthIndex = Number(month) - 1;
  const monthLabel = months[monthIndex];
  const dayNumber = Number(day);

  if (!monthLabel || !Number.isFinite(dayNumber)) {
    return isoDate;
  }

  return `${dayNumber} ${monthLabel} ${year}`;
}
