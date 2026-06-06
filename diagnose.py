import json, re

# The original content we know must appear - used as anchors
# We need to reconstruct: toast module + firebaseModule  

toast_and_firebase = '''
/* ======================================================================================================================
   MÓDULO: TOAST (notificaciones)
====================================================================================================================== */
const toast = {
  container: null,
  init() {
    this.container = document.getElementById('toast-container');
  },
  show(title, message, type = 'info', duration = 4000) {
    if (!this.container) this.init();
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    `;
    this.container?.appendChild(el);
    setTimeout(() => {
      el.classList.add('toast-hide');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, duration);
  },
};

/* ======================================================================================================================
   MÓDULO: FIREBASE
====================================================================================================================== */
const firebaseModule = {
  db: null,
  isConnected: false,
  CONFIG_KEY: 'wft_firebase_config',

  getConfig() {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(this.CONFIG_KEY));
    } catch(e) {}
    if (saved) return saved;

    return {
      apiKey: "AIzaSyDGh58HTTjzk850JzzQWfBGzzHuNcsMjZs",
      authDomain: "workflowtaller-6c4f2.firebaseapp.com",
      projectId: "workflowtaller-6c4f2",
      storageBucket: "workflowtaller-6c4f2.firebasestorage.app",
      messagingSenderId: "71679759534",
      appId: "1:71679759534:web:90ba28fdf1a7739a77c93f"
    };
  },

  saveConfig(cfg) {
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(cfg));
  },

  clearConfig() {
    localStorage.removeItem(this.CONFIG_KEY);
  },

  getCollection(name = 'orders') {
    if (!this.db) return null;
    const cfg = this.getConfig();
    if (!cfg?.projectId) return null;
    return this.db.collection(name);
  },

  setStatus(status) {
    const el = document.getElementById('firebase-status');
    if (!el) return;
    const icons = { online: '🟢', offline: '🔴', local: '🟡' };
    const labels = { online: 'En línea', offline: 'Sin conexión', local: 'Modo local' };
    el.textContent = `${icons[status] || '⚪'} ${labels[status] || status}`;
    el.dataset.status = status;
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

      this.db.enablePersistence({ synchronizeTabs: true }).catch(err => {
        if (err.code === 'failed-precondition') console.warn('[Firebase] Offline: múltiples tabs abiertas.');
        if (err.code === 'unimplemented') console.warn('[Firebase] Offline: no soportado.');
      });

      this.setStatus('online');
      this.isConnected = true;
      console.log('[Firebase] N° SDK inicializado correctamente');
      return true;
    } catch (err) {
      console.error('[Firebase] Error al inicializar:', err);
      this.setStatus('offline');
      return false;
    }
  },
};
'''

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the exact corruption: formatDate method is cut short and then firebaseModule appears inline
# Pattern: the utils object's formatDate is cut short, then firebaseModule appears prematurely
# We need to:
# 1. Find where utils ends (look for the closing }; after escape method)
# 2. Insert the toast + firebaseModule there  
# 3. Remove the premature firebaseModule that got injected

# First, let's see where utils ends vs where firebaseModule was incorrectly spliced
# The premature firebaseModule appears in the first 50 lines of the file

# We'll find "const firebaseModule" that appears INSIDE the utils block and remove it
# then find where the utils block properly ends and insert the proper code

# Find the location of the premature firebaseModule declaration
premature_start = content.find('\nconst firebaseModule = {\n  db: null,\n  isConnected: false,\n  CONFIG_KEY:')

if premature_start == -1:
    print("Could not find premature firebaseModule - checking alternate form")
    # Try to find it
    idx = content.find('const firebaseModule')
    print(f"First occurrence at char: {idx}")
    print(f"Context: {repr(content[max(0,idx-50):idx+100])}")
else:
    # Find the end of this premature block - it ends where getConfig is incomplete
    # It should end right before the next module that's been misplaced
    # Let's find where the next "const " declaration after this premature one is
    
    premature_block_content = content[premature_start:premature_start+500]
    print(f"Premature block found at char {premature_start}")
    print(f"Block content: {repr(premature_block_content)}")
