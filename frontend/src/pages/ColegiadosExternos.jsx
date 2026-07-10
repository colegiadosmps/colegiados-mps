import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  HiOutlineBriefcase,
  HiOutlineBuildingLibrary,
  HiOutlinePauseCircle,
  HiOutlinePencilSquare,
  HiOutlinePlayCircle,
  HiOutlineTrash,
} from "react-icons/hi2";
import ClearFiltersButton from "../components/ClearFiltersButton";
import ConfirmActionModal from "../components/common/ConfirmActionModal";
import EditFormModal from "../components/EditFormModal";
import FilterDropdown from "../components/FilterDropdown";
import MetricCard from "../components/MetricCard";
import GraficoBarras from "../components/GraficoBarras";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import PowerBiTable from "../components/PowerBiTable";
import EmptyStatePanel from "../components/common/EmptyStatePanel";
import { useAuthSession } from "../context/AuthSessionContext";
import { api } from "../services/api";
import { formatColegiadoDisplayName } from "../services/formatters";
import { ALL_VALUE, buildOptions, normalizeFilterValue } from "../services/filterUtils";

const summarizeChart = (items, limit = 5) => {
  if (items.length <= limit) {
    return items;
  }

  const visible = items.slice(0, limit);
  const remainingValue = items.slice(limit).reduce((sum, item) => sum + item.value, 0);
  return [...visible, { label: "Outros", value: remainingValue }];
};

const sortColegiados = (items) =>
  [...items].sort((left, right) =>
    formatColegiadoDisplayName(left.sigla_exibicao || left.nome || left.sigla).localeCompare(
      formatColegiadoDisplayName(right.sigla_exibicao || right.nome || right.sigla),
      "pt-BR",
    ),
  );

const buildColumns = (extraColumns = []) => [
  {
    key: "nome",
    label: "Colegiado",
    width: "240px",
    render: (row) => formatColegiadoDisplayName(row.sigla_exibicao || row.nome || "-"),
  },
  { key: "orgao", label: "Orgao", width: "200px", render: (row) => row.orgao || row.sigla || "-" },
  {
    key: "dispositivo_legal",
    label: "Dispositivo Legal",
    width: "220px",
    className: "cell-wrap",
  },
  {
    key: "descricao",
    label: "Natureza, Competencia ou Finalidade",
    width: "340px",
    className: "cell-wrap",
    render: (row) => row.competencia || row.descricao || "-",
  },
  ...extraColumns,
];

