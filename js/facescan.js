/* Vircène — Face Scan IA
 * Analyse via API OpenAI (Netlify Function). La photo est envoyée pour analyse
 * puis supprimée côté client ; elle n'est pas stockée sur nos serveurs.
 */
(function () {
  'use strict';

  var overlay = null;
  var stream = null;
  var capturedUrl = null;
  var analyseTimers = [];
  var pillTimer = null;
  var lastFocused = null;
  var resultsTranscribed = false;
  var pendingAnalysis = null;
  var lastScanResult = null;

  function clearAnalyseTimers() {
    for (var i = 0; i < analyseTimers.length; i++) clearTimeout(analyseTimers[i]);
    analyseTimers = [];
  }

  function analysisDataDemo() {
    var viraHtml =
      '<p>Merci d\u2019avoir partag\u00e9 \u2728 D\u2019apr\u00e8s ton scan, ta peau semble plut\u00f4t ' +
      '<strong>s\u00e8che</strong>, avec des <strong>rougeurs</strong> et une ' +
      '<strong>d\u00e9shydratation</strong> comme pr\u00e9occupations principales. ' +
      'On note aussi un niveau mod\u00e9r\u00e9 de <strong>ridules</strong>.</p>' +
      '<p>Une peau s\u00e8che produit moins de s\u00e9bum, ce qui peut donner une sensation de ' +
      'tiraillement et un manque d\u2019\u00e9clat. Les rougeurs traduisent souvent une peau ' +
      'sensible ou une barri\u00e8re cutan\u00e9e un peu fragilis\u00e9e.</p>' +
      '<p>Bonne nouvelle : ce sont des profils tr\u00e8s courants, et on les apaise facilement ' +
      'avec une routine cibl\u00e9e et tout en douceur.</p>';
    return {
      meText: 'J\u2019ai fait un scan de mon visage \uD83D\uDCF8',
      viraHtml: viraHtml,
      summary: { skin: 's\u00e8che', concerns: ['rougeurs', 'd\u00e9shydratation'], ridules: 'mod\u00e9r\u00e9' },
      source: 'demo'
    };
  }

  function analysisData() {
    return lastScanResult || analysisDataDemo();
  }

  function $(id) { return document.getElementById(id); }

  function showStep(name) {
    if (!overlay) return;
    var steps = overlay.querySelectorAll('.fs-step');
    for (var i = 0; i < steps.length; i++) {
      steps[i].hidden = steps[i].getAttribute('data-step') !== name;
    }
    overlay.setAttribute('data-current', name);
  }

  /* ---------- Caméra & photo ---------- */
  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(function (t) { t.stop(); });
      stream = null;
    }
    var video = $('fsVideo');
    if (video) { try { video.srcObject = null; } catch (e) { /* ignore */ } }
    if (pillTimer) { clearTimeout(pillTimer); pillTimer = null; }
  }

  function clearPhoto() {
    if (capturedUrl) {
      URL.revokeObjectURL(capturedUrl);
      capturedUrl = null;
    }
    ['fsReviewImg', 'fsAnalyseImg'].forEach(function (id) {
      var im = $(id);
      if (im) im.removeAttribute('src');
    });
  }

  function showCameraFallback() {
    stopCamera();
    var viewport = $('fsViewport');
    var capture = $('fsCapture');
    var fallback = $('fsFallback');
    if (viewport) viewport.hidden = true;
    if (capture) capture.hidden = true;
    if (fallback) fallback.hidden = false;
  }

  function startCamera() {
    showStep('camera');
    var viewport = $('fsViewport');
    var capture = $('fsCapture');
    var fallback = $('fsFallback');
    var video = $('fsVideo');
    if (fallback) fallback.hidden = true;
    if (viewport) viewport.hidden = false;
    if (capture) capture.hidden = false;

    // Réinitialise l'état "validé" des pastilles + verrouillage du cadre
    var pills = overlay.querySelectorAll('.fs-status-pill');
    for (var i = 0; i < pills.length; i++) pills[i].classList.remove('is-on');
    if (viewport) viewport.classList.remove('is-locked');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showCameraFallback();
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      .then(function (s) {
        // L'utilisateur a pu fermer entre-temps
        if (overlay.hidden || overlay.getAttribute('data-current') !== 'camera') {
          s.getTracks().forEach(function (t) { t.stop(); });
          return;
        }
        stream = s;
        if (video) {
          video.srcObject = s;
          var play = video.play();
          if (play && play.catch) play.catch(function () { /* ignore autoplay */ });
        }
        // Validation factice des repères après un court délai (démo)
        pillTimer = setTimeout(function () {
          var on = overlay.querySelectorAll('.fs-status-pill');
          for (var j = 0; j < on.length; j++) on[j].classList.add('is-on');
          var vp = $('fsViewport');
          if (vp) vp.classList.add('is-locked');
        }, 1100);
      })
      .catch(function () {
        showCameraFallback();
      });
  }

  function setCaptured(url) {
    clearPhoto();
    capturedUrl = url;
    stopCamera();
    var rImg = $('fsReviewImg');
    if (rImg) rImg.src = url;
    showStep('review');
  }

  function capturePhoto() {
    var video = $('fsVideo');
    if (!video || !video.videoWidth) return;
    var canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    var ctx = canvas.getContext('2d');
    // Miroir pour correspondre à l'aperçu selfie
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    if (canvas.toBlob) {
      canvas.toBlob(function (blob) {
        if (blob) setCaptured(URL.createObjectURL(blob));
      }, 'image/jpeg', 0.92);
    } else {
      setCaptured(canvas.toDataURL('image/jpeg', 0.92));
    }
  }

  function handleFile(file) {
    if (!file) return;
    setCaptured(URL.createObjectURL(file));
  }

  /* ---------- Analyse & résultats ---------- */
  function startAnalyse() {
    var aImg = $('fsAnalyseImg');
    if (aImg && capturedUrl) aImg.src = capturedUrl;
    showStep('analyse');
    clearAnalyseTimers();
    lastScanResult = null;

    if (window.VirceneViraAPI && capturedUrl) {
      pendingAnalysis = window.VirceneViraAPI.analyzeFace(capturedUrl)
        .then(function (data) {
          lastScanResult = data;
          return data;
        })
        .catch(function (err) {
          console.warn('Face scan API fallback', err);
          return null;
        });
    } else {
      pendingAnalysis = Promise.resolve(null);
    }

    var stage = $('fsAnalyseStage');
    var sub = $('fsAnalyseSub');
    var points = overlay.querySelectorAll('.fs-point');

    for (var i = 0; i < points.length; i++) points[i].classList.remove('is-on');
    if (stage) {
      stage.classList.remove('is-scanning');
      void stage.offsetWidth;
      stage.classList.add('is-scanning');
    }

    for (var p = 0; p < points.length; p++) {
      (function (el, idx) {
        analyseTimers.push(setTimeout(function () { el.classList.add('is-on'); }, 850 + idx * 300));
      })(points[p], p);
    }

    analyseTimers.push(setTimeout(function () {
      if (sub) sub.textContent = 'Analyse des zones cl\u00e9s\u2026';
    }, 800));
    analyseTimers.push(setTimeout(function () {
      if (sub) sub.textContent = 'Pr\u00e9paration de tes r\u00e9sultats\u2026';
    }, 2150));
    analyseTimers.push(setTimeout(showResults, 2900));
  }

  function showResults() {
    var body = $('fsResultsBody');
    var finish = function (data) {
      if (!data && window.VirceneAIMocks) {
        data = window.VirceneAIMocks.MOCK_FACE_SCAN;
      }
      lastScanResult = data || analysisDataDemo();
      if (body) body.innerHTML = lastScanResult.viraHtml;
      showStep('results');
      var firstChip = overlay.querySelector('.fs-chip');
      if (firstChip) firstChip.focus();
    };

    if (pendingAnalysis && typeof pendingAnalysis.then === 'function') {
      pendingAnalysis.then(function (data) {
        // Persiste le résultat réel (pas la démo) dans l'historique
        if (data && data.summary && data.source !== 'demo') {
          var userId = (window.VirceneAuth && window.VirceneAuth.readSession)
            ? (window.VirceneAuth.readSession() || {}).id
            : null;
          if (userId && window.VirceneUserData && window.VirceneUserData.saveFaceScanEntry) {
            window.VirceneUserData.saveFaceScanEntry(userId, {
              timestamp: Date.now(),
              skin: data.summary.skin || '',
              concerns: data.summary.concerns || [],
              ridules: data.summary.ridules || 'aucun',
            });
          }
        }
        finish(data);
      }).catch(function () { finish(null); });
    } else {
      finish(null);
    }
  }

  /* Transcrit l'analyse dans la conversation de Vira (page de droite). Idempotent. */
  function transcribeAnalysis() {
    if (resultsTranscribed) return;
    resultsTranscribed = true;
    if (window.VirceneAdvisor && typeof window.VirceneAdvisor.injectScan === 'function') {
      window.VirceneAdvisor.injectScan(analysisData());
    }
  }

  /* ---------- Ouverture / fermeture ---------- */
  function open() {
    overlay = overlay || $('faceScanOverlay');
    if (!overlay) return;
    lastFocused = document.activeElement;
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    resultsTranscribed = false;
    showStep('intro');
    document.addEventListener('keydown', onKey);
    var startBtn = $('fsStart');
    if (startBtn) startBtn.focus();
  }

  function close() {
    // Si on quitte l'étape résultats, on transcrit l'analyse dans la conversation.
    if (overlay && overlay.getAttribute('data-current') === 'results') {
      transcribeAnalysis();
    }
    stopCamera();
    clearPhoto();
    clearAnalyseTimers();
    if (!overlay) return;
    overlay.hidden = true;
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKey);
    if (lastFocused && lastFocused.focus) {
      try { lastFocused.focus(); } catch (e) { /* ignore */ }
    }
  }

  function onKey(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault();
      close();
    }
  }

  function goToVira(text) {
    transcribeAnalysis();
    close();
    if (text && window.VirceneAdvisor && typeof window.VirceneAdvisor.send === 'function') {
      window.VirceneAdvisor.send(text);
    }
  }

  /* ---------- Init ---------- */
  function init() {
    overlay = $('faceScanOverlay');
    if (!overlay) return;

    // Fermeture (✕, backdrop, boutons "Plus tard")
    var closers = overlay.querySelectorAll('[data-fs-close]');
    for (var i = 0; i < closers.length; i++) {
      closers[i].addEventListener('click', close);
    }
    var closeBtn = $('fsClose');
    if (closeBtn) closeBtn.addEventListener('click', close);

    var startBtn = $('fsStart');
    if (startBtn) startBtn.addEventListener('click', startCamera);

    var captureBtn = $('fsCapture');
    if (captureBtn) captureBtn.addEventListener('click', capturePhoto);

    var fileInput = $('fsFile');
    if (fileInput) {
      fileInput.addEventListener('change', function () {
        if (this.files && this.files[0]) handleFile(this.files[0]);
      });
    }

    var useBtn = $('fsUse');
    if (useBtn) useBtn.addEventListener('click', startAnalyse);

    var retakeBtn = $('fsRetake');
    if (retakeBtn) retakeBtn.addEventListener('click', startCamera);

    var chips = overlay.querySelectorAll('.fs-chip');
    for (var c = 0; c < chips.length; c++) {
      chips[c].addEventListener('click', function () {
        goToVira(this.getAttribute('data-prompt') || this.textContent.trim());
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.VirceneFaceScan = { open: open, close: close };
})();
