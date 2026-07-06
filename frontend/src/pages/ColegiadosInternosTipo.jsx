import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { HiOutlineClipboardDocumentList, HiOutlineMagnifyingGlass } from "react-icons/hi2";
import ClearFiltersButton from "../components/ClearFiltersButton";
import FilterBox from "../components/FilterBox";
import FilterDropdown from "../components/FilterDropdown";
import Loading from "../components/Loading";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import { api } from "../services/api";
import {
  formatBooleanStatus,
  formatColegiadoDisplayName,
} from "../services/formatters";
import { ALL_VALUE, buildOptions, normalizeFilterValue } from "../services/filterUtils";

const normalizeType = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const slugToTypeMap = {
  camara: "camara",
  comite: "comite",
  conselho: "conselho",
  "grupo-de-trabalho": "grupo de trabalho",
  subcomite: "subcomite",
};
const allowedTypes = new Set(Object.values(slugToTypeMap));

const singularTitles = {
  camara: { title: "Camaras", singular: "camara" },
  comite: { title: "Comites", singular: "comite" },
  conselho: { title: "Conselhos", singular: "conselho" },
  "grupo de trabalho": {
    title: "Grupos de Trabalho",
    singular: "grupo de trabalho",
  },
  subcomite: { title: "Subcomites", singular: "subcomite" },
};

const resolveTypeFromSlug = (slug) =>
  slugToTypeMap[String(slug || "").toLowerCase()] || String(slug || "").replace(/-/g, " ");

const ColegiadosInternosTipo = () => {
  const navigate = useNavigate();
  const { tipoSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [colegiados, setColegiados] = useState(null);
  const pageType = resolveTypeFromSlug(tipoSlug);
  const [filters, setFilters] = useState({
    busca: searchParams.get("busca") || "",
    sigla: normalizeFilterValue(searchParams.get("sigla")),
  });

  useEffect(() => {
    api.get("/api/colegiados?categoria=Interno").then(setColegiados);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.busca.trim()) {
      params.set("busca", filters.busca.trim());
    }
    if (filters.sigla !== ALL_VALUE) {
      params.set("sigla", filters.sigla);
    }
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const typedColegiados = useMemo(() => {
    if (!colegiados) {
      return [];
    }

    if (!allowedTypes.has(pageType)) {
      return [];
    }

    return colegiados.filter((item) => normalizeType(item.tipo) === pageType);
  }, [colegiados, pageType]);

  const filteredColegiados = useMemo(() => {
    const search = filters.busca.trim().toLowerCase();

    return typedColegiados.filter((item) => {
      const displayName = formatColegiadoDisplayName(item.sigla_exibicao || item.sigla);
      const searchableValues = [
        item.sigla,
        item.sigla_exibicao,
        item.nome,
        displayName,
      ]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      const matchesSearch =
        !search || searchableValues.some((value) => value.includes(search));
      const matchesSigla =
        filters.sigla === ALL_VALUE ||
        item.sigla === filters.sigla ||
        item.sigla_exibicao === filters.sigla ||
        displayName === filters.sigla;

      return matchesSearch && matchesSigla;
    });
  }, [filters, typedColegiados]);

  const pageMeta = singularTitles[pageType] || {
    title: "Colegiados Internos",
    singular: "colegiado interno",
  };

  if (!colegiados) {
    return <Loading label="Carregando colegiados internos..." />;
  }

  if (!typedColegiados.length) {
    return <div className="empty-state">Nenhum colegiado encontrado para este tipo.</div>;
  }

  return (
    <div className="page-content">
      <PageHeader
        filters={
          <>
            <FilterBox label="Pesquisa">
              <input
                onChange={(event) =>
                  setFilters((current) => ({ ...current, busca: event.target.value }))
                }
                placeholder="Pesquisar por sigla, nome, cidade ou UF"
                value={filters.busca}
              />
            </FilterBox>
            <FilterDropdown
              label="Sigla Colegiado"
              options={buildOptions(
                typedColegiados.map((item) =>
                  formatColegiadoDisplayName(item.sigla_exibicao || item.sigla),
                ),
              )}
              value={filters.sigla}
              onChange={(value) => setFilters((current) => ({ ...current, sigla: value }))}
            />
            <ClearFiltersButton onClick={() => setFilters({ busca: "", sigla: ALL_VALUE })} />
          </>
        }
        filtersClassName="page-header__filters--inline"
        icon={HiOutlineClipboardDocumentList}
        subtitle={`Lista de colegiados classificados como ${pageMeta.singular}.`}
        title={pageMeta.title}
      />

      <section className="content-card">
        <MetricCard
          caption="Total filtrado"
          icon={HiOutlineMagnifyingGlass}
          label="Colegiados"
          tone="blue"
          value={filteredColegiados.length}
        />
      </section>

      <section className="colegiado-grid">
        {filteredColegiados.map((item) => (
          <button
            className="colegiado-tile"
            key={item.sigla}
            onClick={() => navigate(`/colegiados/${item.chave_pasta || item.sigla}`)}
            type="button"
          >
            <div className="colegiado-tile__header">
              <span className="pill">
                {formatColegiadoDisplayName(item.sigla_exibicao || item.sigla)}
              </span>
              <span className={`badge ${item.ativo === "Sim" ? "success" : "danger"}`}>
                {formatBooleanStatus(item.ativo)}
              </span>
            </div>
            <h4>{item.nome || formatColegiadoDisplayName(item.sigla_exibicao || item.sigla)}</h4>
            <div className="colegiado-tile__stats">
              <span>{item.total_membros || 0} membros</span>
              <span>{item.total_reunioes || 0} reunioes</span>
            </div>
          </button>
        ))}
        {!filteredColegiados.length ? (
          <div className="empty-state">Nenhum colegiado encontrado para os filtros selecionados.</div>
        ) : null}
      </section>
    </div>
  );
};

export default ColegiadosInternosTipo;