const ColegiadosExternos = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { canEditContent, token, user } = useAuthSession();
  const [colegiados, setColegiados] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deletingItem, setDeletingItem] = useState(false);
  const [editorError, setEditorError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({
    colegiado: normalizeFilterValue(searchParams.get("colegiado")),
    orgao: normalizeFilterValue(searchParams.get("orgao")),
  });

  const loadData = () => api.get("/api/colegiados?categoria=Externo").then(setColegiados);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.colegiado !== ALL_VALUE) {
      params.set("colegiado", filters.colegiado);
    }
    if (filters.orgao !== ALL_VALUE) {
      params.set("orgao", filters.orgao);
    }
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const filteredColegiados = useMemo(() => {
    if (!colegiados) {
      return [];
    }

    return colegiados.filter((item) => {
      const orgao = item.orgao || item.sigla || "Nao informado";
      const matchesColegiado =
        filters.colegiado === ALL_VALUE ||
        (item.sigla_exibicao || item.nome) === filters.colegiado ||
        formatColegiadoDisplayName(item.sigla_exibicao || item.nome) === filters.colegiado;
      const matchesOrgao = filters.orgao === ALL_VALUE || orgao === filters.orgao;
      return matchesColegiado && matchesOrgao;
    });
  }, [colegiados, filters]);

  const chartData = useMemo(() => {
    const counts = new Map();
    filteredColegiados.forEach((item) => {
      const label = item.orgao || item.sigla || "Nao informado";
      counts.set(label, (counts.get(label) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));
  }, [filteredColegiados]);

  const compactChartData = useMemo(() => summarizeChart(chartData, 5), [chartData]);

  const handleDeleteItem = async (row) => {
    setDeletingItem(true);
    try {
      await api.delete(`/api/colegiados/${row.sigla}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await loadData();
      setItemToDelete(null);
    } catch (error) {
      setEditorError(error.message);
      setEditorOpen(true);
    } finally {
      setDeletingItem(false);
    }
  };

  const actionColumns = useMemo(() => {
    if (!canEditContent) {
      return [];
    }

    return [
      {
        key: "acoes",
        label: "Acoes",
        width: "176px",
        render: (row) => (
          <div className="table-row-actions table-row-actions--compact">
            <button
              aria-label={`Editar ${formatColegiadoDisplayName(row.sigla_exibicao || row.nome || row.sigla)}`}
              className="icon-button--edit"
              onClick={() => {
                setEditingItem(row);
                setEditorError("");
                setEditorOpen(true);
              }}
              type="button"
            >
              <HiOutlinePencilSquare />
            </button>
            <button
              aria-label={row.ativo === "Sim" ? `Inativar ${formatColegiadoDisplayName(row.sigla_exibicao || row.nome || row.sigla)}` : `Reativar ${formatColegiadoDisplayName(row.sigla_exibicao || row.nome || row.sigla)}`}
              className="icon-button--toggle"
              onClick={async () => {
                try {
                  await api.put(
                    `/api/colegiados/${row.sigla}`,
                    { ...row, ativo: row.ativo === "Sim" ? "Nao" : "Sim" },
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                      },
                    },
                  );
                  await loadData();
                } catch (error) {
                  setEditorError(error.message);
                  setEditorOpen(true);
                }
              }}
              title={row.ativo === "Sim" ? "Inativar" : "Reativar"}
              type="button"
            >
              {row.ativo === "Sim" ? <HiOutlinePauseCircle /> : <HiOutlinePlayCircle />}
            </button>
            <button
              aria-label={`Excluir ${formatColegiadoDisplayName(row.sigla_exibicao || row.nome || row.sigla)}`}
              className="icon-button--delete"
              onClick={() => setItemToDelete(row)}
              type="button"
            >
              <HiOutlineTrash />
            </button>
          </div>
        ),
      },
    ];
  }, [canEditContent, token]);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setEditorError("");

    try {
      const formData = new FormData(event.currentTarget);
      const payload = {
        categoria: "Externo",
        sigla: formData.get("sigla"),
        sigla_exibicao: formData.get("sigla_exibicao"),
        nome: formData.get("nome"),
        orgao: formData.get("orgao"),
        dispositivo_legal: formData.get("dispositivo_legal"),
        descricao: formData.get("descricao"),
        ativo: formData.get("ativo"),
        titular: formData.get("titular"),
        suplente: formData.get("suplente"),
        segundo_suplente: formData.get("segundo_suplente"),
        processo_nomeacao: formData.get("processo_nomeacao"),
        observacoes: formData.get("observacoes"),
      };

      const options = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const result = editingItem?.sigla
        ? await api.put(`/api/colegiados/${editingItem.sigla}`, payload, options)
        : await api.post("/api/colegiados", payload, options);
      const savedColegiado = result?.colegiado;

      if (savedColegiado) {
        setColegiados((current) => {
          const currentItems = Array.isArray(current) ? current : [];
          const nextItems = editingItem?.sigla
            ? currentItems.map((item) =>
                item.sigla === editingItem.sigla ? { ...item, ...savedColegiado } : item,
              )
            : [...currentItems, savedColegiado];
          return sortColegiados(nextItems);
        });
      } else {
        await loadData();
      }

      setEditorOpen(false);
      setEditingItem(null);
    } catch (error) {
      setEditorError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!colegiados) {
    return <Loading label="Carregando colegiados externos..." />;
  }

  if (!colegiados.length) {
    return (
      <EmptyStatePanel
        animation="empty"
        message="Base de colegiados externos nao encontrada no Google Drive."
        title="Nenhum colegiado externo encontrado"
      />
    );
  }

  return (
    <div className="page-content">
      <PageHeader
        filters={
          <>
            <FilterDropdown
              label="Colegiado Externo"
              options={buildOptions(
                colegiados.map((item) =>
                  formatColegiadoDisplayName(item.sigla_exibicao || item.nome),
                ),
              )}
              value={filters.colegiado}
              onChange={(value) => setFilters((current) => ({ ...current, colegiado: value }))}
            />
            <FilterDropdown
              label="Orgao"
              options={buildOptions(colegiados.map((item) => item.orgao || item.sigla))}
              value={filters.orgao}
              onChange={(value) => setFilters((current) => ({ ...current, orgao: value }))}
            />
            <ClearFiltersButton
              onClick={() => setFilters({ colegiado: ALL_VALUE, orgao: ALL_VALUE })}
            />
          </>
        }
        filtersClassName="page-header__filters--inline"
        icon={HiOutlineBriefcase}
        subtitle="Consulte os colegiados externos aos quais o MPS esta vinculado."
        title="Colegiados Externos"
      />

      <section className="content-card externos-summary">
        <MetricCard
          caption="Colegiados externos"
          icon={HiOutlineBuildingLibrary}
          label="Colegiados externos"
          tone="blue"
          value={filteredColegiados.length}
        />
        <GraficoBarras
          color="#2b74ff"
          data={compactChartData}
          expandedData={chartData}
          title="Colegiados externos por orgao"
        />
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <h3>Registros externos</h3>
            <p>Os colaboradores podem incluir e manter os vinculos externos do sistema.</p>
          </div>
          {canEditContent ? (
            <button
              className="success-button"
              onClick={() => {
                setEditingItem(null);
                setEditorError("");
                setEditorOpen(true);
              }}
              type="button"
            >
              Adicionar colegiado externo
            </button>
          ) : null}
        </div>
        <PowerBiTable
          columns={buildColumns(actionColumns)}
          emptyMessage="Nenhum colegiado externo encontrado para os filtros selecionados."
          rows={filteredColegiados}
          sortable={false}
        />
      </section>

      {editorOpen ? (
        <EditFormModal
          onClose={() => {
            setEditorOpen(false);
            setEditingItem(null);
          }}
          title={editingItem ? "Editar colegiado externo" : "Adicionar colegiado externo"}
        >
          <form className="form-grid" onSubmit={handleSave}>
            <label>
              <span>Sigla</span>
              <input defaultValue={editingItem?.sigla || ""} name="sigla" required />
            </label>
            <label>
              <span>Sigla de exibicao</span>
              <input defaultValue={editingItem?.sigla_exibicao || ""} name="sigla_exibicao" />
            </label>
            <label className="form-grid__full">
              <span>Colegiado</span>
              <input defaultValue={editingItem?.nome || ""} name="nome" required />
            </label>
            <label>
              <span>Orgao</span>
              <input defaultValue={editingItem?.orgao || ""} name="orgao" />
            </label>
            <label>
              <span>Status</span>
              <select defaultValue={editingItem?.ativo || "Sim"} name="ativo">
                <option value="Sim">Ativo</option>
                <option value="Nao">Inativo</option>
              </select>
            </label>
            <label>
              <span>Titular</span>
              <input defaultValue={editingItem?.titular || ""} name="titular" />
            </label>
            <label>
              <span>Suplente</span>
              <input defaultValue={editingItem?.suplente || ""} name="suplente" />
            </label>
            <label>
              <span>2º suplente</span>
              <input defaultValue={editingItem?.segundo_suplente || ""} name="segundo_suplente" />
            </label>
            <label className="form-grid__full">
              <span>Processo / ato de nomeacao</span>
              <input
                defaultValue={editingItem?.processo_nomeacao || ""}
                name="processo_nomeacao"
              />
            </label>
            <label className="form-grid__full">
              <span>Dispositivo legal</span>
              <textarea
                defaultValue={editingItem?.dispositivo_legal || ""}
                name="dispositivo_legal"
                rows="3"
              />
            </label>
            <label className="form-grid__full">
              <span>Natureza, competencia ou finalidade</span>
              <textarea defaultValue={editingItem?.descricao || ""} name="descricao" rows="4" />
            </label>
            <label className="form-grid__full">
              <span>Observacoes</span>
              <textarea defaultValue={editingItem?.observacoes || ""} name="observacoes" rows="3" />
            </label>
            <div className="form-grid__full editor-form-actions">
              <span className="muted">
                Alteracao registrada para {user?.primeiroNome || "usuario autenticado"}.
              </span>
              <button className="primary-button" disabled={saving} type="submit">
                {saving ? "Salvando..." : "Salvar colegiado externo"}
              </button>
            </div>
            {editorError ? <div className="inline-message danger-text">{editorError}</div> : null}
          </form>
        </EditFormModal>
      ) : null}

      <ConfirmActionModal
        confirmLabel="Excluir colegiado externo"
        description={
          itemToDelete
            ? `O colegiado externo "${formatColegiadoDisplayName(itemToDelete.sigla_exibicao || itemToDelete.nome || itemToDelete.sigla)}" sera removido permanentemente.`
            : ""
        }
        onCancel={() => {
          if (!deletingItem) {
            setItemToDelete(null);
          }
        }}
        onConfirm={() => itemToDelete && handleDeleteItem(itemToDelete)}
        open={Boolean(itemToDelete)}
        processing={deletingItem}
        title="Excluir colegiado externo"
      />
    </div>
  );
};

export default ColegiadosExternos;
