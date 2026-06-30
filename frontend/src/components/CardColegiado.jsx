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
      <Link to={`/colegiados/${colegiado.sigla}`}>Ver detalhes</Link>
      <Link to={`/integrantes?colegiado=${colegiado.sigla}`}>Ver integrantes</Link>
      <Link to={`/publicacoes?colegiado=${colegiado.sigla}`}>
        Abrir publicacoes
      </Link>
    </div>
  </article>
);

export default CardColegiado;
