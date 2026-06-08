// FormForge v4.0 — Popup Script

const FIELDS = [
  { id: 'f-name',       key: 'name',       label: 'Name',       cat: 'personal' },
  { id: 'f-email',      key: 'email',      label: 'Email',      cat: 'personal' },
  { id: 'f-phone',      key: 'phone',      label: 'Phone',      cat: 'personal' },
  { id: 'f-city',       key: 'city',       label: 'City',       cat: 'personal' },
  { id: 'f-university', key: 'university', label: 'University', cat: 'academic' },
  { id: 'f-department', key: 'department', label: 'Department', cat: 'academic' },
  { id: 'f-program',    key: 'program',    label: 'Program',    cat: 'academic' },
  { id: 'f-rollno',     key: 'rollno',     label: 'Roll No',    cat: 'academic' },
  { id: 'f-section',    key: 'section',    label: 'Section',    cat: 'academic' },
  { id: 'f-semester',   key: 'semester',   label: 'Semester',   cat: 'academic' },
  { id: 'f-cgpa',       key: 'cgpa',       label: 'CGPA',       cat: 'academic' },
  { id: 'f-github',     key: 'github',     label: 'GitHub',     cat: 'online'   },
  { id: 'f-linkedin',   key: 'linkedin',   label: 'LinkedIn',   cat: 'online'   },
  { id: 'f-bio',        key: 'bio',        label: 'Bio',        cat: 'bio'      },
];

// ── Toast ──────────────────────────────────────────────────────────────────
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

// ── Main tabs ──────────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
  });
});

// ── Profile sidebar nav ────────────────────────────────────────────────────
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelectorAll('.cat-pane').forEach(p => p.classList.remove('active'));
    item.classList.add('active');
    document.getElementById('cat-' + item.dataset.cat).classList.add('active');
  });
});

// ── Load saved profile into inputs ────────────────────────────────────────
chrome.storage.sync.get(['ff_profile'], (res) => {
  const profile = res.ff_profile || {};
  FIELDS.forEach(({ id, key }) => {
    const el = document.getElementById(id);
    if (el && profile[key]) el.value = profile[key];
  });
  updateFillPanel(profile);
});

// ── Save buttons (one per category, each saves full profile) ──────────────
document.querySelectorAll('[data-cat-save]').forEach(btn => {
  btn.addEventListener('click', () => {
    chrome.storage.sync.get(['ff_profile'], (res) => {
      const profile = Object.assign({}, res.ff_profile || {});
      // Merge all currently visible inputs into profile
      FIELDS.forEach(({ id, key }) => {
        const el = document.getElementById(id);
        if (!el) return;
        const val = el.value.trim();
        if (val) profile[key] = val;
        else delete profile[key];
      });
      chrome.storage.sync.set({ ff_profile: profile }, () => {
        showToast('Profile saved!');
        updateFillPanel(profile);
      });
    });
  });
});

// ── Trigger autofill ───────────────────────────────────────────────────────
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

// ── Fill panel: preview grid + completeness bar ───────────────────────────
function updateFillPanel(profile) {
  const previewFields = [
    { key: 'name',       label: 'NAME'       },
    { key: 'email',      label: 'EMAIL'      },
    { key: 'rollno',     label: 'ROLL NO'    },
    { key: 'university', label: 'UNIVERSITY' },
    { key: 'cgpa',       label: 'CGPA'       },
    { key: 'github',     label: 'GITHUB'     },
    { key: 'section',    label: 'SECTION'    },
  ];

  const grid = document.getElementById('preview-grid');
  grid.innerHTML = previewFields.map(({ key, label }) => {
    const val = profile[key];
    const display = val ? (val.length > 22 ? val.substring(0, 22) + '…' : val) : '—';
    return `
      <div class="preview-item">
        <div class="preview-key">${label}</div>
        <div class="preview-val ${val ? '' : 'empty'}">${display}</div>
      </div>`;
  }).join('');

  const filled = FIELDS.filter(({ key }) => profile[key]).length;
  const pct    = Math.round((filled / FIELDS.length) * 100);
  document.getElementById('completeness-pct').textContent  = pct + '%';
  document.getElementById('completeness-fill').style.width = pct + '%';
}
