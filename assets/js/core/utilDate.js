// Utils com date-fns
export {
  format,
  parseISO,
  isToday,
  isWeekend,
  isSameDay,
  addDays,
  startOfMonth,
  endOfMonth,
  getDay,
  differenceInDays,
  addMonths,
  subMonths
} from 'https://cdn.jsdelivr.net/npm/date-fns@3.6.0/+esm';
/**
 * Formata uma data ISO para 'dd/MM/yyyy'
 * @param {string|Date} date
 * @returns {string}
 */
export function formatDateBR(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM/yyyy');
}

/**
 * Verifica se a data é hoje
 * @param {string|Date} date
 * @returns {boolean}
 */
export function isTodayDate(date) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isToday(d);
}




