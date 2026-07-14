(function () {
  'use strict';

  function esc(text) {
    return String(text || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function readDiagnostic(session) {
    if (window.VirceneDiagnostic?.loadDiagnosticForSession) {
      return window.VirceneDiagnostic.loadDiagnosticForSession(session);
    }
    if (window.VirceneDiagnostic?.loadDiagnostic && session?.id) {
      const saved = window.VirceneDiagnostic.loadDiagnostic(session.id);
      if (saved) return saved;
    }
    try {
      const raw = sessionStorage.getItem('vircene_landing_diag');
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function renderTags(items) {
    if (!items || !items.length) {
      return '<span class="profile-tag profile-tag--muted">—</span>';
    }
    return items.map(function (item) {
      return '<span class="profile-tag">' + esc(item) + '</span>';
    }).join('');
  }

  function renderDiagnostic(summary) {
    if (!summary) return '';

    return (
      '<div class="profile-diag-grid">' +
        '<div class="profile-diag-cell">' +
          '<p class="profile-diag-label">Type de peau</p>' +
          '<p class="profile-diag-value">' + esc(summary.skinType) + '</p>' +
        '</div>' +
        '<div class="profile-diag-cell">' +
          '<p class="profile-diag-label">Objectif</p>' +
          '<p class="profile-diag-value">' + esc(summary.intention) + '</p>' +
        '</div>' +
        '<div class="profile-diag-cell profile-diag-cell--full">' +
          '<p class="profile-diag-label">Préoccupations</p>' +
          '<div class="profile-tags">' + renderTags(summary.concerns) + '</div>' +
        '</div>' +
        '<div class="profile-diag-cell profile-diag-cell--full">' +
          '<p class="profile-diag-label">Routine</p>' +
          '<div class="profile-tags">' + renderTags(summary.routine || summary.morning) + '</div>' +
        '</div>' +
        '<div class="profile-diag-cell profile-diag-cell--full">' +
          '<p class="profile-diag-label">Fréquence</p>' +
          '<p class="profile-diag-value">' + esc(summary.frequency) + '</p>' +
        '</div>' +
      '</div>'
    );
  }

  function resolvePremium(session) {
    if (!session) return false;
    const fresh = window.VirceneAuth?.readSession?.() || session;
    if (window.VirceneAuth?.isPremiumSession) {
      return window.VirceneAuth.isPremiumSession(fresh);
    }
    if (window.VircenePaywall?.isPremium) {
      return window.VircenePaywall.isPremium(fresh);
    }
    return fresh.plan === 'premium';
  }

  async function init() {
    let session = window.VirceneAuth?.readSession?.();
    if (window.VirceneAuth?.resolveAuthOnLoad) {
      try {
        session = (await window.VirceneAuth.resolveAuthOnLoad()) || session;
      } catch (_) { /* ignore */ }
    }
    session = window.VirceneAuth?.readSession?.() || session;
    if (!session) {
      location.replace('login.html?next=profile.html');
      return;
    }

    const premium = resolvePremium(session);
    const devUser = window.VirceneAuth?.getDevTestUser?.(session);
    const initial = (session.firstName || session.email || 'V').trim().charAt(0).toUpperCase();
    const fullName = [session.firstName, session.lastName].filter(Boolean).join(' ').trim() || 'Mon compte';

    document.getElementById('profileAvatar').textContent = initial;
    document.getElementById('profileName').textContent = fullName;
    document.getElementById('profileEmail').textContent = session.email || '—';
    document.getElementById('profilePlan').textContent = devUser?.role === 'developer'
      ? 'Premium · Développeur'
      : (premium ? 'Premium actif' : 'Compte gratuit');
    document.getElementById('profileFirstName').textContent = session.firstName || '—';
    document.getElementById('profileLastName').textContent = session.lastName || '—';
    document.getElementById('profileEmailField').textContent = session.email || '—';

    const manage = document.getElementById('profileManage');
    const subscribe = document.getElementById('profileSubscribe');
    if (premium) {
      if (subscribe) subscribe.hidden = true;
      if (manage) manage.hidden = false;
    } else {
      if (subscribe) subscribe.hidden = false;
      if (manage) manage.hidden = true;
    }

    const rawDiag = readDiagnostic(session);
    const summary = window.VirceneDiagnostic?.formatDiagnosticSummary
      ? window.VirceneDiagnostic.formatDiagnosticSummary(rawDiag)
      : null;

    const lead = document.getElementById('profileDiagLead');
    const block = document.getElementById('profileDiag');

    if (summary && block) {
      if (lead) lead.hidden = true;
      block.hidden = false;
      block.innerHTML = renderDiagnostic(summary);
    }

    document.getElementById('logoutBtn')?.addEventListener('click', async function () {
      if (window.VirceneAuth?.logout) {
        await window.VirceneAuth.logout();
      }
      location.replace('index.html');
    });
  }

  init();
})();
