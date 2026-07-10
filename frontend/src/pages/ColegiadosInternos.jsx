import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  HiOutlineClipboardDocumentList,
  HiOutlineFolderOpen,
  HiOutlinePauseCircle,
  HiOutlinePencilSquare,
  HiOutlinePlayCircle,
  HiOutlineTrash,
} from "react-icons/hi2";
import ClearFiltersButton from "../components/ClearFiltersButton";
import EditFormModal from "../components/EditFormModal";
import FilterDropdown from "../components/FilterDropdown";
import Loading from "../components/Loading";
import MetricCard from "../components/MetricCard";
import PageHeader from "../components/PageHeader";
import ConfirmActionModal from "../components/common/ConfirmActionModal";
import EmptyStatePanel from "../components/common/EmptyStatePanel";
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

const preferredTypeOrder = ["camara", "comite", "conselho", "grupo de trabalho", "subcomite"];

const typeSlugMap = {
  camara: "camara",
  comite: "comite",
  conselho: "conselho",
  "grupo de trabalho": "grupo-de-trabalho",
  subcomite: "subcomite",
};

const getTypeSlug = (tipo) => typeSlugMap[normalizeType(tipo)] || normalizeType(tipo).replace(/\s+/g, "-");
const stopCardClick = (event) => event.stopPropagation();

