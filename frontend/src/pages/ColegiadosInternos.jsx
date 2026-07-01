import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import ClearFiltersButton from "../components/ClearFiltersButton";
import FilterDropdown from "../components/FilterDropdown";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import { api } from "../services/api";
import { ALL_VALUE, buildOptions, normalizeFilterValue } from "../services/filterUtils";

const typeOrder = ["Camara", "Comite", "Conselho", "Grupo de Trabalho", "Subcomite"];

const sortTypes = (entries) =>
  [...entries].sort(([left], [right]) => {
    const leftIndex = typeOrder.indexOf(left);
    const rightIndex = typeOrder.indexOf(right);
    if (leftIndex === -1 && rightIndex === -1) {
      return left.localeCompare(right);
    }
    if (leftIndex === -1) {
      return 1;
    }
    if (rightIndex === -1) {
      return -1;
    }
    return leftIndex - rightIndex;
  });

const ColegiadosInternos = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [colegiados, setColegiados] = useState(null);
  const [filters, setFilters] = useState({
    tipo: normalizeFilterValue(searchParams.get("tipo")),
    sigla: normalizeFilterValue(searchParams.get("sigla")),
  });

  useEffect(() => {
    api.get("/api/colegiados?tipo=Interno").then(setColegiados);
  }, []);

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

  const filteredColegiados = useMemo(() => {
    if (!colegiados) {
      return [];
    }

    return colegiados.filter((item) => {
      const matchesTipo = filters.tipo === ALL_VALUE || item.tipo === filters.tipo;
      const matchesSigla = filters.sigla === ALL_VALUE || item.sigla === filters.sigla;
      return matchesTipo && matchesSigla;
    });
  }, [colegiados, filters]);

  const grouped = useMemo(() => {
    const groups = new Map();

    filteredColegiados.forEach((item) => {
      const groupKey = item.tipo || "Nao informado";
      const current = groups.get(groupKey) || [];
      current.push(item);
      groups.set(groupKey, current);
    });

    return sortTypes(Array.from(groups.entries()));
  }, [filteredColegiados]);

  if (!colegiados) {
    return <Loading label="Carregando colegiados internos..." />;
  }

  if (!colegiados.length) {
    return <div className="empty-state">Base de colegiados internos nao encontrada.</div>;
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
              onChange={(value) => setFilters((current) => ({ ...current, sigla: value }))}
            />
            <ClearFiltersButton
              onClick={() => setFilters({ tipo: ALL_VALUE, sigla: ALL_VALUE })}
            />
          </>
        }
        icon={HiOutlineClipboardDocumentList}
        metricLabel="Colegiados internos"
        metricValue={filteredColegiados.length}
        subtitle="Base organizada por tipo de colegiado, com acesso rapido aos detalhes de cada estrutura."
        title="Colegiados Internos"
      />

      <section className="type-groups">
        {grouped.map(([tipo, items]) => (
          <article className="type-card" key={tipo}>
            <div className="type-card__header">
              <div>
                <p className="eyebrow">Tipo de colegiado</p>
                <h3>{tipo}</h3>
              </div>
              <span className="pill">{items.length} colegiado(s)</span>
            </div>

            <div className="colegiado-grid">
              {items.map((item) => (
                <button
                  className="colegiado-tile"
                  key={item.sigla}
                  onClick={() => navigate(`/colegiados/${item.sigla}`)}
                  type="button"
                >
                  <div className="colegiado-tile__header">
                    <span className="pill">{item.sigla}</span>
                    <span className={`badge ${item.ativo === "Sim" ? "success" : "danger"}`}>
                      {item.ativo || "Nao informado"}
                    </span>
                  </div>
                  <h4>{item.nome}</h4>
                  <div className="colegiado-tile__stats">
                    <span>{item.total_membros || 0} membros</span>
                    <span>{item.total_reunioes || 0} reunioes</span>
                  </div>
                </button>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default ColegiadosInternos;
