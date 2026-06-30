import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  HiOutlineHome,
} from "react-icons/hi2";
import CardColegiado from "../components/CardColegiado";
import CardResumo from "../components/CardResumo";
import ClearFiltersButton from "../components/ClearFiltersButton";
import FilterDropdown from "../components/FilterDropdown";
import GraficoBarras from "../components/GraficoBarras";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import { api } from "../services/api";
import {
  ALL_VALUE,
  buildOptions,
  normalizeFilterValue,
} from "../services/filterUtils";

const aggregateBy = (rows, key, valueFilter) => {
  const counts = new Map();

  rows.forEach((row) => {
    if (valueFilter && !valueFilter(row)) {
      return;
    }

    const label = row[key] || "Nao informado";
    counts.set(label, (counts.get(label) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));
};

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [resumo, setResumo] = useState(null);
  const [membros, setMembros] = useState([]);
  const [reunioes, setReunioes] = useState([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    tipo: normalizeFilterValue(searchParams.get("tipo")),
    colegiado: normalizeFilterValue(searchParams.get("colegiado")),
    status: normalizeFilterValue(searchParams.get("status")),
  });

  useEffect(() => {
    Promise.all([
      api.get("/api/dashboard"),
      api.get("/api/membros"),
      api.get("/api/reunioes"),
    ])
      .then(([resumoResult, membrosResult, reunioesResult]) => {
        setResumo(resumoResult);
        setMembros(membrosResult);
        setReunioes(reunioesResult);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.tipo !== ALL_VALUE) {
      params.set("tipo", filters.tipo);
    }
    if (filters.colegiado !== ALL_VALUE) {
      params.set("colegiado", filters.colegiado);
    }
    if (filters.status !== ALL_VALUE) {
      params.set("status", filters.status);
    }
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const filtered = useMemo(() => {
    if (!resumo) {
      return null;
    }

    const filteredColegiados = resumo.colegiados_com_resumo.filter((colegiado) => {
      const matchesTipo = filters.tipo === ALL_VALUE || colegiado.tipo === filters.tipo;
      const matchesSigla = filters.colegiado === ALL_VALUE || colegiado.sigla === filters.colegiado;
      const matchesStatus = filters.status === ALL_VALUE || colegiado.ativo === filters.status;
      return matchesTipo && matchesSigla && matchesStatus;
    });

    const allowedSiglas = new Set(filteredColegiados.map((item) => item.sigla));
    const filteredMembros = membros.filter((item) => {
      const allowed = allowedSiglas.has(item.sigla_colegiado);
      const statusMatch = filters.status === ALL_VALUE || item.ativo === filters.status;
      return allowed && statusMatch;
    });
    const filteredReunioes = reunioes.filter((item) => allowedSiglas.has(item.sigla_colegiado));

    return {
      colegiados: filteredColegiados,
      membros: filteredMembros,
      reunioes: filteredReunioes,
      totalColegiados: filteredColegiados.length,
      totalInternos: filteredColegiados.filter((item) => item.tipo === "Interno").length,
      totalExternos: filteredColegiados.filter((item) => item.tipo === "Externo").length,
      totalMembros: filteredMembros.length,
      totalAtivos: filteredMembros.filter((item) => item.ativo === "Sim").length,
      totalReunioes: filteredReunioes.length,
      totalPublicacoes: filteredColegiados.filter((item) => item.ultima_atualizacao).length,
      charts: {
        colegiadosPorTipo: aggregateBy(filteredColegiados, "tipo"),
        membrosPorColegiado: aggregateBy(filteredMembros, "sigla_colegiado"),
        ativosInativos: aggregateBy(filteredMembros, "ativo"),
        reunioesPorStatus: aggregateBy(filteredReunioes, "status_reuniao"),
      },
    };
  }, [filters, membros, reunioes, resumo]);

  if (error) {
    return <div className="empty-state">{error}</div>;
  }

  if (!resumo || !filtered) {
    return <Loading label="Montando o painel institucional..." />;
  }

  const tipoOptions = buildOptions(resumo.colegiados_com_resumo.map((item) => item.tipo));
  const colegiadoOptions = buildOptions(resumo.colegiados_com_resumo.map((item) => item.sigla));
  const statusOptions = buildOptions(["Sim", "Nao"], "Todos");

  return (
    <div className="page-content">
      <PageHeader
        filters={
          <>
            <FilterDropdown
              label="Tipo de Colegiado"
              options={tipoOptions}
              value={filters.tipo}
              onChange={(value) => setFilters((current) => ({ ...current, tipo: value }))}
            />
            <FilterDropdown
              label="Sigla Colegiado"
              options={colegiadoOptions}
              value={filters.colegiado}
              onChange={(value) => setFilters((current) => ({ ...current, colegiado: value }))}
            />
            <FilterDropdown
              label="Status"
              options={statusOptions}
              value={filters.status}
              onChange={(value) => setFilters((current) => ({ ...current, status: value }))}
            />
            <ClearFiltersButton
              onClick={() =>
                setFilters({ tipo: ALL_VALUE, colegiado: ALL_VALUE, status: ALL_VALUE })
              }
            />
          </>
        }
        icon={HiOutlineHome}
        subtitle="Visao consolidada dos colegiados, integrantes, reunioes e publicacoes da base institucional."
        title="Dashboard"
      />

      <section className="metric-grid">
        <CardResumo titulo="Total de Colegiados" valor={filtered.totalColegiados} />
        <CardResumo titulo="Colegiados Internos" valor={filtered.totalInternos} />
        <CardResumo titulo="Colegiados Externos" valor={filtered.totalExternos} />
        <CardResumo titulo="Integrantes" valor={filtered.totalMembros} />
        <CardResumo titulo="Ativos" valor={filtered.totalAtivos} />
        <CardResumo titulo="Reunioes" valor={filtered.totalReunioes} />
        <CardResumo titulo="Publicacoes" valor={filtered.totalPublicacoes} />
      </section>

      <section className="charts-grid">
        <GraficoBarras data={filtered.charts.colegiadosPorTipo} title="Colegiados Internos x Externos" />
        <GraficoBarras data={filtered.charts.membrosPorColegiado} title="Membros por Colegiado" color="#12689a" />
        <GraficoBarras data={filtered.charts.ativosInativos} title="Membros Ativos x Inativos" color="#2f7d4f" />
        <GraficoBarras data={filtered.charts.reunioesPorStatus} title="Reunioes por Status" color="#0b5f8f" />
      </section>

      <section>
        <div className="section-heading">
          <h2>Colegiados em destaque</h2>
          <p>Atalhos de consulta com detalhes, integrantes e publicacoes por colegiado.</p>
        </div>
        <div className="entity-grid">
          {filtered.colegiados.map((colegiado) => (
            <CardColegiado key={colegiado.sigla} colegiado={colegiado} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
