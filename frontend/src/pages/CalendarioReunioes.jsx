import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HiOutlineCalendarDays } from "react-icons/hi2";
import ClearFiltersButton from "../components/ClearFiltersButton";
import FilterDropdown from "../components/FilterDropdown";
import GraficoLinha from "../components/GraficoLinha";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import TabelaReunioes from "../components/TabelaReunioes";
import { api } from "../services/api";
import { ALL_VALUE, buildOptions, normalizeFilterValue } from "../services/filterUtils";
import { formatMonthYear } from "../services/formatters";

const aggregateByMonth = (rows) => {
  const counts = new Map();
  rows.forEach((row) => {
    const label = row.data_reuniao ? formatMonthYear(row.data_reuniao) : "Sem data";
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => {
      if (left.label === "Sem data") {
        return 1;
      }
      if (right.label === "Sem data") {
        return -1;
      }
      const [leftMonth, leftYear] = left.label.split("/");
      const [rightMonth, rightYear] = right.label.split("/");
      return `${leftYear}${leftMonth}`.localeCompare(`${rightYear}${rightMonth}`);
    });
};

const CalendarioReunioes = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reunioes, setReunioes] = useState([]);
  const [colegiados, setColegiados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: normalizeFilterValue(searchParams.get("status")),
    tipo: normalizeFilterValue(searchParams.get("tipo")),
    colegiado: normalizeFilterValue(searchParams.get("colegiado")),
  });

  useEffect(() => {
    Promise.all([api.get("/api/reunioes"), api.get("/api/colegiados")])
      .then(([reunioesResult, colegiadosResult]) => {
        setReunioes(reunioesResult);
        setColegiados(colegiadosResult);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.status !== ALL_VALUE) {
      params.set("status", filters.status);
    }
    if (filters.tipo !== ALL_VALUE) {
      params.set("tipo", filters.tipo);
    }
    if (filters.colegiado !== ALL_VALUE) {
      params.set("colegiado", filters.colegiado);
    }
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const filteredReunioes = useMemo(() => {
    const tipoMap = new Map(colegiados.map((item) => [item.sigla, item.tipo]));
    return reunioes.filter((item) => {
      const matchesStatus =
        filters.status === ALL_VALUE || item.status_reuniao === filters.status;
      const matchesSigla =
        filters.colegiado === ALL_VALUE || item.sigla_colegiado === filters.colegiado;
      const matchesTipo =
        filters.tipo === ALL_VALUE || tipoMap.get(item.sigla_colegiado) === filters.tipo;
      return matchesStatus && matchesSigla && matchesTipo;
    });
  }, [colegiados, filters, reunioes]);

  if (loading) {
    return <Loading label="Carregando calendario de reunioes..." />;
  }

  return (
    <div className="page-content">
      <PageHeader
        filters={
          <>
            <FilterDropdown
              label="Status"
              options={buildOptions(reunioes.map((item) => item.status_reuniao))}
              value={filters.status}
              onChange={(value) => setFilters((current) => ({ ...current, status: value }))}
            />
            <FilterDropdown
              label="Tipo de Colegiado"
              options={buildOptions(colegiados.map((item) => item.tipo))}
              value={filters.tipo}
              onChange={(value) => setFilters((current) => ({ ...current, tipo: value }))}
            />
            <FilterDropdown
              label="Sigla Colegiado"
              options={buildOptions(colegiados.map((item) => item.sigla))}
              value={filters.colegiado}
              onChange={(value) => setFilters((current) => ({ ...current, colegiado: value }))}
            />
            <ClearFiltersButton
              onClick={() =>
                setFilters({ status: ALL_VALUE, tipo: ALL_VALUE, colegiado: ALL_VALUE })
              }
            />
          </>
        }
        icon={HiOutlineCalendarDays}
        metricLabel="Reunioes filtradas"
        metricValue={filteredReunioes.length}
        subtitle="Quando o filtro muda, quantidade, tabela e grafico mensal mudam juntos."
        title="Calendario de Reunioes"
      />

      <section className="charts-grid single-chart">
        <GraficoLinha data={aggregateByMonth(filteredReunioes)} title="Reunioes por Mes" />
      </section>

      <section className="content-card">
        <TabelaReunioes reunioes={filteredReunioes} />
      </section>
    </div>
  );
};

export default CalendarioReunioes;
