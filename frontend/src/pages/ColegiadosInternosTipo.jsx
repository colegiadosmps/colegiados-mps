import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineMagnifyingGlass,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from "react-icons/hi2";
import ClearFiltersButton from "../components/ClearFiltersButton";
import ConfirmActionModal from "../components/common/ConfirmActionModal";
import DateInputField from "../components/DateInputField";
import EditFormModal from "../components/EditFormModal";
import FilterBox from "../components/FilterBox";
import FilterDropdown from "../components/FilterDropdown";
import Loading from "../components/Loading";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import EmptyStatePanel from "../components/common/EmptyStatePanel";
import { useAuthSession } from "../context/AuthSessionContext";
import { api } from "../services/api";
import { formatBooleanStatus, formatColegiadoDisplayName } from "../services/formatters";
import { ALL_VALUE, buildOptions, normalizeFilterValue } from "../services/filterUtils";

const normalizeType = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const slugToTypeMap = {
  camara: "camara",
  comite: "comite",
  conselho: "conselho",
  "grupo-de-trabalho": "grupo de trabalho",
  subcomite: "subcomite",
};

const singularTitles = {
  camara: { title: "Camaras", singular: "camara" },
  comite: { title: "Comites", singular: "comite" },
  conselho: { title: "Conselhos", singular: "conselho" },
  "grupo de trabalho": { title: "Grupos de Trabalho", singular: "grupo de trabalho" },
  subcomite: { title: "Subcomites", singular: "subcomite" },
};

const resolveTypeFromSlug = (slug) =>
  slugToTypeMap[String(slug || "").toLowerCase()] || String(slug || "").replace(/-/g, " ");

