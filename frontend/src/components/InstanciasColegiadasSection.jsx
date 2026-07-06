import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ClearFiltersButton from "./ClearFiltersButton";
import FilterBox from "./FilterBox";
import FilterDropdown from "./FilterDropdown";
import { api } from "../services/api";
import { ALL_VALUE, buildOptions } from "../services/filterUtils";
import {
  extractCpsLocation,
  formatBooleanStatus,
  formatColegiadoDisplayName,
  getRegionOrder,
  getUfInfo,
} from "../services/formatters";

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
  const [municipioFilter, setMunicipioFilter] = useState("");
  const [ufFilter, setUfFilter] = useState(ALL_VALUE);
  const normalizedParentSigla = String(sigla || "").trim().toUpperCase();

  useEffect(() => {
    api
      .get(`/api/colegiados/${sigla}/instancias`)
      .then(setPayload)
      .catch(() => setPayload({ total: 0, agrupamento: null, instancias: [] }));
  }, [sigla]);

  const cnpsDerivedEstados = useMemo(() => {
    if (normalizedParentSigla !== "CNPS") {
      return [];
    }

    const map = new Map();

    (payload?.instancias || []).forEach((instancia) => {
      const location =
        extractCpsLocation(instancia.sigla_exibicao || instancia.sigla || instancia.nome) || {};
      const ufInfo = getUfInfo(location.uf || instancia.uf);
      const uf = ufInfo.uf;

      if (!uf) {
        return;
      }

      const current = map.get(uf) || {
        uf,
        estado: ufInfo.estado,
        regiao: ufInfo.regiao,
        total: 0,
        municipios: [],
      };

      current.total += 1;
      if (location.municipio) {
        current.municipios.push(location.municipio);
      }
      map.set(uf, current);
    });

    return Array.from(map.values()).sort((left, right) =>
      String(left.estado || left.uf).localeCompare(String(right.estado || right.uf), "pt-BR"),
    );
  }, [normalizedParentSigla, payload?.instancias]);

  const shouldRenderStateGroups =
    payload?.agrupamento === "estado" || normalizedParentSigla === "CNPS";
  const estados = useMemo(
    () =>
      [...(shouldRenderStateGroups
        ? payload?.agrupamento === "estado"
          ? payload?.estados || []
          : cnpsDerivedEstados
        : [])]
        .map((estado) => {
          const ufInfo = getUfInfo(estado.uf);
          return {
            ...estado,
            estado: ufInfo.estado || estado.estado,
            uf: ufInfo.uf || estado.uf,
            regiao: ufInfo.regiao || "Outras",
            municipios: Array.from(
              new Set(
                [
                  ...(estado.municipios || []),
                  ...((estado.instancias || []).map((instancia) => {
                    const location =
                      extractCpsLocation(
                        instancia.sigla_exibicao || instancia.sigla || instancia.nome,
                      ) || {};
                    return location.municipio || instancia.municipio;
                  }) || []),
                ].filter(Boolean),
              ),
            ),
          };
        })
        .sort((left, right) =>
          String(left.estado || left.uf).localeCompare(String(right.estado || right.uf), "pt-BR"),
        ),
    [cnpsDerivedEstados, payload?.agrupamento, payload?.estados, shouldRenderStateGroups],
  );
  const filteredEstados = useMemo(
    () =>
      estados.filter((estado) => {
        const search = municipioFilter.trim().toLowerCase();
        const matchesMunicipio =
          !search ||
          (estado.municipios || []).some((municipio) =>
            String(municipio).toLowerCase().includes(search),
          );
        const matchesUf = ufFilter === ALL_VALUE || estado.uf === ufFilter;
        return matchesMunicipio && matchesUf;
      }),
    [estados, municipioFilter, ufFilter],
  );
  const groupedEstados = useMemo(() => {
    const order = getRegionOrder();
    return order
      .map((regiao) => ({
        regiao,
        estados: filteredEstados.filter((estado) => estado.regiao === regiao),
      }))
      .filter((group) => group.estados.length);
  }, [filteredEstados]);

  if (!payload || !payload.total) {
    return null;
  }

  return (
    <section className="detail-panel instancias-section">
      <div className="section-heading">
        <div>
          <h3>Instancias Colegiadas</h3>
          <p>
            {shouldRenderStateGroups
              ? "Conselhos de Previdencia Social organizados por Estado."
              : "Instancias colegiadas vinculadas a esta estrutura."}
          </p>
        </div>
      </div>

      {shouldRenderStateGroups ? (
        <>
          <div className="instancias-filters">
            <FilterBox label="Municipio">
              <input
                onChange={(event) => setMunicipioFilter(event.target.value)}
                placeholder="Buscar municipio..."
                value={municipioFilter}
              />
            </FilterBox>
            <FilterDropdown
              label="UF"
              onChange={setUfFilter}
              options={buildOptions(estados.map((estado) => estado.uf))}
              value={ufFilter}
            />
            <ClearFiltersButton
              onClick={() => {
                setMunicipioFilter("");
                setUfFilter(ALL_VALUE);
              }}
            />
          </div>

          {groupedEstados.length ? (
            <div className="instancias-region-list">
              {groupedEstados.map((group) => (
                <section className="instancias-region-block" key={group.regiao}>
                  <h4 className="instancias-region-title">{group.regiao}</h4>
                  <div className="instancias-grid instancias-grid--states">
                    {group.estados.map((estado) => (
                      <EstadoCard
                        estado={estado}
                        key={estado.uf || estado.estado}
                        parentSigla={payload.pai}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              Nenhuma instancia colegiada encontrada para os filtros selecionados.
            </div>
          )}
        </>
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
