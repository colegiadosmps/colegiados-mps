const Filtros = ({ children, title = "Filtros" }) => (
  <section className="filters-panel">
    <div className="section-heading">
      <h2>{title}</h2>
      <p>Refine os resultados para localizar informacoes com rapidez.</p>
    </div>
    <div className="filters-grid">{children}</div>
  </section>
);

export default Filtros;
