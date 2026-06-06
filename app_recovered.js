Created At: 2026-06-03T17:03:01Z
Completed At: 2026-06-03T17:03:01Z
File Path: `file:///G:/Mi%20unidad/Microcontroladores%20Proyectos/WorkFlowTaller/app.js`
Total Lines: 3166
Total Bytes: 147204
Showing lines 2342 to 2442
The following code has been modified to include a line number before every line, in the format: <line_number>: <original_line>. Please note that any changes targeting the original code should remove the line number, colon, and leading space.
2342:   initAutocomplete() {
2343:     const input = document.getElementById('field-client-name');
2344:     const dropdown = document.getElementById('client-autocomplete');
2345:     if (!input || !dropdown) return;
2346: 
2347:     const hide = () => { dropdown.hidden = true; this._acFocused = -1; };
2348:     const show = () => { dropdown.hidden = false; };
2349: 
2350:     input.addEventListener('input', () => {
2351:       clearTimeout(this._acTimer);
2352:       this._acTimer = setTimeout(() => this._renderAC(input.value), 180);
2353:     });
2354: 
2355:     input.addEventListener('keydown', e => {
2356:       const items = dropdown.querySelectorAll('.client-ac-item');
2357:       if (e.key === 'ArrowDown') {
2358:         e.preventDefault();
2359:         this._acFocused = Math.min(this._acFocused + 1, items.length - 1);
2360:         items.forEach((el, i) => el.classList.toggle('focused', i === this._acFocused));
2361:       } else if (e.key === 'ArrowUp') {
2362:         e.preventDefault();
2363:         this._acFocused = Math.max(this._acFocused - 1, 0);
2364:         items.forEach((el, i) => el.classList.toggle('focused', i === this._acFocused));
2365:       } else if (e.key === 'Enter' && this._acFocused >= 0) {
2366:         e.preventDefault();
2367:         items[this._acFocused]?.click();
2368:       } else if (e.key === 'Escape') {
2369:         hide();
2370:       }
2371:     });
2372: 
2373:     // Cerrar al hacer clic fuera
2374:     document.addEventListener('click', e => {
2375:       if (!input.contains
<truncated 1706 bytes>
2410:       });
2411:     } else {
2412:       html += `<div class="client-ac-item" style="color:var(--t-muted);font-size:.8rem;">
2413:         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="18" height="18"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
2414:         No hay coincidencias para "${utils.escape(query)}"
2415:       </div>`;
2416:     }
2417: 
2418:     // Fila para guardar cliente nuevo
2419:     html += `<div class="client-ac-save-row" id="ac-save-new">
2420:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
2421:       Guardar "${utils.escape(query)}" como nuevo cliente
2422:     </div>`;
2423: 
2424:     dropdown.innerHTML = html;
2425:     dropdown.hidden = false;
2426: 
2427:     // Click en resultado
2428:     dropdown.querySelectorAll('.client-ac-item[data-id]').forEach(el => {
2429:       el.addEventListener('click', () => {
2430:         const client = clientsModule.clients.get(el.dataset.id);
2431:         if (!client) return;
2432:         document.getElementById('field-client-name').value = client.name;
2433:         document.getElementById('field-client-phone').value = client.phone || '';
2434:         document.getElementById('field-client-cedula').value = client.clientCedula || '';
2435:         document.getElementById('field-client-ruc').value = client.clientRuc || '';
2436:         document.getElementById('field-client-pin').value = client.clientPin || '';
2437:         dropdown.hidden = true;
2438:         formModule.updateBalance?.();
2439:       });
2440:     });
2441: 
2442:     // Click en "guardar como nuevo"
The above content does NOT show the entire file contents. If you need to view any lines of the file which were not shown to complete your task, call this tool again to view those lines.
