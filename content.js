// FormForge v1.0 — Content Script
// Fuzzy-matching autofill engine for Google Forms

(function () {
  let userProfile = {};
  let fillCount = 0;

  // ── Load profile from storage ─────────────────────────────────────────────
  chrome.storage.sync.get(['ff_profile'], (res) => {
    userProfile = res.ff_profile || {};
    autofillForm();
  });

  // ── Core Injection ────────────────────────────────────────────────────────
  function injectValue(element, value) {
    if (!element || !value) return false;
    if (element.value === value) return false;

    element.focus();
    element.value = value;
    element.dispatchEvent(new Event('input',  { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur',   { bubbles: true }));
    return true;
  }

  // ── Ordinal converter: 6 → "6th", 1 → "1st" etc. ───────────────────────
  function toOrdinals(val) {
    const n = parseInt(val);
    if (isNaN(n)) return [val.toLowerCase()];
    const suffix = (n === 1) ? 'st' : (n === 2) ? 'nd' : (n === 3) ? 'rd' : 'th';
    return [String(n), `${n}${suffix}`, `${n} ${suffix}`, val.toLowerCase()];
  }

  // ── Inject into Google Forms custom dropdown [role="listbox"] ─────────────
  function injectDropdown(question, value) {
    // Google Forms dropdowns: click the select div to open, then click matching option
    const selectDiv = question.querySelector('[role="listbox"], [role="combobox"]') ||
                      question.querySelector('[jsname][class*="select"]');
    if (!selectDiv) return false;

    // Try native select first
    const nativeSelect = question.querySelector('select');
    if (nativeSelect) {
      const variants = toOrdinals(value);
      for (const opt of nativeSelect.options) {
        if (variants.some(v => opt.text.toLowerCase().includes(v) || opt.value.toLowerCase().includes(v))) {
          nativeSelect.value = opt.value;
          nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      return false;
    }

    // Google custom dropdown — click to open, find option, click it
    selectDiv.click();
    return new Promise(resolve => {
      setTimeout(() => {
        const variants = toOrdinals(value);
        const options = document.querySelectorAll('[role="option"]');
        let matched = false;
        for (const opt of options) {
          const text = opt.textContent.trim().toLowerCase();
          if (variants.some(v => text === v || text.includes(v))) {
            opt.click();
            matched = true;
            break;
          }
        }
        // Close dropdown if no match found
        if (!matched) {
          document.body.click();
        }
        resolve(matched);
      }, 150);
    });
  }

  // ── Label → Profile key matching ─────────────────────────────────────────
  const FIELD_MAP = [
    // Specific multi-word matches FIRST to prevent partial word collisions
    // e.g. "University/Institute Name" must match university, not name
    { keys: ['university', 'institute', 'institution', 'college', 'school'], field: 'university' },
    { keys: ['roll no', 'roll number', 'reg no', 'registration no', 'student id', 'cms id', 'enrollment'], field: 'rollno' },
    { keys: ['full name', 'your name', 'applicant name', 'student name', 'candidate name'], field: 'name' },
    { keys: ['email', 'e-mail', 'mail'],                            field: 'email' },
    { keys: ['phone', 'contact number', 'mobile number', 'whatsapp', 'cell'], field: 'phone' },
    { keys: ['cgpa', 'gpa', 'grade point'],                         field: 'cgpa' },
    { keys: ['department', 'dept', 'faculty'],                      field: 'department' },
    { keys: ['program', 'degree', 'title of degree', 'course of study', 'field of study'], field: 'program' },
    { keys: ['current semester', 'semester', 'sem'],                field: 'semester' },
    { keys: ['section', 'batch', 'class'],                          field: 'section' },
    { keys: ['github'],                                              field: 'github' },
    { keys: ['linkedin'],                                            field: 'linkedin' },
    { keys: ['city', 'residential', 'location', 'address'],         field: 'city' },
    { keys: ['bio', 'about yourself', 'introduce yourself', 'describe yourself', 'tell us about'], field: 'bio' },
    // 'name' alone goes LAST — only matches if nothing else matched first
    { keys: ['name'],                                                field: 'name' },
    { keys: ['contact', 'phone', 'mobile', 'number'],               field: 'phone' },
  ];

  function matchField(labelText) {
    const lower = labelText.toLowerCase().trim();
    for (const { keys, field } of FIELD_MAP) {
      for (const key of keys) {
        if (lower.includes(key)) return field;
      }
    }
    return null;
  }

  // ── Handle short-text, paragraph, and dropdown inputs ───────────────────
  async function fillTextInputs() {
    let filled = 0;
    const questions = document.querySelectorAll('[role="listitem"]');

    for (const q of questions) {
      const labelEl = q.querySelector('.M7eMe') ||
                      q.querySelector('[class*="freebirdFormviewerComponentsQuestionBaseTitle"]') ||
                      q.querySelector('span[id^="i"]');
      if (!labelEl) continue;

      const labelText = labelEl.textContent.trim();
      const fieldKey  = matchField(labelText);
      if (!fieldKey || !userProfile[fieldKey]) continue;

      const value = userProfile[fieldKey];

      // Short text
      const textInput = q.querySelector('input[type="text"]');
      if (textInput) {
        if (injectValue(textInput, value)) filled++;
        continue;
      }

      // Paragraph / long text
      const textarea = q.querySelector('textarea');
      if (textarea) {
        if (injectValue(textarea, value)) filled++;
        continue;
      }

      // Dropdown (select or Google custom listbox)
      const hasDropdown = q.querySelector('select, [role="listbox"], [role="combobox"]');
      if (hasDropdown) {
        const result = await injectDropdown(q, value);
        if (result) filled++;
      }
    }

    return filled;
  }

  // ── Fill Google's special pre-header email field ────────────────────────
  function fillHeaderEmail() {
    if (!userProfile.email) return 0;
    // Google Forms shows logged-in email at top — it's read-only, can't fill
    // But some forms have a separate "Your email" input outside listitem structure
    const emailInputs = document.querySelectorAll('input[type="email"], input[name*="email"]');
    let filled = 0;
    emailInputs.forEach(input => {
      // Skip read-only Google account email display
      if (input.readOnly || input.disabled) return;
      if (injectValue(input, userProfile.email)) filled++;
    });
    return filled;
  }

  // ── Main autofill runner ──────────────────────────────────────────────────
  async function autofillForm() {
    if (Object.keys(userProfile).length === 0) return;
    const filled = await fillTextInputs();
    const emailFilled = fillHeaderEmail();
    fillCount += filled + emailFilled;

    chrome.storage.local.set({ ff_last_fill_count: fillCount });

    if (filled + emailFilled > 0) {
      showToast(`FormForge filled ${filled + emailFilled} field${filled + emailFilled > 1 ? 's' : ''} ✓`);
    }
  }

  // ── Track filled inputs so user edits are never overwritten ─────────────
  const filledInputs = new WeakSet();

  function safeInject(element, value) {
    // Skip if user has already typed something different
    if (element.value && element.value !== value) return false;
    const result = injectValue(element, value);
    if (result) filledInputs.add(element);
    return result;
  }

  async function safeFill() {
    if (Object.keys(userProfile).length === 0) return 0;
    let filled = 0;
    const questions = document.querySelectorAll('[role="listitem"]');
    for (const question of questions) {
      const labelEl = question.querySelector('.M7eMe') ||
                      question.querySelector('[class*="freebirdFormviewerComponentsQuestionBaseTitle"]') ||
                      question.querySelector('span[id^="i"]');
      if (!labelEl) continue;
      const fieldKey = matchField(labelEl.textContent.trim());
      if (!fieldKey || !userProfile[fieldKey]) continue;
      const value = userProfile[fieldKey];

      const input = question.querySelector('input[type="text"]') || question.querySelector('textarea');
      if (input) {
        if (filledInputs.has(input)) continue;
        if (safeInject(input, value)) filled++;
        continue;
      }

      // Dropdown
      const hasDropdown = question.querySelector('select, [role="listbox"], [role="combobox"]');
      if (hasDropdown && !filledInputs.has(hasDropdown)) {
        const result = await injectDropdown(question, value);
        if (result) { filledInputs.add(hasDropdown); filled++; }
      }
    }
    return filled;
  }

  // ── MutationObserver — only fires on structural DOM changes (new form page)
  // NOT on text input changes, preventing the refill loop
  let debounceTimer;
  const observer = new MutationObserver((mutations) => {
    const hasNewNodes = mutations.some(m => m.type === 'childList' && m.addedNodes.length > 0);
    if (!hasNewNodes) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      fillCount = 0;
      safeFill();
    }, 400);
  });

  const formContainer = document.querySelector('form');
  if (formContainer) {
    safeFill(); // initial fill on page load
    observer.observe(formContainer, { childList: true, subtree: true });
  }

  // ── Context menu injection listener ──────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'FF_INSERT_FIELD') {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
        injectValue(active, msg.value);
        showToast(`Inserted: ${msg.label}`);
      }
    }
    if (msg.type === 'FF_TRIGGER_FILL') {
      chrome.storage.sync.get(['ff_profile'], (res) => {
        userProfile = res.ff_profile || {};
        fillCount = 0;
        // Manual trigger — force fill everything ignoring WeakSet
        let filled = 0;
        document.querySelectorAll('[role="listitem"]').forEach(question => {
          const labelEl = question.querySelector('.M7eMe') ||
                          question.querySelector('[class*="freebirdFormviewerComponentsQuestionBaseTitle"]') ||
                          question.querySelector('span[id^="i"]');
          if (!labelEl) return;
          const fieldKey = matchField(labelEl.textContent.trim());
          if (!fieldKey || !userProfile[fieldKey]) return;
          const input = question.querySelector('input[type="text"]') || question.querySelector('textarea');
          if (!input) return;
          if (injectValue(input, userProfile[fieldKey])) filled++;
        });
        showToast(filled > 0
          ? `Filled ${filled} field${filled > 1 ? 's' : ''} ✓`
          : 'No matching fields found');
      });
    }
  });

  // ── Toast notification ────────────────────────────────────────────────────
  function showToast(msg) {
    const existing = document.getElementById('ff-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'ff-toast';
    toast.textContent = msg;
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #1a1a2e;
      color: #00e5c0;
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 600;
      padding: 12px 20px;
      border-radius: 10px;
      border: 1px solid rgba(0,229,192,0.3);
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 999999;
      animation: ff-slidein 0.3s ease;
      pointer-events: none;
    `;

    const style = document.createElement('style');
    style.textContent = `
      @keyframes ff-slidein {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
})();
