import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { HiOutlineMap } from "react-icons/hi2";
import ClearFiltersButton from "../components/ClearFiltersButton";
import FilterBox from "../components/FilterBox";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import { api } from "../services/api";
import {
  formatBooleanStatus,
  formatColegiadoDisplayName,
} from "../services/formatters";

const EstadoInstanciasPage = () => {
  const navigate = useNavigate();
  const { sigla, uf } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [payload, setPayload] = useState(null);
  const [municipio, setMunicipio] = useState(searchParams.get("municipio") || "");

  useEffect(() => {
    const params = new URLSearchParams();
    if (municipio.trim()) {
      params.set("municipio", municipio.trim());
    }
    setSearchParams(params, { replace: true });
  }, [municipio, setSearchParams]);

  useEffect(() => {
    const query = municipio.trim()
      ? `?municipio=${encodeURIComponent(municipio.trim())}`
      : "";

    api
      .get(`/api/colegiados/${sigla}/instancias/${uf}${query}`)
      .then(setPayload);
  }, [municipio, sigla, uf]);

  const filtered = useMemo(() => payload?.instancias || [], [payload]);

  if (!payload) {
    return <Loading label="Carregando instancias colegiadas..." />;
  }

  const parentDisplayName = formatColegiadoDisplayName(sigla);

  return (
    <div className="page-content">
      <PageHeader
        icon={HiOutlineMap}
        subtitle={`Instancias colegiadas vinculadas ao ${parentDisplayName} no Estado de ${payload.estado || uf}.`}
        title={payload.estado || uf}
      >
        <div className="hero-inline-metric">
          <span>Total de instancias:</span>
          <strong>{filtered.length}</strong>
        </div>
      </PageHeader>

      <section className="content-card instancia-filter-panel">
        <div className="instancia-filter-panel__grid">
          <FilterBox label="Municipio">
            <input
              onChange={(event) => setMunicipio(event.target.value)}
              placeholder="Buscar municipio..."
              value={municipio}
            />
          </FilterBox>
          <ClearFiltersButton onClick={() => setMunicipio("")} />
        </div>
      </section>

      <section className="instancias-grid">
        {filtered.map((instancia) => (
          <article className="instancia-card" key={instancia.sigla}>
            <div className="instancia-card__content">
              <span className="pill pill--soft">
                {formatColegiadoDisplayName(instancia.sigla_exibicao || instancia.sigla)}
              </span>
              <h4>
                {instancia.nome &&
                instancia.nome !== instancia.sigla &&
                instancia.nome !== instancia.sigla_exibicao
                  ? instancia.nome
                  : formatColegiadoDisplayName(instancia.sigla_exibicao || instancia.sigla)}
              </h4>
              <div className="instancia-card__meta">
                <span>{instancia.municipio || "-"}</span>
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
        ))}
        {!filtered.length ? (
          <div className="empty-state">Nenhuma instancia colegiada encontrada para este Estado.</div>
        ) : null}
      </section>
    </div>
  );
};

export default EstadoInstanciasPage;
