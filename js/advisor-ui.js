/**
 * Vircène AI — interface Vira (API OpenAI + fallback local)
 */
(function (global) {
  'use strict';

  function typingHtml() {
    return '<span class="advisor-typing" aria-label="Vira réfléchit">'
      + '<span></span><span></span><span></span></span>';
  }

  function init(session) {
    const hero = document.getElementById('advisorHero');
    const thread = document.getElementById('advisorThread');
    const form = document.getElementById('advisorForm');
    const input = document.getElementById('advisorInput');
    if (!hero || !thread || !form || !input) return;

    const nameEl = document.getElementById('advisorUserName');
    if (nameEl && session) {
      const name = (session.firstName || 'toi').trim();
      nameEl.textContent = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    }

    let scanContext = null;
    const history = [];
    const profile = global.VirceneViraAPI?.loadProfileContext?.(session) || null;

    function addMessage(text, who, isHtml) {
      const bubble = document.createElement('div');
      bubble.className = `advisor-msg advisor-msg--${who}`;
      if (who === 'vira') {
        bubble.innerHTML = '<span class="advisor-msg-avatar" aria-hidden="true">V</span><div class="advisor-msg-body"></div>';
        const body = bubble.querySelector('.advisor-msg-body');
        if (isHtml) body.innerHTML = text;
        else body.textContent = text;
      } else {
        bubble.textContent = text;
      }
      thread.appendChild(bubble);
      thread.scrollTop = thread.scrollHeight;
      global.VircenePremiumUX?.refresh?.(thread);
      return bubble;
    }

    function buildFallbackReply(userText) {
      const t = (userText || '').toLowerCase();
      if (t.includes('conseil')) {
        return 'Voici mes conseils pour une peau sèche, sujette aux rougeurs et déshydratée :<br>'
          + '• Nettoie en douceur — évite l\'eau brûlante et les savons décapants.<br>'
          + '• Hydrate à fond : acide hyaluronique + glycérine le matin.<br>'
          + '• Renforce ta barrière avec des céramides et un soin riche le soir.<br>'
          + '• Apaise les rougeurs avec niacinamide, panthénol ou centella.<br>'
          + '• SPF tous les matins, même en hiver ☀️';
      }
      if (t.includes('produit')) {
        return 'Pour ton profil, je te conseille ces familles de produits :<br>'
          + '• <strong>Nettoyant doux</strong> sans sulfates.<br>'
          + '• <strong>Sérum hydratant</strong> à l\'acide hyaluronique.<br>'
          + '• <strong>Crème barrière</strong> aux céramides.<br>'
          + '• <strong>SPF 50</strong> hydratant.<br>'
          + 'Ajoute-les dans « Mes produits » : je vérifierai leur composition.';
      }
      if (t.includes('routine')) {
        return 'Voici une routine de départ, tout en douceur :<br>'
          + '<strong>Matin</strong> : nettoyant doux → sérum hydratant → crème barrière → SPF.<br>'
          + '<strong>Soir</strong> : nettoyant doux → sérum apaisant (niacinamide) → soin riche céramides.<br>'
          + 'On l\'ajustera ensemble au fil de ton évolution ✦';
      }
      if (t.includes('explique') || t.includes('terme') || t.includes('préoccupation')) {
        return 'Avec plaisir :<br>'
          + '• <strong>Peau sèche</strong> : produit peu de sébum — d\'où les tiraillements.<br>'
          + '• <strong>Rougeurs</strong> : sensibilité ou barrière fragilisée.<br>'
          + '• <strong>Déshydratation</strong> : manque d\'eau, pas forcément de gras.<br>'
          + '• <strong>Ridules</strong> : souvent liées à la déshydratation.';
      }
      if (t.includes('scan') || t.includes('visage')) {
        return 'Le Face Scan IA cartographie ton visage en quelques secondes. '
          + 'Appuie sur <strong>Scanner mon visage</strong> pour démarrer.';
      }
      if (scanContext) {
        return 'D\'après ton scan (peau ' + scanContext.skin + ', '
          + (scanContext.concerns || []).join(', ')
          + '), dis-moi ce que tu veux approfondir : conseils, produits ou routine ?';
      }
      return 'Je suis là pour t\'aider ✦ Pose-moi une question sur ta peau, ta routine ou lance un scan pour partir sur des bases solides.';
    }

    async function viraReply(userText) {
      const typing = addMessage(typingHtml(), 'vira', true);
      const body = typing.querySelector('.advisor-msg-body') || typing;

      history.push({ role: 'user', content: userText });

      try {
        if (global.VirceneViraAPI?.chat) {
          const data = await global.VirceneViraAPI.chat({
            message: userText,
            history: history.slice(0, -1),
            scanContext,
            profile,
          });
          const reply = data.replyHtml || '';
          body.innerHTML = reply;
          history.push({ role: 'assistant', content: reply.replace(/<[^>]+>/g, ' ').trim() });
          thread.scrollTop = thread.scrollHeight;
          return;
        }
      } catch (err) {
        console.warn('Vira API fallback', err);
      }

      const fallback = buildFallbackReply(userText);
      body.innerHTML = fallback;
      history.push({ role: 'assistant', content: fallback.replace(/<[^>]+>/g, ' ').trim() });
      thread.scrollTop = thread.scrollHeight;
    }

    function openChat() {
      if (!hero.hidden) {
        hero.hidden = true;
        thread.hidden = false;
        document.body.classList.add('advisor-chat-active');
      }
    }

    function send(text) {
      const value = (text || '').trim();
      if (!value) return;
      openChat();
      addMessage(value, 'me');
      input.value = '';
      viraReply(value);
    }

    function injectScan(data) {
      openChat();
      addMessage((data && data.meText) || "J'ai fait un scan de mon visage 📸", 'me');
      addMessage((data && data.viraHtml) || '', 'vira', true);
      if (data && data.summary) scanContext = data.summary;
      if (data && data.viraHtml) {
        history.push({ role: 'user', content: data.meText || 'Scan visage' });
        history.push({ role: 'assistant', content: data.viraHtml.replace(/<[^>]+>/g, ' ').trim() });
      }
      thread.scrollTop = thread.scrollHeight;
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      send(input.value);
    });

    document.querySelectorAll('.advisor-action').forEach((card) => {
      card.addEventListener('click', () => {
        if (card.dataset.action === 'facescan') {
          if (global.VirceneFaceScan?.open) global.VirceneFaceScan.open();
          return;
        }
        const prompt = card.dataset.prompt || '';
        if (card.dataset.send === '1') send(prompt);
        else {
          input.value = prompt;
          input.focus();
        }
      });
    });

    global.VirceneAdvisor = { send, injectScan };
  }

  global.VirceneAdvisorUI = { init };
})(window);
