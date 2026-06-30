import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import ClearFiltersButton from "../components/ClearFiltersButton";
import FilterDropdown from "../components/FilterDropdown";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import PowerBiTable from "../components/PowerBiTable";
import { api } from "../services/api";
import { ALL_VALUE, buildOptions, normalizeFilterValue } from "../services/filterUtils";

const columns = [
  { key: "sigla", label: "Colegiado Pai", width: "140px" },
  { key: "tipo", label: "Tipo", width: "120px" },
  {
    key: "competencia",
    label: "Competencias",
    width: "320px",
    className: "cell-wrap",
    render: (row) => row.competencia || row.descricao || "-",
  },
  { key: "quorum", label: "Quorum", width: "110px", render: () => "-" },
  { key: "ato", label: "Ato de Criacao", width: "150px", render: () => "-" },
  { key: "total_reunioes", label: "Reunioes", width: "110px" },
  { key: "total_membros", label: "Membros", width: "110px" },
  {
    key: "consulta",
    label: "Consulta",
    width: "110px",
    render: (row) => (
      <Link className="text-link" to={`/colegiados/${row.sigla}`}>
        Abrir
      </Link>
    ),
  },
];

const ColegiadosInternos = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [colegiados, setColegiados] = useState(null);
  const [filters, setFilters] = useState({
    colegiado: normalizeFilterValue(searchParams.get("colegiado")),
    tipo: normalizeFilterValue(searchParams.get("tipo")),
    sigla: normalizeFilterValue(searchParams.get("sigla")),
  });

  useEffect(() => {
    api.get("/api/colegiados?tipo=Interno").then(setColegiados);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.colegiado !== ALL_VALUE) {
      params.set("colegiado", filters.colegiado);
    }
    if (filters.tipo !== ALL_VALUE) {
      params.set("tipo", filters.tipo);
    }
    if (filters.sigla !== ALL_VALUE) {
      params.set("sigla", filters.sigla);
    }
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const filteredColegiados = useMemo(() => {
    if (!colegiados) {
      return [];
    }

    return colegiados.filter((item) => {
      const matchesColegiado =
        filters.colegiado === ALL_VALUE || item.nome === filters.colegiado;
      const matchesTipo = filters.tipo === ALL_VALUE || item.tipo === filters.tipo;
      const matchesSigla = filters.sigla === ALL_VALUE || item.sigla === filters.sigla;
      return matchesColegiado && matchesTipo && matchesSigla;
    });
  }, [colegiados, filters]);

  if (!colegiados) {
    return <Loading label="Carregando colegiados internos..." />;
  }

  return (
    <div className="page-content">
      <PageHeader
        filters={
          <>
            <FilterDropdown
              label="Colegiado"
              options={buildOptions(colegiados.map((item) => item.nome))}
              value={filters.colegiado}
              onChange={(value) => setFilters((current) => ({ ...current, colegiado: value }))}
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
              value={filters.sigla}
              onChange={(value) => setFilters((current) => ({ ...current, sigla: value }))}
            />
            <ClearFiltersButton
              onClick={() =>
                setFilters({ colegiado: ALL_VALUE, tipo: ALL_VALUE, sigla: ALL_VALUE })
              }
            />
          </>
        }
        icon={HiOutlineClipboardDocumentList}
        metricLabel="Colegiados internos"
        metricValue={filteredColegiados.length}
        subtitle="Tabela ampla com colegiado pai, competencias, reunioes e membros."
        title="Colegiados Internos"
      />

      <section className="content-card">
        <div className="section-heading">
          <h3>Consulta principal</h3>
          <p>Quando voce seleciona um colegiado, a consulta detalhada fica disponivel pelo link da ultima coluna.</p>
        </div>
        <PowerBiTable
          columns={columns}
          emptyMessage="Nenhum colegiado interno encontrado para os filtros selecionados."
          rows={filteredColegiados}
        />
      </section>
    </div>
  );
};

export default ColegiadosInternos;
