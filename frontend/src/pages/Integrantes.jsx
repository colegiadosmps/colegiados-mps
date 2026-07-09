import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  HiOutlinePauseCircle,
  HiOutlinePencilSquare,
  HiOutlinePlayCircle,
  HiOutlineTrash,
  HiOutlineUsers,
} from "react-icons/hi2";
import ClearFiltersButton from "../components/ClearFiltersButton";
import ConfirmActionModal from "../components/common/ConfirmActionModal";
import EditFormModal from "../components/EditFormModal";
import FilterBox from "../components/FilterBox";
import FilterDropdown from "../components/FilterDropdown";
import GraficoBarras from "../components/GraficoBarras";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import TabelaMembros from "../components/TabelaMembros";
import { useAuthSession } from "../context/AuthSessionContext";
import { api } from "../services/api";
import { formatColegiadoDisplayName } from "../services/formatters";
import { ALL_VALUE, buildOptions, normalizeFilterValue } from "../services/filterUtils";

const aggregateBy = (rows, key) => {
  const counts = new Map();
  rows.forEach((row) => {
    const label = row[key] || "Nao informado";
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));
};

const Integrantes = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { canEditContent, token, user } = useAuthSession();
  const [membros, setMembros] = useState([]);
  const [colegiados, setColegiados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [deletingMember, setDeletingMember] = useState(false);
  const [editorError, setEditorError] = useState("");
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({
    colegiado: normalizeFilterValue(searchParams.get("colegiado")),
    nome: searchParams.get("nome") || "",
    tipo_vinculo: normalizeFilterValue(searchParams.get("tipo_vinculo")),
    papel: normalizeFilterValue(searchParams.get("papel")),
  });

  const loadData = () =>
    Promise.all([api.get("/api/membros"), api.get("/api/colegiados")])
      .then(([membrosResult, colegiadosResult]) => {
        setMembros(membrosResult);
        setColegiados(colegiadosResult);
      });

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.colegiado !== ALL_VALUE) {
      params.set("colegiado", filters.colegiado);
    }
    if (filters.nome) {
      params.set("nome", filters.nome);
    }
    if (filters.tipo_vinculo !== ALL_VALUE) {
      params.set("tipo_vinculo", filters.tipo_vinculo);
    }
    if (filters.papel !== ALL_VALUE) {
      params.set("papel", filters.papel);
    }
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  const filteredMembros = useMemo(() => {
    const searchTerm = filters.nome.toLowerCase();
    return membros.filter((membro) => {
      const matchesColegiado =
        filters.colegiado === ALL_VALUE ||
        membro.sigla_colegiado === filters.colegiado ||
        formatColegiadoDisplayName(membro.sigla_colegiado) === filters.colegiado;
      const matchesNome =
        !searchTerm || membro.nome_membro?.toLowerCase().includes(searchTerm);
      const matchesTipo =
        filters.tipo_vinculo === ALL_VALUE || membro.tipo_vinculo === filters.tipo_vinculo;
      const matchesPapel = filters.papel === ALL_VALUE || membro.papel === filters.papel;
      return matchesColegiado && matchesNome && matchesTipo && matchesPapel;
    });
  }, [filters, membros]);

  const handleDeleteMember = async (row) => {
    setDeletingMember(true);
    try {
      await api.delete(`/api/membros/${row.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await loadData();
      setMemberToDelete(null);
    } catch (error) {
      setEditorError(error.message);
      setEditorOpen(true);
    } finally {
      setDeletingMember(false);
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
              aria-label={`Editar integrante ${row.nome_membro}`}
              className="icon-button--edit"
              onClick={() => {
                setEditingMember(row);
                setEditorError("");
                setEditorOpen(true);
              }}
              type="button"
            >
              <HiOutlinePencilSquare />
            </button>
            <button
              aria-label={row.ativo === "Sim" ? `Inativar integrante ${row.nome_membro}` : `Reativar integrante ${row.nome_membro}`}
              className="icon-button--toggle"
              onClick={async () => {
                try {
                  await api.put(
                    `/api/membros/${row.id}`,
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
              aria-label={`Excluir integrante ${row.nome_membro}`}
              className="icon-button--delete"
              onClick={() => setMemberToDelete(row)}
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
        nome_membro: formData.get("nome_membro"),
        sigla_colegiado: formData.get("sigla_colegiado"),
        unidade: formData.get("unidade"),
        tipo_vinculo: formData.get("tipo_vinculo"),
        papel: formData.get("papel"),
        detalhamento_papel: formData.get("detalhamento_papel"),
        inicio_vigencia: formData.get("inicio_vigencia"),
        fim_vigencia: formData.get("fim_vigencia"),
        email_institucional: formData.get("email_institucional"),
        telefone_institucional: formData.get("telefone_institucional"),
        ativo: formData.get("ativo"),
        observacao: formData.get("observacao"),
        sigla_colegiado_pai:
          colegiados.find((item) => item.sigla === formData.get("sigla_colegiado"))
            ?.sigla_colegiado_pai || "",
      };

      const requestOptions = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      if (editingMember?.id) {
        await api.put(`/api/membros/${editingMember.id}`, payload, requestOptions);
      } else {
        await api.post("/api/membros", payload, requestOptions);
      }

      await loadData();
      setEditorOpen(false);
      setEditingMember(null);
    } catch (error) {
      setEditorError(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading label="Carregando integrantes..." />;
  }

  return (
    <div className="page-content">
      <PageHeader
        filters={
          <>
            <FilterDropdown
              label="Colegiado"
              options={buildOptions(
                colegiados.map((item) =>
                  formatColegiadoDisplayName(item.sigla_exibicao || item.sigla),
                ),
              )}
              value={filters.colegiado}
              onChange={(value) => setFilters((current) => ({ ...current, colegiado: value }))}
            />
            <FilterBox label="Nome">
              <input
                value={filters.nome}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, nome: event.target.value }))
                }
                placeholder="Buscar por nome"
              />
            </FilterBox>
            <FilterDropdown
              label="Tipo de Vinculo"
              options={buildOptions(membros.map((item) => item.tipo_vinculo))}
              value={filters.tipo_vinculo}
              onChange={(value) =>
                setFilters((current) => ({ ...current, tipo_vinculo: value }))
              }
            />
            <FilterDropdown
              label="Papel"
              options={buildOptions(membros.map((item) => item.papel))}
              value={filters.papel}
              onChange={(value) => setFilters((current) => ({ ...current, papel: value }))}
            />
            <ClearFiltersButton
              onClick={() =>
                setFilters({
                  colegiado: ALL_VALUE,
                  nome: "",
                  tipo_vinculo: ALL_VALUE,
                  papel: ALL_VALUE,
                })
              }
            />
          </>
        }
        filtersClassName="page-header__filters--inline"
        icon={HiOutlineUsers}
        metricCaption="Total de integrantes ativos"
        metricIcon={HiOutlineUsers}
        metricLabel="Integrantes"
        metricTone="blue"
        metricValue={filteredMembros.length}
        subtitle="Consulte e analise os integrantes vinculados aos colegiados."
        title="Integrantes"
      />

      <section className="content-card">
        <div className="section-heading">
          <div>
            <h3>Base de Integrantes</h3>
            <p>Tabela consolidada com filtros e operacoes permitidas ao perfil autenticado.</p>
          </div>
          {canEditContent ? (
            <button
              className="success-button"
              onClick={() => {
                setEditingMember(null);
                setEditorError("");
                setEditorOpen(true);
              }}
              type="button"
            >
              Adicionar integrante
            </button>
          ) : null}
        </div>
        <TabelaMembros extraColumns={actionColumns} membros={filteredMembros} />
      </section>

      <section className="charts-grid">
        <GraficoBarras
          data={aggregateBy(filteredMembros, "tipo_vinculo")}
          title="Tipo de Vinculo"
          color="#37b45b"
        />
        <GraficoBarras
          data={aggregateBy(filteredMembros, "papel")}
          title="Papel"
          color="#7a45e6"
        />
      </section>

      {editorOpen ? (
        <EditFormModal
          onClose={() => {
            setEditorOpen(false);
            setEditingMember(null);
          }}
          title={editingMember ? "Editar integrante" : "Adicionar integrante"}
        >
          <form className="form-grid" onSubmit={handleSave}>
            <label>
              <span>Nome</span>
              <input defaultValue={editingMember?.nome_membro || ""} name="nome_membro" required />
            </label>
            <label>
              <span>Colegiado</span>
              <select
                defaultValue={editingMember?.sigla_colegiado || filters.colegiado || ""}
                name="sigla_colegiado"
                required
              >
                <option value="">Selecione</option>
                {colegiados.map((item) => (
                  <option key={item.sigla} value={item.sigla}>
                    {formatColegiadoDisplayName(item.sigla_exibicao || item.sigla)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Tipo de Vinculo</span>
              <input defaultValue={editingMember?.tipo_vinculo || ""} name="tipo_vinculo" />
            </label>
            <label>
              <span>Papel</span>
              <input defaultValue={editingMember?.papel || ""} name="papel" />
            </label>
            <label>
              <span>Unidade</span>
              <input
                defaultValue={editingMember?.unidade || editingMember?.sigla_colegiado_pai || ""}
                name="unidade"
              />
            </label>
            <label>
              <span>Status</span>
              <select defaultValue={editingMember?.ativo || "Sim"} name="ativo">
                <option value="Sim">Ativo</option>
                <option value="Nao">Inativo</option>
              </select>
            </label>
            <label>
              <span>Inicio</span>
              <input defaultValue={editingMember?.inicio_vigencia || ""} name="inicio_vigencia" />
            </label>
            <label>
              <span>Fim</span>
              <input defaultValue={editingMember?.fim_vigencia || ""} name="fim_vigencia" />
            </label>
            <label>
              <span>Email</span>
              <input
                defaultValue={editingMember?.email_institucional || ""}
                name="email_institucional"
                type="email"
              />
            </label>
            <label>
              <span>Telefone</span>
              <input
                defaultValue={editingMember?.telefone_institucional || ""}
                name="telefone_institucional"
              />
            </label>
            <label className="form-grid__full">
              <span>Detalhamento do Papel</span>
              <textarea
                defaultValue={editingMember?.detalhamento_papel || ""}
                name="detalhamento_papel"
                rows="3"
              />
            </label>
            <label className="form-grid__full">
              <span>Observacao</span>
              <textarea defaultValue={editingMember?.observacao || ""} name="observacao" rows="3" />
            </label>
            <div className="form-grid__full editor-form-actions">
              <span className="muted">
                Alteracao registrada para {user?.primeiroNome || "usuario autenticado"}.
              </span>
              <button className="primary-button" disabled={saving} type="submit">
                {saving ? "Salvando..." : "Salvar integrante"}
              </button>
            </div>
            {editorError ? <div className="inline-message danger-text">{editorError}</div> : null}
          </form>
        </EditFormModal>
      ) : null}

      <ConfirmActionModal
        confirmLabel="Excluir integrante"
        description={
          memberToDelete
            ? `O integrante "${memberToDelete.nome_membro}" sera removido permanentemente.`
            : ""
        }
        onCancel={() => {
          if (!deletingMember) {
            setMemberToDelete(null);
          }
        }}
        onConfirm={() => memberToDelete && handleDeleteMember(memberToDelete)}
        open={Boolean(memberToDelete)}
        processing={deletingMember}
        title="Excluir integrante"
      />
    </div>
  );
};

export default Integrantes;
