import { useEffect, useState } from "react";
import { HiOutlineCircleStack } from "react-icons/hi2";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import PowerBiTable from "../components/PowerBiTable";
import { api } from "../services/api";

const historicoColumns = [
  { key: "data_sincronizacao", label: "Data", width: "180px" },
  { key: "status", label: "Status", width: "180px" },
  { key: "total_pastas_encontradas", label: "Pastas", width: "90px" },
  { key: "total_arquivos_encontrados", label: "Arquivos", width: "90px" },
  { key: "total_arquivos_processados", label: "Processados", width: "110px" },
  { key: "total_registros_membros", label: "Membros", width: "90px" },
  { key: "total_registros_reunioes", label: "Reunioes", width: "90px" },
  { key: "observacao", label: "Observacao", width: "260px", className: "cell-wrap" },
];

const arquivosColumns = [
  { key: "arquivo", label: "Arquivo", width: "280px", className: "cell-wrap" },
  { key: "tipo", label: "Tipo", width: "120px" },
  { key: "sigla_colegiado", label: "Colegiado", width: "120px" },
  { key: "data_base", label: "Data Base", width: "120px" },
  { key: "quantidade_registros", label: "Qtd.", width: "90px" },
  { key: "status", label: "Status", width: "140px" },
  { key: "observacao", label: "Observacao", width: "280px", className: "cell-wrap" },
];

const StatusBase = () => {
  const [historico, setHistorico] = useState(null);
  const [detalheAtual, setDetalheAtual] = useState(null);
  const [driveStatus, setDriveStatus] = useState(null);

  const loadData = () =>
    Promise.all([
      api.get("/api/sincronizacoes"),
      api.get("/api/importacoes/google-drive/status"),
    ]).then(async ([historicoResult, driveStatusResult]) => {
      setHistorico(historicoResult);
      setDriveStatus(driveStatusResult);

      if (historicoResult[0]) {
        const detalhe = await api.get(`/api/sincronizacoes/${historicoResult[0].id}`);
        setDetalheAtual(detalhe);
      } else {
        setDetalheAtual(null);
      }
    });

  useEffect(() => {
    loadData();
  }, []);

  if (!historico || !driveStatus) {
    return <Loading label="Carregando status da base..." />;
  }

  const ultima = historico[0];

  return (
    <div className="page-content">
      <PageHeader
        filters={null}
        icon={HiOutlineCircleStack}
        metricLabel="Ultima sincronizacao"
        metricValue={ultima?.total_arquivos_processados || 0}
        subtitle="Painel tecnico para consulta do historico de sincronizacao e dos arquivos processados."
        title="Status da Base"
      />

      <section className="content-card">
        <div className="status-grid">
          <div className="status-item">
            <span>Google Drive</span>
            <strong>{driveStatus.configured ? "Configurado" : "Nao configurado"}</strong>
          </div>
          <div className="status-item">
            <span>Ultima sincronizacao</span>
            <strong>{ultima?.data_sincronizacao || "-"}</strong>
          </div>
          <div className="status-item">
            <span>Pastas encontradas</span>
            <strong>{ultima?.total_pastas_encontradas || 0}</strong>
          </div>
          <div className="status-item">
            <span>Arquivos encontrados</span>
            <strong>{ultima?.total_arquivos_encontrados || 0}</strong>
          </div>
          <div className="status-item">
            <span>Arquivos processados</span>
            <strong>{ultima?.total_arquivos_processados || 0}</strong>
          </div>
          <div className="status-item">
            <span>Publicacoes</span>
            <strong>{ultima?.total_pastas_publicacoes || 0}</strong>
          </div>
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <h3>Historico de Sincronizacoes</h3>
          <p>{historico.length} execucao(oes) registradas.</p>
        </div>
        <PowerBiTable
          columns={historicoColumns}
          emptyMessage="Nenhuma sincronizacao registrada."
          rows={historico}
        />
      </section>

      <section className="content-card">
        <div className="section-heading">
          <h3>Arquivos da Ultima Sincronizacao</h3>
          <p>{detalheAtual?.arquivos?.length || 0} arquivo(s) registrados.</p>
        </div>
        <PowerBiTable
          columns={arquivosColumns}
          emptyMessage="Nenhum arquivo registrado na ultima sincronizacao."
          rows={detalheAtual?.arquivos || []}
        />
      </section>
    </div>
  );
};

export default StatusBase;
