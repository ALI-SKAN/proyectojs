// Template Method Pattern: Define el esqueleto de un algoritmo en una operación, difiriendo algunos pasos a las subclases o componentes hijos.
export function BaseLayout({ title, subtitle, topNav, children }) {
  return (
    <div className="layout-container">
      {topNav}
      
      <div className="hero">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="container" style={{ padding: '0 24px 3rem' }}>
        {children}
      </div>
    </div>
  );
}
