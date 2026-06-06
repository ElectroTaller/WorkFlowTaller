import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# The structure is:
# chars 0-1690: correct utils module header (but formatDate is cut short)
# chars 1691-4384: premature firebaseModule (this IS the real firebase code - we can use it)
# chars 4385+: rest of file starting with ordersModule (seems intact)

# Step 1: Get the part before the corruption (utils up to but not including the cut formatDate)
before_cut = content[:1550]  # up to just before formatDate gets cut off

# Step 2: We need to insert the MISSING parts of utils that were consumed
# From the original code, utils has these methods after formatDate:
# - daysSince, escape, debounce, etc.
# We need to reconstruct the complete utils object

# Looking at what was consumed, the regex deleted: 
# - rest of utils.formatDate 
# - rest of utils object 
# - entire toast module
# - then replaced with a duplicate firebaseModule

# The premature firebaseModule block (chars 1691-4384) is the REAL firebaseModule code
# chars 4385+ is ordersModule onwards - this should be intact

# Let's extract the firebaseModule from the premature position (it's correct code)
firebase_block = content[1691:4385]  # This is the complete real firebaseModule

# The rest of the file (ordersModule onwards)  
rest_of_file = content[4385:]

# Now reconstruct: utils (complete) + toast + firebase + rest
# We need to get the missing utils methods - let's look at what's in rest_of_file 
# to understand what methods utils should have

# From the original code pattern, utils has these methods we need to restore:
missing_utils_completion = """
    else date = new Date(value);
    if (isNaN(date)) return '-';
    const opts = { day: '2-digit', month: '2-digit', year: 'numeric' };
    if (includeTime) {
      opts.hour = '2-digit'; opts.minute = '2-digit';
    }
    return date.toLocaleDateString('es-PA', opts);
  },

  /** Cuántos días desde una fecha (Timestamp o string) */
  daysSince(value) {
    if (!value) return 0;
    let date;
    if (value?.toDate) date = value.toDate();
    else if (value instanceof Date) date = value;
    else date = new Date(value);
    if (isNaN(date)) return 0;
    return Math.floor((Date.now() - date.getTime()) / 86_400_000);
  },

  /** Escapa HTML para evitar XSS */
  escape(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  },

  /** Debounce simple */
  debounce(fn, delay = 300) {
    let t;
    return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
  },
};

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

"""

# Build the reconstructed file
new_content = before_cut + missing_utils_completion + firebase_block + rest_of_file

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/app.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f'Reconstruction done. New file length: {len(new_content)} chars')
