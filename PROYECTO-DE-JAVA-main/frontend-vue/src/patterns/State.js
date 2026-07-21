// State Pattern: Permite a un objeto alterar su comportamiento cuando su estado interno cambia.

class UIState {
  constructor(context) {
    this.context = context;
  }
  render() { throw new Error('Render method must be implemented'); }
}

export class LoadingState extends UIState {
  render() {
    return { isLoading: true, error: null, data: [] };
  }
}

export class SuccessState extends UIState {
  constructor(context, data) {
    super(context);
    this.data = data;
  }
  render() {
    return { isLoading: false, error: null, data: this.data };
  }
}

export class ErrorState extends UIState {
  constructor(context, error) {
    super(context);
    this.error = error;
  }
  render() {
    return { isLoading: false, error: this.error, data: [] };
  }
}

export class UIContext {
  constructor() {
    this.state = new LoadingState(this);
  }

  setState(state) {
    this.state = state;
  }

  render() {
    return this.state.render();
  }
}
