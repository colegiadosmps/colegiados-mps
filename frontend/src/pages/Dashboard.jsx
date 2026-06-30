import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CardColegiado from "../components/CardColegiado";
import CardResumo from "../components/CardResumo";
import GraficoBarras from "../components/GraficoBarras";
import GraficoPizza from "../components/GraficoPizza";
import Loading from "../components/Loading";
import { api } from "../services/api";

const Dashboard = () => {
  const [resumo, setResumo] = useState(null);
  const [graficos, setGraficos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/api/dashboard"), api.get("/api/dashboard/graficos")])
      .then(([resumoResult, graficosResult]) => {
        setResumo(resumoResult);
        setGraficos(graficosResult);
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div className="empty-state">{error}</div>;
  }

  if (!resumo || !graficos) {
    return <Loading label="Montando o painel de consulta..." />;
  }

  return (
    <div className="page-content">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Painel de consulta</p>
          <h2>Consulte colegiados, integrantes, reunioes e publicacoes com base sincronizada do Google Drive.</h2>
        </div>
        <div className="hero-highlight">
          <span>Ultima sincronizacao</span>
          <strong>
            {resumo.ultima_sincronizacao?.data_sincronizacao || "Ainda nao realizada"}
          </strong>
          <small>{resumo.ultima_sincronizacao?.status || "Sem historico"}</small>
        </div>
      </section>

      <section className="summary-grid">
        <CardResumo titulo="Colegiados" valor={resumo.total_colegiados} detalhe="Base total consolidada" />
        <CardResumo titulo="Internos" valor={resumo.total_colegiados_internos} detalhe="Colegiados classificados como internos" />
        <CardResumo titulo="Externos" valor={resumo.total_colegiados_externos} detalhe="Colegiados classificados como externos" />
        <CardResumo titulo="Integrantes" valor={resumo.total_membros} detalhe="Registros sincronizados" />
        <CardResumo titulo="Ativos" valor={resumo.total_membros_ativos} detalhe="Situacao vigente" />
        <CardResumo titulo="Reunioes" valor={resumo.total_reunioes} detalhe="Agenda e historico consolidados" />
        <CardResumo titulo="Publicacoes" valor={resumo.total_pastas_publicacoes} detalhe="Pastas de documentos vinculadas" />
      </section>

      <section className="quick-links">
        <Link className="quick-link-card" to="/colegiados/internos">Colegiados Internos</Link>
        <Link className="quick-link-card" to="/colegiados/externos">Colegiados Externos</Link>
        <Link className="quick-link-card" to="/integrantes">Integrantes</Link>
        <Link className="quick-link-card" to="/calendario-reunioes">Calendario de Reunioes</Link>
        <Link className="quick-link-card" to="/historico-reunioes">Historico de Reunioes</Link>
        <Link className="quick-link-card" to="/publicacoes">Publicacoes</Link>
        <Link className="quick-link-card" to="/status-base">Status da Base</Link>
      </section>

      <section className="charts-grid">
        <GraficoPizza data={graficos.colegiados_por_tipo} title="Colegiados por tipo" />
        <GraficoBarras data={graficos.membros_por_colegiado} title="Integrantes por colegiado" />
        <GraficoPizza data={graficos.membros_ativos_inativos} title="Ativos x inativos" />
        <GraficoBarras data={graficos.reunioes_por_status} title="Reunioes por status" color="#2f7d4f" />
      </section>

      <section>
        <div className="section-heading">
          <h2>Colegiados em destaque</h2>
          <p>Consulta rapida por colegiado com atalhos para detalhes, integrantes e publicacoes.</p>
        </div>
        <div className="entity-grid">
          {resumo.colegiados_com_resumo.map((colegiado) => (
            <CardColegiado key={colegiado.sigla} colegiado={colegiado} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
