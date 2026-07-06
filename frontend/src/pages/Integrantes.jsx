import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HiOutlineUsers } from "react-icons/hi2";
import ClearFiltersButton from "../components/ClearFiltersButton";
import FilterBox from "../components/FilterBox";
import FilterDropdown from "../components/FilterDropdown";
import GraficoBarras from "../components/GraficoBarras";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import TabelaMembros from "../components/TabelaMembros";
import { api } from "../services/api";
import { formatColegiadoDisplayName } from "../services/formatters";
import { ALL_VALUE, buildOptions, normalizeFilterValue } from "../services/filterUtils";

const aggregateBy = (rows, key) => {
  const counts = new Map();
  rows.forEach((row) => {
    const label = row[key] || "Nao informado";
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));
};

const Integrantes = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [membros, setMembros] = useState([]);
  const [colegiados, setColegiados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    colegiado: normalizeFilterValue(searchParams.get("colegiado")),
    nome: searchParams.get("nome") || "",
    tipo_vinculo: normalizeFilterValue(searchParams.get("tipo_vinculo")),
    papel: normalizeFilterValue(searchParams.get("papel")),
  });

  useEffect(() => {
    Promise.all([api.get("/api/membros"), api.get("/api/colegiados")])
      .then(([membrosResult, colegiadosResult]) => {
        setMembros(membrosResult);
        setColegiados(colegiadosResult);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.colegiado !== ALL_VALUE) {
      params.set("colegiado", filters.colegiado);
    }
    if (filters.nome) {
      params.set("nome", filters.nome);
    }
    if (filters.tipo_vinculo !== ALL_VALUE) {
      params.set("tipo_vinculo", filters.tipo_vinculo);
    }
    if (filters.papel !== ALL_VALUE) {
      params.set("papel", filters.papel);
    }
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const filteredMembros = useMemo(() => {
    const searchTerm = filters.nome.toLowerCase();
    return membros.filter((membro) => {
      const matchesColegiado =
        filters.colegiado === ALL_VALUE ||
        membro.sigla_colegiado === filters.colegiado ||
        formatColegiadoDisplayName(membro.sigla_colegiado) === filters.colegiado;
      const matchesNome =
        !searchTerm || membro.nome_membro?.toLowerCase().includes(searchTerm);
      const matchesTipo =
        filters.tipo_vinculo === ALL_VALUE || membro.tipo_vinculo === filters.tipo_vinculo;
      const matchesPapel = filters.papel === ALL_VALUE || membro.papel === filters.papel;
      return matchesColegiado && matchesNome && matchesTipo && matchesPapel;
    });
  }, [filters, membros]);

  if (loading) {
    return <Loading label="Carregando integrantes..." />;
  }

  return (
    <div className="page-content">
      <PageHeader
        filters={
          <>
            <FilterDropdown
              label="Colegiado"
              options={buildOptions(
                colegiados.map((item) =>
                  formatColegiadoDisplayName(item.sigla_exibicao || item.sigla),
                ),
              )}
              value={filters.colegiado}
              onChange={(value) => setFilters((current) => ({ ...current, colegiado: value }))}
            />
            <FilterBox label="Nome">
              <input
                value={filters.nome}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, nome: event.target.value }))
                }
                placeholder="Buscar por nome"
              />
            </FilterBox>
            <FilterDropdown
              label="Tipo de Vinculo"
              options={buildOptions(membros.map((item) => item.tipo_vinculo))}
              value={filters.tipo_vinculo}
              onChange={(value) =>
                setFilters((current) => ({ ...current, tipo_vinculo: value }))
              }
            />
            <FilterDropdown
              label="Papel"
              options={buildOptions(membros.map((item) => item.papel))}
              value={filters.papel}
              onChange={(value) => setFilters((current) => ({ ...current, papel: value }))}
            />
            <ClearFiltersButton
              onClick={() =>
                setFilters({
                  colegiado: ALL_VALUE,
                  nome: "",
                  tipo_vinculo: ALL_VALUE,
                  papel: ALL_VALUE,
                })
              }
            />
          </>
        }
        filtersClassName="page-header__filters--inline"
        icon={HiOutlineUsers}
        metricCaption="Total de integrantes ativos"
        metricIcon={HiOutlineUsers}
        metricLabel="Integrantes"
        metricTone="blue"
        metricValue={filteredMembros.length}
        subtitle="Consulte e analise os integrantes vinculados aos colegiados."
        title="Integrantes"
      />

      <section className="content-card">
        <TabelaMembros membros={filteredMembros} />
      </section>

      <section className="charts-grid">
        <GraficoBarras
          data={aggregateBy(filteredMembros, "tipo_vinculo")}
          title="Tipo de Vinculo"
          color="#37b45b"
        />
        <GraficoBarras
          data={aggregateBy(filteredMembros, "papel")}
          title="Papel"
          color="#7a45e6"
        />
      </section>
    </div>
  );
};

export default Integrantes;
