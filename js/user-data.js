/**
 * Vircène — persistance locale par utilisateur (MVP)
 */
(function (global) {
  const PREFIX = 'vircene_user_';

  function key(userId, suffix) {
    return PREFIX + (userId || 'anon') + '_' + suffix;
  }

  function read(userId, suffix, fallback) {
    try {
      const raw = localStorage.getItem(key(userId, suffix));
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function write(userId, suffix, data) {
    localStorage.setItem(key(userId, suffix), JSON.stringify(data));
  }

  function getProducts(userId) {
    return read(userId, 'products', null);
  }

  function saveProducts(userId, products) {
    write(userId, 'products', products);
    global.VirceneCloudSync?.pushField('products', products);
  }

  function getRoutine(userId) {
    return read(userId, 'routine', null);
  }

  function saveRoutine(userId, routine) {
    write(userId, 'routine', routine);
    global.VirceneCloudSync?.pushField('routine', routine);
  }

  function getPhotos(userId) {
    return read(userId, 'photos', []);
  }

  function savePhotos(userId, photos) {
    write(userId, 'photos', photos);
  }

  function getPosts(userId) {
    return read(userId, 'posts', []);
  }

  function savePosts(userId, posts) {
    write(userId, 'posts', posts);
  }

  function getFollowing(userId) {
    return read(userId, 'following', []);
  }

  function saveFollowing(userId, following) {
    write(userId, 'following', following);
  }

  function getActivityLog(userId) {
    return read(userId, 'activity', []);
  }

  function saveActivityLog(userId, dates) {
    write(userId, 'activity', dates);
    global.VirceneCloudSync?.pushField('activity', dates);
  }

  function getScanAnalysis(userId) {
    return read(userId, 'scan_analysis', null);
  }

  function saveScanAnalysis(userId, payload) {
    write(userId, 'scan_analysis', payload);
    global.VirceneCloudSync?.pushField('scan_analysis', payload);
  }

  function toggleActivityDay(userId, dateKey) {
    const log = getActivityLog(userId);
    const idx = log.indexOf(dateKey);
    if (idx >= 0) log.splice(idx, 1);
    else log.push(dateKey);
    saveActivityLog(userId, log);
    return log;
  }

  // Historique des scans faciaux — chaque entrée : { timestamp, skin, concerns, ridules }
  function getFaceScanHistory(userId) {
    return read(userId, 'face_scan_history', []);
  }

  function saveFaceScanEntry(userId, entry) {
    if (!userId || !entry) return;
    const history = getFaceScanHistory(userId);
    history.unshift(entry); // plus récent en premier
    const trimmed = history.slice(0, 20);
    write(userId, 'face_scan_history', trimmed);
    global.VirceneCloudSync?.pushField('face_scan_history', trimmed);
  }

  global.VirceneUserData = {
    getProducts,
    saveProducts,
    getRoutine,
    saveRoutine,
    getPhotos,
    savePhotos,
    getPosts,
    savePosts,
    getFollowing,
    saveFollowing,
    getActivityLog,
    saveActivityLog,
    getScanAnalysis,
    saveScanAnalysis,
    toggleActivityDay,
    getFaceScanHistory,
    saveFaceScanEntry,
  };
})(window);
