import { sb } from './client.js';
import { habits } from './habits.js';

export async function exportCSV(userId) {
  const { data: completions } = await sb.from('completions')
    .select('habit_id, date')
    .eq('user_id', userId)
    .order('date');

  const { data: skinLogs } = await sb.from('skin_logs')
    .select('date, severity, notes')
    .eq('user_id', userId)
    .order('date');

  const allHabits = [...habits.implement, ...habits.avoid];
  const habitMap  = Object.fromEntries(allHabits.map(h => [h.id, h]));

  const rows = [['Date', 'Type', 'Habit', 'Completed', 'Skin Severity', 'Skin Notes']];

  const skinByDate = Object.fromEntries(
    (skinLogs || []).map(s => [s.date, s])
  );

  const dates = [...new Set((completions || []).map(c => c.date))].sort();

  dates.forEach(date => {
    const dayCompletions = (completions || []).filter(c => c.date === date);
    const skin = skinByDate[date];

    allHabits.forEach((habit, i) => {
      const completed = dayCompletions.some(c => c.habit_id === habit.id) ? 'Yes' : 'No';
      rows.push([
        date,
        habit.type,
        habit.name,
        completed,
        i === 0 ? (skin?.severity ?? '') : '',
        i === 0 ? (skin?.notes ?? '')    : '',
      ]);
    });
  });

  const csv = rows
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = '75hard_export.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}
