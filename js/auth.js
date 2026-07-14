/**
 * Vircène — Auth unifiée
 * Priorité : Supabase → Firebase → mock local (email)
 */
(function (global) {
  const STORAGE_KEY = 'vircene_session';
  const PENDING_REGISTER_KEY = 'vircene_pending_register';
  const AUTH_NOTICE_KEY = 'vircene_auth_notice';
  const WELCOME_KEY = 'vircene_welcome';
  const ENTRANCE_KEY = 'vircene_entrance';
  const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/+esm';

  let supabaseClient;
  let supabasePromise;
  let firebaseReady;

  function devGrantsPremium(session) {
    const dev = getConfig().dev || {};
    if (!dev.grantPremium || !session?.email) return false;
    const email = session.email.toLowerCase();
    return (dev.premiumTestUsers || []).some((user) => String(user.email || '').toLowerCase() === email);
  }

  function getDevTestUser(session) {
    const dev = getConfig().dev || {};
    if (!dev.grantPremium || !session?.email) return null;
    const email = session.email.toLowerCase();
    return (dev.premiumTestUsers || []).find((user) => String(user.email || '').toLowerCase() === email) || null;
  }

  function isPremiumSession(session) {
    if (!session) return false;
    if (devGrantsPremium(session)) return true;
    return session.plan === 'premium';
  }

  function getConfig() {
    return global.VIRCENE_CONFIG || {};
  }

  function loginDevPremiumAccount(email, password) {
    const users = getConfig().dev?.premiumTestUsers;
    if (!Array.isArray(users) || !users.length) return null;
    const address = String(email || '').trim().toLowerCase();
    const pwd = String(password || '').trim();
    if (!address || !pwd) return null;
    const match = users.find((user) => user.email === address && user.password === pwd);
    if (!match) return null;
    return createSession({
      email: match.email,
      firstName: match.firstName || match.email.split('@')[0] || 'Premium',
      lastName: match.lastName || '',
      plan: 'premium',
      provider: 'dev',
      onboardingDone: true
    });
  }

  function getSupabaseConfig() {
    const cfg = getConfig().supabase || {};
    return cfg.url && cfg.anonKey ? cfg : null;
  }

  function getFirebaseConfig() {
    const cfg = getConfig().firebase || {};
    return cfg.apiKey && cfg.authDomain && cfg.projectId ? cfg : null;
  }

  function authBackend() {
    if (getSupabaseConfig()) return 'supabase';
    if (getFirebaseConfig()) return 'firebase';
    return 'mock';
  }

  function readSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return normalizeSession(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  function normalizeSession(session) {
    if (!session) return null;
    let changed = false;
    if (session.email) {
      const email = String(session.email).trim().toLowerCase();
      if (email !== session.email) {
        session.email = email;
        changed = true;
      }
    }
    if (devGrantsPremium(session) && session.plan !== 'premium') {
      session.plan = 'premium';
      changed = true;
    }
    if (changed) writeSession(session);
    return session;
  }

  function writeSession(session) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  function clearSession() {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(PENDING_REGISTER_KEY);
  }

  function createSession(payload) {
    const now = new Date().toISOString();
    const session = {
      id: payload.id || ('usr_' + Math.random().toString(36).slice(2, 10)),
      provider: payload.provider || 'email',
      email: payload.email || '',
      firstName: payload.firstName || 'Toi',
      lastName: payload.lastName || '',
      skinType: payload.skinType || '',
      goals: payload.goals || [],
      about: payload.about || '',
      plan: payload.plan || 'free',
      onboardingDone: Boolean(payload.onboardingDone),
      avatarUrl: payload.avatarUrl || '',
      createdAt: payload.createdAt || now,
      lastLoginAt: now
    };
    writeSession(session);
    return normalizeSession(session);
  }

  function splitName(displayName) {
    if (!displayName) return { firstName: 'Toi', lastName: '' };
    const parts = displayName.trim().split(/\s+/);
    return { firstName: parts[0] || 'Toi', lastName: parts.slice(1).join(' ') };
  }

  function formatAuthError(error) {
    const code = error?.code || '';
    const message = error?.message || '';

    if (message.includes('Invalid login credentials')) {
      return 'Email ou mot de passe incorrect.';
    }
    if (/already registered|already exists/i.test(message)) {
      return 'Un compte existe déjà avec cet e-mail. Connecte-toi.';
    }
    if (message.includes('Email not confirmed')) {
      return 'Confirme ton email avant de te connecter (vérifie ta boîte mail).';
    }
    if (code.includes('api-key-not-valid') || message.includes('api-key-not-valid')) {
      return 'Clé Firebase invalide. Vérifie js/config.js.';
    }
    if (code === 'auth/unauthorized-domain') {
      return 'Domaine non autorisé dans Firebase ou Supabase (ajoute localhost).';
    }
    if (message.includes('Invalid API key') || message.includes('Supabase')) {
      return 'Clé Supabase invalide. Vérifie url + anonKey dans js/config.js.';
    }
    return message || 'Connexion impossible.';
  }

  function getAuthCallbackUrl() {
    return new URL('login.html', window.location.href).href;
  }

  function hasOAuthReturn() {
    return global.location.search.includes('code=')
      || global.location.hash.includes('access_token=');
  }

  /* ─── Supabase ─── */
  function loadSupabase() {
    if (supabaseClient) return Promise.resolve(supabaseClient);
    if (supabasePromise) return supabasePromise;

    const config = getSupabaseConfig();
    if (!config) {
      return Promise.reject(new Error('Supabase non configuré dans js/config.js'));
    }

    const clientOptions = {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'implicit',
        storage: global.localStorage
      }
    };

    if (global.supabase?.createClient) {
      supabaseClient = global.supabase.createClient(config.url, config.anonKey, clientOptions);
      return Promise.resolve(supabaseClient);
    }

    supabasePromise = import(SUPABASE_JS).then(({ createClient }) => {
      supabaseClient = createClient(config.url, config.anonKey, clientOptions);
      return supabaseClient;
    });

    return supabasePromise;
  }

  async function fetchSupabaseProfile(userId) {
    const supabase = await loadSupabase();
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    return data;
  }

  async function upsertSupabaseProfile(userId, fields) {
    const supabase = await loadSupabase();
    await supabase.from('profiles').upsert({
      id: userId,
      updated_at: new Date().toISOString(),
      ...fields
    });
  }

  async function sessionFromSupabaseAuth(authSession, options) {
    const user = authSession.user;
    const meta = user.user_metadata || {};
    let profile = null;
    try {
      profile = await fetchSupabaseProfile(user.id);
    } catch { /* profil optionnel */ }
    const names = splitName(meta.full_name || meta.name || user.email?.split('@')[0]);
    const isRegister = Boolean(options?.isRegister);
    const isOAuth = (user.app_metadata?.provider || '').includes('google')
      || (user.app_metadata?.provider || '').includes('apple')
      || meta.iss?.includes('google');

    const provider = (user.app_metadata?.provider || '').includes('google') || meta.iss?.includes('google')
      ? 'google'
      : (user.app_metadata?.provider || '').includes('apple')
        ? 'apple'
        : 'email';

    const onboardingDone = true;
    let plan = profile?.plan || meta.plan || 'free';

    return createSession({
      id: user.id,
      email: (user.email || profile?.email || '').toLowerCase(),
      firstName: profile?.first_name || meta.first_name || names.firstName,
      lastName: profile?.last_name || meta.last_name || names.lastName,
      skinType: profile?.skin_type || meta.skin_type || '',
      goals: profile?.goals || meta.goals || [],
      about: profile?.about || meta.about || '',
      plan,
      avatarUrl: profile?.avatar_url || meta.avatar_url || meta.picture || '',
      provider,
      onboardingDone
    });
  }

  async function waitForSupabaseSession(supabase, timeoutMs) {
    const limit = timeoutMs || 8000;
    const { data: { session: existing } } = await supabase.auth.getSession();
    if (existing) return existing;

    return new Promise(resolve => {
      let done = false;
      const finish = session => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        subscription.unsubscribe();
        resolve(session);
      };

      const timer = setTimeout(() => finish(null), limit);
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
          finish(session);
        }
      });
    });
  }

  async function completeSupabaseAuth() {
    if (!getSupabaseConfig()) return null;
    const supabase = await loadSupabase();

    const query = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams((window.location.hash || '').replace(/^#/, ''));
    const oauthError = query.get('error_description') || query.get('error')
      || hash.get('error_description') || hash.get('error');
    if (oauthError) {
      throw new Error(decodeURIComponent(String(oauthError).replace(/\+/g, ' ')));
    }

    // Flux implicite : detectSessionInUrl lit les tokens du hash automatiquement.
    let session = await waitForSupabaseSession(supabase, 10000);

    if (session) {
      const isRegister = sessionStorage.getItem(PENDING_REGISTER_KEY) === '1';
      sessionStorage.removeItem(PENDING_REGISTER_KEY);
      global.history.replaceState({}, document.title, window.location.pathname);

      // Détecte si le compte vient d'être créé ou existait déjà.
      const user = session.user || {};
      const created = user.created_at ? new Date(user.created_at).getTime() : 0;
      const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : created;
      const isNewUser = created && Math.abs(lastSignIn - created) < 8000;

      if (isNewUser) {
        // Compte tout juste créé → on déclenche la bienvenue (toast + email).
        sessionStorage.setItem(WELCOME_KEY, '1');
      } else if (isRegister) {
        // Inscription demandée mais le compte existait déjà → on le signale.
        sessionStorage.setItem(AUTH_NOTICE_KEY, 'exists');
      }

      return sessionFromSupabaseAuth(session, { isRegister });
    }

    return null;
  }

  async function syncSupabaseSession() {
    if (!getSupabaseConfig()) return null;
    const supabase = await loadSupabase();
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;
    return sessionFromSupabaseAuth(session, { isRegister: false });
  }

  async function loginWithGoogleSupabase(options) {
    const supabase = await loadSupabase();
    if (options?.isRegister) sessionStorage.setItem(PENDING_REGISTER_KEY, '1');
    else sessionStorage.removeItem(PENDING_REGISTER_KEY);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthCallbackUrl(),
        queryParams: { prompt: 'select_account' }
      }
    });
    if (error) throw error;
    if (data?.url) {
      global.location.href = data.url;
      return null;
    }
    throw new Error('Impossible d\'ouvrir Google. Réessaie.');
  }

  async function loginSupabase(email, password) {
    const supabase = await loadSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password
    });
    if (error) throw error;
    return sessionFromSupabaseAuth(data.session, { isRegister: false });
  }

  async function registerSupabase(formData) {
    const supabase = await loadSupabase();
    const email = (formData.get('email') || '').toString().trim().toLowerCase();
    const password = (formData.get('password') || '').toString();
    const firstName = (formData.get('firstName') || '').toString().trim();
    const lastName = (formData.get('lastName') || '').toString().trim();
    const skinType = (formData.get('skinType') || '').toString();
    const goals = Array.from(formData.getAll('goals'));
    const about = (formData.get('about') || '').toString().trim();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          skin_type: skinType,
          goals,
          about
        }
      }
    });
    if (error) throw error;

    // Supabase renvoie un utilisateur factice (identities vide) quand l'email existe déjà.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      const existsErr = new Error('Un compte existe déjà avec cet e-mail. Connecte-toi.');
      existsErr.code = 'account_exists';
      throw existsErr;
    }

    if (data.user) {
      await upsertSupabaseProfile(data.user.id, {
        email,
        first_name: firstName,
        last_name: lastName,
        skin_type: skinType,
        goals,
        about,
        onboarding_done: true
      });
    }

    if (data.session) {
      sessionStorage.setItem(WELCOME_KEY, '1');
      return sessionFromSupabaseAuth(data.session, { isRegister: true });
    }

    throw new Error('Compte créé — confirme ton email puis connecte-toi.');
  }

  /* ─── Firebase (legacy) ─── */
  function sessionFromFirebaseUser(user, options) {
    const names = splitName(user.displayName);
    const isRegister = Boolean(options?.isRegister);
    const provider = user.providerData?.[0]?.providerId?.includes('apple')
      ? 'apple'
      : user.providerData?.[0]?.providerId?.includes('google')
        ? 'google'
        : 'oauth';

    return createSession({
      id: user.uid,
      email: (user.email || '').toLowerCase(),
      firstName: names.firstName,
      lastName: names.lastName,
      avatarUrl: user.photoURL || '',
      provider,
      onboardingDone: true
    });
  }

  function loadFirebase() {
    if (firebaseReady) return firebaseReady;
    const config = getFirebaseConfig();
    if (!config) return Promise.reject(new Error('Firebase non configuré'));

    if (global.firebase?.apps?.length) {
      firebaseReady = Promise.resolve(global.firebase);
      return firebaseReady;
    }

    firebaseReady = new Promise((resolve, reject) => {
      const appScript = document.createElement('script');
      appScript.src = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js';
      appScript.onload = () => {
        const authScript = document.createElement('script');
        authScript.src = 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js';
        authScript.onload = () => {
          try {
            if (!global.firebase.apps.length) global.firebase.initializeApp(config);
            resolve(global.firebase);
          } catch (e) { reject(e); }
        };
        authScript.onerror = () => reject(new Error('Firebase Auth indisponible'));
        document.head.appendChild(authScript);
      };
      appScript.onerror = () => reject(new Error('Firebase indisponible'));
      document.head.appendChild(appScript);
    });
    return firebaseReady;
  }

  async function loginWithGoogleFirebase(options) {
    const fb = await loadFirebase();
    const provider = new fb.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    if (options?.isRegister) sessionStorage.setItem(PENDING_REGISTER_KEY, '1');
    else sessionStorage.removeItem(PENDING_REGISTER_KEY);
    await fb.auth().signInWithRedirect(provider);
    return null;
  }

  async function completeFirebaseAuth() {
    if (!getFirebaseConfig()) return null;
    const fb = await loadFirebase();
    const result = await fb.auth().getRedirectResult();
    if (result?.user) {
      const isRegister = sessionStorage.getItem(PENDING_REGISTER_KEY) === '1';
      sessionStorage.removeItem(PENDING_REGISTER_KEY);
      return sessionFromFirebaseUser(result.user, { isRegister });
    }
    return syncFirebaseUser();
  }

  function syncFirebaseUser() {
    if (!getFirebaseConfig()) return Promise.resolve(null);
    return loadFirebase().then(fb => new Promise(resolve => {
      const finish = user => {
        if (!user) return resolve(null);
        const existing = readSession();
        if (existing && existing.email === (user.email || '').toLowerCase()) {
          existing.lastLoginAt = new Date().toISOString();
          writeSession(existing);
          return resolve(existing);
        }
        const isRegister = sessionStorage.getItem(PENDING_REGISTER_KEY) === '1';
        sessionStorage.removeItem(PENDING_REGISTER_KEY);
        resolve(sessionFromFirebaseUser(user, { isRegister }));
      };
      if (fb.auth().currentUser) return finish(fb.auth().currentUser);
      const unsub = fb.auth().onAuthStateChanged(u => { unsub(); finish(u); });
    }));
  }

  /* ─── API publique ─── */
  let authLoadPromise;

  async function resolveAuthOnLoadImpl() {
    if (authBackend() === 'supabase') {
      if (hasOAuthReturn()) {
        const oauthSession = await completeSupabaseAuth();
        if (oauthSession) return oauthSession;
      }

      const synced = await syncSupabaseSession();
      if (synced) return synced;

      const existing = readSession();
      if (existing) return existing;

      return null;
    }

    const existing = readSession();
    if (existing) return existing;

    if (authBackend() === 'firebase') {
      let session = await completeFirebaseAuth();
      if (!session) session = await syncFirebaseUser();
      return session;
    }
    return readSession();
  }

  async function refreshSessionFromSupabase() {
    authLoadPromise = null;
    const session = await syncSupabaseSession();
    if (session) {
      writeSession(session);
      normalizeSession(session);
    }
    return readSession() || session;
  }

  async function resolveAuthOnLoad() {
    if (!authLoadPromise) {
      authLoadPromise = resolveAuthOnLoadImpl()
        .then((session) => {
          if (session) {
            writeSession(session);
            normalizeSession(session);
          }
          return readSession() || session;
        })
        .catch((error) => {
          authLoadPromise = null;
          throw error;
        });
    }
    return authLoadPromise;
  }

  async function loginWithProvider(provider, options) {
    if (authBackend() === 'supabase' && provider === 'google') {
      return loginWithGoogleSupabase(options);
    }
    if (authBackend() === 'firebase' && provider === 'google') {
      return loginWithGoogleFirebase(options);
    }
    throw new Error('Connexion Google indisponible. Vérifie js/config.js.');
  }

  async function login(email, password) {
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPassword = String(password || '').trim();

    const devSession = loginDevPremiumAccount(cleanEmail, cleanPassword);
    if (devSession) return devSession;

    if (authBackend() === 'supabase') {
      try {
        return await loginSupabase(cleanEmail, cleanPassword);
      } catch (error) {
        if (getConfig().dev?.premiumTestUsers?.length
          && /Invalid login credentials/i.test(error?.message || '')) {
          const hint = getConfig().dev.premiumTestUsers[0]?.email || 'premium.lea@example.com';
          const loginErr = new Error(`Compte Supabase introuvable. En dev local, utilise ${hint}`);
          loginErr.code = 'dev_test_hint';
          throw loginErr;
        }
        throw error;
      }
    }
    if (!email || !password || password.length < 8) {
      throw new Error('Email ou mot de passe invalide.');
    }
    const existing = readSession();
    if (existing && existing.email === email.trim().toLowerCase()) {
      existing.lastLoginAt = new Date().toISOString();
      writeSession(existing);
      return existing;
    }
    return createSession({
      email: email.trim().toLowerCase(),
      firstName: email.split('@')[0] || 'Toi',
      provider: 'email',
      onboardingDone: true
    });
  }

  async function register(formData) {
    if (authBackend() === 'supabase') return registerSupabase(formData);
    const goals = Array.from(formData.getAll('goals'));
    return createSession({
      email: (formData.get('email') || '').toString().trim().toLowerCase(),
      firstName: (formData.get('firstName') || '').toString().trim(),
      lastName: (formData.get('lastName') || '').toString().trim(),
      skinType: (formData.get('skinType') || '').toString(),
      goals,
      about: (formData.get('about') || '').toString().trim(),
      provider: 'email',
      onboardingDone: true
    });
  }

  async function logout() {
    clearSession();
    if (getSupabaseConfig()) {
      try {
        const supabase = await loadSupabase();
        await supabase.auth.signOut();
      } catch { /* ignore */ }
    }
    if (getFirebaseConfig()) {
      try {
        const fb = await loadFirebase();
        await fb.auth().signOut();
      } catch { /* ignore */ }
    }
  }

  async function markOnboardingDone() {
    const session = readSession();
    if (!session) return null;
    session.onboardingDone = true;
    writeSession(session);
    if (authBackend() === 'supabase' && session.id) {
      await upsertSupabaseProfile(session.id, { onboarding_done: true });
    }
    return session;
  }

  function isSocialAuthReady() {
    return authBackend() !== 'mock';
  }

  function bindSocialAuth(options) {
    const opts = options || {};
    const errorEl = opts.errorEl ? document.getElementById(opts.errorEl) : null;

    document.querySelectorAll('[data-auth-provider]').forEach(btn => {
      if (!isSocialAuthReady()) {
        btn.disabled = true;
        return;
      }
      btn.disabled = false;

      btn.addEventListener('click', async () => {
        if (btn.dataset.authProvider !== 'google') return;
        if (errorEl) errorEl.classList.remove('is-visible');
        const label = btn.textContent.trim();

        try {
          btn.textContent = 'Redirection…';
          await loginWithProvider('google', { isRegister: Boolean(opts.isRegister) });
        } catch (error) {
          btn.disabled = false;
          btn.textContent = label;
          if (errorEl) {
            errorEl.textContent = formatAuthError(error);
            errorEl.classList.add('is-visible');
          }
        }
      });
    });
  }

  function requireAuth(redirectTo) {
    const session = readSession();
    if (!session) {
      window.location.href = redirectTo || 'login.html';
      return null;
    }
    return session;
  }

  function consumeAuthNotice() {
    const notice = sessionStorage.getItem(AUTH_NOTICE_KEY);
    if (notice) sessionStorage.removeItem(AUTH_NOTICE_KEY);
    return notice;
  }

  function consumeWelcome() {
    const flag = sessionStorage.getItem(WELCOME_KEY) === '1';
    if (flag) sessionStorage.removeItem(WELCOME_KEY);
    return flag;
  }

  async function resetPassword(email) {
    const address = String(email || '').trim().toLowerCase();
    if (!address) throw new Error('Indique ton adresse email.');

    if (authBackend() === 'supabase') {
      const supabase = await loadSupabase();
      const redirectTo = new URL('login.html', window.location.href).href;
      const { error } = await supabase.auth.resetPasswordForEmail(address, { redirectTo });
      if (error) throw error;
      return;
    }

    if (authBackend() === 'firebase') {
      const fb = await loadFirebase();
      await fb.auth().sendPasswordResetEmail(address);
      return;
    }

    throw new Error('Réinitialisation disponible avec Supabase ou Firebase configuré.');
  }

  function hasDiagnostic(userId) {
    try {
      const raw = localStorage.getItem('vircene_user_' + (userId || 'anon') + '_diagnostic');
      if (!raw) return false;
      const data = JSON.parse(raw);
      return Boolean(data && (data.report || data.frequency || data.intention));
    } catch {
      return false;
    }
  }

  function safeNextPath(next) {
    if (!next || typeof next !== 'string') return null;
    const trimmed = next.trim().replace(/^\//, '');
    if (/^[a-z0-9.-]+\.html(\?[a-z0-9_=&.-]+)?$/i.test(trimmed)) return trimmed;
    if (/^[a-z0-9.-]+(\?[a-z0-9_=&.-]+)?$/i.test(trimmed)) return trimmed;
    return null;
  }

  function isCompatFunnel(options) {
    const params = new URLSearchParams(global.location.search);
    if (options && options.flowCompat) return true;
    if (params.get('flow') === 'compat') return true;
    return false;
  }

  function redirectAfterAuth(session, options) {
    if (!session) return;
    writeSession(session);

    const params = new URLSearchParams(global.location.search);
    const flowCompat = isCompatFunnel(options);
    const next = safeNextPath(
      (options && options.next)
      || params.get('next')
    );

    if (flowCompat) {
      try {
        sessionStorage.removeItem('vircene_compat_funnel');
        sessionStorage.removeItem('vircene_checkout_plan');
        sessionStorage.setItem('vircene_open_questionnaire', '1');
      } catch { /* ignore */ }
      window.location.replace(next || 'index.html?questionnaire=1');
      return;
    }

    const planIntent = (options && options.plan)
      || params.get('plan')
      || sessionStorage.getItem('vircene_checkout_plan');
    sessionStorage.removeItem('vircene_checkout_plan');

    const premium = isPremiumSession(session);

    if (next) {
      window.location.replace(next);
      return;
    }

    if (planIntent && !premium) {
      const plan = planIntent;
      if (global.VircenePaywall?.redirectToCheckout) {
        global.VircenePaywall.redirectToCheckout(session, plan);
        return;
      }
      const stripeUrl = global.VirceneStripe?.checkoutUrl?.(plan, session);
      if (stripeUrl) {
        window.location.replace(stripeUrl);
        return;
      }
      window.location.replace('account.html?upgrade=' + encodeURIComponent(plan));
      return;
    }

    if (options && options.entrance) markEntrance();
    try {
      sessionStorage.removeItem('vircene_compat_funnel');
      sessionStorage.removeItem('vircene_open_questionnaire');
    } catch { /* ignore */ }
    window.location.replace(premium ? 'app.html?view=accueil' : 'index.html');
  }

  function markEntrance() {
    try {
      sessionStorage.setItem(ENTRANCE_KEY, '1');
    } catch { /* ignore */ }
  }

  function requirePremiumOrRedirect(session) {
    if (!session) {
      window.location.replace('login.html');
      return null;
    }
    const premium = isPremiumSession(session);
    if (!premium) {
      const plan = new URLSearchParams(window.location.search).get('plan') || 'monthly';
      if (global.VircenePaywall?.redirectToCheckout) {
        global.VircenePaywall.redirectToCheckout(session, plan);
      } else {
        const stripeUrl = global.VirceneStripe?.checkoutUrl?.(plan, session);
        if (stripeUrl) {
          window.location.replace(stripeUrl);
        } else {
          window.location.replace('account.html?upgrade=' + encodeURIComponent(plan));
        }
      }
      return null;
    }
    return session;
  }

  async function getAccessToken() {
    try {
      const supabase = await loadSupabase().catch(() => null);
      if (!supabase) return null;
      const { data } = await supabase.auth.getSession();
      return data?.session?.access_token || null;
    } catch (_) {
      return null;
    }
  }

  global.VirceneAuth = {
    authBackend,
    readSession,
    createSession,
    clearSession,
    login,
    register,
    logout,
    loginWithProvider,
    registerSupabase,
    requireAuth,
    requirePremiumOrRedirect,
    redirectAfterAuth,
    resetPassword,
    consumeAuthNotice,
    getAccessToken,
    consumeWelcome,
    bindSocialAuth,
    isSocialAuthReady,
    resolveAuthOnLoad,
    refreshSessionFromSupabase,
    completeSupabaseAuth,
    syncSupabaseSession,
    completeAuthRedirect: completeFirebaseAuth,
    syncFirebaseUser,
    markOnboardingDone,
    markEntrance,
    hasDiagnostic,
    isPremiumSession,
    devGrantsPremium,
    getDevTestUser,
    formatAuthError,
    getAuthCallbackUrl,
    hasOAuthReturn
  };
})(window);
