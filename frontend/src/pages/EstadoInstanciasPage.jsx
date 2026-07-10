import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  HiOutlineMap,
  HiOutlinePauseCircle,
  HiOutlinePencilSquare,
  HiOutlinePlayCircle,
  HiOutlineTrash,
} from "react-icons/hi2";
import ClearFiltersButton from "../components/ClearFiltersButton";
import FilterBox from "../components/FilterBox";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import ConfirmActionModal from "../components/common/ConfirmActionModal";
import EmptyStatePanel from "../components/common/EmptyStatePanel";
import { useAuthSession } from "../context/AuthSessionContext";
import { api } from "../services/api";
import {
  formatBooleanStatus,
  formatColegiadoDisplayName,
} from "../services/formatters";

const stopCardClick = (event) => event.stopPropagation();

const EstadoInstanciasPage = () => {
  const navigate = useNavigate();
  const { sigla, uf } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canEditContent, token } = useAuthSession();
  const [payload, setPayload] = useState(null);
  const [municipio, setMunicipio] = useState(searchParams.get("municipio") || "");
  const [instanciaToDelete, setInstanciaToDelete] = useState(null);
  const [deletingInstancia, setDeletingInstancia] = useState(false);

  const loadPayload = (currentMunicipio) => {
    const query = currentMunicipio.trim()
      ? `?municipio=${encodeURIComponent(currentMunicipio.trim())}`
      : "";

    return api.get(`/api/colegiados/${sigla}/instancias/${uf}${query}`).then(setPayload);
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (municipio.trim()) {
      params.set("municipio", municipio.trim());
    }
    setSearchParams(params, { replace: true });
  }, [municipio, setSearchParams]);

  useEffect(() => {
    loadPayload(municipio);
  }, [municipio, sigla, uf]);

  const filtered = useMemo(() => payload?.instancias || [], [payload]);

  if (!payload) {
    return <Loading label="Carregando instancias colegiadas..." />;
  }

  const handleToggleStatus = async (instancia) => {
    try {
      await api.put(
        `/api/colegiados/${instancia.sigla}`,
        { ...instancia, ativo: instancia.ativo === "Sim" ? "Nao" : "Sim" },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      await loadPayload(municipio);
    } catch (error) {
      window.alert(error.message);
    }
  };

  const handleDelete = async (instancia) => {
    setDeletingInstancia(true);
    try {
      await api.delete(`/api/colegiados/${instancia.sigla}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await loadPayload(municipio);
    } catch (error) {
      window.alert(error.message);
    } finally {
      setDeletingInstancia(false);
      setInstanciaToDelete(null);
    }
  };

  const parentDisplayName = formatColegiadoDisplayName(sigla);

  return (
    <div className="page-content">
      <PageHeader
        icon={HiOutlineMap}
        subtitle={`Instancias colegiadas vinculadas ao ${parentDisplayName} no Estado de ${payload.estado || uf}.`}
        title={payload.estado || uf}
      >
        <div className="hero-inline-metric">
          <span>Total de instancias:</span>
          <strong>{filtered.length}</strong>
        </div>
      </PageHeader>

      <section className="content-card instancia-filter-panel">
        <div className="instancia-filter-panel__grid">
          <FilterBox label="Municipio">
            <input
              onChange={(event) => setMunicipio(event.target.value)}
              placeholder="Buscar municipio..."
              value={municipio}
            />
          </FilterBox>
          <ClearFiltersButton onClick={() => setMunicipio("")} />
        </div>
      </section>

      <section className="instancias-grid">
        {filtered.map((instancia) => (
          <article
            className="instancia-card"
            key={instancia.sigla}
            onClick={() => navigate(`/colegiados/${instancia.chave_pasta || instancia.sigla}`)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                navigate(`/colegiados/${instancia.chave_pasta || instancia.sigla}`);
              }
            }}
            role="button"
            tabIndex={0}
          >
            <div className="instancia-card__content">
              <div className="colegiado-tile__header">
                <span className="pill pill--soft">
                  {formatColegiadoDisplayName(instancia.sigla_exibicao || instancia.sigla)}
                </span>
                <div className="colegiado-tile__actions" onClick={stopCardClick}>
                  {canEditContent ? (
                    <>
                      <button
                        aria-label={`Editar ${formatColegiadoDisplayName(instancia.sigla_exibicao || instancia.sigla)}`}
                        className="icon-button--edit"
                        onClick={() => navigate(`/colegiados/${instancia.chave_pasta || instancia.sigla}`)}
                        type="button"
                      >
                        <HiOutlinePencilSquare />
                      </button>
                      <button
                        aria-label={`Excluir ${formatColegiadoDisplayName(instancia.sigla_exibicao || instancia.sigla)}`}
                        className="icon-button--delete"
                        onClick={() => setInstanciaToDelete(instancia)}
                        type="button"
                      >
                        <HiOutlineTrash />
                      </button>
                      <button
                        aria-label={instancia.ativo === "Sim" ? `Inativar ${formatColegiadoDisplayName(instancia.sigla_exibicao || instancia.sigla)}` : `Reativar ${formatColegiadoDisplayName(instancia.sigla_exibicao || instancia.sigla)}`}
                        className="icon-button--toggle"
                        onClick={() => handleToggleStatus(instancia)}
                        title={instancia.ativo === "Sim" ? "Inativar" : "Reativar"}
                        type="button"
                      >
                        {instancia.ativo === "Sim" ? <HiOutlinePauseCircle /> : <HiOutlinePlayCircle />}
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
              <h4>
                {instancia.nome &&
                instancia.nome !== instancia.sigla &&
                instancia.nome !== instancia.sigla_exibicao
                  ? instancia.nome
                  : formatColegiadoDisplayName(instancia.sigla_exibicao || instancia.sigla)}
              </h4>
              <div className="instancia-card__meta">
                <span>{instancia.municipio || "-"}</span>
                <span>{formatBooleanStatus(instancia.ativo)}</span>
                <span>{instancia.membros_count || 0} membros</span>
                <span>{instancia.reunioes_count || 0} reunioes</span>
              </div>
            </div>
            <div className="colegiado-tile__footer">
              <span />
              <button
                className="text-button instancia-card__action"
                onClick={(event) => {
                  stopCardClick(event);
                  navigate(`/colegiados/${instancia.chave_pasta || instancia.sigla}`);
                }}
                type="button"
              >
                Acessar
              </button>
            </div>
          </article>
        ))}
        {!filtered.length ? (
          <EmptyStatePanel
            animation="empty-search"
            message="Nenhuma instancia colegiada encontrada para este Estado."
            title="Sem instancias colegiadas"
          />
        ) : null}
      </section>

      <ConfirmActionModal
        confirmLabel="Excluir instancia"
        description={
          instanciaToDelete
            ? `A instancia colegiada "${formatColegiadoDisplayName(instanciaToDelete.sigla_exibicao || instanciaToDelete.sigla)}" sera removida permanentemente.`
            : ""
        }
        onCancel={() => {
          if (!deletingInstancia) {
            setInstanciaToDelete(null);
          }
        }}
        onConfirm={() => instanciaToDelete && handleDelete(instanciaToDelete)}
        open={Boolean(instanciaToDelete)}
        processing={deletingInstancia}
        title="Excluir instancia colegiada"
      />
    </div>
  );
};

export default EstadoInstanciasPage;
