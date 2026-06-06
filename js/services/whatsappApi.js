const whatsappApi = {
  get baseUrl() {
    return `http://${window.location.hostname || 'localhost'}:3000`;
  },

  /**
   * Envía un mensaje de texto al bot local de WhatsApp
   */
  async sendMessage(phone, message, line = 1) {
    const response = await fetch(`${this.baseUrl}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': 'wft-bot-2026' },
      body: JSON.stringify({ phone, message, line })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Error del servidor local');
    }
    
    return data;
  },

  /**
   * Sincroniza órdenes en caché hacia el bot local
   */
  async syncOrders(payload) {
    const response = await fetch(`${this.baseUrl}/sync-orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': 'wft-bot-2026' },
      body: JSON.stringify({ orders: payload })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }
};

window.whatsappApi = whatsappApi;