const ColegiadosInternos = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canEditContent, token, user } = useAuthSession();
  const [tipos, setTipos] = useState(null);
  const [colegiados, setColegiados] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTipo, setEditingTipo] = useState(null);
  const [tipoToDelete, setTipoToDelete] = useState(null);
  const [deletingTipo, setDeletingTipo] = useState(false);
  const [editorError, setEditorError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({
    tipo: normalizeFilterValue(searchParams.get("tipo")),
    sigla: normalizeFilterValue(searchParams.get("sigla")),
  });

  const loadData = async () => {
    const [tiposPayload, colegiadosPayload] = await Promise.all([
      api.get("/api/tipos-colegiados?categoria=Interno"),
      api.get("/api/colegiados?categoria=Interno"),
    ]);
    setTipos(tiposPayload);
    setColegiados(colegiadosPayload);
  };

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

  const filteredTipos = useMemo(() => {
    if (!tipos || !colegiados) {
      return [];
    }

    return tipos
      .map((tipo) => {
        const related = colegiados.filter((item) => item.tipo === (tipo.nome_exibicao || tipo.nome));
        const matchesTipo =
          filters.tipo === ALL_VALUE || (tipo.nome_exibicao || tipo.nome) === filters.tipo;
        const matchesSigla =
          filters.sigla === ALL_VALUE ||
          related.some((item) => {
            const displayName = formatColegiadoDisplayName(item.sigla_exibicao || item.sigla);
            return item.sigla === filters.sigla || item.sigla_exibicao === filters.sigla || displayName === filters.sigla;
          });

        return {
          ...tipo,
          total_colegiados: related.length,
          visible: matchesTipo && matchesSigla,
        };
      })
      .filter((tipo) => tipo.visible)
      .sort((left, right) => {
        const leftName = left.nome_exibicao || left.nome || "";
        const rightName = right.nome_exibicao || right.nome || "";
        const leftIndex = preferredTypeOrder.indexOf(normalizeType(leftName));
        const rightIndex = preferredTypeOrder.indexOf(normalizeType(rightName));

        if (leftIndex !== -1 || rightIndex !== -1) {
          if (leftIndex === -1) {
            return 1;
          }
          if (rightIndex === -1) {
            return -1;
          }
          return leftIndex - rightIndex;
        }

        const orderDiff = (left.ordem_exibicao || 0) - (right.ordem_exibicao || 0);
        if (orderDiff !== 0) {
          return orderDiff;
        }

        return String(leftName).localeCompare(String(rightName), "pt-BR");
      });
  }, [colegiados, filters, tipos]);

  if (!tipos || !colegiados) {
    return <Loading label="Carregando colegiados internos..." />;
  }

  if (!colegiados.length) {
    return (
      <EmptyStatePanel
        animation="empty"
        message="Base de colegiados internos nao foi carregada."
        title="Nenhum colegiado interno encontrado"
      />
    );
  }

  return (
    <div className="page-content">
      <PageHeader
        filters={
          <>
            <FilterDropdown
              label="Tipo de Colegiado"
              options={buildOptions(tipos.map((item) => item.nome_exibicao || item.nome))}
              value={filters.tipo}
              onChange={(value) => setFilters((current) => ({ ...current, tipo: value }))}
            />
            <FilterDropdown
              label="Sigla Colegiado"
              options={buildOptions(
                colegiados.map((item) => formatColegiadoDisplayName(item.sigla_exibicao || item.sigla)),
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
            value={filteredTipos.length}
          />
          {canEditContent ? (
            <button
              className="success-button"
              onClick={() => {
                setEditingTipo(null);
                setEditorError("");
                setEditorOpen(true);
              }}
              type="button"
            >
              Adicionar nova pasta
            </button>
          ) : null}
        </div>
      </section>

      <section className="type-summary-grid">
        {filteredTipos.map((tipo) => (
          <article
            className="type-summary-card"
            key={tipo.id}
            onClick={() => navigate(`/colegiados/internos/tipo/${getTypeSlug(tipo.nome_exibicao || tipo.nome)}`)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate(`/colegiados/internos/tipo/${getTypeSlug(tipo.nome_exibicao || tipo.nome)}`);
              }
            }}
            role="button"
            tabIndex={0}
          >
            {canEditContent ? (
              <div className="type-summary-card__actions" onClick={stopCardClick}>
                <button
                  aria-label="Editar"
                  className="icon-button--edit"
                  onClick={() => {
                    setEditingTipo(tipo);
                    setEditorError("");
                    setEditorOpen(true);
                  }}
                  title="Editar"
                  type="button"
                >
                  <HiOutlinePencilSquare />
                </button>
                <button
                  aria-label="Excluir"
                  className="icon-button--delete"
                  onClick={() => setTipoToDelete(tipo)}
                  title="Excluir"
                  type="button"
                >
                  <HiOutlineTrash />
                </button>
                <button
                  aria-label={tipo.status === "Ativo" ? "Inativar" : "Reativar"}
                  className="icon-button--toggle"
                  onClick={async () => {
                    try {
                      await api.put(
                        `/api/tipos-colegiados/${tipo.id}`,
                        {
                          ...tipo,
                          status: tipo.status === "Ativo" ? "Inativo" : "Ativo",
                        },
                        {
                          headers: {
                            Authorization: `Bearer ${token}`,
                          },
                        },
                      );
                      await loadData();
                    } catch (error) {
                      window.alert(error.message);
                    }
                  }}
                  title={tipo.status === "Ativo" ? "Inativar" : "Reativar"}
                  type="button"
                >
                  {tipo.status === "Ativo" ? <HiOutlinePauseCircle /> : <HiOutlinePlayCircle />}
                </button>
              </div>
            ) : null}
            <div className="type-summary-card__top">
              <h3>{tipo.nome_exibicao || tipo.nome}</h3>
              <span className="pill">{tipo.total_colegiados} colegiado(s)</span>
            </div>
            <p>{tipo.descricao || "Colegiados internos organizados por classificacao."}</p>
            <button
              className="text-button type-summary-card__action"
              onClick={(event) => {
                stopCardClick(event);
                navigate(`/colegiados/internos/tipo/${getTypeSlug(tipo.nome_exibicao || tipo.nome)}`);
              }}
              type="button"
            >
              Acessar
            </button>
          </article>
        ))}
        {!filteredTipos.length ? (
          <EmptyStatePanel
            animation="empty-search"
            message="Nenhum colegiado interno encontrado para os filtros selecionados."
            title="Busca sem resultado"
          />
        ) : null}
      </section>

      {editorOpen ? (
        <EditFormModal
          onClose={() => setEditorOpen(false)}
          title={editingTipo ? "Editar tipo de colegiado" : "Adicionar nova pasta"}
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
                  nome: formData.get("nome"),
                  nome_exibicao: formData.get("nome_exibicao"),
                  descricao: formData.get("descricao"),
                  ordem_exibicao: formData.get("ordem_exibicao"),
                  status: formData.get("status"),
                  observacoes: formData.get("observacoes"),
                };
                const options = {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                };

                if (editingTipo) {
                  await api.put(`/api/tipos-colegiados/${editingTipo.id}`, payload, options);
                } else {
                  await api.post("/api/tipos-colegiados", payload, options);
                }

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
              <span>Nome do tipo</span>
              <input defaultValue={editingTipo?.nome || ""} name="nome" required />
            </label>
            <label>
              <span>Nome de exibicao</span>
              <input defaultValue={editingTipo?.nome_exibicao || ""} name="nome_exibicao" required />
            </label>
            <label className="form-grid__full">
              <span>Descricao</span>
              <textarea defaultValue={editingTipo?.descricao || ""} name="descricao" rows="3" />
            </label>
            <label>
              <span>Ordem de exibicao</span>
              <input defaultValue={editingTipo?.ordem_exibicao || ""} name="ordem_exibicao" />
            </label>
            <label>
              <span>Status</span>
              <select defaultValue={editingTipo?.status || "Ativo"} name="status">
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
              </select>
            </label>
            <label className="form-grid__full">
              <span>Observacoes</span>
              <textarea defaultValue={editingTipo?.observacoes || ""} name="observacoes" rows="3" />
            </label>
            <div className="form-grid__full editor-form-actions">
              <span className="muted">
                {saving
                  ? "Salvando tipo de colegiado..."
                  : `Edicao disponivel para ${user?.primeiroNome || "usuario autenticado"}.`}
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
        confirmLabel="Excluir"
        description={
          tipoToDelete
            ? "Tem certeza que deseja excluir este tipo de colegiado? Esta acao nao podera ser desfeita."
            : ""
        }
        onCancel={() => {
          if (!deletingTipo) {
            setTipoToDelete(null);
          }
        }}
        onConfirm={async () => {
          if (!tipoToDelete) {
            return;
          }

          setDeletingTipo(true);
          try {
            await api.delete(`/api/tipos-colegiados/${tipoToDelete.id}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            await loadData();
            setTipoToDelete(null);
          } catch (error) {
            window.alert(
              error.message.includes("vinculados")
                ? "Existem colegiados vinculados a este tipo. Inative ou remaneje os colegiados antes de excluir."
                : error.message,
            );
          } finally {
            setDeletingTipo(false);
          }
        }}
        open={Boolean(tipoToDelete)}
        processing={deletingTipo}
        title="Confirmar exclusao"
      />
    </div>
  );
};

export default ColegiadosInternos;
