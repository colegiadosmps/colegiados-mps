import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HiOutlineChartBarSquare } from "react-icons/hi2";
import ClearFiltersButton from "../components/ClearFiltersButton";
import FilterDropdown from "../components/FilterDropdown";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import PowerBiTable from "../components/PowerBiTable";
import { api } from "../services/api";
import { ALL_VALUE, buildOptions, normalizeFilterValue } from "../services/filterUtils";

const columns = [
  {
    key: "nome_pasta",
    label: "Titulo",
    width: "240px",
  },
  {
    key: "ementa",
    label: "Ementa",
    width: "320px",
    className: "cell-wrap",
    render: (row) =>
      `Pasta institucional vinculada ao colegiado ${row.sigla_colegiado}.`,
  },
  {
    key: "link_pasta",
    label: "URL_OU_CAMINHO",
    width: "380px",
    className: "cell-url cell-wrap",
    render: (row) => (
      <a href={row.link_pasta} rel="noreferrer" target="_blank">
        {row.link_pasta}
      </a>
    ),
  },
];

const Publicacoes = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [publicacoes, setPublicacoes] = useState(null);
  const [colegiados, setColegiados] = useState([]);
  const [filters, setFilters] = useState({
    tipo: normalizeFilterValue(searchParams.get("tipo")),
    colegiado: normalizeFilterValue(searchParams.get("colegiado")),
    reuniao: normalizeFilterValue(searchParams.get("reuniao")),
  });

  useEffect(() => {
    Promise.all([api.get("/api/publicacoes"), api.get("/api/colegiados")]).then(
      ([publicacoesResult, colegiadosResult]) => {
        setPublicacoes(publicacoesResult);
        setColegiados(colegiadosResult);
      },
    );
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.tipo !== ALL_VALUE) {
      params.set("tipo", filters.tipo);
    }
    if (filters.colegiado !== ALL_VALUE) {
      params.set("colegiado", filters.colegiado);
    }
    if (filters.reuniao !== ALL_VALUE) {
      params.set("reuniao", filters.reuniao);
    }
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const filteredPublicacoes = useMemo(() => {
    if (!publicacoes) {
      return [];
    }

    const tipoMap = new Map(colegiados.map((item) => [item.sigla, item.tipo]));
    return publicacoes.filter((item) => {
      const matchesTipo =
        filters.tipo === ALL_VALUE || tipoMap.get(item.sigla_colegiado) === filters.tipo;
      const matchesSigla =
        filters.colegiado === ALL_VALUE || item.sigla_colegiado === filters.colegiado;
      const matchesReuniao =
        filters.reuniao === ALL_VALUE || item.nome_pasta === filters.reuniao;
      return matchesTipo && matchesSigla && matchesReuniao;
    });
  }, [colegiados, filters, publicacoes]);

  if (!publicacoes) {
    return <Loading label="Carregando publicacoes..." />;
  }

  return (
    <div className="page-content">
      <PageHeader
        filters={
          <>
            <FilterDropdown
              label="Tipo de Colegiado"
              options={buildOptions(colegiados.map((item) => item.tipo))}
              value={filters.tipo}
              onChange={(value) => setFilters((current) => ({ ...current, tipo: value }))}
            />
            <FilterDropdown
              label="Sigla Colegiado"
              options={buildOptions(publicacoes.map((item) => item.sigla_colegiado))}
              value={filters.colegiado}
              onChange={(value) => setFilters((current) => ({ ...current, colegiado: value }))}
            />
            <FilterDropdown
              label="Reuniao"
              options={buildOptions(publicacoes.map((item) => item.nome_pasta))}
              value={filters.reuniao}
              onChange={(value) => setFilters((current) => ({ ...current, reuniao: value }))}
            />
            <ClearFiltersButton
              onClick={() =>
                setFilters({ tipo: ALL_VALUE, colegiado: ALL_VALUE, reuniao: ALL_VALUE })
              }
            />
          </>
        }
        icon={HiOutlineChartBarSquare}
        metricLabel="Publicacoes filtradas"
        metricValue={filteredPublicacoes.length}
        subtitle="Interface preparada para exibir publicacoes em tabela, mesmo partindo hoje das pastas do Google Drive."
        title="Publicacoes"
      />

      <section className="content-card">
        <PowerBiTable
          columns={columns}
          emptyMessage="Nenhuma publicacao encontrada para os filtros selecionados."
          rows={filteredPublicacoes}
        />
      </section>
    </div>
  );
};

export default Publicacoes;
