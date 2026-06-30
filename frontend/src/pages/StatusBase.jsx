import { useEffect, useState } from "react";
import Loading from "../components/Loading";
import { api } from "../services/api";

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
      <section className="content-card">
        <div className="section-heading">
          <h2>Status da base</h2>
          <p>Painel tecnico de sincronizacao com Google Drive.</p>
        </div>
        <div className="status-grid">
          <div className="status-item"><span>Google Drive</span><strong>{driveStatus.configured ? "Configurado" : "Nao configurado"}</strong></div>
          <div className="status-item"><span>Ultima sincronizacao</span><strong>{ultima?.data_sincronizacao || "-"}</strong></div>
          <div className="status-item"><span>Pastas encontradas</span><strong>{ultima?.total_pastas_encontradas || 0}</strong></div>
          <div className="status-item"><span>Arquivos encontrados</span><strong>{ultima?.total_arquivos_encontrados || 0}</strong></div>
          <div className="status-item"><span>Arquivos processados</span><strong>{ultima?.total_arquivos_processados || 0}</strong></div>
          <div className="status-item"><span>Pastas de publicacoes</span><strong>{ultima?.total_pastas_publicacoes || 0}</strong></div>
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <h2>Historico de sincronizacoes</h2>
          <p>{historico.length} execucao(oes) registradas.</p>
        </div>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Status</th>
                <th>Pastas</th>
                <th>Arquivos</th>
                <th>Processados</th>
                <th>Membros</th>
                <th>Reunioes</th>
                <th>Observacao</th>
              </tr>
            </thead>
            <tbody>
              {historico.map((item) => (
                <tr key={item.id}>
                  <td>{item.data_sincronizacao}</td>
                  <td>{item.status}</td>
                  <td>{item.total_pastas_encontradas}</td>
                  <td>{item.total_arquivos_encontrados}</td>
                  <td>{item.total_arquivos_processados}</td>
                  <td>{item.total_registros_membros}</td>
                  <td>{item.total_registros_reunioes}</td>
                  <td>{item.observacao || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="content-card">
        <div className="section-heading">
          <h2>Arquivos da ultima sincronizacao</h2>
          <p>{detalheAtual?.arquivos?.length || 0} arquivo(s) registrados.</p>
        </div>
        {detalheAtual?.arquivos?.length ? (
          <div className="table-shell">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Arquivo</th>
                  <th>Tipo</th>
                  <th>Colegiado</th>
                  <th>Data base</th>
                  <th>Qtd.</th>
                  <th>Status</th>
                  <th>Observacao</th>
                </tr>
              </thead>
              <tbody>
                {detalheAtual.arquivos.map((item) => (
                  <tr key={item.id}>
                    <td>{item.arquivo}</td>
                    <td>{item.tipo}</td>
                    <td>{item.sigla_colegiado}</td>
                    <td>{item.data_base || "-"}</td>
                    <td>{item.quantidade_registros}</td>
                    <td>{item.status}</td>
                    <td>{item.observacao || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">Nenhum arquivo registrado na ultima sincronizacao.</div>
        )}
      </section>
    </div>
  );
};

export default StatusBase;
