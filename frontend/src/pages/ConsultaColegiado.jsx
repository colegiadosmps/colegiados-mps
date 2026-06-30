import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import ClearFiltersButton from "../components/ClearFiltersButton";
import FilterDropdown from "../components/FilterDropdown";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import PowerBiTable from "../components/PowerBiTable";
import TabelaMembros from "../components/TabelaMembros";
import { api } from "../services/api";
import { ALL_VALUE, buildOptions, normalizeFilterValue } from "../services/filterUtils";

const reunioesColumns = [
  { key: "id_reuniao", label: "Reuniao", width: "160px", render: (row) => row.id_reuniao || "-" },
  { key: "data_reuniao", label: "Data", width: "120px" },
  { key: "status_reuniao", label: "Status", width: "180px" },
];

const ConsultaColegiado = () => {
  const { sigla } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [colegiado, setColegiado] = useState(null);
  const [colegiados, setColegiados] = useState([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    tipo: normalizeFilterValue(searchParams.get("tipo")),
    sigla: normalizeFilterValue(searchParams.get("sigla")) || sigla,
  });

  useEffect(() => {
    Promise.all([api.get(`/api/colegiados/${sigla}`), api.get("/api/colegiados")])
      .then(([colegiadoResult, colegiadosResult]) => {
        setColegiado(colegiadoResult);
        setColegiados(colegiadosResult);
      })
      .catch((err) => setError(err.message));
  }, [sigla]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.tipo !== ALL_VALUE) {
      params.set("tipo", filters.tipo);
    }
    if (filters.sigla !== ALL_VALUE) {
      params.set("sigla", filters.sigla);
    }
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const filteredMembros = useMemo(() => {
    if (!colegiado) {
      return [];
    }
    return colegiado.membros;
  }, [colegiado]);

  if (error) {
    return <div className="empty-state">{error}</div>;
  }

  if (!colegiado) {
    return <Loading label={`Carregando detalhes de ${sigla}...`} />;
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
              value={filters.sigla}
              onChange={(value) => {
                setFilters((current) => ({ ...current, sigla: value }));
                if (value !== ALL_VALUE && value !== colegiado.sigla) {
                  navigate(`/colegiados/${value}`);
                }
              }}
            />
            <ClearFiltersButton
              onClick={() =>
                setFilters({ tipo: ALL_VALUE, sigla: normalizeFilterValue(colegiado.sigla) })
              }
            />
          </>
        }
        icon={HiOutlineClipboardDocumentList}
        metricLabel="Integrantes do colegiado"
        metricValue={colegiado.total_membros}
        subtitle="Detalhes de competencias, ato de criacao, reunioes e membros do colegiado selecionado."
        title={colegiado.nome}
      />

      <section className="detail-grid">
        <article className="detail-panel">
          <h3>Competencias</h3>
          <div className="detail-value">
            {colegiado.competencia || colegiado.descricao || "Sem competencias cadastradas."}
          </div>
        </article>
        <article className="detail-panel">
          <h3>Ato de Criacao</h3>
          <div className="detail-value">Informacao ainda nao sincronizada na base atual.</div>
        </article>
        <article className="detail-panel">
          <h3>Reunioes</h3>
          <PowerBiTable
            columns={reunioesColumns}
            emptyMessage="Nenhuma reuniao vinculada a este colegiado."
            rows={colegiado.reunioes}
          />
        </article>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <h3>Membros</h3>
          <div className="form-actions">
            <Link className="text-link" to={`/integrantes?colegiado=${colegiado.sigla}`}>
              Abrir em Integrantes
            </Link>
          </div>
        </div>
        <TabelaMembros membros={filteredMembros} />
      </section>
    </div>
  );
};

export default ConsultaColegiado;
