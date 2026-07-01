import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { HiOutlineHome } from "react-icons/hi2";
import CardResumo from "../components/CardResumo";
import GraficoBarras from "../components/GraficoBarras";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import { api } from "../services/api";

const aggregateBy = (rows, key, fallback = "Nao informado") => {
  const counts = new Map();

  rows.forEach((row) => {
    const label = row[key] || fallback;
    counts.set(label, (counts.get(label) || 0) + 1);
  });

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label));
};

const Dashboard = () => {
  const [resumo, setResumo] = useState(null);
  const [membros, setMembros] = useState([]);
  const [reunioes, setReunioes] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      api.get("/api/dashboard"),
      api.get("/api/membros"),
      api.get("/api/reunioes"),
      api.get("/api/colegiados?categoria=Externo"),
    ])
      .then(([resumoResult, membrosResult, reunioesResult, externosResult]) => {
        setResumo({
          ...resumoResult,
          colegiados_externos_detalhe: externosResult,
        });
        setMembros(membrosResult);
        setReunioes(reunioesResult);
      })
      .catch((requestError) => setError(requestError.message));
  }, []);

  const derived = useMemo(() => {
    if (!resumo) {
      return null;
    }

    const internos = resumo.colegiados_com_resumo.filter((item) => item.categoria === "Interno");
    const externos = resumo.colegiados_externos_detalhe || [];

    return {
      totalInternos: internos.length,
      totalExternos: externos.length,
      totalIntegrantes: membros.length,
      totalReunioes: reunioes.length,
      totalPlanejadas: reunioes.filter((item) => item.status_reuniao === "Planejada").length,
      totalRealizadas: reunioes.filter((item) => item.status_reuniao === "Realizada").length,
      totalTitulares: membros.filter((item) => item.tipo_vinculo === "Titular").length,
      totalSuplentes: membros.filter((item) => item.tipo_vinculo === "Suplente").length,
      charts: {
        internosPorTipo: aggregateBy(internos, "tipo"),
        externosPorOrgao: aggregateBy(
          externos.map((item) => ({
            ...item,
            orgao_resumo: item.orgao || item.sigla || "Nao informado",
          })),
          "orgao_resumo",
        ),
        integrantesPorColegiado: aggregateBy(membros, "sigla_colegiado"),
        integrantesPorVinculo: aggregateBy(membros, "tipo_vinculo"),
        integrantesPorPapel: aggregateBy(membros, "papel"),
        reunioesPorStatus: aggregateBy(reunioes, "status_reuniao"),
      },
    };
  }, [membros, reunioes, resumo]);

  if (error) {
    return <div className="empty-state">{error}</div>;
  }

  if (!resumo || !derived) {
    return <Loading label="Montando dashboard..." />;
  }

  return (
    <div className="page-content">
      <PageHeader
        filters={null}
        icon={HiOutlineHome}
        subtitle="Visao geral dos colegiados, integrantes e reunioes carregados no sistema."
        title="Dashboard"
      />

      <section className="metric-grid">
        <Link className="dashboard-card-link" to="/colegiados/internos">
          <CardResumo titulo="Total de Colegiados Internos" valor={derived.totalInternos} />
        </Link>
        <Link className="dashboard-card-link" to="/colegiados/externos">
          <CardResumo titulo="Total de Colegiados Externos" valor={derived.totalExternos} />
        </Link>
        <Link className="dashboard-card-link" to="/integrantes">
          <CardResumo titulo="Total de Integrantes" valor={derived.totalIntegrantes} />
        </Link>
        <CardResumo titulo="Total de Reunioes" valor={derived.totalReunioes} />
        <CardResumo titulo="Reunioes Planejadas" valor={derived.totalPlanejadas} />
        <CardResumo titulo="Reunioes Realizadas" valor={derived.totalRealizadas} />
        <CardResumo titulo="Total de Titulares" valor={derived.totalTitulares} />
        <CardResumo titulo="Total de Suplentes" valor={derived.totalSuplentes} />
      </section>

      <section className="charts-grid">
        <GraficoBarras
          data={derived.charts.internosPorTipo}
          title="Distribuicao de Colegiados Internos por Tipo"
        />
        <GraficoBarras
          color="#12689a"
          data={derived.charts.externosPorOrgao}
          title="Quantidade de Colegiados Externos por Orgao"
        />
        <GraficoBarras
          color="#0b5f8f"
          data={derived.charts.integrantesPorColegiado}
          title="Quantidade de Integrantes por Colegiado"
        />
        <GraficoBarras
          color="#2f7d4f"
          data={derived.charts.integrantesPorVinculo}
          title="Quantidade de Integrantes por Tipo de Vinculo"
        />
        <GraficoBarras
          color="#12567a"
          data={derived.charts.integrantesPorPapel}
          title="Quantidade de Integrantes por Papel"
        />
        <GraficoBarras
          color="#315f97"
          data={derived.charts.reunioesPorStatus}
          title="Resumo de Reunioes por Status"
        />
      </section>
    </div>
  );
};

export default Dashboard;
