import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  HiOutlineCalendarDays,
  HiOutlinePencilSquare,
  HiOutlineTrash,
} from "react-icons/hi2";
import ClearFiltersButton from "../components/ClearFiltersButton";
import ConfirmActionModal from "../components/common/ConfirmActionModal";
import EditFormModal from "../components/EditFormModal";
import FilterDropdown from "../components/FilterDropdown";
import GraficoLinha from "../components/GraficoLinha";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import TabelaReunioes from "../components/TabelaReunioes";
import { useAuthSession } from "../context/AuthSessionContext";
import { api } from "../services/api";
import { ALL_VALUE, buildOptions, normalizeFilterValue } from "../services/filterUtils";
import { formatMonthYear } from "../services/formatters";

const aggregateByMonth = (rows) => {
  const counts = new Map();
  rows.forEach((row) => {
    const label = row.data_reuniao ? formatMonthYear(row.data_reuniao) : "Sem data";
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => {
      if (left.label === "Sem data") {
        return 1;
      }
      if (right.label === "Sem data") {
        return -1;
      }
      const [leftMonth, leftYear] = left.label.split("/");
      const [rightMonth, rightYear] = right.label.split("/");
      return `${leftYear}${leftMonth}`.localeCompare(`${rightYear}${rightMonth}`);
    });
};

const CalendarioReunioes = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { canEditContent, token, user } = useAuthSession();
  const [reunioes, setReunioes] = useState([]);
  const [colegiados, setColegiados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState(null);
  const [meetingToDelete, setMeetingToDelete] = useState(null);
  const [deletingMeeting, setDeletingMeeting] = useState(false);
  const [editorError, setEditorError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({
    status: normalizeFilterValue(searchParams.get("status")),
    tipo: normalizeFilterValue(searchParams.get("tipo")),
    colegiado: normalizeFilterValue(searchParams.get("colegiado")),
  });

  const loadData = () =>
    Promise.all([api.get("/api/reunioes"), api.get("/api/colegiados")])
      .then(([reunioesResult, colegiadosResult]) => {
        setReunioes(reunioesResult);
        setColegiados(colegiadosResult);
      });

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.status !== ALL_VALUE) {
      params.set("status", filters.status);
    }
    if (filters.tipo !== ALL_VALUE) {
      params.set("tipo", filters.tipo);
    }
    if (filters.colegiado !== ALL_VALUE) {
      params.set("colegiado", filters.colegiado);
    }
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const filteredReunioes = useMemo(() => {
    const tipoMap = new Map(colegiados.map((item) => [item.sigla, item.tipo]));
    return reunioes.filter((item) => {
      const matchesStatus =
        filters.status === ALL_VALUE || item.status_reuniao === filters.status;
      const matchesSigla =
        filters.colegiado === ALL_VALUE || item.sigla_colegiado === filters.colegiado;
      const matchesTipo =
        filters.tipo === ALL_VALUE || tipoMap.get(item.sigla_colegiado) === filters.tipo;
      return matchesStatus && matchesSigla && matchesTipo;
    });
  }, [colegiados, filters, reunioes]);

  const handleDeleteMeeting = async (row) => {
    setDeletingMeeting(true);
    try {
      await api.delete(`/api/reunioes/${row.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await loadData();
      setMeetingToDelete(null);
    } catch (error) {
      setEditorError(error.message);
      setEditorOpen(true);
    } finally {
      setDeletingMeeting(false);
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
              aria-label={`Editar reuniao ${row.id_reuniao}`}
              className="icon-button--edit"
              onClick={() => {
                setEditingMeeting(row);
                setEditorError("");
                setEditorOpen(true);
              }}
              type="button"
            >
              <HiOutlinePencilSquare />
            </button>
            <button
              className="purple-button"
              onClick={async () => {
                try {
                  await api.put(
                    `/api/reunioes/${row.id}`,
                    {
                      ...row,
                      status_reuniao:
                        row.status_reuniao === "Cancelada" ? "Planejada" : "Cancelada",
                    },
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
              type="button"
            >
              {row.status_reuniao === "Cancelada" ? "Reativar" : "Cancelar"}
            </button>
            <button
              aria-label={`Excluir reuniao ${row.id_reuniao}`}
              className="icon-button--delete"
              onClick={() => setMeetingToDelete(row)}
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
        id_reuniao: formData.get("id_reuniao"),
        sigla_colegiado: formData.get("sigla_colegiado"),
        data_reuniao: formData.get("data_reuniao"),
        hora: formData.get("hora"),
        local: formData.get("local"),
        classificacao_pauta: formData.get("classificacao_pauta"),
        descricao_pauta: formData.get("descricao_pauta"),
        texto_ata: formData.get("texto_ata"),
        status_reuniao: formData.get("status_reuniao"),
        quorum_registrado: formData.get("quorum_registrado"),
        link_ata: formData.get("link_ata"),
        observacao: formData.get("observacao"),
      };

      const options = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (editingMeeting?.id) {
        await api.put(`/api/reunioes/${editingMeeting.id}`, payload, options);
      } else {
        await api.post("/api/reunioes", payload, options);
      }

      await loadData();
      setEditorOpen(false);
      setEditingMeeting(null);
    } catch (error) {
      setEditorError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading label="Carregando calendario de reunioes..." />;
  }

  return (
    <div className="page-content">
      <PageHeader
        filters={
          <>
            <FilterDropdown
              label="Status"
              options={buildOptions(reunioes.map((item) => item.status_reuniao))}
              value={filters.status}
              onChange={(value) => setFilters((current) => ({ ...current, status: value }))}
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
              value={filters.colegiado}
              onChange={(value) => setFilters((current) => ({ ...current, colegiado: value }))}
            />
            <ClearFiltersButton
              onClick={() =>
                setFilters({ status: ALL_VALUE, tipo: ALL_VALUE, colegiado: ALL_VALUE })
              }
            />
          </>
        }
        icon={HiOutlineCalendarDays}
        metricLabel="Reunioes filtradas"
        metricValue={filteredReunioes.length}
        subtitle="Quando o filtro muda, quantidade, tabela e grafico mensal mudam juntos."
        title="Calendario de Reunioes"
      />

      <section className="charts-grid single-chart">
        <GraficoLinha data={aggregateByMonth(filteredReunioes)} title="Reunioes por Mes" />
      </section>

      <section className="content-card">
        <div className="section-heading">
          <div>
            <h3>Agenda consolidada</h3>
            <p>O colaborador autenticado pode criar, editar e cancelar reunioes.</p>
          </div>
          {canEditContent ? (
            <button
              className="success-button"
              onClick={() => {
                setEditingMeeting(null);
                setEditorError("");
                setEditorOpen(true);
              }}
              type="button"
            >
              Adicionar reuniao
            </button>
          ) : null}
        </div>
        <TabelaReunioes extraColumns={actionColumns} reunioes={filteredReunioes} />
      </section>

      {editorOpen ? (
        <EditFormModal
          onClose={() => {
            setEditorOpen(false);
            setEditingMeeting(null);
          }}
          title={editingMeeting ? "Editar reuniao" : "Adicionar reuniao"}
        >
          <form className="form-grid" onSubmit={handleSave}>
            <label>
              <span>Reuniao</span>
              <input defaultValue={editingMeeting?.id_reuniao || ""} name="id_reuniao" required />
            </label>
            <label>
              <span>Colegiado</span>
              <select defaultValue={editingMeeting?.sigla_colegiado || ""} name="sigla_colegiado" required>
                <option value="">Selecione</option>
                {colegiados.map((item) => (
                  <option key={item.sigla} value={item.sigla}>
                    {item.sigla}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Data</span>
              <input defaultValue={editingMeeting?.data_reuniao || ""} name="data_reuniao" />
            </label>
            <label>
              <span>Horario</span>
              <input defaultValue={editingMeeting?.hora || ""} name="hora" placeholder="HH:mm" />
            </label>
            <label>
              <span>Local</span>
              <input defaultValue={editingMeeting?.local || ""} name="local" />
            </label>
            <label>
              <span>Status</span>
              <select defaultValue={editingMeeting?.status_reuniao || "Planejada"} name="status_reuniao">
                <option value="Planejada">Planejada</option>
                <option value="Realizada">Realizada</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </label>
            <label>
              <span>Classificacao da pauta</span>
              <input
                defaultValue={editingMeeting?.classificacao_pauta || ""}
                name="classificacao_pauta"
              />
            </label>
            <label>
              <span>Quorum</span>
              <input defaultValue={editingMeeting?.quorum_registrado || ""} name="quorum_registrado" />
            </label>
            <label className="form-grid__full">
              <span>Descricao da pauta</span>
              <textarea
                defaultValue={editingMeeting?.descricao_pauta || ""}
                name="descricao_pauta"
                rows="3"
              />
            </label>
            <label className="form-grid__full">
              <span>Texto da ata</span>
              <textarea defaultValue={editingMeeting?.texto_ata || ""} name="texto_ata" rows="3" />
            </label>
            <label className="form-grid__full">
              <span>Link da ata</span>
              <input defaultValue={editingMeeting?.link_ata || ""} name="link_ata" />
            </label>
            <label className="form-grid__full">
              <span>Observacao</span>
              <textarea defaultValue={editingMeeting?.observacao || ""} name="observacao" rows="3" />
            </label>
            <div className="form-grid__full editor-form-actions">
              <span className="muted">
                Alteracao registrada para {user?.primeiroNome || "usuario autenticado"}.
              </span>
              <button className="primary-button" disabled={saving} type="submit">
                {saving ? "Salvando..." : "Salvar reuniao"}
              </button>
            </div>
            {editorError ? <div className="inline-message danger-text">{editorError}</div> : null}
          </form>
        </EditFormModal>
      ) : null}

      <ConfirmActionModal
        confirmLabel="Excluir reuniao"
        description={
          meetingToDelete
            ? `A reuniao "${meetingToDelete.id_reuniao}" sera removida permanentemente.`
            : ""
        }
        onCancel={() => {
          if (!deletingMeeting) {
            setMeetingToDelete(null);
          }
        }}
        onConfirm={() => meetingToDelete && handleDeleteMeeting(meetingToDelete)}
        open={Boolean(meetingToDelete)}
        processing={deletingMeeting}
        title="Excluir reuniao"
      />
    </div>
  );
};

export default CalendarioReunioes;
