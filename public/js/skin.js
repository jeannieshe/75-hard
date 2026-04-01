import { sb } from './client.js';

export const skinLog = { severity: null, notes: '' };
let saveTimer = null;

export async function loadSkinLog(userId, date) {
  const { data } = await sb.from('skin_logs')
    .select('severity, notes')
    .eq('user_id', userId)
    .eq('date', date)
    .maybeSingle();

  skinLog.severity = data?.severity ?? null;
  skinLog.notes    = data?.notes ?? '';
  renderSkinLog();
}

export function renderSkinLog() {
  document.getElementById('skinNotes').value = skinLog.notes;

  document.querySelectorAll('.sev-btn').forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.sev) === skinLog.severity);
  });
}

export function handleSeverityClick(userId, date, value) {
  skinLog.severity = skinLog.severity === value ? null : value;
  renderSkinLog();
  saveSkinLog(userId, date);
}

export function handleNotesInput(userId, date) {
  skinLog.notes = document.getElementById('skinNotes').value;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveSkinLog(userId, date), 800);
}

async function saveSkinLog(userId, date) {
  await sb.from('skin_logs').upsert(
    { user_id: userId, date, severity: skinLog.severity, notes: skinLog.notes },
    { onConflict: 'user_id,date' }
  );
}
