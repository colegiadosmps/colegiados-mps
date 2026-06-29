import { useEffect, useState } from "react";
import { api } from "../services/api";
import CardResumo from "../components/CardResumo";
import CardColegiado from "../components/CardColegiado";
import Loading from "../components/Loading";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/dashboard")
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return <div className="empty-state">{error}</div>;
  }

  if (!data) {
    return <Loading label="Montando o painel institucional..." />;
  }

  return (
    <div className="page-content">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Visao geral</p>
          <h2>Acompanhe colegiados, membros, reunioes e publicacoes em um unico lugar.</h2>
        </div>
        <div className="hero-highlight">
          <span>Ultima importacao</span>
          <strong>{data.ultima_importacao || "Ainda nao realizada"}</strong>
        </div>
      </section>

      <section className="summary-grid">
        <CardResumo titulo="Colegiados" valor={data.total_colegiados} detalhe="Cadastro total ativo no painel" />
        <CardResumo titulo="Membros" valor={data.total_membros} detalhe="Registros consolidados na base" />
        <CardResumo titulo="Membros ativos" valor={data.total_membros_ativos} detalhe="Situacao atual de vigencia" />
        <CardResumo titulo="Reunioes" valor={data.total_reunioes} detalhe="Historico importado dos colegiados" />
        <CardResumo titulo="Pastas de publicacoes" valor={data.total_pastas_publicacoes} detalhe="Links de referencia cadastrados" />
      </section>

      <section>
        <div className="section-heading">
          <h2>Colegiados em destaque</h2>
          <p>Atalhos rapidos para consulta operacional por colegiado.</p>
        </div>
        <div className="entity-grid">
          {data.colegiados.map((colegiado) => (
            <CardColegiado key={colegiado.sigla} colegiado={colegiado} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
