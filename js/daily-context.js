/**
 * Vircène — contexte quotidien (température, humidité, UV, pollution) via Open-Meteo.
 */
(function (global) {
  'use strict';

  const FALLBACK = { lat: 48.8566, lon: 2.3522, label: 'Paris' };

  const WEATHER_LABELS = {
    0: 'Ciel dégagé',
    1: 'Plutôt clair',
    2: 'Partiellement nuageux',
    3: 'Couvert',
    45: 'Brouillard',
    48: 'Brouillard givrant',
    51: 'Bruine légère',
    53: 'Bruine',
    55: 'Bruine dense',
    61: 'Pluie faible',
    63: 'Pluie',
    65: 'Forte pluie',
    71: 'Neige faible',
    73: 'Neige',
    80: 'Averses',
    95: 'Orage'
  };

  function weatherLabel(code) {
    if (WEATHER_LABELS[code] !== undefined) return WEATHER_LABELS[code];
    if (code >= 56 && code <= 67) return 'Pluie';
    if (code >= 71 && code <= 77) return 'Neige';
    if (code >= 81 && code <= 82) return 'Averses';
    if (code >= 95) return 'Orage';
    return 'Conditions variables';
  }

  function aqiLabel(aqi) {
    if (aqi <= 20) return { text: 'Bonne', level: 'low', severity: 'good' };
    if (aqi <= 40) return { text: 'Correcte', level: 'mid', severity: 'mid' };
    if (aqi <= 60) return { text: 'Moyenne', level: 'mid', severity: 'mid' };
    if (aqi <= 80) return { text: 'Mauvaise', level: 'high', severity: 'bad' };
    return { text: 'Très mauvaise', level: 'high', severity: 'bad' };
  }

  function uvLabel(uv) {
    if (uv < 3) return { text: 'Faible', level: 'low', severity: 'good' };
    if (uv < 6) return { text: 'Modéré', level: 'mid', severity: 'mid' };
    if (uv < 8) return { text: 'Élevé', level: 'high', severity: 'bad' };
    return { text: 'Très élevé', level: 'high', severity: 'bad' };
  }

  function humidityLabel(rh) {
    if (rh <= 35) return { text: 'Faible', full: 'Humidité faible', level: 'dry', severity: 'mid' };
    if (rh <= 55) return { text: 'Modérée', full: 'Humidité modérée', level: 'mid', severity: 'good' };
    if (rh <= 70) return { text: 'Élevée', full: 'Humidité élevée', level: 'humid', severity: 'mid' };
    return { text: 'Très élevée', full: 'Humidité très élevée', level: 'very_humid', severity: 'bad' };
  }

  function tempLabel(temp) {
    if (temp >= 32) return { text: 'Très chaud', short: 'Chaleur', severity: 'bad' };
    if (temp >= 26) return { text: 'Chaud', short: 'Chaleur', severity: 'mid' };
    if (temp <= 5) return { text: 'Très froid', short: 'Froid', severity: 'bad' };
    if (temp <= 10) return { text: 'Froid', short: 'Froid', severity: 'mid' };
    if (temp <= 16) return { text: 'Frais', short: 'Frais', severity: 'good' };
    return { text: 'Doux', short: 'Doux', severity: 'good' };
  }

  function getDayPhase(ctx) {
    const hour = new Date().getHours();
    if (!ctx.isDay || hour >= 18) return 'evening';
    if (hour < 12) return 'morning';
    return 'afternoon';
  }

  function formatDayMeta(city) {
    const raw = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
    const dateStr = raw.charAt(0).toUpperCase() + raw.slice(1);
    return city ? `${dateStr} · ${city}` : dateStr;
  }

  function buildRoutineCtaLabel(phase) {
    if (phase === 'evening') return 'Voir ma routine du soir';
    if (phase === 'morning') return 'Voir ma routine du matin';
    return 'Voir ma routine';
  }

  function loadLifestyleProfile() {
    try {
      const userId = global.VirceneAuth?.readSession?.()?.id || 'anon';
      const raw = localStorage.getItem('vircene_user_' + userId + '_diagnostic');
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data.sleep && !data.hydration && !data.stress) return null;
      return {
        sleep: data.sleep || null,
        hydration: data.hydration || null,
        stress: data.stress || null
      };
    } catch {
      return null;
    }
  }

  function buildLifestyleCandidates(lifestyle, phase) {
    if (!lifestyle) return [];
    const candidates = [];

    if (lifestyle.sleep === 'short') {
      const action = phase === 'evening'
        ? 'Texture réconfortante ce soir.'
        : 'Textures douces ce matin.';
      candidates.push({
        weight: 82,
        key: 'sleep',
        html: `<span class="day-trigger">Peu de sommeil</span> → ta peau a besoin de douceur. ${action}`
      });
    }

    if (lifestyle.hydration === 'rare') {
      candidates.push({
        weight: 68,
        key: 'hydration',
        html: '<span class="day-trigger">Hydratation</span> → pense à boire régulièrement ; ta peau en profite aussi.'
      });
    }

    if (lifestyle.stress === 'pressure') {
      candidates.push({
        weight: 78,
        key: 'stress',
        html: '<span class="day-trigger">Période chargée</span> → on garde une routine simple et apaisante.'
      });
    }

    return candidates;
  }

  function buildPrimaryAdvice(ctx) {
    const phase = getDayPhase(ctx);
    const lifestyle = ctx.lifestyle;
    const temp = ctx.temp;
    const rh = ctx.humidity;
    const dry = rh <= 40;
    const humid = rh >= 65;
    const cold = temp <= 10;
    const hot = temp >= 26;

    if (lifestyle?.sleep === 'short' && phase === 'evening') {
      return 'Peu de sommeil ces temps-ci — texture réconfortante ce soir, sans actif agressif.';
    }

    if (lifestyle?.stress === 'pressure') {
      if (phase === 'evening') {
        return 'Période chargée — routine apaisante ce soir, pas besoin d\'en faire plus.';
      }
      if (phase === 'morning') {
        return 'Période chargée — routine simple ce matin, textures douces et SPF si tu sors.';
      }
    }

    if (lifestyle?.hydration === 'rare' && dry) {
      return 'Air sec et hydratation légère — sérum humectant puis crème barrière aujourd\'hui.';
    }

    if (phase === 'evening') {
      if (cold && dry) return 'Pas de SPF ce soir. Baume réparateur et barrière renforcée.';
      if (cold) return 'Pas de SPF ce soir. Place à la réparation et au confort.';
      if (hot && dry) return 'Pas de SPF ce soir. Hydrate en profondeur après la journée.';
      if (humid) return 'Pas de SPF ce soir. Texture légère et réparation ciblée.';
      if (dry) return 'Pas de SPF ce soir. Sérum puis crème riche pour réparer.';
      return 'Pas de SPF ce soir. Place à la réparation.';
    }

    if (phase === 'morning') {
      if (ctx.aqi >= 60) return 'Antioxydant d\'abord, puis ta routine habituelle.';
      if (hot && (ctx.isDay && ctx.uv >= 3)) return 'Texture légère + SPF aujourd\'hui, réapplique si tu sors.';
      if (cold && dry) return 'Barrière à protéger — texture riche et nettoyant doux.';
      if (dry) return 'Hydrate bien ce matin — l\'air est sec autour de toi.';
      if (humid) return 'Texture légère ce matin — gel ou fluide suffisent.';
      if (ctx.isDay && ctx.uv >= 3) return 'Texture légère + SPF aujourd\'hui, réapplique si tu sors.';
      return 'Routine équilibrée — écoute ce que ta peau te dit.';
    }

    if (ctx.isDay && ctx.uv >= 6) return 'UV marqué — pense à réappliquer ta protection solaire.';
    if (ctx.isDay && ctx.uv >= 3) return 'Pense à réappliquer ton SPF si tu sors encore.';
    if (ctx.aqi >= 60) return 'Air chargé — limite l\'exposition et nettoie en douceur ce soir.';
    if (hot && dry) return 'Chaleur sèche — brume ou hydratation légère si ta peau tire.';
    return 'Continue ta routine — ajuste selon ce que tu ressens.';
  }

  function buildTriggerLine(ctx) {
    const phase = getDayPhase(ctx);
    const candidates = buildLifestyleCandidates(ctx.lifestyle, phase);

    if (ctx.aqi >= 60) {
      candidates.push({ weight: 90, key: 'aqi', html: '<span class="day-trigger">Air mauvais aujourd\'hui</span> → pense à ton antioxydant.' });
    } else if (ctx.aqi >= 40) {
      candidates.push({ weight: 55, key: 'aqi', html: '<span class="day-trigger">Air modéré</span> → vitamine C le matin peut aider.' });
    }

    if (phase !== 'evening' && ctx.isDay && ctx.uv >= 6) {
      candidates.push({ weight: 85, key: 'uv', html: '<span class="day-trigger">UV élevé</span> → réapplique ta protection solaire.' });
    } else if (phase !== 'evening' && ctx.isDay && ctx.uv >= 3) {
      candidates.push({ weight: 70, key: 'uv', html: '<span class="day-trigger">UV modéré</span> → n\'oublie pas ton SPF si tu sors.' });
    }

    if (ctx.humidity <= 35) {
      const action = phase === 'evening' ? 'baume ou crème riche ce soir.' : 'hydrate davantage ce matin.';
      candidates.push({ weight: 65, key: 'humidity', html: `<span class="day-trigger">Humidité faible</span> → ${action}` });
    } else if (ctx.humidity >= 70) {
      candidates.push({ weight: 60, key: 'humidity', html: '<span class="day-trigger">Humidité élevée</span> → privilégie des textures légères.' });
    }

    if (ctx.temp <= 10) {
      candidates.push({ weight: 75, key: 'temp', html: '<span class="day-trigger">Froid</span> → renforce ta barrière cutanée.' });
    } else if (ctx.temp >= 28) {
      const heatAction = phase === 'evening'
        ? 'textures légères et hydratation ce soir.'
        : 'textures légères et SPF si tu sors.';
      candidates.push({ weight: 72, key: 'temp', html: `<span class="day-trigger">Chaleur</span> → ${heatAction}` });
    }

    if (phase === 'evening' && !candidates.length) {
      return { html: '<span class="day-trigger">Nuit</span> → c\'est le moment de réparer, pas de protéger du soleil.', trigger: 'evening', key: null };
    }

    candidates.sort((a, b) => b.weight - a.weight);
    if (candidates.length) {
      return { html: candidates[0].html, trigger: 'env', key: candidates[0].key };
    }
    return { html: 'Conditions stables → continue ta routine en écoutant ta peau.', trigger: null, key: null };
  }

  function getIndicatorSeverity(ctx, key) {
    switch (key) {
      case 'uv':
        return !ctx.isDay ? 'good' : (ctx.uvInfo?.severity || uvLabel(ctx.uv).severity);
      case 'aqi':
        return ctx.aqiInfo?.severity || aqiLabel(ctx.aqi).severity;
      case 'temp':
        return ctx.tempInfo?.severity || tempLabel(ctx.temp).severity;
      case 'humidity':
        return ctx.humidityInfo?.severity || humidityLabel(ctx.humidity).severity;
      default:
        return 'good';
    }
  }

  function applyEnvHierarchy(ctx, envPanel) {
    if (!envPanel) return;
    const line = ctx.triggerLine || buildTriggerLine(ctx);
    const primaryKey = line.key || null;

    envPanel.querySelectorAll('.day-env-btn').forEach((btn) => {
      const key = btn.dataset.envKey;
      const severity = getIndicatorSeverity(ctx, key);
      const isWatch = severity === 'mid' || severity === 'bad';
      btn.classList.toggle('day-env-btn--primary', key === primaryKey);
      btn.classList.toggle('day-env-btn--watch', isWatch);
    });
  }

  function buildIndicatorDetails(ctx) {
    const phase = getDayPhase(ctx);
    const uvInfo = ctx.uvInfo || uvLabel(ctx.uv);
    const aqiInfo = ctx.aqiInfo || aqiLabel(ctx.aqi);
    const humInfo = ctx.humidityInfo || humidityLabel(ctx.humidity);
    const tInfo = tempLabel(ctx.temp);

    let uvDetail = '';
    if (!ctx.isDay) {
      uvDetail = 'Indice UV négligeable la nuit — pas de protection solaire nécessaire.';
    } else if (ctx.uv >= 6) {
      uvDetail = `Indice ${ctx.uv} (${uvInfo.text}) — réapplication toutes les 2 h si exposition.`;
    } else if (ctx.uv >= 3) {
      uvDetail = `Indice ${ctx.uv} (${uvInfo.text}) — SPF recommandé si tu sors.`;
    } else {
      uvDetail = `Indice ${ctx.uv} (${uvInfo.text}) — protection légère suffit en journée.`;
    }

    const aqiDetail = ctx.aqi >= 60
      ? `AQI ${ctx.aqi} (${aqiInfo.text}) — limite le temps dehors, double nettoyage ce soir.`
      : ctx.aqi >= 40
        ? `AQI ${ctx.aqi} (${aqiInfo.text}) — un sérum antioxydant le matin est un plus.`
        : `AQI ${ctx.aqi} (${aqiInfo.text}) — air favorable pour ta peau aujourd'hui.`;

    let tempDetail = `${ctx.temp}°C (${tInfo.text}) — `;
    if (ctx.temp >= 28) tempDetail += 'évite les textures épaisses en journée.';
    else if (ctx.temp <= 10) tempDetail += 'privilégie des textures plus riches le soir.';
    else tempDetail += 'température confortable pour ta routine habituelle.';

    let humDetail = `${ctx.humidity}% (${humInfo.full}) — `;
    if (ctx.humidity <= 35) humDetail += phase === 'evening' ? 'compense avec un soin plus riche.' : 'humectants et crème barrière recommandés.';
    else if (ctx.humidity >= 70) humDetail += 'gel ou fluide plutôt que crème lourde.';
    else humDetail += 'niveau confortable pour la plupart des peaux.';

    return { uv: uvDetail, aqi: aqiDetail, temp: tempDetail, humidity: humDetail };
  }

  function buildClimateAdvice(ctx) {
    const temp = ctx.temp;
    const rh = ctx.humidity;
    const phase = getDayPhase(ctx);
    const cold = temp <= 10;
    const cool = temp <= 16;
    const hot = temp >= 26;
    const veryHot = temp >= 32;
    const dry = rh <= 40;
    const humid = rh >= 65;

    let headline = 'Conditions équilibrées';
    let detail = 'Routine habituelle — hydrate et ajuste selon ce que ta peau ressent aujourd\'hui.';
    const tags = [];

    if (cold && dry) {
      headline = 'Froid · air sec';
      detail = phase === 'evening'
        ? 'Barrière cutanée à réparer — baume riche et nettoyant doux ce soir.'
        : 'Barrière cutanée à protéger — textures plus riches, baume le soir et nettoyant doux.';
      tags.push('Barrière', 'Texture riche', 'Baume');
    } else if (cold) {
      headline = 'Air froid';
      detail = phase === 'evening'
        ? 'Renforce ta barrière ce soir — crème riche et confort contre le chauffage.'
        : 'Renforce ta barrière — crème plus riche le soir et protection contre le vent.';
      tags.push('Barrière', 'Texture riche');
    } else if (veryHot && dry) {
      headline = 'Chaleur sèche';
      detail = phase === 'evening'
        ? 'Hydratation en profondeur ce soir après une journée sèche et chaude.'
        : 'Hydratation renforcée + SPF 50, textures légères le jour.';
      tags.push('Hydratation ++', 'SPF 50', 'Texture légère');
    } else if (hot && dry) {
      headline = 'Chaud · air sec';
      detail = phase === 'evening'
        ? 'L\'air a asséché ta peau — sérum puis crème riche ce soir.'
        : 'L\'air tire l\'eau de ta peau — humectants le matin, crème légère + SPF.';
      tags.push('Hydratation', 'SPF', 'Humectants');
    } else if (hot && humid) {
      headline = 'Chaud · air humide';
      detail = phase === 'evening'
        ? 'Texture légère ce soir — évite les couches épaisses qui étouffent.'
        : 'Texture légère + SPF — gel ou fluide, pas de couches épaisses.';
      tags.push('Texture légère', 'SPF', 'Gel');
    } else if (hot) {
      headline = 'Chaleur';
      detail = phase === 'evening'
        ? 'Pas de SPF — hydrate et laisse ta peau récupérer.'
        : 'Texture légère + SPF, réapplication si tu sors.';
      tags.push('Texture légère', 'SPF');
    } else if (cool && dry) {
      headline = 'Frais · air sec';
      detail = 'Hydratation renforcée — sérum humectant + crème barrière.';
      tags.push('Hydratation', 'Barrière');
    } else if (dry) {
      headline = 'Air sec';
      detail = phase === 'evening'
        ? 'Priorise l\'hydratation ce soir — crème riche pour limiter la déshydratation.'
        : 'Priorise l\'hydratation — sérum le matin, crème plus riche le soir.';
      tags.push('Hydratation', 'Humectants', 'Crème riche');
    } else if (humid) {
      headline = 'Air humide';
      detail = 'Textures légères — gel ou émulsion fluide, évite les beurres lourds.';
      tags.push('Texture légère', 'Gel');
    } else if (cool) {
      headline = 'Temps frais';
      detail = 'Routine équilibrée — crème confortable et barrière légèrement renforcée le soir.';
      tags.push('Confort', 'Barrière');
    }

    if (phase !== 'evening' && ctx.isDay && ctx.uv >= 6 && !tags.some(t => t.includes('SPF'))) {
      tags.push('SPF 50');
    } else if (phase !== 'evening' && ctx.isDay && ctx.uv >= 3 && !tags.some(t => t.includes('SPF'))) {
      tags.push('SPF');
    }

    return { headline, detail, tags };
  }

  function buildAdvice(ctx) {
    const climate = buildClimateAdvice(ctx);
    const parts = [climate.detail];
    const phase = getDayPhase(ctx);

    if (phase !== 'evening' && ctx.isDay && ctx.uv >= 6) {
      parts.push('UV élevé — réapplique ta protection solaire en milieu de journée.');
    }

    if (ctx.aqi >= 60) {
      parts.push('Pollution marquée — antioxydant le matin recommandé.');
    } else if (ctx.aqi >= 40 && phase !== 'evening') {
      parts.push('Air un peu chargé — vitamine C le matin aide ta peau.');
    }

    return parts.join(' ');
  }

  function buildHeroMessage(ctx) {
    return buildPrimaryAdvice(ctx);
  }

  function setStatusDot(el, severity) {
    if (!el) return;
    el.classList.remove('env-status--good', 'env-status--mid', 'env-status--bad');
    el.classList.add('env-status--' + (severity || 'good'));
  }

  function getPosition() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(FALLBACK);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          label: null
        }),
        () => resolve(FALLBACK),
        { timeout: 8000, maximumAge: 900000 }
      );
    });
  }

  async function reverseGeocode(lat, lon) {
    try {
      const url = `https://geocoding-api.open-meteo.com/v1/reverse?latitude=${lat}&longitude=${lon}&language=fr&count=1`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('geo');
      const data = await res.json();
      const place = data.results && data.results[0];
      if (!place) return null;
      return place.name || place.admin1 || null;
    } catch {
      return null;
    }
  }

  async function fetchContext(coords) {
    const { lat, lon } = coords;
    const weatherUrl = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon
      + '&current=temperature_2m,relative_humidity_2m,weather_code,uv_index,is_day&timezone=auto';
    const airUrl = 'https://air-quality-api.open-meteo.com/v1/air-quality?latitude=' + lat + '&longitude=' + lon
      + '&current=european_aqi,pm2_5&timezone=auto';

    const [weatherRes, airRes, city] = await Promise.all([
      fetch(weatherUrl),
      fetch(airUrl),
      coords.label ? Promise.resolve(coords.label) : reverseGeocode(lat, lon)
    ]);

    if (!weatherRes.ok) throw new Error('weather');
    const weather = await weatherRes.json();
    const air = airRes.ok ? await airRes.json() : { current: {} };
    const cur = weather.current || {};
    const airCur = air.current || {};

    const ctx = {
      lat,
      lon,
      city: city || FALLBACK.label,
      temp: Math.round(cur.temperature_2m ?? 18),
      humidity: Math.round(cur.relative_humidity_2m ?? 50),
      weatherCode: cur.weather_code ?? 0,
      weatherText: weatherLabel(cur.weather_code ?? 0),
      uv: Math.round((cur.uv_index ?? 0) * 10) / 10,
      isDay: cur.is_day === 1,
      aqi: Math.round(airCur.european_aqi ?? 25),
      pm25: airCur.pm2_5 != null ? Math.round(airCur.pm2_5) : null
    };

    ctx.aqiInfo = aqiLabel(ctx.aqi);
    ctx.uvInfo = uvLabel(ctx.uv);
    ctx.humidityInfo = humidityLabel(ctx.humidity);
    ctx.tempInfo = tempLabel(ctx.temp);
    ctx.phase = getDayPhase(ctx);
    ctx.lifestyle = loadLifestyleProfile();
    ctx.climateAdvice = buildClimateAdvice(ctx);
    ctx.advice = buildAdvice(ctx);
    ctx.primaryAdvice = buildPrimaryAdvice(ctx);
    ctx.triggerLine = buildTriggerLine(ctx);
    ctx.indicatorDetails = buildIndicatorDetails(ctx);
    ctx.heroMessage = ctx.primaryAdvice;
    ctx.routineCta = buildRoutineCtaLabel(ctx.phase);
    return ctx;
  }

  let envDetailTexts = {};

  function bindEnvExpand() {
    const panel = document.querySelector('.day-card-env');
    const detailPanel = document.getElementById('dayEnvDetailPanel');
    if (!panel || panel.dataset.bound === '1') return;
    panel.dataset.bound = '1';

    panel.addEventListener('click', (e) => {
      const btn = e.target.closest('.day-env-btn');
      if (!btn || !detailPanel) return;

      const key = btn.dataset.envKey;
      const isOpen = btn.getAttribute('aria-expanded') === 'true';

      panel.querySelectorAll('.day-env-btn').forEach((other) => {
        other.setAttribute('aria-expanded', 'false');
        other.classList.remove('is-open');
      });

      if (isOpen) {
        detailPanel.hidden = true;
        detailPanel.textContent = '';
        return;
      }

      btn.setAttribute('aria-expanded', 'true');
      btn.classList.add('is-open');
      detailPanel.textContent = envDetailTexts[key] || '';
      detailPanel.hidden = !envDetailTexts[key];
    });
  }

  function renderCards(ctx) {
    const meta = document.getElementById('dayCardMeta');
    const advice = document.getElementById('dayCardAdvice');
    const trigger = document.getElementById('dayCardTrigger');
    const cta = document.getElementById('dayCardCta');
    const note = document.getElementById('greetingNote');
    const uvVal = document.getElementById('todayUvValue');
    const uvSub = document.getElementById('todayUvSub');
    const aqiVal = document.getElementById('todayAqiValue');
    const aqiSub = document.getElementById('todayAqiSub');
    const tempVal = document.getElementById('todayTempValue');
    const tempSub = document.getElementById('todayTempSub');
    const humidityVal = document.getElementById('todayHumidityValue');
    const humiditySub = document.getElementById('todayHumiditySub');
    const tempCard = document.getElementById('todayTempCard');
    const humidityCard = document.getElementById('todayHumidityCard');
    const details = ctx.indicatorDetails || buildIndicatorDetails(ctx);

    if (meta) meta.textContent = formatDayMeta(ctx.city);
    if (advice) advice.textContent = ctx.primaryAdvice || buildPrimaryAdvice(ctx);
    if (trigger) {
      const line = ctx.triggerLine || buildTriggerLine(ctx);
      trigger.innerHTML = line.html;
    }
    if (cta) cta.textContent = ctx.routineCta || buildRoutineCtaLabel(getDayPhase(ctx));
    if (note && document.body.classList.contains('is-tracking-view')) {
      note.textContent = ctx.primaryAdvice || buildPrimaryAdvice(ctx);
    }

    if (tempVal) tempVal.textContent = ctx.temp + '°';
    if (tempSub) tempSub.textContent = ctx.tempInfo?.text || tempLabel(ctx.temp).text;
    if (humidityVal) humidityVal.textContent = ctx.humidity + '%';
    if (humiditySub) humiditySub.textContent = ctx.humidityInfo?.full || humidityLabel(ctx.humidity).full;

    if (tempCard) {
      tempCard.classList.toggle('tracking-env-seg--hot', ctx.temp >= 28);
      tempCard.classList.toggle('tracking-env-seg--cold', ctx.temp <= 10);
    }
    if (humidityCard) {
      humidityCard.classList.toggle('tracking-env-seg--dry', ctx.humidity <= 40);
      humidityCard.classList.toggle('tracking-env-seg--humid', ctx.humidity >= 65);
    }

    if (uvVal) {
      uvVal.textContent = ctx.isDay ? String(ctx.uv) : '—';
      const uvCard = document.getElementById('todayUvCard');
      uvCard?.classList.toggle('tracking-env-seg--high', ctx.isDay && ctx.uv >= 6);
      uvCard?.classList.toggle('tracking-env-seg--mid', ctx.isDay && ctx.uv >= 3 && ctx.uv < 6);
    }
    if (uvSub) {
      if (!ctx.isDay) {
        uvSub.textContent = 'Nuit';
      } else {
        uvSub.textContent = 'UV ' + (ctx.uvInfo?.text || uvLabel(ctx.uv).text).toLowerCase();
      }
    }
    setStatusDot(document.getElementById('todayUvStatus'), !ctx.isDay ? 'good' : (ctx.uvInfo?.severity || uvLabel(ctx.uv).severity));

    if (aqiVal) {
      aqiVal.textContent = String(ctx.aqi);
      const aqiCard = document.getElementById('todayAqiCard');
      aqiCard?.classList.toggle('tracking-env-seg--high', ctx.aqi >= 60);
      aqiCard?.classList.toggle('tracking-env-seg--mid', ctx.aqi >= 40 && ctx.aqi < 60);
    }
    if (aqiSub) {
      aqiSub.textContent = 'Air ' + (ctx.aqiInfo?.text || aqiLabel(ctx.aqi).text).toLowerCase();
    }
    setStatusDot(document.getElementById('todayAqiStatus'), ctx.aqiInfo?.severity || aqiLabel(ctx.aqi).severity);
    setStatusDot(document.getElementById('todayTempStatus'), ctx.tempInfo?.severity || tempLabel(ctx.temp).severity);
    setStatusDot(document.getElementById('todayHumidityStatus'), ctx.humidityInfo?.severity || humidityLabel(ctx.humidity).severity);

    envDetailTexts = details;
    const detailPanel = document.getElementById('dayEnvDetailPanel');
    const envPanel = document.querySelector('.day-card-env');
    if (detailPanel) {
      detailPanel.hidden = true;
      detailPanel.textContent = '';
    }
    envPanel?.querySelectorAll('.day-env-btn').forEach((btn) => {
      btn.setAttribute('aria-expanded', 'false');
      btn.classList.remove('is-open');
    });

    applyEnvHierarchy(ctx, envPanel);
    bindEnvExpand();
  }

  function renderLoading() {
    const meta = document.getElementById('dayCardMeta');
    const advice = document.getElementById('dayCardAdvice');
    const trigger = document.getElementById('dayCardTrigger');
    if (meta) meta.textContent = 'Localisation en cours…';
    if (advice) advice.textContent = 'Je prépare ton conseil du jour…';
    if (trigger) trigger.textContent = 'J\'analyse la température, l\'humidité et la pollution autour de toi…';
  }

  function renderError() {
    const meta = document.getElementById('dayCardMeta');
    const advice = document.getElementById('dayCardAdvice');
    const trigger = document.getElementById('dayCardTrigger');
    const cta = document.getElementById('dayCardCta');
    if (meta) meta.textContent = formatDayMeta(FALLBACK.label);
    const phase = getDayPhase({ isDay: new Date().getHours() >= 6 && new Date().getHours() < 20 });
    if (advice) {
      advice.textContent = phase === 'evening'
        ? 'Pas de SPF ce soir. Place à la réparation.'
        : 'Texture légère + SPF aujourd\'hui, réapplique si tu sors.';
    }
    if (trigger) trigger.textContent = 'Données indisponibles — continue ta routine habituelle.';
    if (cta) cta.textContent = buildRoutineCtaLabel(phase);
  }

  // Enrichissement IA — remplace le conseil statique si la réponse arrive dans le délai imparti.
  async function enrichAdviceWithAI(ctx) {
    const adviceUrl = (global.VIRCENE_CONFIG && global.VIRCENE_CONFIG.api && global.VIRCENE_CONFIG.api.dailyAdvice)
      || '/.netlify/functions/daily-advice';

    // Profil utilisateur optionnel
    let profile = null;
    try {
      const session = global.VirceneAuth?.readSession?.();
      if (session && global.VirceneUserData) {
        const ud = global.VirceneUserData;
        const products = ud.getProducts?.(session.id);
        const diagRaw = localStorage.getItem('vircene_user_' + session.id + '_diagnostic');
        const diag = diagRaw ? JSON.parse(diagRaw) : {};
        profile = {
          skinType: session.skinType || diag.skinType || '',
          concerns: Array.isArray(diag.concernIds) ? diag.concernIds : [],
          vitrine: Array.isArray(products)
            ? products.slice(0, 6).filter((p) => p.active).map((p) => ({ name: p.name, active: p.active }))
            : [],
        };
      }
    } catch { /* profil optionnel — on continue sans */ }

    const payload = {
      weather: {
        temp: ctx.temp,
        humidity: ctx.humidity,
        uv: ctx.uv,
        aqi: ctx.aqi,
        isDay: ctx.isDay,
        weatherText: ctx.weatherText || '',
        phase: ctx.phase || getDayPhase(ctx),
      },
      profile,
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500); // 4,5 s max

    try {
      let adviceAuthHeader = {};
      try {
        if (global.VirceneAuth && global.VirceneAuth.getAccessToken) {
          const tok = await global.VirceneAuth.getAccessToken();
          if (tok) adviceAuthHeader = { Authorization: 'Bearer ' + tok };
        }
      } catch (_) {}
      const res = await fetch(adviceUrl, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, adviceAuthHeader),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!res.ok) return;

      const data = await res.json();

      // Met à jour les éléments DOM si la vue est encore visible
      const adviceEl = document.getElementById('dayCardAdvice');
      const triggerEl = document.getElementById('dayCardTrigger');

      if (adviceEl && data.advice) adviceEl.textContent = data.advice;
      if (triggerEl && data.trigger) triggerEl.innerHTML = data.trigger;
    } catch {
      clearTimeout(timer);
      // Timeout ou erreur réseau — on garde le conseil statique, aucune régression
    }
  }

  async function init() {
    const panel = document.getElementById('view-aujourdhui');
    if (!panel) return;

    renderLoading();
    try {
      const coords = await getPosition();
      const ctx = await fetchContext(coords);
      renderCards(ctx);
      global.VirceneDailyContext = {
        last: ctx,
        buildAdvice,
        buildClimateAdvice,
        buildHeroMessage,
        buildPrimaryAdvice,
        buildTriggerLine,
        formatDayMeta,
        loadLifestyleProfile
      };
      // Enrichissement IA après rendu statique — non bloquant
      enrichAdviceWithAI(ctx);
    } catch {
      renderError();
    }
  }

  global.VirceneDailyContext = {
    init,
    buildAdvice,
    buildClimateAdvice,
    buildHeroMessage,
    buildPrimaryAdvice,
    buildTriggerLine,
    formatDayMeta,
    loadLifestyleProfile
  };
})(window);
