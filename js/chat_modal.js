document.addEventListener('DOMContentLoaded', () => {
    const btnActiveChats = document.getElementById('btn-active-chats');
    const modalActiveChats = document.getElementById('modal-active-chats');
    const btnCloseChats = document.getElementById('modal-chats-close');
    
    const chatsListContainer = document.getElementById('chats-list');
    const chatMessagesContainer = document.getElementById('chat-messages');
    const chatHeader = document.getElementById('chat-header');
    
    const lineTabs = document.querySelectorAll('.line-tab');
    
    const chatInputText = document.getElementById('chat-input-text');
    const btnChatSend = document.getElementById('btn-chat-send');
    
    const modalImagePreview = document.getElementById('modal-image-preview');
    const previewImageFull = document.getElementById('preview-image-full');
    const btnCloseImage = document.getElementById('btn-close-image');
    
    // API base (ajusta si el puerto es distinto)
    const BOT_API_URL = 'http://localhost:3000';
    // Ojo: Asegúrate que esta API_KEY coincida con la del bot
    const API_KEY = 'wft-bot-2026';

    let currentChatsData = { line1: [], line2: [] };
    let currentActiveLine = 1;
    let currentActiveChatId = null;

    // --- Auto-Open & Inactividad ---
    let lastSeenMessageTimestamp = 0;
    let inactivityTimer = null;

    function resetInactivityTimer() {
        if (inactivityTimer) clearTimeout(inactivityTimer);
        // Si la ventana está visible, iniciar temporizador de 3 min
        if (!modalActiveChats.hidden) {
            inactivityTimer = setTimeout(() => {
                modalActiveChats.hidden = true;
                modalActiveChats.style.display = 'none';
            }, 3 * 60 * 1000); // 3 minutos
        }
    }

    const chatDraggablePanel = document.getElementById('chat-draggable-panel');
    const modalMainHeader = modalActiveChats.querySelector('.modal-header');

    if (chatDraggablePanel) {
        ['mousemove', 'click', 'keydown'].forEach(evt => {
            chatDraggablePanel.addEventListener(evt, resetInactivityTimer);
        });
    }

    // --- Drag & Drop Logic ---
    
    if (modalMainHeader && chatDraggablePanel) {
        modalMainHeader.style.cursor = 'move';
        
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;
        
        modalMainHeader.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return; // Ignorar el botón de cerrar
            isDragging = true;
            
            const rect = chatDraggablePanel.getBoundingClientRect();
            // Fijar posición inicial para coordenadas absolutas si aún no tiene
            if (!chatDraggablePanel.style.left || chatDraggablePanel.style.left === '') {
                chatDraggablePanel.style.left = rect.left + 'px';
                chatDraggablePanel.style.top = rect.top + 'px';
                chatDraggablePanel.style.position = 'fixed';
                chatDraggablePanel.style.margin = '0';
            }
            
            startX = e.clientX;
            startY = e.clientY;
            initialLeft = parseFloat(chatDraggablePanel.style.left) || 0;
            initialTop = parseFloat(chatDraggablePanel.style.top) || 0;
            
            document.body.style.userSelect = 'none'; 
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            chatDraggablePanel.style.left = (initialLeft + dx) + 'px';
            chatDraggablePanel.style.top = (initialTop + dy) + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            document.body.style.userSelect = '';
        });
    }

    // --- Funciones de Utilidad ---

    function formatTime(timestamp) {
        if (!timestamp) return '';
        const d = new Date(timestamp * 1000);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // --- Renderizado ---

    function renderChatsList() {
        const chats = currentActiveLine === 1 ? currentChatsData.line1 : currentChatsData.line2;
        chatsListContainer.innerHTML = '';
        
        if (!chats || chats.length === 0) {
            chatsListContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--t-secondary);">No hay chats activos recientes.</div>';
            return;
        }

        chats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = `chat-item ${chat.id === currentActiveChatId ? 'active' : ''}`;
            
            // Extraer el último mensaje para el subtítulo
            let lastMessageText = '';
            let lastMessageTime = '';
            if (chat.messages && chat.messages.length > 0) {
                const lastMsg = chat.messages[chat.messages.length - 1];
                lastMessageText = lastMsg.hasMedia ? '📷 Imagen' : (lastMsg.body || '');
                lastMessageTime = formatTime(lastMsg.timestamp);
            }

            chatItem.innerHTML = `
                <div class="chat-item-avatar">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" style="color:#aaa;"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
                <div class="chat-item-content">
                    <div class="chat-item-name">${chat.name || chat.id}</div>
                    <div class="chat-item-lastmsg">${lastMessageText.substring(0, 30)}${lastMessageText.length > 30 ? '...' : ''}</div>
                </div>
                <div class="chat-item-time">${lastMessageTime}</div>
            `;
            
            chatItem.addEventListener('click', () => {
                currentActiveChatId = chat.id;
                renderChatsList(); // Para actualizar clase active
                renderChatMessages(chat);
            });
            
            chatsListContainer.appendChild(chatItem);
        });
    }

    function renderChatMessages(chat) {
        chatHeader.innerHTML = `
            <div class="chat-item-avatar" style="width: 40px; height: 40px; margin-right: 12px; background: #dfe5e7; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24" style="color:#aaa;"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            </div>
            <div>
                <div style="font-weight: 600; font-size: 1.1rem; color: var(--t-primary);">${chat.name}</div>
                <div style="font-size: 0.8rem; color: var(--t-secondary);">${chat.id.replace('@c.us', '')}</div>
            </div>
        `;

        chatMessagesContainer.innerHTML = '';
        
        if (!chat.messages || chat.messages.length === 0) {
            chatMessagesContainer.innerHTML = '<div style="text-align: center; color: #666; font-size: 0.9rem; background: rgba(255,255,255,0.7); padding: 8px 16px; border-radius: 20px; align-self: center;">No hay mensajes recientes</div>';
        } else {
            chat.messages.forEach(msg => {
                const isMe = msg.fromMe;
                const msgDiv = document.createElement('div');
                msgDiv.className = `chat-bubble ${isMe ? 'chat-bubble-out' : 'chat-bubble-in'}`;
                
                let innerHTML = '';
                
                if (msg.hasMedia && msg.type === 'image') {
                    innerHTML += `
                        <div class="chat-media-container" data-msgid="${msg.id}" style="width: 200px; height: 200px; background: #ddd; border-radius: 6px; margin-bottom: 5px; cursor: pointer; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
                            <span style="font-size: 0.8rem; color: #555;">Toca para cargar imagen</span>
                        </div>
                    `;
                    // Cargar imagen de fondo asíncronamente
                    loadMedia(msg.id, currentActiveLine, msgDiv);
                }
                
                if (msg.body) {
                    innerHTML += `<div class="chat-body">${msg.body.replace(/\n/g, '<br/>')}</div>`;
                }
                
                innerHTML += `<div class="chat-time">${formatTime(msg.timestamp)}</div>`;
                
                msgDiv.innerHTML = innerHTML;
                chatMessagesContainer.appendChild(msgDiv);
            });
        }
        
        // Scroll to bottom
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        
        // Habilitar input
        chatInputText.disabled = false;
        btnChatSend.disabled = false;
        chatInputText.focus();
    }

    async function loadMedia(messageId, line, msgDiv) {
        try {
            const url = `${BOT_API_URL}/api/chats/media/${line}/${messageId}?apiKey=${API_KEY}`;
            const response = await fetch(url);
            const resData = await response.json();
            
            if (resData.success && resData.data) {
                const container = msgDiv.querySelector('.chat-media-container');
                if (container) {
                    const imgSrc = `data:${resData.mimetype};base64,${resData.data}`;
                    container.innerHTML = `<img src="${imgSrc}" style="width: 100%; height: 100%; object-fit: cover;" />`;
                    container.onclick = () => {
                        previewImageFull.src = imgSrc;
                        modalImagePreview.style.display = 'flex';
                    };
                }
            }
        } catch (e) {
            console.error('Error cargando media:', e);
        }
    }

    // --- Carga Inicial y Polling ---

    function checkForNewMessages() {
        let maxTimestamp = lastSeenMessageTimestamp;
        let hasNewIncoming = false;
        
        const checkLine = (lineData) => {
            if (!lineData) return;
            lineData.forEach(chat => {
                if (chat.messages && chat.messages.length > 0) {
                    const lastMsg = chat.messages[chat.messages.length - 1];
                    if (lastMsg.timestamp > maxTimestamp) {
                        maxTimestamp = lastMsg.timestamp;
                        if (!lastMsg.fromMe && lastMsg.timestamp > lastSeenMessageTimestamp) {
                            hasNewIncoming = true;
                        }
                    }
                }
            });
        };
        
        checkLine(currentChatsData.line1);
        checkLine(currentChatsData.line2);
        
        // Inicializar la primera vez sin disparar
        if (lastSeenMessageTimestamp === 0) {
            lastSeenMessageTimestamp = maxTimestamp;
            return false;
        }
        
        if (hasNewIncoming) {
            lastSeenMessageTimestamp = maxTimestamp;
            return true;
        }
        
        if (maxTimestamp > lastSeenMessageTimestamp) {
            lastSeenMessageTimestamp = maxTimestamp;
        }
        return false;
    }

    async function loadChatsData(silent = false) {
        if (!silent) {
            chatsListContainer.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--t-secondary);">Cargando chats... <span class="status-dot spin"></span></div>';
        }
        try {
            const response = await fetch(`${BOT_API_URL}/api/chats/active?apiKey=${API_KEY}`);
            const data = await response.json();
            
            if (data.success) {
                currentChatsData = data.data;
                const isNew = checkForNewMessages();
                
                if (isNew) {
                    // Abrir automáticamente si estaba cerrado
                    if (modalActiveChats.hidden) {
                        modalActiveChats.hidden = false;
                        modalActiveChats.style.display = 'flex';
                    }
                    resetInactivityTimer();
                }
                
                // Actualizar interfaz si está abierto
                if (!modalActiveChats.hidden) {
                    renderChatsList();
                    if (currentActiveChatId) {
                        // Solo hacer scroll si ya estaba al final para no molestar al usuario
                        const isAtBottom = chatMessagesContainer.scrollHeight - chatMessagesContainer.scrollTop <= chatMessagesContainer.clientHeight + 50;
                        const chatData = (currentActiveLine === 1 ? currentChatsData.line1 : currentChatsData.line2).find(c => c.id === currentActiveChatId);
                        if (chatData) renderChatMessages(chatData);
                        if (isAtBottom) chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
                    }
                }
            } else if (!silent) {
                chatsListContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--c-danger);">Error: ${data.error}</div>`;
            }
        } catch (e) {
            if (!silent) {
                chatsListContainer.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--c-danger);">Error de conexión con el bot. Asegúrate que esté corriendo.</div>`;
            }
            console.error(e);
        }
    }

    // Iniciar polling
    setInterval(() => loadChatsData(true), 10000);

    // Reemplazo compatible con código existente
    async function fetchActiveChats() {
        await loadChatsData(false);
    }

    // --- Enviar Mensaje ---

    async function sendChatMessage() {
        const text = chatInputText.value.trim();
        if (!text || !currentActiveChatId) return;
        
        chatInputText.disabled = true;
        btnChatSend.disabled = true;
        
        // Render optimista
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-bubble chat-bubble-out';
        msgDiv.innerHTML = `
            <div class="chat-body">${text.replace(/\n/g, '<br/>')}</div>
            <div class="chat-time">Enviando...</div>
        `;
        chatMessagesContainer.appendChild(msgDiv);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        chatInputText.value = '';

        try {
            const phone = currentActiveChatId.replace('@c.us', '');
            const body = {
                phone: phone,
                message: text,
                line: currentActiveLine,
                apiKey: API_KEY
            };

            const response = await fetch(`${BOT_API_URL}/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await response.json();

            if (data.success) {
                msgDiv.querySelector('.chat-time').innerText = 'Enviado';
            } else {
                msgDiv.querySelector('.chat-time').innerText = 'Error';
                msgDiv.querySelector('.chat-time').style.color = 'red';
                alert('Error al enviar mensaje: ' + data.error);
            }
        } catch (e) {
            msgDiv.querySelector('.chat-time').innerText = 'Error de red';
            msgDiv.querySelector('.chat-time').style.color = 'red';
            console.error(e);
        } finally {
            chatInputText.disabled = false;
            btnChatSend.disabled = false;
            chatInputText.focus();
        }
    }

    // --- Event Listeners ---

    btnActiveChats.addEventListener('click', () => {
        modalActiveChats.hidden = false;
        modalActiveChats.style.display = 'flex';
        resetInactivityTimer();
        // Limpiar estado
        chatMessagesContainer.innerHTML = '<div style="text-align: center; margin-top: auto; margin-bottom: auto; color: #666; font-size: 0.9rem; background: rgba(255,255,255,0.7); padding: 8px 16px; border-radius: 20px; align-self: center;">Selecciona un chat</div>';
        chatHeader.innerHTML = '<div style="font-weight: 600; font-size: 1.1rem; color: var(--t-primary);">Selecciona un chat</div>';
        chatInputText.disabled = true;
        btnChatSend.disabled = true;
        currentActiveChatId = null;
        
        fetchActiveChats();
    });

    btnCloseChats.addEventListener('click', () => {
        modalActiveChats.hidden = true;
        modalActiveChats.style.display = 'none';
    });

    lineTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            lineTabs.forEach(t => {
                t.classList.remove('active');
                t.style.borderBottom = 'none';
                t.style.color = 'var(--t-secondary)';
            });
            
            const target = e.currentTarget;
            target.classList.add('active');
            target.style.borderBottom = '2px solid var(--c-primary)';
            target.style.color = 'var(--c-primary)';
            
            currentActiveLine = parseInt(target.getAttribute('data-line'));
            currentActiveChatId = null; // reset selection
            
            chatMessagesContainer.innerHTML = '<div style="text-align: center; margin-top: auto; margin-bottom: auto; color: #666; font-size: 0.9rem; background: rgba(255,255,255,0.7); padding: 8px 16px; border-radius: 20px; align-self: center;">Selecciona un chat</div>';
            chatHeader.innerHTML = '<div style="font-weight: 600; font-size: 1.1rem; color: var(--t-primary);">Selecciona un chat</div>';
            chatInputText.disabled = true;
            btnChatSend.disabled = true;

            renderChatsList();
        });
    });

    btnChatSend.addEventListener('click', sendChatMessage);
    chatInputText.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });

    btnCloseImage.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        modalImagePreview.style.display = 'none';
        previewImageFull.src = '';
    });

    modalImagePreview.addEventListener('click', (e) => {
        if (e.target === modalImagePreview) {
            modalImagePreview.style.display = 'none';
            previewImageFull.src = '';
        }
    });

    // También cerrar con Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modalImagePreview.style.display === 'flex') {
                modalImagePreview.style.display = 'none';
                previewImageFull.src = '';
            } else if (!modalActiveChats.hidden) {
                modalActiveChats.hidden = true;
            }
        }
    });
});
