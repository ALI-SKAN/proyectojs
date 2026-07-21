// Builder Pattern: Construye URLs complejas de manera fluida
export class QueryBuilder {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.params = new URLSearchParams();
  }

  addParam(key, value) {
    if (value !== undefined && value !== null && value !== '') {
      this.params.append(key, value);
    }
    return this;
  }

  build() {
    const queryString = this.params.toString();
    return queryString ? `${this.baseUrl}?${queryString}` : this.baseUrl;
  }
}
