<div align="center">

<!-- PLACEHOLDER: Banner image (e.g. a dark 1280×400px hero with the FormForge logo and tagline) -->
<!-- ![FormForge Banner](assets/banner.png) -->

# ⚡ FormForge

**Fuzzy-matching autofill engine for Google Forms.**  
Set your profile once. Fill any form instantly.

[![Version](https://img.shields.io/badge/version-1.0%20Ignition-00e5c0?style=flat-square)](#)
[![Manifest](https://img.shields.io/badge/manifest-v3-0ea5e9?style=flat-square)](#)
[![License](https://img.shields.io/badge/license-MIT-8b9cc8?style=flat-square)](#license)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-00e5c0?style=flat-square)](#contributing)

</div>

---

## Table of Contents

- [What is FormForge?](#what-is-formforge)
- [Features](#features)
- [Screenshots](#screenshots)
- [Installation](#installation)
- [Usage](#usage)
- [How the Matching Works](#how-the-matching-works)
- [Profile Fields Reference](#profile-fields-reference)
- [Known Limitations](#known-limitations)
- [Contributing](#contributing)

---

## What is FormForge?

FormForge is a Chrome extension built for students and anyone who fills the same Google Forms over and over — attendance sheets, lab reports, event registrations, feedback forms, you name it.

Instead of typing your name, roll number, university, and section for the hundredth time, you fill in your profile **once** inside FormForge. From that point on, hitting **Autofill This Form** fills every matching field on the page in under a second.

FormForge uses a fuzzy keyword-matching engine to map your profile fields to form question labels — so it works even when the question says *"Reg. No."* instead of *"Roll Number"*, or *"WhatsApp"* instead of *"Phone"*.

---

## Features

- **Instant autofill** — fills all detected fields in one click, text fields synchronously in a single batch, dropdowns in parallel
- **Fuzzy keyword matching** — handles abbreviations, alternate phrasings, and partial labels
- **Dropdown support** — detects and selects Google Forms custom dropdowns, including ordinal options (1st, 2nd, 6th…)
- **Multi-page forms** — MutationObserver watches for new pages and fills them automatically as they load
- **Right-click insert** — right-click any input on a Google Form → FormForge → pick a field to inject
- **Categorized profile editor** — Personal, Academic, Online, Bio — organized in a sidebar so it never feels cluttered
- **Profile completeness indicator** — at-a-glance progress bar showing how much of your profile is filled in
- **Fully local** — all data stored in `chrome.storage.sync`, never leaves your browser

---
## Screenshots

<div align="center">
    
**Fill Tab — autofill view with profile status grid**

<img width="451" height="624" alt="Fill Tab" src="https://github.com/user-attachments/assets/1e2e6ba6-faf0-4940-8ad1-2616939ca840" />

<br><br>

**Profile Tab — Personal details**

<img width="446" height="672" alt="Personal Profile" src="https://github.com/user-attachments/assets/9a3ebd7e-39b7-4042-a2e0-7694cd38fcda" />

<br><br>

**Profile Tab — Academic details**

<img width="444" height="676" alt="Academic Profile" src="https://github.com/user-attachments/assets/8697bbcf-2d8d-47a3-aaa6-31e488c5f7e8" />

<br><br>

**Guide Tab**

<img width="443" height="747" alt="Guide Tab" src="https://github.com/user-attachments/assets/4d491cdb-3c0d-4cb1-b70f-d0e7161e59c4" />

</div>

---

## Installation

FormForge is not on the Chrome Web Store yet — load it manually as an unpacked extension.

### 1. Get the code

```bash
git clone https://github.com/rauf17/form-forge.git
cd form-forge
```

Or download the ZIP from the [Releases](../../releases) page and extract it.

### 2. Open Chrome Extensions

Go to `chrome://extensions/` in your browser.

### 3. Enable Developer Mode

Toggle **Developer mode** on in the top-right corner.

### 4. Load the extension

Click **Load unpacked** and select the `formforge-v4` folder (the one containing `manifest.json`).

### 5. Pin it

Click the puzzle icon in your Chrome toolbar and pin FormForge so it's always one click away.

---

## Usage

### First-time setup

1. Click the FormForge icon in your toolbar to open the popup.
2. Go to the **Profile** tab.
3. Fill in your details across the four categories — Personal, Academic, Online, Bio.
4. Hit **Save Profile** in each category.

### Autofilling a form

1. Open any Google Form in Chrome.
2. Click the FormForge icon.
3. Hit **⚡ Autofill This Form**.
4. Done — all matched fields are filled instantly.

FormForge also runs automatically on page load, so matched fields may already be filled before you even open the popup.

### Manual field injection

Right-click any text input on a Google Form → **FormForge** → select the profile field you want to insert. Useful for fields FormForge didn't auto-detect.

### Multi-page forms

FormForge watches the page for DOM changes. When you advance to the next page of a multi-page form, it automatically fills the new fields that appear — no need to click anything.

---

## How the Matching Works

FormForge reads the question label text for each form field and runs it against a priority-ordered keyword map. The map is designed so that longer, more specific phrases match first, preventing false positives.

For example, *"University/Institute Name"* matches the `university` field — not the `name` field — because the `university` keywords are checked before the generic `name` keyword.

**Keyword map (simplified):**

| Profile Field | Matched keywords |
|---|---|
| Name | `full name`, `your name`, `student name`, then `name` (last resort) |
| Email | `email`, `e-mail`, `mail` |
| Phone | `phone`, `contact number`, `mobile`, `whatsapp`, `cell` |
| Roll No | `roll no`, `roll number`, `reg no`, `student id`, `cms id`, `enrollment` |
| University | `university`, `institute`, `institution`, `college`, `school` |
| Department | `department`, `dept`, `faculty` |
| Program | `program`, `degree` |
| Section | `section`, `batch`, `class` |
| Semester | `semester`, `sem` |
| CGPA | `cgpa`, `gpa` |
| City | `city`, `location`, `residential`, `address` |
| GitHub | `github` |
| LinkedIn | `linkedin` |
| Bio | `bio`, `about`, `yourself`, `introduce` |

**Dropdown handling:** For semester/ordinal dropdowns, FormForge converts your value to multiple formats — `6`, `6th`, `6 th` — and finds the closest matching option.

---

## Profile Fields Reference

| Field | Example value | Notes |
|---|---|---|
| Full Name | XYZ | Your name as it appears on forms |
| Email | xyz@example.com | Won't fill Google's own account email field |
| Phone | +92 3XX XXXXXXX | Include country code for best results |
| City / Location | Islamabad, Pakistan | |
| University | FAST-NUCES, Islamabad | |
| Department | CS | |
| Program | BSCS | |
| Roll Number | 2X-XXXX | |
| Section | BCS-6A | |
| Semester | 6 | Will match "6th" dropdowns automatically |
| CGPA | 3.50 | |
| GitHub | https://github.com/username | |
| LinkedIn | https://linkedin.com/in/username | |
| Bio | Short intro... | Free text, fills paragraph fields |

---

## Known Limitations

- **Google account email field** — The "Your email" field at the top of some forms is Google's own pre-filled account field, not a regular form input. FormForge cannot override it.
- **Radio buttons & checkboxes** — Currently not supported. Only text inputs, textareas, and custom dropdowns are filled.
- **Non-Google Forms** — FormForge only activates on `docs.google.com/forms`. Other form platforms are not supported.
- **Ambiguous labels** — If a question label contains no recognizable keyword, FormForge will skip it. Use the right-click insert as a fallback.

---

## Contributing

Contributions are welcome. Here's the best way to get involved:

**Reporting bugs**

Open an issue and include:
- What you expected to happen
- What actually happened
- The URL of the form (or a description of it)
- Your browser version

**Suggesting features**

Open an issue with the `enhancement` label. Describe the use case, not just the feature — it helps prioritize.

**Submitting code**

```bash
# 1. Fork the repo and clone your fork
git clone https://github.com/YOUR_USERNAME/form-forge.git

# 2. Create a branch
git checkout -b feature/your-feature-name

# 3. Make your changes, then commit
git commit -m "feat: describe what you did"

# 4. Push and open a Pull Request
git push origin feature/your-feature-name
```

PRs should target the `main` branch. Please include a short description of what changed and why.

---

---

<div align="center">

Made with ♥ by [Abdul Rauf](https://github.com/rauf17)

</div>
