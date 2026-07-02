import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  HiOutlineBuildingLibrary,
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
  HiOutlineHome,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineUser,
} from "react-icons/hi2";
import CardResumo from "../components/CardResumo";
import DonutChartCard from "../components/DonutChartCard";
import GraficoBarras from "../components/GraficoBarras";
import Loading from "../components/Loading";
import PageHeader from "../components/PageHeader";
import { api } from "../services/api";
import { formatColegiadoDisplayName } from "../services/formatters";

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
        subtitle="Visao geral dos colegiados, integrantes e reunioes com dados atualizados e indicadores estrategicos."
        title="Dashboard"
      />

      <section className="metric-grid metric-grid--dashboard">
        <Link className="dashboard-card-link" to="/colegiados/internos">
          <CardResumo
            caption="Painel interno"
            icone={HiOutlineBuildingLibrary}
            titulo="Colegiados Internos"
            tone="blue"
            valor={derived.totalInternos}
          />
        </Link>
        <Link className="dashboard-card-link" to="/colegiados/externos">
          <CardResumo
            caption="Vinculos externos"
            icone={HiOutlineBuildingLibrary}
            titulo="Colegiados Externos"
            tone="green"
            valor={derived.totalExternos}
          />
        </Link>
        <Link className="dashboard-card-link" to="/integrantes">
          <CardResumo
            caption="Base de membros"
            icone={HiOutlineUsers}
            titulo="Integrantes"
            tone="purple"
            valor={derived.totalIntegrantes}
          />
        </Link>
        <CardResumo
          caption="Agenda geral"
          icone={HiOutlineCalendarDays}
          titulo="Reunioes"
          tone="amber"
          valor={derived.totalReunioes}
        />
        <CardResumo
          caption="Status previsto"
          icone={HiOutlineCalendarDays}
          titulo="Reunioes Planejadas"
          tone="sky"
          valor={derived.totalPlanejadas}
        />
        <CardResumo
          caption="Status concluido"
          icone={HiOutlineCheckCircle}
          titulo="Reunioes Realizadas"
          tone="green"
          valor={derived.totalRealizadas}
        />
        <CardResumo
          caption="Vinculo principal"
          icone={HiOutlineUser}
          titulo="Titulares"
          tone="sky"
          valor={derived.totalTitulares}
        />
        <CardResumo
          caption="Vinculo de apoio"
          icone={HiOutlineUserGroup}
          titulo="Suplentes"
          tone="purple"
          valor={derived.totalSuplentes}
        />
      </section>

      <section className="charts-grid charts-grid--dashboard">
        <GraficoBarras
          color="#2b74ff"
          data={derived.charts.internosPorTipo}
          title="Distribuicao de Colegiados Internos por Tipo"
        />
        <GraficoBarras
          color="#37b45b"
          data={derived.charts.externosPorOrgao}
          title="Quantidade de Colegiados Externos por Orgao"
        />
        <GraficoBarras
          color="#2b74ff"
          data={derived.charts.integrantesPorColegiado.map((item) => ({
            ...item,
            label: formatColegiadoDisplayName(item.label),
          }))}
          title="Quantidade de Integrantes por Colegiado"
        />
        <DonutChartCard
          colors={["#56c46b", "#5d9cff", "#d5dfeb"]}
          data={derived.charts.integrantesPorVinculo}
          title="Quantidade de Integrantes por Tipo de Vinculo"
        />
        <GraficoBarras
          color="#7a45e6"
          data={derived.charts.integrantesPorPapel}
          title="Quantidade de Integrantes por Papel"
        />
        <DonutChartCard
          colors={["#2b74ff", "#37b45b", "#e14747", "#c6d0dc"]}
          data={derived.charts.reunioesPorStatus}
          title="Resumo de Reunioes por Status"
        />
      </section>
    </div>
  );
};

export default Dashboard;
