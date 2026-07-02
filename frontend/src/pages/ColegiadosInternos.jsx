import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import ClearFiltersButton from "../components/ClearFiltersButton";
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

const typeOrder = ["camara", "comite", "conselho", "grupo de trabalho", "subcomite"];

const sortTypes = (entries) =>
  [...entries].sort(([left], [right]) => {
    const leftIndex = typeOrder.indexOf(normalizeType(left));
    const rightIndex = typeOrder.indexOf(normalizeType(right));
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
    api.get("/api/colegiados?categoria=Interno").then(setColegiados);
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
      const matchesSigla =
        filters.sigla === ALL_VALUE ||
        item.sigla === filters.sigla ||
        item.sigla_exibicao === filters.sigla ||
        formatColegiadoDisplayName(item.sigla_exibicao || item.sigla) === filters.sigla;
      return matchesTipo && matchesSigla;
    });
  }, [colegiados, filters]);

  const grouped = useMemo(() => {
    const groups = new Map();

    filteredColegiados.forEach((item) => {
      const groupKey = item.tipo || "Sem classificacao";
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
    return <div className="empty-state">Base de colegiados internos nao foi carregada.</div>;
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
              options={buildOptions(
                colegiados.map((item) =>
                  formatColegiadoDisplayName(item.sigla_exibicao || item.sigla),
                ),
              )}
              value={filters.sigla}
              onChange={(value) => setFilters((current) => ({ ...current, sigla: value }))}
            />
            <ClearFiltersButton
              onClick={() => setFilters({ tipo: ALL_VALUE, sigla: ALL_VALUE })}
            />
          </>
        }
        icon={HiOutlineClipboardDocumentList}
        subtitle="Base organizada por tipo de colegiado, com acesso rapido aos detalhes de cada estrutura."
        title="Colegiados Internos"
      />

      <section className="content-card">
        <MetricCard
          caption="Base oficial carregada"
          icon={HiOutlineClipboardDocumentList}
          label="Colegiados internos"
          tone="blue"
          value={filteredColegiados.length}
        />
      </section>

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
            </div>
          </article>
        ))}
        {!grouped.length ? (
          <div className="empty-state">Nenhum colegiado interno encontrado para os filtros selecionados.</div>
        ) : null}
      </section>
    </div>
  );
};

export default ColegiadosInternos;
