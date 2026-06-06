const fs = require('fs');
const file = 'G:/Mi unidad/Microcontroladores Proyectos/WorkFlowTaller/app.js';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/if \(!cfg\.apiKey \|\| !cfg\.projectId\) \{[\s\S]*?return;\s*\}/, '');
content = content.replace(/shopName: document\.getElementById\('cfg-shop-name'\)\.value\.trim\(\),/, 
  "shopName: document.getElementById('cfg-shop-name').value.trim(),\n        shopPhone: document.getElementById('cfg-shop-phone') ? document.getElementById('cfg-shop-phone').value.trim() : ''");
fs.writeFileSync(file, content);
console.log('Fixed app.js');
