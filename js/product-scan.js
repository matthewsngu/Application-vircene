/**
 * Vircène — Scanner produits
 * Caméra plein écran · cadre + ligne de scan · import galerie
 */
(function (global) {
  'use strict';

  const MAX_PRODUCTS = 3;

  function createScreen(options) {
    options = options || {};
    const maxProducts = options.maxProducts || MAX_PRODUCTS;
    const onComplete = typeof options.onComplete === 'function' ? options.onComplete : function () {};
    const onBack = typeof options.onBack === 'function' ? options.onBack : function () {};

    let stream = null;
    let flashOn = false;
    let currentIndex = 0;
    const photos = [];
    let destroyed = false;

    const el = document.createElement('section');
    el.className = 'diag-screen diag-screen--product-scan' + (options.standalone ? ' pscan-standalone' : '');
    el.dataset.screen = 'productScan';
    el.innerHTML = `
      <header class="pscan-head">
        <button type="button" class="pscan-back" data-action="back" aria-label="Retour">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button type="button" class="pscan-import" data-action="gallery">Importer une photo</button>
        <span class="pscan-step-badge" data-step-badge aria-live="polite">1/${maxProducts}</span>
      </header>
      <div class="pscan-body">
        <div class="pscan-viewport-wrap" data-viewport-wrap>
          <div class="pscan-step-toast" data-step-toast hidden aria-live="polite">
            <span class="pscan-step-toast-inner">
              <span class="pscan-step-toast-kicker">Produit suivant</span>
              <span class="pscan-step-toast-title">Produit <span data-toast-num>2</span></span>
              <span class="pscan-step-toast-sub">Scanne l'étiquette ou la liste INCI</span>
            </span>
          </div>
          <div class="pscan-viewport" data-viewport>
            <video class="pscan-video" data-video playsinline muted autoplay aria-hidden="true"></video>
            <div class="pscan-vignette" aria-hidden="true"></div>
            <div class="pscan-frame" aria-hidden="true">
              <span class="pscan-corner pscan-corner--tl"></span>
              <span class="pscan-corner pscan-corner--tr"></span>
              <span class="pscan-corner pscan-corner--bl"></span>
              <span class="pscan-corner pscan-corner--br"></span>
              <span class="pscan-scanline"></span>
            </div>
          </div>
          <div class="pscan-fallback" data-fallback hidden>
            <div class="pscan-fallback-icon" aria-hidden="true">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M4 7h2l1.5-2h9L18 7h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="1.4"/><circle cx="12" cy="13" r="3.2" stroke="currentColor" stroke-width="1.4"/></svg>
            </div>
            <p class="pscan-fallback-title">Photographier ton produit</p>
            <p class="pscan-fallback-text" data-fallback-text>Importe une photo de l'étiquette ou de la liste INCI.</p>
            <button type="button" class="pscan-fallback-btn" data-action="pick">Choisir une photo</button>
          </div>
          <div class="pscan-preview" data-preview hidden>
            <div class="pscan-preview-frame">
              <img class="pscan-preview-img" data-preview-img alt="" hidden />
            </div>
            <p class="pscan-preview-label">Produit <span data-preview-num>1</span> enregistré</p>
            <div class="pscan-preview-actions">
              <button type="button" class="pscan-retake" data-action="retake">Reprendre la photo</button>
              <button type="button" class="pscan-next diag-hero-pill diag-hero-pill--dark" data-action="next" hidden>
                Produit suivant
              </button>
            </div>
          </div>
          <div class="pscan-thumbs" data-thumbs hidden aria-label="Produits scannés"></div>
          <div class="pscan-dock" data-controls>
            <button type="button" class="pscan-flash" data-action="flash" aria-label="Flash" aria-pressed="false">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M13 2L5 13h6l-1 9 9-13h-6l1-7z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>
            </button>
            <div class="pscan-capture-zone">
              <button type="button" class="pscan-capture" data-action="capture" aria-label="Scanner le produit">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 7h2l1-2h8l1 2h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M12 10v4M10 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
              <p class="pscan-hint" data-hint>Scanne l'étiquette INCI</p>
            </div>
            <span class="pscan-dock-spacer" aria-hidden="true"></span>
          </div>
        </div>
        <button type="button" class="pscan-finish diag-hero-pill diag-hero-pill--dark" data-action="finish" hidden>
          Terminer l'analyse
        </button>
      </div>
      <input type="file" accept="image/*" capture="environment" data-file-input hidden />
    `;

    const video = el.querySelector('[data-video]');
    const viewport = el.querySelector('[data-viewport]');
    const fallback = el.querySelector('[data-fallback]');
    const preview = el.querySelector('[data-preview]');
    const previewImg = el.querySelector('[data-preview-img]');
    const previewNum = el.querySelector('[data-preview-num]');
    const stepBadge = el.querySelector('[data-step-badge]');
    const hint = el.querySelector('[data-hint]');
    const controls = el.querySelector('[data-controls]');
    const finishBtn = el.querySelector('[data-action="finish"]');
    const fileInput = el.querySelector('[data-file-input]');
    const flashBtn = el.querySelector('[data-action="flash"]');
    const nextBtn = el.querySelector('[data-action="next"]');
    const retakeBtn = el.querySelector('[data-action="retake"]');
    const thumbsEl = el.querySelector('[data-thumbs]');
    const viewportWrap = el.querySelector('[data-viewport-wrap]');
    const stepToast = el.querySelector('[data-step-toast]');
    const toastNum = el.querySelector('[data-toast-num]');
    const fallbackText = el.querySelector('[data-fallback-text]');
    let transitioning = false;

    function isPreviewVisible() {
      return preview && !preview.hidden;
    }

    function getBadgeStep() {
      if (isPreviewVisible()) return Math.max(photos.length, 1);
      return Math.min(photos.length + 1, maxProducts);
    }

    function updateScanCopy() {
      const step = Math.min(photos.length + 1, maxProducts);
      if (hint) {
        hint.textContent = maxProducts > 1
          ? 'Produit ' + step + ' — scanne l\'étiquette INCI'
          : 'Scanne l\'étiquette INCI';
      }
      if (fallbackText) {
        fallbackText.textContent = 'Produit ' + step + ' — importe une photo de l\'étiquette ou de la liste INCI.';
      }
    }

    function pulseBadge() {
      if (!stepBadge) return;
      stepBadge.classList.remove('is-bump');
      void stepBadge.offsetWidth;
      stepBadge.classList.add('is-bump');
      setTimeout(function () { stepBadge.classList.remove('is-bump'); }, 560);
    }

    function showStepToast(step) {
      if (!stepToast) return;
      if (toastNum) toastNum.textContent = String(step);
      stepToast.hidden = false;
      stepToast.classList.remove('is-visible');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          stepToast.classList.add('is-visible');
        });
      });
    }

    function hideStepToast(callback) {
      if (!stepToast) {
        if (callback) callback();
        return;
      }
      stepToast.classList.remove('is-visible');
      setTimeout(function () {
        stepToast.hidden = true;
        if (callback) callback();
      }, 280);
    }

    function animateSurfaceEnter(surface) {
      if (!surface) return;
      surface.classList.remove('is-entering');
      void surface.offsetWidth;
      surface.classList.add('is-entering');
      setTimeout(function () { surface.classList.remove('is-entering'); }, 480);
    }

    function runStepTransition(nextStep, callback) {
      transitioning = true;
      if (viewportWrap) viewportWrap.classList.add('is-transitioning');
      if (preview) preview.classList.add('is-leaving');
      if (nextBtn) nextBtn.disabled = true;

      setTimeout(function () {
        if (preview) {
          preview.classList.remove('is-leaving');
          preview.hidden = true;
        }
        updateStepUI();
        pulseBadge();
        showStepToast(nextStep);
        setTimeout(function () {
          hideStepToast(function () {
            if (callback) callback();
            if (viewportWrap) viewportWrap.classList.remove('is-transitioning');
            if (nextBtn) nextBtn.disabled = false;
            transitioning = false;
          });
        }, 760);
      }, 300);
    }

    function stopCamera() {
      if (stream) {
        stream.getTracks().forEach(function (t) { t.stop(); });
        stream = null;
      }
      if (video) {
        try { video.srcObject = null; } catch (_) { /* ignore */ }
      }
    }

    function updateStepUI() {
      const step = getBadgeStep();
      if (stepBadge) stepBadge.textContent = step + '/' + maxProducts;
      if (previewNum) previewNum.textContent = String(Math.max(photos.length, 1));
      if (finishBtn) finishBtn.hidden = photos.length === 0;
      updateScanCopy();
      renderThumbs();
    }

    function renderThumbs() {
      if (!thumbsEl) return;
      if (!photos.length) {
        thumbsEl.hidden = true;
        thumbsEl.innerHTML = '';
        return;
      }
      thumbsEl.hidden = false;
      thumbsEl.innerHTML = photos.map(function (photo, i) {
        const active = i === photos.length - 1 && isPreviewVisible() ? ' is-active' : '';
        return `
          <button type="button" class="pscan-thumb${active}" data-thumb="${i}" aria-label="Modifier le produit ${i + 1}">
            <img src="${photo.dataUrl}" alt="" />
          </button>
        `;
      }).join('');
    }

    function updatePreviewActions() {
      const atMax = photos.length >= maxProducts;
      if (nextBtn) {
        nextBtn.hidden = atMax;
        nextBtn.textContent = 'Produit suivant';
      }
      if (retakeBtn) retakeBtn.textContent = 'Reprendre la photo';
      if (finishBtn && atMax) finishBtn.hidden = false;
    }

    function showCameraView(animated) {
      if (preview) preview.hidden = true;
      if (fallback) fallback.hidden = true;
      if (viewport) {
        viewport.hidden = false;
        if (animated) animateSurfaceEnter(viewport);
      }
      if (controls) controls.hidden = false;
      updateStepUI();
    }

    function showFallback(animated) {
      stopCamera();
      if (viewport) viewport.hidden = true;
      if (preview) preview.hidden = true;
      if (fallback) {
        fallback.hidden = false;
        if (animated) animateSurfaceEnter(fallback);
      }
      if (controls) controls.hidden = true;
      updateStepUI();
    }

    function showPreview(dataUrl) {
      stopCamera();
      if (viewport) viewport.hidden = true;
      if (fallback) fallback.hidden = true;
      if (preview) {
        preview.hidden = false;
        preview.classList.remove('is-leaving');
        preview.classList.add('is-entering');
        setTimeout(function () { preview.classList.remove('is-entering'); }, 460);
      }
      if (previewImg) {
        previewImg.src = dataUrl;
        previewImg.hidden = false;
        previewImg.alt = 'Produit ' + Math.max(photos.length, 1);
      }
      if (controls) controls.hidden = true;
      updateStepUI();
      updatePreviewActions();
    }

    function startCamera(animated) {
      if (destroyed) return;
      showCameraView(animated);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showFallback(animated);
        return;
      }

      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      navigator.mediaDevices.getUserMedia(constraints)
        .then(function (s) {
          if (destroyed) {
            s.getTracks().forEach(function (t) { t.stop(); });
            return;
          }
          stream = s;
          if (video) {
            video.srcObject = s;
            var play = video.play();
            if (play && play.catch) play.catch(function () { /* ignore */ });
          }
        })
        .catch(function () {
          showFallback(animated);
        });
    }

    function openNextScan() {
      startCamera(true);
    }

    function capturePhoto() {
      if (!video || !video.videoWidth) return;
      var canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      var dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      registerPhoto(dataUrl);
    }

    function registerPhoto(dataUrl) {
      photos.push({
        index: currentIndex,
        dataUrl: dataUrl,
        capturedAt: new Date().toISOString()
      });
      currentIndex = photos.length;
      updateStepUI();
      showPreview(dataUrl);
    }

    function retakePhoto() {
      if (!photos.length) return;
      photos.pop();
      currentIndex = photos.length;
      updateStepUI();
      if (photos.length > 0) {
        showPreview(photos[photos.length - 1].dataUrl);
        updatePreviewActions();
        return;
      }
      startCamera();
    }

    function confirmPhoto() {
      if (transitioning || photos.length >= maxProducts) return;
      const nextStep = photos.length + 1;
      runStepTransition(nextStep, openNextScan);
    }

    function handleFile(file) {
      if (!file || !file.type.startsWith('image/')) return;
      var reader = new FileReader();
      reader.onload = function () {
        if (typeof reader.result === 'string') registerPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }

    function finishScan() {
      stopCamera();
      onComplete(photos.slice());
    }

    function toggleFlash() {
      flashOn = !flashOn;
      if (flashBtn) flashBtn.setAttribute('aria-pressed', flashOn ? 'true' : 'false');
      if (!stream) return;
      var track = stream.getVideoTracks()[0];
      if (!track || !track.getCapabilities) return;
      var caps = track.getCapabilities();
      if (!caps.torch) return;
      track.applyConstraints({ advanced: [{ torch: flashOn }] }).catch(function () { /* ignore */ });
    }

    el.querySelector('[data-action="back"]')?.addEventListener('click', function () {
      stopCamera();
      onBack();
    });

    el.querySelector('[data-action="capture"]')?.addEventListener('click', capturePhoto);

    el.querySelector('[data-action="gallery"]')?.addEventListener('click', function () {
      fileInput?.click();
    });

    el.querySelector('[data-action="pick"]')?.addEventListener('click', function () {
      fileInput?.click();
    });

    retakeBtn?.addEventListener('click', retakePhoto);
    nextBtn?.addEventListener('click', confirmPhoto);

    thumbsEl?.addEventListener('click', function (event) {
      const btn = event.target.closest('[data-thumb]');
      if (!btn) return;
      const index = Number(btn.getAttribute('data-thumb'));
      if (!Number.isFinite(index) || index < 0 || index >= photos.length) return;
      photos.splice(index);
      currentIndex = photos.length;
      updateStepUI();
      startCamera();
    });

    el.querySelector('[data-action="finish"]')?.addEventListener('click', finishScan);

    flashBtn?.addEventListener('click', toggleFlash);

    fileInput?.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      handleFile(file);
    });

    updateStepUI();
    startCamera();

    function destroy() {
      destroyed = true;
      stopCamera();
      if (previewImg) previewImg.removeAttribute('src');
    }

    return { element: el, destroy: destroy };
  }

  global.VirceneProductScan = {
    createScreen: createScreen,
    MAX_PRODUCTS: MAX_PRODUCTS
  };
})(window);
