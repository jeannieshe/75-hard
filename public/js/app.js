import { signInWithGoogle, signOut, onAuthStateChange } from './auth.js';
import {
  habits, completedIds,
  loadHabits, loadCompletions,
  toggleCompletion, addHabit, removeHabit,
  renderHabits,
} from './habits.js';
import { loadSkinLog, renderSkinLog, handleSeverityClick, handleNotesInput } from './skin.js';
import { exportCSV } from './export.js';

// ── State ──────────────────────────────────────────────────────────
let currentUser = null;
let viewDate    = todayKey();

const START_DATE = '2026-03-30';
const TOTAL_DAYS = 78;

// ── Auth ───────────────────────────────────────────────────────────
onAuthStateChange(async (user) => {
  if (user) {
    currentUser = user;
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    await loadHabits(user.id);
    await loadCompletions(user.id, viewDate);
    await loadSkinLog(user.id, viewDate);
    renderAll();
  } else {
    currentUser = null;
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('app').style.display = 'none';
  }
});

document.getElementById('googleSignIn').addEventListener('click', signInWithGoogle);

document.getElementById('signOutBtn').addEventListener('click', async () => {
  await signOut();
});

// ── Render ─────────────────────────────────────────────────────────
function renderAll() {
  // Header
  const dateObj = new Date(viewDate + 'T00:00:00');
  document.getElementById('dateDisplay').textContent =
    dateObj.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });

  const dn = dayNumber(viewDate);
  document.getElementById('dayNumber').textContent = Math.max(1, Math.min(TOTAL_DAYS, dn));
  document.getElementById('progressBar').style.width =
    Math.max(0, Math.min(100, ((dn - 1) / TOTAL_DAYS) * 100)) + '%';
  document.getElementById('nextDay').disabled = viewDate === todayKey();

  // Habits
  renderHabits('implement', completedIds);
  renderHabits('avoid', completedIds);

  // Skin
  renderSkinLog();
}

// ── Habit interactions ─────────────────────────────────────────────
['implement', 'avoid'].forEach(type => {
  document.getElementById(type + 'List').addEventListener('click', async (e) => {
    const item      = e.target.closest('.habit-item');
    const deleteBtn = e.target.closest('.delete-btn');
    if (!item) return;

    const habitId = item.dataset.habitId;

    if (deleteBtn) {
      const habit = [...habits.implement, ...habits.avoid].find(h => h.id === habitId);
      if (!confirm(`Remove "${habit?.name}"?`)) return;
      await removeHabit(type, habitId);
      renderHabits(type, completedIds);
      return;
    }

    await toggleCompletion(currentUser.id, habitId, viewDate);
    renderHabits(type, completedIds);
  });

  document.getElementById('add' + capitalize(type) + 'Btn').addEventListener('click', async () => {
    const input = document.getElementById(type + 'Input');
    const name  = input.value.trim();
    if (!name) return;
    await addHabit(currentUser.id, type, name);
    input.value = '';
    renderHabits(type, completedIds);
  });

  document.getElementById(type + 'Input').addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;
    const input = e.target;
    const name  = input.value.trim();
    if (!name) return;
    await addHabit(currentUser.id, type, name);
    input.value = '';
    renderHabits(type, completedIds);
  });
});

// ── Skin interactions ──────────────────────────────────────────────
document.getElementById('severityBtns').addEventListener('click', (e) => {
  const btn = e.target.closest('.sev-btn');
  if (!btn) return;
  handleSeverityClick(currentUser.id, viewDate, Number(btn.dataset.sev));
});

document.getElementById('skinNotes').addEventListener('input', () => {
  handleNotesInput(currentUser.id, viewDate);
});

// ── Day navigation ─────────────────────────────────────────────────
async function goToDate(newDate) {
  if (newDate > todayKey()) return;
  viewDate = newDate;
  await loadCompletions(currentUser.id, viewDate);
  await loadSkinLog(currentUser.id, viewDate);
  renderAll();
}

document.getElementById('prevDay').addEventListener('click', () => {
  const d = new Date(viewDate + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  goToDate(dateKey(d));
});

document.getElementById('nextDay').addEventListener('click', () => {
  const d = new Date(viewDate + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  goToDate(dateKey(d));
});

document.getElementById('todayBtn').addEventListener('click', () => {
  goToDate(todayKey());
});

// ── Export ─────────────────────────────────────────────────────────
document.getElementById('exportBtn').addEventListener('click', () => {
  exportCSV(currentUser.id);
});

// ── Utilities ──────────────────────────────────────────────────────
function todayKey() { return dateKey(new Date()); }

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dayNumber(dateStr) {
  const start  = new Date(START_DATE + 'T00:00:00');
  const target = new Date(dateStr + 'T00:00:00');
  return Math.floor((target - start) / 86400000) + 1;
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
