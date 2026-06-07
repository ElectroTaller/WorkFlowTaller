const firebaseModule = {
  db: null,
  isConnected: false,
  CONFIG_KEY: 'wft_firebase_config',

  getConfig() {
    const defaultCfg = {
      apiKey: "AIzaSyDGh58HTTjzk850JzzQWfBGzzHuNcsMjZs",
      authDomain: "workflowtaller-6c4f2.firebaseapp.com",
      projectId: "workflowtaller-6c4f2",
      storageBucket: "workflowtaller-6c4f2.firebasestorage.app",
      messagingSenderId: "71679759534",
      appId: "1:71679759534:web:90ba28fdf1a7739a77c93f"
    };
    try {
      const stored = JSON.parse(localStorage.getItem(this.CONFIG_KEY));
      if (stored) {
        return { ...defaultCfg, ...stored };
      }
    } catch(e) {}
    return defaultCfg;
  },

  saveConfig(cfg) {
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(cfg));
  },

  clearConfig() {
    localStorage.removeItem(this.CONFIG_KEY);
  },

  async init() {
    const cfg = this.getConfig();
    if (!cfg?.apiKey || !cfg?.projectId) {
      this.setStatus('local');
      return false;
    }
    try {
      console.log('[Firebase] Iniciando con proyecto:', cfg.projectId);

      if (!firebase.apps.length) {
        firebase.initializeApp(cfg);
      }
      this.db = firebase.firestore();

      // Reactivar el "Sistema anti-olvido" (Persistencia offline nativa)
      this.db.enablePersistence({ synchronizeTabs: true }).catch(err => {
        if (err.code === 'failed-precondition') console.warn('[Firebase] Offline: múltiples tabs abiertas.');
        if (err.code === 'unimplemented') console.warn('[Firebase] Offline: no soportado.');
      });

      // Marcar como conectado — onSnapshot en startListening detectará errores reales
      this.setStatus('online');
      this.isConnected = true;
      console.log('[Firebase] ✅ SDK inicializado correctamente');
      return true;
    } catch (err) {
      console.error('[Firebase] ❌ Error al inicializar:', err.message);
      this.db = null;
      this.setStatus('local');
      toast.show('Error Firebase', err.message, 'error', 6000);
      return false;
    }
  },

  setStatus(state) {
    const dot = document.getElementById('status-dot');
    const text = document.getElementById('status-text');
    if (!dot || !text) return;
    dot.className = `status-dot ${state}`;
    const labels = { online: '🟢 Conectado', offline: '🔴 Sin conexión', local: '🟡 Modo Local' };
    text.textContent = labels[state] || state;
  },

  getCollection() {
    if (!this.db) return null;
    return this.db.collection('orders');
  },
};

window.firebaseModule = firebaseModule;

window.syncBotConfig = async function() {
    const cfg = firebaseModule.getConfig() || {};
    try {
        const host = window.location.hostname || 'localhost';
        await fetch(`http://${host}:3000/config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                allowHumanContact: cfg.allowHumanContact !== undefined ? cfg.allowHumanContact : true,
                notifyAfterHours: cfg.notifyAfterHours !== undefined ? cfg.notifyAfterHours : true,
                shopPhone: cfg.shopPhone || '',
                shopPhone2: cfg.shopPhone2 || ''
            })
        });
        console.log('[Bot] Configuración sincronizada con el bot (Admins actualizados)');
    } catch(e) {
        console.warn('[Bot] No se pudo sincronizar la configuración con el bot en localhost:3000');
    }
};

window.addEventListener('DOMContentLoaded', () => {
    if (window.syncBotConfig) window.syncBotConfig();
});
