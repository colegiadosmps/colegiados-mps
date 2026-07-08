import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HiOutlineClipboardDocumentList, HiOutlineFolderOpen } from "react-icons/hi2";
import ClearFiltersButton from "../components/ClearFiltersButton";
import EditFormModal from "../components/EditFormModal";
import FilterDropdown from "../components/FilterDropdown";
import Loading from "../components/Loading";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import { useAuthSession } from "../context/AuthSessionContext";
import { api } from "../services/api";
import { formatColegiadoDisplayName } from "../services/formatters";
import { ALL_VALUE, buildOptions, normalizeFilterValue } from "../services/filterUtils";

const normalizeType = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const typeOrder = ["camara", "comite", "conselho", "grupo de trabalho", "subcomite"];
const allowedTypes = new Set(typeOrder);

const typeDescriptions = {
  camara: "Camaras vinculadas a colegiados e estruturas tematicas da base.",
  comite: "Comites permanentes e tecnicos vinculados ao sistema.",
  conselho: "Conselhos nacionais e Conselhos de Previdencia Social vinculados a base.",
  "grupo de trabalho":
    "Grupos de trabalho e frentes temporarias registradas no conjunto interno.",
  subcomite: "Subcomites vinculados a colegiados com atuacao especializada.",
};

const typeSlugMap = {
  camara: "camara",
  comite: "comite",
  conselho: "conselho",
  "grupo de trabalho": "grupo-de-trabalho",
  subcomite: "subcomite",
};

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

const getTypeDescription = (tipo) =>
  typeDescriptions[normalizeType(tipo)] || "Colegiados internos organizados por classificacao.";

const getTypeSlug = (tipo) => typeSlugMap[normalizeType(tipo)] || normalizeType(tipo).replace(/\s+/g, "-");

const ColegiadosInternos = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canEditContent, token, user } = useAuthSession();
  const [colegiados, setColegiados] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorError, setEditorError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({
    tipo: normalizeFilterValue(searchParams.get("tipo")),
    sigla: normalizeFilterValue(searchParams.get("sigla")),
  });

  const loadData = () => api.get("/api/colegiados?categoria=Interno").then(setColegiados);

  useEffect(() => {
    loadData();
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
      if (!allowedTypes.has(normalizeType(item.tipo))) {
        return false;
      }

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
            <ClearFiltersButton onClick={() => setFilters({ tipo: ALL_VALUE, sigla: ALL_VALUE })} />
          </>
        }
        filtersClassName="page-header__filters--inline"
        icon={HiOutlineClipboardDocumentList}
        subtitle="A base interna comeca resumida por tipo. Entre em cada categoria para ver a lista completa."
        title="Colegiados Internos"
      />

      <section className="content-card">
        <div className="section-heading">
          <MetricCard
            caption="Categorias filtradas"
            icon={HiOutlineFolderOpen}
            label="Tipos de colegiado"
            tone="blue"
            value={grouped.length}
          />
          {canEditContent ? (
            <button
              className="primary-button"
              onClick={() => {
                setEditorError("");
                setEditorOpen(true);
              }}
              type="button"
            >
              Novo colegiado interno
            </button>
          ) : null}
        </div>
      </section>

      <section className="type-summary-grid">
        {grouped.map(([tipo, items]) => (
          <article className="type-summary-card" key={tipo}>
            <div className="type-summary-card__top">
              <p className="eyebrow">Tipo de colegiado</p>
              <h3>{tipo}</h3>
              <span className="pill">{items.length} colegiado(s)</span>
            </div>
            <p>{getTypeDescription(tipo)}</p>
            <button
              className="text-button type-summary-card__action"
              onClick={() => navigate(`/colegiados/internos/tipo/${getTypeSlug(tipo)}`)}
              type="button"
            >
              Acessar
            </button>
          </article>
        ))}
        {!grouped.length ? (
          <div className="empty-state">Nenhum colegiado interno encontrado para os filtros selecionados.</div>
        ) : null}
      </section>

      {editorOpen ? (
        <EditFormModal onClose={() => setEditorOpen(false)} title="Adicionar colegiado interno">
          <form
            className="form-grid"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(true);
              setEditorError("");

              try {
                const formData = new FormData(event.currentTarget);
                await api.post(
                  "/api/colegiados",
                  {
                    categoria: "Interno",
                    sigla: formData.get("sigla"),
                    sigla_exibicao: formData.get("sigla_exibicao"),
                    nome: formData.get("nome"),
                    tipo: formData.get("tipo"),
                    ato_criacao: formData.get("ato_criacao"),
                    data_instituicao: formData.get("data_instituicao"),
                    regra_quorum: formData.get("regra_quorum"),
                    qtd_min_reunioes_anuais: formData.get("qtd_min_reunioes_anuais"),
                    competencia: formData.get("competencia"),
                    observacoes: formData.get("observacoes"),
                    ativo: formData.get("ativo"),
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${token}`,
                    },
                  },
                );
                await loadData();
                setEditorOpen(false);
              } catch (error) {
                setEditorError(error.message);
              } finally {
                setSaving(false);
              }
            }}
          >
            <label>
              <span>Sigla</span>
              <input name="sigla" required />
            </label>
            <label>
              <span>Sigla de exibicao</span>
              <input name="sigla_exibicao" />
            </label>
            <label className="form-grid__full">
              <span>Nome</span>
              <input name="nome" required />
            </label>
            <label>
              <span>Tipo</span>
              <select defaultValue="Conselho" name="tipo">
                <option value="Camara">Camara</option>
                <option value="Comite">Comite</option>
                <option value="Conselho">Conselho</option>
                <option value="Grupo de Trabalho">Grupo de Trabalho</option>
                <option value="Subcomite">Subcomite</option>
              </select>
            </label>
            <label>
              <span>Status</span>
              <select defaultValue="Sim" name="ativo">
                <option value="Sim">Ativo</option>
                <option value="Nao">Inativo</option>
              </select>
            </label>
            <label>
              <span>Data de instituicao</span>
              <input name="data_instituicao" />
            </label>
            <label>
              <span>Quantidade minima de reunioes</span>
              <input name="qtd_min_reunioes_anuais" />
            </label>
            <label className="form-grid__full">
              <span>Ato de criacao</span>
              <textarea name="ato_criacao" rows="3" />
            </label>
            <label className="form-grid__full">
              <span>Competencias</span>
              <textarea name="competencia" rows="4" />
            </label>
            <label className="form-grid__full">
              <span>Regra de quorum</span>
              <textarea name="regra_quorum" rows="3" />
            </label>
            <label className="form-grid__full">
              <span>Observacoes</span>
              <textarea name="observacoes" rows="3" />
            </label>
            <div className="form-grid__full editor-form-actions">
              <span className="muted">
                Alteracao registrada para {user?.primeiroNome || "usuario autenticado"}.
              </span>
              <button className="primary-button" disabled={saving} type="submit">
                {saving ? "Salvando..." : "Salvar colegiado"}
              </button>
            </div>
            {editorError ? <div className="inline-message danger-text">{editorError}</div> : null}
          </form>
        </EditFormModal>
      ) : null}
    </div>
  );
};

export default ColegiadosInternos;
