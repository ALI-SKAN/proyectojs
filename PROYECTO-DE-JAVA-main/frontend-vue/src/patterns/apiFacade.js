// Facade Pattern: Oculta la complejidad de la API REST nativa (headers, parseo, manejo de errores)

export const apiFacade = {
  getHeaders() {
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  },

  async get(url) {
    const res = await fetch(url, { headers: this.getHeaders() });
    if (!res.ok) throw new Error(`Error GET: ${res.statusText}`);
    return await res.json();
  },

  async delete(url) {
    const res = await fetch(url, { method: 'DELETE', headers: this.getHeaders() });
    if (!res.ok) throw new Error(`Error DELETE: ${res.statusText}`);
    return await res.json();
  }
};
