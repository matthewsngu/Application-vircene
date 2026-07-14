/**
 * Vircène — Page accueil éditorial (hero scroll story + homepage luxe)
 */
(function () {
  'use strict';

  async function bootstrap() {
    const auth = window.VirceneAuth;
    let session = null;

    if (auth?.resolveAuthOnLoad) {
      try {
        session = await auth.resolveAuthOnLoad();
      } catch {
        session = auth.readSession?.() || null;
      }
    } else {
      session = auth?.readSession?.() || null;
    }

    if (window.VirceneAccountBadge?.refresh) {
      session = await window.VirceneAccountBadge.refresh(session) || session;
    }

    if (window.VirceneEntrance?.shouldPlay?.()) {
      await window.VirceneEntrance.play(session || {});
    }

    initPage(session);
  }

  function initPage(session) {
  const promo = document.getElementById('diorPromo');
  const promoClose = document.getElementById('diorPromoClose');
  const premium = session && (
    window.VirceneAuth?.isPremiumSession?.(session)
    || window.VircenePaywall?.isPremium?.(session)
    || session.plan === 'premium'
  );
  if (premium) {
    document.body.classList.add('is-premium-user');
    if (promo) {
      promo.hidden = true;
      document.body.classList.add('dior-promo-closed');
    }
  }
  if (promo && promoClose) {
    promoClose.addEventListener('click', () => {
      promo.hidden = true;
      document.body.classList.add('dior-promo-closed');
    });
  }

  /* CTA hero : Découvrir → Mettre à jour si analyse déjà faite */
  async function initHeroCta(activeSession) {
    const labels = [...document.querySelectorAll('[data-hero-cta]')];
    const links = [...document.querySelectorAll('[data-hero-cta-link]')];
    if (!labels.length && !links.length) return;

    const auth = window.VirceneAuth;
    if (!auth) return;

    let resolvedSession = activeSession || auth.readSession();
    if (!resolvedSession && auth.resolveAuthOnLoad) {
      try {
        resolvedSession = await auth.resolveAuthOnLoad();
      } catch {
        resolvedSession = null;
      }
    }

    const hasAnalysis = Boolean(resolvedSession && auth.hasDiagnostic(resolvedSession.id));
    const label = hasAnalysis ? 'Mettre à jour' : 'Découvrir';
    const href = hasAnalysis
      ? 'diagnostic?update=1'
      : (resolvedSession ? 'diagnostic' : 'login?next=diagnostic');

    labels.forEach((el) => { el.textContent = label; });
    links.forEach((el) => { el.setAttribute('href', href); });
    labels.filter((el) => el.tagName === 'A').forEach((el) => { el.setAttribute('href', href); });
  }

  initHeroCta(session);

  /* Hero scroll story — progress 0→1 pendant le scroll (comme Dior) */
  function initHeroStory() {
    const story = document.querySelector('[data-hero-story]');
    if (!story) return;

    const track = story.querySelector('.dior-story__track');
    const sticky = story.querySelector('.dior-story__sticky');
    if (!track || !sticky) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      story.style.setProperty('--story-progress', '1');
      return;
    }

    let ticking = false;

    function update() {
      ticking = false;
      const trackTop = track.getBoundingClientRect().top;
      const range = Math.max(track.offsetHeight - sticky.offsetHeight, 1);
      const scrolled = Math.max(0, -trackTop);
      const progress = Math.min(1, scrolled / range);
      story.style.setProperty('--story-progress', progress.toFixed(4));
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  initHeroStory();

  const footerPromo = document.querySelector('[data-footer-promo]');
  if (footerPromo) {
    const slides = [...footerPromo.querySelectorAll('.dior-footer-promo-slide')];
    let fp = 0;
    setInterval(() => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      fp = (fp + 1) % slides.length;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === fp));
    }, 5000);
  }

  const header = document.getElementById('diorHeader');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('is-scrolled', window.scrollY > 4);
    }, { passive: true });
  }
  }

  bootstrap();
})();
