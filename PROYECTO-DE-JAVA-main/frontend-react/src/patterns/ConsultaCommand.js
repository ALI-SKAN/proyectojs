// Command Pattern: Encapsula una solicitud (API call) como un objeto, permitiendo parametrizar y encolar operaciones.
export class ConsultaCommand {
  constructor(apiEndpoint, token) {
    this.apiEndpoint = apiEndpoint;
    this.token = token;
  }

  async execute(formPayload) {
    const headers = { 'Content-Type': 'application/json' };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    try {
      const res = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(formPayload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Error al ejecutar comando');
      }
      return await res.json();
    } catch (error) {
      throw error;
    }
  }
}
