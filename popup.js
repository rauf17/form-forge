// FormForge v1.0 — Popup Script

const FIELDS = [
  { id: 'f-name',       key: 'name',       label: 'Name' },
  { id: 'f-email',      key: 'email',      label: 'Email' },
  { id: 'f-phone',      key: 'phone',      label: 'Phone' },
  { id: 'f-city',       key: 'city',       label: 'City' },
  { id: 'f-university', key: 'university', label: 'University' },
  { id: 'f-department', key: 'department', label: 'Department' },
  { id: 'f-program',    key: 'program',    label: 'Program' },
  { id: 'f-rollno',     key: 'rollno',     label: 'Roll No' },
  { id: 'f-section',    key: 'section',    label: 'Section' },
  { id: 'f-semester',   key: 'semester',   label: 'Semester' },
  { id: 'f-cgpa',       key: 'cgpa',       label: 'CGPA' },
  { id: 'f-github',     key: 'github',     label: 'GitHub' },
  { id: 'f-linkedin',   key: 'linkedin',   label: 'LinkedIn' },
  { id: 'f-bio',        key: 'bio',        label: 'Bio' },
];

// ── Toast ─────────────────────────────────────────────────────────────────
const toast    = document.getElementById('toast');
const toastMsg = document.getElementById('toast-msg');
const toastIco = document.getElementById('toast-icon');
let toastTimer;

function showToast(msg, type = 'success') {
  clearTimeout(toastTimer);
  toastMsg.textContent = msg;
  if (type === 'error') {
    toastIco.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';
    toast.className = 'toast error show';
  } else {
    toastIco.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
    toast.className = 'toast show';
  }
  toastTimer = setTimeout(() => { toast.className = 'toast'; }, 2500);
}

// ── Tabs ──────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
  });
});

// ── Load profile ──────────────────────────────────────────────────────────
chrome.storage.sync.get(['ff_profile'], (res) => {
  const profile = res.ff_profile || {};
  FIELDS.forEach(({ id, key }) => {
    const el = document.getElementById(id);
    if (el && profile[key]) el.value = profile[key];
  });
  updateFillPanel(profile);
});

// ── Save profile ──────────────────────────────────────────────────────────
document.getElementById('btn-save').addEventListener('click', () => {
  const profile = {};
  FIELDS.forEach(({ id, key }) => {
    const el = document.getElementById(id);
    if (el && el.value.trim()) profile[key] = el.value.trim();
  });

  chrome.storage.sync.set({ ff_profile: profile }, () => {
    showToast('Profile saved!');
    updateFillPanel(profile);
  });
});

// ── Trigger fill ──────────────────────────────────────────────────────────
document.getElementById('btn-fill').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.url?.includes('docs.google.com/forms')) {
      return showToast('Open a Google Form first', 'error');
    }
    chrome.tabs.sendMessage(tab.id, { type: 'FF_TRIGGER_FILL' });
    showToast('Filling form...');
  });
});

// ── Update fill panel (preview + completeness) ────────────────────────────
function updateFillPanel(profile) {
  const previewFields = [
    { key: 'name',       label: 'NAME' },
    { key: 'email',      label: 'EMAIL' },
    { key: 'rollno',     label: 'ROLL NO' },
    { key: 'university', label: 'UNIVERSITY' },
    { key: 'cgpa',       label: 'CGPA' },
    { key: 'github',     label: 'GITHUB' },
    { key: 'section',    label: 'SECTION' },
  ];

  const grid = document.getElementById('preview-grid');
  grid.innerHTML = previewFields.map(({ key, label }) => {
    const val = profile[key];
    const display = val
      ? (val.length > 22 ? val.substring(0, 22) + '…' : val)
      : '—';
    return `
      <div class="preview-item">
        <div class="preview-key">${label}</div>
        <div class="preview-val ${val ? '' : 'empty'}">${display}</div>
      </div>
    `;
  }).join('');

  // Completeness
  const filled  = FIELDS.filter(({ key }) => profile[key]).length;
  const total   = FIELDS.length;
  const pct     = Math.round((filled / total) * 100);
  document.getElementById('completeness-pct').textContent  = pct + '%';
  document.getElementById('completeness-fill').style.width = pct + '%';
}
