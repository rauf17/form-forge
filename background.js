// FormForge v1.0 — Background Service Worker

// ── Context Menu Setup ────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'ff-root',
      title: 'FormForge — Insert',
      contexts: ['editable'],
    });

    const items = [
      { id: 'ff-name',       label: 'Full Name',       field: 'name' },
      { id: 'ff-email',      label: 'Email',           field: 'email' },
      { id: 'ff-phone',      label: 'Phone / Contact', field: 'phone' },
      { id: 'ff-rollno',     label: 'Roll Number',     field: 'rollno' },
      { id: 'ff-university', label: 'University',      field: 'university' },
      { id: 'ff-department', label: 'Department',      field: 'department' },
      { id: 'ff-program',    label: 'Program / Degree',field: 'program' },
      { id: 'ff-section',    label: 'Section / Batch', field: 'section' },
      { id: 'ff-semester',   label: 'Semester',        field: 'semester' },
      { id: 'ff-github',     label: 'GitHub Link',     field: 'github' },
      { id: 'ff-linkedin',   label: 'LinkedIn Link',   field: 'linkedin' },
      { id: 'ff-city',       label: 'City / Location', field: 'city' },
      { id: 'ff-bio',        label: 'Bio / About Me',  field: 'bio' },
    ];

    items.forEach(item => {
      chrome.contextMenus.create({
        id: item.id,
        parentId: 'ff-root',
        title: item.label,
        contexts: ['editable'],
      });
    });
  });
});

// ── Context Menu Click Handler ────────────────────────────────────────────
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.menuItemId.startsWith('ff-')) return;
  const field = info.menuItemId.replace('ff-', '');

  chrome.storage.sync.get(['ff_profile'], (res) => {
    const profile = res.ff_profile || {};
    const value = profile[field];
    if (!value) return;

    const labelMap = {
      name: 'Full Name', email: 'Email', phone: 'Phone',
      rollno: 'Roll Number', university: 'University',
      department: 'Department', program: 'Program',
      section: 'Section', semester: 'Semester',
      github: 'GitHub', linkedin: 'LinkedIn',
      city: 'City', bio: 'Bio',
    };

    chrome.tabs.sendMessage(tab.id, {
      type: 'FF_INSERT_FIELD',
      value,
      label: labelMap[field] || field,
    });
  });
});
