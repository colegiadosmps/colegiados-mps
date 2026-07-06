import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { formatBooleanStatus, formatColegiadoDisplayName } from "../services/formatters";

const EstadoCard = ({ estado, parentSigla }) => {
  const navigate = useNavigate();

  return (
    <article className="instancia-card instancia-card--estado">
      <div className="instancia-card__content">
        <span className="pill pill--soft">{estado.uf}</span>
        <h4>{estado.estado}</h4>
        <p>{estado.total} inst{estado.total === 1 ? "ancia colegiada" : "ancias colegiadas"}</p>
      </div>
      <button
        className="text-button instancia-card__action"
        onClick={() => navigate(`/colegiados/${parentSigla}/estado/${estado.uf}`)}
        type="button"
      >
        Acessar
      </button>
    </article>
  );
};

const InstanciaDiretaCard = ({ instancia }) => {
  const navigate = useNavigate();
  const displayName = formatColegiadoDisplayName(instancia.sigla_exibicao || instancia.sigla);
  const title =
    instancia.nome &&
    instancia.nome !== instancia.sigla &&
    instancia.nome !== instancia.sigla_exibicao
      ? instancia.nome
      : displayName;

  return (
    <article className="instancia-card">
      <div className="instancia-card__content">
        <span className="pill">{displayName}</span>
        <h4>{title}</h4>
        <div className="instancia-card__meta">
          <span>{formatBooleanStatus(instancia.ativo)}</span>
          <span>{instancia.membros_count || 0} membros</span>
          <span>{instancia.reunioes_count || 0} reunioes</span>
        </div>
      </div>
      <button
        className="text-button instancia-card__action"
        onClick={() => navigate(`/colegiados/${instancia.chave_pasta || instancia.sigla}`)}
        type="button"
      >
        Acessar
      </button>
    </article>
  );
};

const InstanciasColegiadasSection = ({ sigla }) => {
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    api
      .get(`/api/colegiados/${sigla}/instancias`)
      .then(setPayload)
      .catch(() => setPayload({ total: 0, agrupamento: null, instancias: [] }));
  }, [sigla]);

  if (!payload || !payload.total) {
    return null;
  }

  const estados = [...(payload.estados || [])].sort((left, right) =>
    String(left.estado || left.uf).localeCompare(String(right.estado || right.uf), "pt-BR"),
  );

  return (
    <section className="detail-panel instancias-section">
      <div className="section-heading">
        <div>
          <h3>Instancias Colegiadas</h3>
          <p>
            {payload.agrupamento === "estado"
              ? "Conselhos de Previdencia Social organizados por Estado."
              : "Instancias colegiadas vinculadas a esta estrutura."}
          </p>
        </div>
      </div>

      {payload.agrupamento === "estado" ? (
        <div className="instancias-grid instancias-grid--states">
          {estados.map((estado) => (
            <EstadoCard
              estado={estado}
              key={estado.uf || estado.estado}
              parentSigla={payload.pai}
            />
          ))}
        </div>
      ) : (
        <div className="instancias-grid">
          {payload.instancias.map((instancia) => (
            <InstanciaDiretaCard instancia={instancia} key={instancia.sigla} />
          ))}
        </div>
      )}
    </section>
  );
};

export default InstanciasColegiadasSection;