const ColegiadosInternosTipo = () => {
  const navigate = useNavigate();
  const { tipoSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canEditContent, token, user } = useAuthSession();
  const [colegiados, setColegiados] = useState(null);
  const [editorItem, setEditorItem] = useState(null);
  const [editorError, setEditorError] = useState("");
  const [saving, setSaving] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deletingItem, setDeletingItem] = useState(false);
  const pageType = resolveTypeFromSlug(tipoSlug);
  const [filters, setFilters] = useState({
    busca: searchParams.get("busca") || "",
    sigla: normalizeFilterValue(searchParams.get("sigla")),
  });

  const loadColegiados = () =>
    api
      .get(
        `/api/colegiados?categoria=Interno${pageType === "subcomite" ? "&incluirInstancias=true" : ""}`,
      )
      .then(setColegiados);

  useEffect(() => {
    loadColegiados();
  }, [pageType]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.busca.trim()) {
      params.set("busca", filters.busca.trim());
    }
    if (filters.sigla !== ALL_VALUE) {
      params.set("sigla", filters.sigla);
    }
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const typedColegiados = useMemo(() => {
    if (!colegiados) {
      return [];
    }

    return colegiados.filter((item) => normalizeType(item.tipo) === pageType);
  }, [colegiados, pageType]);

  const filteredColegiados = useMemo(() => {
    const search = filters.busca.trim().toLowerCase();

    return typedColegiados.filter((item) => {
      const displayName = formatColegiadoDisplayName(item.sigla_exibicao || item.sigla);
      const searchableValues = [item.sigla, item.sigla_exibicao, item.nome, displayName]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase());

      const matchesSearch = !search || searchableValues.some((value) => value.includes(search));
      const matchesSigla =
        filters.sigla === ALL_VALUE ||
        item.sigla === filters.sigla ||
        item.sigla_exibicao === filters.sigla ||
        displayName === filters.sigla;

      return matchesSearch && matchesSigla;
    });
  }, [filters, typedColegiados]);

  const handleToggleStatus = async (item) => {
    try {
      await api.put(
        `/api/colegiados/${item.sigla}`,
        { ...item, ativo: item.ativo === "Sim" ? "Nao" : "Sim" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      await loadColegiados();
    } catch (error) {
      window.alert(error.message);
    }
  };

  const handleDelete = async (item) => {
    setDeletingItem(true);
    try {
      await api.delete(`/api/colegiados/${item.sigla}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await loadColegiados();
    } catch (error) {
      window.alert(error.message);
    } finally {
      setDeletingItem(false);
      setItemToDelete(null);
    }
  };

  const pageMeta = singularTitles[pageType] || {
    title: "Colegiados Internos",
    singular: "colegiado interno",
  };

  if (!colegiados) {
    return <Loading label="Carregando colegiados internos..." />;
  }

  if (!typedColegiados.length) {
    return (
      <EmptyStatePanel
        animation="empty"
        message="Nenhum colegiado encontrado para este tipo."
        title="Categoria vazia"
      />
    );
  }

  return (
    <div className="page-content">
      <PageHeader
        filters={
          <>
            <FilterBox label="Pesquisa">
              <input
                onChange={(event) => setFilters((current) => ({ ...current, busca: event.target.value }))}
                placeholder="Pesquisar por sigla, nome, cidade ou UF"
                value={filters.busca}
              />
            </FilterBox>
            <FilterDropdown
              label="Sigla Colegiado"
              options={buildOptions(typedColegiados.map((item) => formatColegiadoDisplayName(item.sigla_exibicao || item.sigla)))}
              value={filters.sigla}
              onChange={(value) => setFilters((current) => ({ ...current, sigla: value }))}
            />
            <ClearFiltersButton onClick={() => setFilters({ busca: "", sigla: ALL_VALUE })} />
          </>
        }
        filtersClassName="page-header__filters--inline"
        icon={HiOutlineClipboardDocumentList}
        subtitle={`Lista de colegiados classificados como ${pageMeta.singular}.`}
        title={pageMeta.title}
      />

      <section className="content-card">
        <div className="section-heading">
          <MetricCard
            caption="Total filtrado"
            icon={HiOutlineMagnifyingGlass}
            label="Colegiados"
            tone="blue"
            value={filteredColegiados.length}
          />
          {canEditContent ? (
            <button
              className="success-button"
              onClick={() => {
                setEditorItem({});
                setEditorError("");
              }}
              type="button"
            >
              Adicionar novo colegiado
            </button>
          ) : null}
        </div>
      </section>

      <section className="colegiado-grid">
        {filteredColegiados.map((item) => (
          <article className="colegiado-tile" key={item.sigla}>
            <div className="colegiado-tile__header colegiado-tile__header--start">
              <div className="colegiado-tile__title-block">
                <span className="pill">{formatColegiadoDisplayName(item.sigla_exibicao || item.sigla)}</span>
                <h4>{item.nome || formatColegiadoDisplayName(item.sigla_exibicao || item.sigla)}</h4>
              </div>
              <div className="colegiado-tile__actions">
                {canEditContent ? (
                  <>
                    <button
                      aria-label="Editar"
                      className="icon-button--edit"
                      onClick={() => {
                        setEditorItem(item);
                        setEditorError("");
                      }}
                      title="Editar"
                      type="button"
                    >
                      <HiOutlinePencilSquare />
                    </button>
                    <button
                      aria-label="Excluir"
                      className="icon-button--delete"
                      onClick={() => setItemToDelete(item)}
                      title="Excluir"
                      type="button"
                    >
                      <HiOutlineTrash />
                    </button>
                  </>
                ) : null}
                <span className={`badge ${item.ativo === "Sim" ? "success" : "danger"}`}>
                  {formatBooleanStatus(item.ativo)}
                </span>
              </div>
            </div>
            <div className="colegiado-tile__stats colegiado-tile__stats--stack">
              <span>{item.total_instancias || 0} instancias colegiadas</span>
              <span>{item.total_membros || 0} membros</span>
              <span>{item.total_reunioes || 0} reunioes</span>
            </div>
            <div className="colegiado-tile__footer">
              {canEditContent ? (
                <button className="purple-button" onClick={() => handleToggleStatus(item)} type="button">
                  {item.ativo === "Sim" ? "Inativar" : "Reativar"}
                </button>
              ) : (
                <span />
              )}
              <button
                className="text-button"
                onClick={() => navigate(`/colegiados/${item.chave_pasta || item.sigla}`)}
                type="button"
              >
                Acessar
              </button>
            </div>
          </article>
        ))}
        {!filteredColegiados.length ? (
          <EmptyStatePanel
            animation="empty-search"
            message="Nenhum colegiado encontrado para os filtros selecionados."
            title="Busca sem resultado"
          />
        ) : null}
      </section>

      {editorItem ? (
        <EditFormModal
          onClose={() => setEditorItem(null)}
          title={editorItem.sigla ? `Editar colegiado ${editorItem.sigla}` : "Adicionar novo colegiado"}
        >
          <form
            className="form-grid"
            onSubmit={async (event) => {
              event.preventDefault();
              setSaving(true);
              setEditorError("");

              try {
                const formData = new FormData(event.currentTarget);
                const payload = {
                  categoria: "Interno",
                  sigla: editorItem.sigla || formData.get("sigla"),
                  sigla_exibicao: formData.get("sigla_exibicao"),
                  nome: formData.get("nome"),
                  tipo: pageMeta.singular === "grupo de trabalho" ? "Grupo de Trabalho" : pageMeta.title.slice(0, -1),
                  ativo: formData.get("ativo"),
                  competencia: formData.get("competencia"),
                  ato_criacao: formData.get("ato_criacao"),
                  data_instituicao: formData.get("data_instituicao"),
                  data_termino: formData.get("data_termino"),
                  qtd_min_reunioes_anuais: formData.get("qtd_min_reunioes_anuais"),
                  regra_quorum: formData.get("regra_quorum"),
                  observacoes: formData.get("observacoes"),
                  unidade: formData.get("unidade"),
                  sigla_unidade_pai: formData.get("sigla_unidade_pai"),
                };
                const options = {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                };

                if (editorItem.sigla) {
                  await api.put(`/api/colegiados/${editorItem.sigla}`, payload, options);
                } else {
                  await api.post("/api/colegiados", payload, options);
                }

                await loadColegiados();
                setEditorItem(null);
              } catch (error) {
                setEditorError(error.message);
              } finally {
                setSaving(false);
              }
            }}
          >
            {!editorItem.sigla ? (
              <label>
                <span>Sigla</span>
                <input name="sigla" required />
              </label>
            ) : null}
            <label>
              <span>Sigla de exibicao</span>
              <input defaultValue={editorItem.sigla_exibicao || ""} name="sigla_exibicao" />
            </label>
            <label className="form-grid__full">
              <span>Nome do colegiado</span>
              <input defaultValue={editorItem.nome || ""} name="nome" required />
            </label>
            <label>
              <span>Status</span>
              <select defaultValue={editorItem.ativo || "Sim"} name="ativo">
                <option value="Sim">Ativo</option>
                <option value="Nao">Inativo</option>
              </select>
            </label>
            <label>
              <span>Unidade</span>
              <input defaultValue={editorItem.unidade || ""} name="unidade" />
            </label>
            <label>
              <span>Sigla da Unidade Pai</span>
              <input defaultValue={editorItem.sigla_unidade_pai || ""} name="sigla_unidade_pai" />
            </label>
            <DateInputField
              defaultValue={editorItem.data_instituicao || ""}
              name="data_instituicao"
              span="Data de Instituicao"
            />
            <DateInputField
              defaultValue={editorItem.data_termino || ""}
              name="data_termino"
              span="Data de Termino"
            />
            <label>
              <span>Quantidade minima de reunioes anuais</span>
              <input defaultValue={editorItem.qtd_min_reunioes_anuais || ""} name="qtd_min_reunioes_anuais" />
            </label>
            <label className="form-grid__full">
              <span>Competencias</span>
              <textarea defaultValue={editorItem.competencia || ""} name="competencia" rows="4" />
            </label>
            <label className="form-grid__full">
              <span>Ato de Criacao</span>
              <textarea defaultValue={editorItem.ato_criacao || ""} name="ato_criacao" rows="3" />
            </label>
            <label className="form-grid__full">
              <span>Regra de Quorum</span>
              <textarea defaultValue={editorItem.regra_quorum || ""} name="regra_quorum" rows="3" />
            </label>
            <label className="form-grid__full">
              <span>Observacoes</span>
              <textarea defaultValue={editorItem.observacoes || ""} name="observacoes" rows="3" />
            </label>
            <div className="form-grid__full editor-form-actions">
              <span className="muted">
                Alteracao registrada para {user?.primeiroNome || "usuario autenticado"}.
              </span>
              <button className="success-button" disabled={saving} type="submit">
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
            {editorError ? <div className="inline-message danger-text">{editorError}</div> : null}
          </form>
        </EditFormModal>
      ) : null}

      <ConfirmActionModal
        confirmLabel="Excluir colegiado"
        description={
          itemToDelete
            ? `O colegiado "${formatColegiadoDisplayName(itemToDelete.sigla_exibicao || itemToDelete.sigla)}" sera removido permanentemente.`
            : ""
        }
        onCancel={() => {
          if (!deletingItem) {
            setItemToDelete(null);
          }
        }}
        onConfirm={() => itemToDelete && handleDelete(itemToDelete)}
        open={Boolean(itemToDelete)}
        processing={deletingItem}
        title="Confirmar exclusao"
      />
    </div>
  );
};

export default ColegiadosInternosTipo;
