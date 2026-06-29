const CardResumo = ({ titulo, valor, detalhe }) => (
  <article className="summary-card">
    <p>{titulo}</p>
    <strong>{valor}</strong>
    <span>{detalhe}</span>
  </article>
);

export default CardResumo;
