/**
 * Vircène — Miniatures photos scan pour localStorage
 */
(function (global) {
  'use strict';

  var THUMB_MAX_SIDE = 320;
  var THUMB_QUALITY = 0.78;
  var THUMB_MAX_CHARS = 120000;

  function isDataImage(url) {
    return typeof url === 'string' && url.indexOf('data:image') === 0;
  }

  function compressDataUrl(dataUrl, maxSide, quality) {
    maxSide = maxSide || THUMB_MAX_SIDE;
    quality = quality == null ? THUMB_QUALITY : quality;
    return new Promise(function (resolve) {
      if (!isDataImage(dataUrl)) {
        resolve(dataUrl || '');
        return;
      }
      if (dataUrl.length <= THUMB_MAX_CHARS && dataUrl.length < 8000) {
        resolve(dataUrl);
        return;
      }
      var img = new Image();
      img.onload = function () {
        try {
          var scale = Math.min(1, maxSide / Math.max(img.width, img.height, 1));
          var w = Math.max(1, Math.round(img.width * scale));
          var h = Math.max(1, Math.round(img.height * scale));
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          var out = canvas.toDataURL('image/jpeg', quality);
          if (out.length > THUMB_MAX_CHARS) {
            out = canvas.toDataURL('image/jpeg', 0.62);
          }
          resolve(out);
        } catch (_) {
          resolve('');
        }
      };
      img.onerror = function () { resolve(''); };
      img.src = dataUrl;
    });
  }

  function productPhotoSource(product) {
    if (!product) return '';
    return product.photoUrl || product.dataUrl || product.imageUrl || '';
  }

  function prepareProductsForStorage(products) {
    var list = products || [];
    return Promise.all(list.map(function (p) {
      var src = productPhotoSource(p);
      if (!src) {
        return Promise.resolve(Object.assign({}, p, { photoUrl: '', imageUrl: p.imageUrl || '' }));
      }
      return compressDataUrl(src).then(function (thumb) {
        var copy = Object.assign({}, p);
        copy.photoUrl = thumb || '';
        if (thumb) copy.imageUrl = thumb;
        delete copy.dataUrl;
        return copy;
      });
    }));
  }

  function resolveProductPhoto(product, userId) {
    var src = productPhotoSource(product);
    if (src) return src;

    if (!userId || !global.VirceneUserData?.getProducts) return '';

    var key = String(product.brand || '').trim().toLowerCase() + '|' + String(product.name || '').trim().toLowerCase();
    var vitrine = global.VirceneUserData.getProducts(userId) || [];
    for (var i = 0; i < vitrine.length; i++) {
      var v = vitrine[i];
      var vk = String(v.brand || '').trim().toLowerCase() + '|' + String(v.name || '').trim().toLowerCase();
      if (vk === key && (v.imageUrl || v.photoUrl)) {
        return v.imageUrl || v.photoUrl;
      }
    }
    return '';
  }

  global.VirceneScanPhotos = {
    compressDataUrl: compressDataUrl,
    prepareProductsForStorage: prepareProductsForStorage,
    resolveProductPhoto: resolveProductPhoto,
    productPhotoSource: productPhotoSource
  };
})(window);
