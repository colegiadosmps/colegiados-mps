import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HiOutlineDocumentText } from "react-icons/hi2";
import ClearFiltersButton from "../components/ClearFiltersButton";
import FilterDropdown from "../components/FilterDropdown";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import PowerBiTable from "../components/PowerBiTable";
import { api } from "../services/api";
import { ALL_VALUE, buildOptions, normalizeFilterValue } from "../services/filterUtils";

const infoColumns = [
  { key: "sigla_colegiado", label: "Colegiado", width: "140px" },
  { key: "data_reuniao", label: "Data", width: "110px" },
  { key: "hora", label: "Horario", width: "100px" },
  {
    key: "descricao_pauta",
    label: "Pauta",
    width: "420px",
    className: "cell-wrap",
  },
];

const publicationColumns = [
  {
    key: "titulo",
    label: "Titulo",
    width: "220px",
    render: (row) => row.nome_pasta || row.sigla_colegiado,
  },
  {
    key: "ementa",
    label: "Ementa",
    width: "320px",
    className: "cell-wrap",
    render: () => "Pasta de publicacoes vinculada ao colegiado selecionado.",
  },
  {
    key: "link_pasta",
    label: "URL_OU_CAMINHO",
    width: "360px",
    className: "cell-url cell-wrap",
    render: (row) => (
      <a href={row.link_pasta} rel="noreferrer" target="_blank">
        {row.link_pasta}
      </a>
    ),
  },
];

const HistoricoReunioes = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reunioes, setReunioes] = useState([]);
  const [colegiados, setColegiados] = useState([]);
  const [publicacoes, setPublicacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    tipo: normalizeFilterValue(searchParams.get("tipo")),
    colegiado: normalizeFilterValue(searchParams.get("colegiado")),
    reuniao: normalizeFilterValue(searchParams.get("reuniao")),
  });

  useEffect(() => {
    Promise.all([
      api.get("/api/reunioes"),
      api.get("/api/colegiados"),
      api.get("/api/publicacoes"),
    ])
      .then(([reunioesResult, colegiadosResult, publicacoesResult]) => {
        setReunioes(reunioesResult);
        setColegiados(colegiadosResult);
        setPublicacoes(publicacoesResult);
      })
      .finally(() => setLoading(false));
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

  const filteredReunioes = useMemo(() => {
    const tipoMap = new Map(colegiados.map((item) => [item.sigla, item.tipo]));
    return reunioes.filter((item) => {
      const reuniaoLabel = item.id_reuniao || item.descricao_pauta || "Nao informada";
      const matchesTipo =
        filters.tipo === ALL_VALUE || tipoMap.get(item.sigla_colegiado) === filters.tipo;
      const matchesColegiado =
        filters.colegiado === ALL_VALUE || item.sigla_colegiado === filters.colegiado;
      const matchesReuniao = filters.reuniao === ALL_VALUE || reuniaoLabel === filters.reuniao;
      return matchesTipo && matchesColegiado && matchesReuniao;
    });
  }, [colegiados, filters, reunioes]);

  const filteredPublicacoes = useMemo(() => {
    if (filters.colegiado === ALL_VALUE) {
      return publicacoes;
    }

    return publicacoes.filter((item) => item.sigla_colegiado === filters.colegiado);
  }, [filters.colegiado, publicacoes]);

  if (loading) {
    return <Loading label="Carregando historico de reunioes..." />;
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
              options={buildOptions(colegiados.map((item) => item.sigla))}
              value={filters.colegiado}
              onChange={(value) => setFilters((current) => ({ ...current, colegiado: value }))}
            />
            <FilterDropdown
              label="Reuniao"
              options={buildOptions(reunioes.map((item) => item.id_reuniao || item.descricao_pauta))}
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
        icon={HiOutlineDocumentText}
        metricLabel="Reunioes realizadas"
        metricValue={filteredReunioes.length}
        subtitle="Informacoes da reuniao e publicacoes vinculadas respondem ao mesmo conjunto de filtros."
        title="Historico de Reunioes"
      />

      <section className="content-card">
        <div className="section-heading">
          <h3>Informacoes da Reuniao</h3>
        </div>
        <PowerBiTable
          columns={infoColumns}
          emptyMessage="Nenhuma reuniao encontrada para os filtros selecionados."
          rows={filteredReunioes}
        />
      </section>

      <section className="content-card">
        <div className="section-heading">
          <h3>Publicacoes da Reuniao</h3>
        </div>
        <PowerBiTable
          columns={publicationColumns}
          emptyMessage="Nenhuma publicacao vinculada ao filtro atual."
          rows={filteredPublicacoes}
        />
      </section>
    </div>
  );
};

export default HistoricoReunioes;
