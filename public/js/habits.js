import { sb } from './client.js';

export const habits = { implement: [], avoid: [] };
export let completedIds = new Set();

export async function loadHabits(userId) {
  const { data } = await sb.from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('position');

  if (data && data.length > 0) {
    habits.implement = data.filter(h => h.type === 'implement');
    habits.avoid     = data.filter(h => h.type === 'avoid');
  } else {
    await seedDefaultHabits(userId);
  }
}

async function seedDefaultHabits(userId) {
  const defaults = [
    { name: 'SLEEP: 11pm–6am weekdays (ready for bed by 10:30pm) / 1am–9am weekends', type: 'implement', position: 0 },
    { name: 'UPSKILLING: Complete ≥1 Neetcode problem', type: 'implement', position: 1 },
    { name: 'LEARNING: Read nonfiction ≥10 min', type: 'implement', position: 2 },
    { name: 'UPSKILLING: 30 min AI research (video / podcast / paper / vibe coding)', type: 'implement', position: 3 },
    { name: 'PHYSICAL: Workout ≥45 min', type: 'implement', position: 4 },
    { name: 'PHYSICAL: Cold shower', type: 'implement', position: 5 },
    { name: 'MEDS: Take meds at 7pm + skincare', type: 'implement', position: 6 },
    { name: 'FOOD: ≤1500 cal', type: 'implement', position: 7 },
    { name: 'FOOD: ≥100g protein', type: 'implement', position: 8 },
    { name: 'FOOD: 4× 24 fl oz water bottles', type: 'implement', position: 9 },
    { name: 'MENTAL: Journal check-in at 10:20pm', type: 'implement', position: 10 },
    { name: 'FOOD: Eat out ≤1×/week', type: 'avoid', position: 0 },
    { name: 'FOOD: No processed foods', type: 'avoid', position: 1 },
    { name: 'SPENDING: Luxury/self-care purchase ≤1×/week', type: 'avoid', position: 2 },
    { name: 'MENTAL: No negative self-talk', type: 'avoid', position: 3 },
  ].map(h => ({ ...h, user_id: userId }));

  const { data } = await sb.from('habits').insert(defaults).select();
  if (data) {
    habits.implement = data.filter(h => h.type === 'implement');
    habits.avoid     = data.filter(h => h.type === 'avoid');
  }
}

export async function loadCompletions(userId, date) {
  const { data } = await sb.from('completions')
    .select('habit_id')
    .eq('user_id', userId)
    .eq('date', date);
  completedIds = new Set((data || []).map(c => c.habit_id));
}

export async function toggleCompletion(userId, habitId, date) {
  if (completedIds.has(habitId)) {
    completedIds.delete(habitId);
    await sb.from('completions')
      .delete()
      .eq('user_id', userId)
      .eq('habit_id', habitId)
      .eq('date', date);
  } else {
    completedIds.add(habitId);
    await sb.from('completions')
      .insert({ user_id: userId, habit_id: habitId, date });
  }
}

export async function addHabit(userId, type, name) {
  const position = habits[type].length;
  const { data } = await sb.from('habits')
    .insert({ user_id: userId, name, type, position })
    .select()
    .single();
  if (data) habits[type].push(data);
  return data;
}

export async function removeHabit(type, habitId) {
  await sb.from('habits').delete().eq('id', habitId);
  habits[type] = habits[type].filter(h => h.id !== habitId);
}

export function renderHabits(type, completedSet) {
  const list = document.getElementById(type + 'List');
  list.innerHTML = '';

  habits[type].forEach(habit => {
    const isChecked = completedSet.has(habit.id);
    const item = document.createElement('div');
    item.className = 'habit-item' + (isChecked ? ' checked' : '');
    item.dataset.habitId = habit.id;
    item.innerHTML = `
      <div class="checkbox">
        <svg width="12" height="12" fill="none" stroke="#fff" stroke-width="3" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <span class="habit-label">${escHtml(habit.name)}</span>
      <button class="delete-btn" title="Remove">✕</button>
    `;
    list.appendChild(item);
  });
}

function escHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
