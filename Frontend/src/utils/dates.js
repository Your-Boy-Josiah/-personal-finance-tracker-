export const getToday = () => {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
};

export const toDateInputValue = (value) => {
  if (!value) return getToday();

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return getToday();

  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-');
};

export const formatDateOnly = (value, options = {}) => {
  if (!value) return '—';

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString(undefined, { ...options, timeZone: 'UTC' });
};