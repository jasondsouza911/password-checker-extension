(() => {
  const pw = document.getElementById('pw');
  const fill = document.getElementById('fill');
  const status = document.getElementById('status');
  const checkBtn = document.getElementById('checkBtn');
  const genBtn = document.getElementById('genBtn');
  const copyBtn = document.getElementById('copyBtn');
  const suggestions = document.getElementById('suggestions');
  const suggestList = document.getElementById('suggestList');

  const COMMON = new Set([
    '123456',
    'password',
    'qwerty',
    'admin',
    '111111'
  ]);

  function scorePassword(s) {
    if (!s) return 0;

    let score = 0;

    if (s.length >= 16) score += 35;
    else if (s.length >= 12) score += 25;
    else if (s.length >= 8) score += 10;

    if (/[a-z]/.test(s)) score += 15;
    if (/[A-Z]/.test(s)) score += 15;
    if (/\d/.test(s)) score += 15;
    if (/[^A-Za-z0-9]/.test(s)) score += 15;

    if (/(0123|1234|abcd|qwer|1111|0000)/i.test(s)) score -= 20;
    if (COMMON.has(s.toLowerCase())) score = 0;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  function updateBar(score) {
    fill.style.width = score + '%';

    if (score >= 75) {
      fill.style.background =
        getComputedStyle(document.documentElement)
          .getPropertyValue('--success') || '#00e07a';
    } else if (score >= 45) {
      fill.style.background =
        getComputedStyle(document.documentElement)
          .getPropertyValue('--warn') || '#ffb84d';
    } else {
      fill.style.background =
        getComputedStyle(document.documentElement)
          .getPropertyValue('--danger') || '#ff5c6c';
    }
  }

  function generatePassword(len = 16) {
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = lower.toUpperCase();
    const digits = '0123456789';
    const symbols = '!@#$%^&*()-_+=<>?';
    const pool = lower + upper + digits + symbols;

    const rnd = (max) => {
      const a = new Uint32Array(1);
      crypto.getRandomValues(a);
      return a[0] % max;
    };

    const out = [];
    out.push(lower[rnd(lower.length)]);
    out.push(upper[rnd(upper.length)]);
    out.push(digits[rnd(digits.length)]);
    out.push(symbols[rnd(symbols.length)]);

    while (out.join('').length < len) {
      out.push(pool[rnd(pool.length)]);
    }

    for (let i = out.length - 1; i > 0; i--) {
      const j = rnd(i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }

    return out.join('').slice(0, len);
  }

  function renderSuggestions(list) {
    suggestList.innerHTML = '';

    list.forEach(pwVal => {
      const el = document.createElement('div');
      el.className = 'suggest-item';
      el.textContent = pwVal;
      el.title = 'Click to use this password';

      el.addEventListener('click', () => {
        pw.value = pwVal;
        suggestions.style.display = 'none';
        checkPassword();
      });

      suggestList.appendChild(el);
    });

    suggestions.style.display = 'block';
  }

  function checkPassword() {
    const val = (pw.value || '').trim();
    const sc = scorePassword(val);

    updateBar(sc);
    suggestions.style.display = 'none';

    if (!val) {
      status.textContent = 'Enter a password and click Check.';
      status.style.color = '';
      return;
    }

    if (sc >= 75) {
      status.textContent = 'Strong password — no suggestions.';
      status.style.color =
        getComputedStyle(document.documentElement)
          .getPropertyValue('--success');
    } else if (sc >= 45) {
      status.textContent = 'Moderate password — suggestions provided.';
      status.style.color =
        getComputedStyle(document.documentElement)
          .getPropertyValue('--warn');

      renderSuggestions([
        generatePassword(16),
        generatePassword(18),
        generatePassword(20)
      ]);
    } else {
      status.textContent = 'Weak password — suggestions provided.';
      status.style.color =
        getComputedStyle(document.documentElement)
          .getPropertyValue('--danger');

      renderSuggestions([
        generatePassword(14),
        generatePassword(16),
        generatePassword(18)
      ]);
    }
  }

  checkBtn.addEventListener('click', checkPassword);

  genBtn.addEventListener('click', () =>
    renderSuggestions([
      generatePassword(16),
      generatePassword(18),
      generatePassword(20)
    ])
  );

  copyBtn.addEventListener('click', async () => {
    const txt = pw.value || '';
    if (!txt) return;

    try {
      await navigator.clipboard.writeText(txt);
      copyBtn.textContent = 'Copied';
      setTimeout(() => copyBtn.textContent = 'Copy', 900);
    } catch (e) {
      copyBtn.textContent = 'Error';
      setTimeout(() => copyBtn.textContent = 'Copy', 900);
    }
  });

  pw.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      checkPassword();
    }
  });

  // Read temporary value from background (if present), then clear it.
  function initFromStorage() {
    try {
      chrome.storage.local.get(['cyberguard_temp_pw'], (res) => {
        const v = res && res.cyberguard_temp_pw
          ? res.cyberguard_temp_pw
          : '';

        if (v) {
          pw.value = v;
          // clear stored value for privacy
          chrome.storage.local.remove(
            ['cyberguard_temp_pw'],
            () => {}
          );
          checkPassword();
        } else {
          updateBar(0);
        }
      });
    } catch (e) {
      // storage not available — just init UI
      updateBar(0);
    }
  }

  // initialize
  initFromStorage();
})();
