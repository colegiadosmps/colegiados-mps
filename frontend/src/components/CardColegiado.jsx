import { Link } from "react-router-dom";
import { formatColegiadoDisplayName, formatDateTime } from "../services/formatters";

const CardColegiado = ({ colegiado }) => (
  <article className="entity-card">
    <div className="entity-card__header">
      <span className="pill">
        {formatColegiadoDisplayName(colegiado.sigla_exibicao || colegiado.sigla)}
      </span>
      <span className={`badge ${colegiado.ativo === "Sim" ? "success" : "danger"}`}>
        {colegiado.tipo || "Nao informado"}
      </span>
    </div>

    <h3>{colegiado.nome || formatColegiadoDisplayName(colegiado.sigla_exibicao || colegiado.sigla)}</h3>
    <p className="muted">
      {colegiado.ultima_atualizacao
        ? `Atualizado em ${formatDateTime(colegiado.ultima_atualizacao)}`
        : "Sem base sincronizada"}
    </p>

    <div className="entity-card__stats">
      <div>
        <strong>{colegiado.total_membros}</strong>
        <span>Integrantes</span>
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
