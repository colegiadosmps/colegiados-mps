import { Link } from "react-router-dom";

const CardColegiado = ({ colegiado }) => (
  <article className="entity-card">
    <div className="entity-card__header">
      <span className="pill">{colegiado.sigla}</span>
      <span className="muted">{colegiado.ultima_atualizacao || "Sem base"}</span>
    </div>

    <h3>{colegiado.nome}</h3>

    <div className="entity-card__stats">
      <div>
        <strong>{colegiado.total_membros}</strong>
        <span>Membros</span>
      </div>
      <div>
        <strong>{colegiado.total_reunioes}</strong>
        <span>Reunioes</span>
      </div>
    </div>

    <div className="entity-card__actions">
      <Link to={`/membros?colegiado=${colegiado.sigla}`}>Ver membros</Link>
      <Link to={`/reunioes?colegiado=${colegiado.sigla}`}>Ver reunioes</Link>
      <Link to={`/publicacoes?colegiado=${colegiado.sigla}`}>
        Abrir publicacoes
      </Link>
    </div>
  </article>
);

export default CardColegiado;
