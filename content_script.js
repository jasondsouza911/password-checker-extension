// CyberGuard — Option A (SAFE VERSION)
// Live strength badge, zero page interference

(() => {
  const BADGE_ID = 'cyberguard-strength-badge';
  let badge = null;
  let activeInput = null;
  let rafPending = false;

  function scorePassword(p) {
    if (!p) return 0;
    let s = 0;
    if (p.length >= 16) s += 35;
    else if (p.length >= 12) s += 25;
    else if (p.length >= 8) s += 10;
    if (/[a-z]/.test(p)) s += 15;
    if (/[A-Z]/.test(p)) s += 15;
    if (/\d/.test(p)) s += 15;
    if (/[^A-Za-z0-9]/.test(p)) s += 15;
    return Math.min(100, Math.max(0, s));
  }

  function strength(score) {
    if (score >= 75) return { t: 'Strong', c: '#00e07a' };
    if (score >= 45) return { t: 'Moderate', c: '#ffb84d' };
    return { t: 'Weak', c: '#ff5c6c' };
  }

  function ensureBadge() {
    if (badge) return badge;

    badge = document.createElement('div');
    badge.id = BADGE_ID;
    badge.textContent = 'Weak';

    Object.assign(badge.style, {
      position: 'absolute',
      zIndex: '2147483647',
      padding: '4px 10px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: '700',
      background: '#ff5c6c',
      color: '#02161a',
      pointerEvents: 'none',
      display: 'none',
      boxShadow: '0 6px 18px rgba(0,0,0,.35)',
      fontFamily: 'Inter, Arial, sans-serif'
    });

    document.body.appendChild(badge);
    return badge;
  }

  function positionBadge(input) {
    if (!badge || !input) return;
    const r = input.getBoundingClientRect();
    badge.style.top = window.scrollY + r.top - 26 + 'px';
    badge.style.left = window.scrollX + r.left + 'px';
  }

  function updateBadge(input) {
    if (!input) return;
    const val = input.value || '';
    if (!val) {
      badge.style.display = 'none';
      return;
    }

    const sc = scorePassword(val);
    const s = strength(sc);

    badge.textContent = s.t;
    badge.style.background = s.c;
    badge.style.display = 'block';
    positionBadge(input);
  }

  function isPasswordInput(el) {
    return (
      el &&
      el.tagName === 'INPUT' &&
      (
        el.type === 'password' ||
        el.getAttribute('type') === 'password' ||
        el.autocomplete?.toLowerCase().includes('password')
      )
    );
  }

  // Run ONLY when user focuses a password field
  document.addEventListener('focusin', e => {
    if (isPasswordInput(e.target)) {
      activeInput = e.target;
      ensureBadge();
      updateBadge(activeInput);
    }
  }, true);

  // Live typing (throttled via rAF)
  document.addEventListener('input', e => {
    if (activeInput && e.target === activeInput) {
      if (!rafPending) {
        rafPending = true;
        requestAnimationFrame(() => {
          rafPending = false;
          updateBadge(activeInput);
        });
      }
    }
  }, true);

  // Cleanup on blur
  document.addEventListener('focusout', () => {
    if (badge) badge.style.display = 'none';
    activeInput = null;
  }, true);

  // Reposition safely
  window.addEventListener('scroll', () => {
    if (activeInput) positionBadge(activeInput);
  }, true);

  window.addEventListener('resize', () => {
    if (activeInput) positionBadge(activeInput);
  });

})();
