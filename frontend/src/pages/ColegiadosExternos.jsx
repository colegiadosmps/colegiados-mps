import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HiOutlineBriefcase, HiOutlineBuildingLibrary } from "react-icons/hi2";
import ClearFiltersButton from "../components/ClearFiltersButton";
import FilterDropdown from "../components/FilterDropdown";
import MetricCard from "../components/MetricCard";
import GraficoBarras from "../components/GraficoBarras";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import PowerBiTable from "../components/PowerBiTable";
import { api } from "../services/api";
import { formatColegiadoDisplayName } from "../services/formatters";
import { ALL_VALUE, buildOptions, normalizeFilterValue } from "../services/filterUtils";

const columns = [
  {
    key: "nome",
    label: "Colegiado",
    width: "240px",
    render: (row) => formatColegiadoDisplayName(row.sigla_exibicao || row.nome || "-"),
  },
  { key: "orgao", label: "Orgao", width: "200px", render: (row) => row.orgao || row.sigla || "-" },
  {
    key: "dispositivo_legal",
    label: "Dispositivo Legal",
    width: "220px",
    className: "cell-wrap",
  },
  {
    key: "descricao",
    label: "Natureza, Competencia ou Finalidade",
    width: "340px",
    className: "cell-wrap",
    render: (row) => row.competencia || row.descricao || "-",
  },
];

const ColegiadosExternos = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [colegiados, setColegiados] = useState(null);
  const [filters, setFilters] = useState({
    colegiado: normalizeFilterValue(searchParams.get("colegiado")),
    orgao: normalizeFilterValue(searchParams.get("orgao")),
  });

  useEffect(() => {
    api.get("/api/colegiados?categoria=Externo").then(setColegiados);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.colegiado !== ALL_VALUE) {
      params.set("colegiado", filters.colegiado);
    }
    if (filters.orgao !== ALL_VALUE) {
      params.set("orgao", filters.orgao);
    }
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const filteredColegiados = useMemo(() => {
    if (!colegiados) {
      return [];
    }

    return colegiados.filter((item) => {
      const orgao = item.orgao || item.sigla || "Nao informado";
      const matchesColegiado =
        filters.colegiado === ALL_VALUE ||
        (item.sigla_exibicao || item.nome) === filters.colegiado ||
        formatColegiadoDisplayName(item.sigla_exibicao || item.nome) === filters.colegiado;
      const matchesOrgao = filters.orgao === ALL_VALUE || orgao === filters.orgao;
      return matchesColegiado && matchesOrgao;
    });
  }, [colegiados, filters]);

  const chartData = useMemo(() => {
    const counts = new Map();
    filteredColegiados.forEach((item) => {
      const label = item.orgao || item.sigla || "Nao informado";
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));
  }, [filteredColegiados]);

  if (!colegiados) {
    return <Loading label="Carregando colegiados externos..." />;
  }

  if (!colegiados.length) {
    return <div className="empty-state">Base de colegiados externos nao encontrada no Google Drive.</div>;
  }

  return (
    <div className="page-content">
      <PageHeader
        filters={
          <>
            <FilterDropdown
              label="Colegiado Externo"
              options={buildOptions(
                colegiados.map((item) =>
                  formatColegiadoDisplayName(item.sigla_exibicao || item.nome),
                ),
              )}
              value={filters.colegiado}
              onChange={(value) => setFilters((current) => ({ ...current, colegiado: value }))}
            />
            <FilterDropdown
              label="Orgao"
              options={buildOptions(colegiados.map((item) => item.orgao || item.sigla))}
              value={filters.orgao}
              onChange={(value) => setFilters((current) => ({ ...current, orgao: value }))}
            />
            <ClearFiltersButton
              onClick={() => setFilters({ colegiado: ALL_VALUE, orgao: ALL_VALUE })}
            />
          </>
        }
        filtersClassName="page-header__filters--inline"
        icon={HiOutlineBriefcase}
        subtitle="Consulte os colegiados externos aos quais o MPS esta vinculado."
        title="Colegiados Externos"
      />

      <section className="content-card externos-summary">
        <MetricCard
          caption="Colegiados externos"
          icon={HiOutlineBuildingLibrary}
          label="Colegiados externos"
          tone="blue"
          value={filteredColegiados.length}
        />
        <GraficoBarras
          color="#2b74ff"
          data={chartData}
          title="Colegiados externos por orgao"
        />
      </section>

      <section className="content-card">
        <PowerBiTable
          columns={columns}
          emptyMessage="Nenhum colegiado externo encontrado para os filtros selecionados."
          rows={filteredColegiados}
          sortable={false}
        />
      </section>
    </div>
  );
};

export default ColegiadosExternos;
