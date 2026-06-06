import re

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """  getConfig() {
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
  },"""

pattern = r'getConfig\(\)\s*\{.*?return\s*\{.*?AIzaSyDGh58HTTjzk850JzzQWfBGzzHuNcsMjZs.*?appId:.*?\}\s*;\s*\},'
new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/app.js', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Done')
