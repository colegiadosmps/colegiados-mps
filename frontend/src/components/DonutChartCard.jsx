import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ChartCard from "./ChartCard";
import ExpandedChartModal from "./ExpandedChartModal";

const TooltipContent = ({ active, payload }) => {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid rgba(10, 45, 94, 0.1)",
        borderRadius: "14px",
        padding: "0.75rem 0.9rem",
        boxShadow: "0 12px 24px rgba(11, 47, 79, 0.08)",
      }}
    >
      <p style={{ margin: 0, color: "#0b2f4f", fontWeight: 600 }}>
        {payload[0]?.payload?.label || "Sem dados"}
      </p>
      <p style={{ margin: "0.35rem 0 0", color: "#2563eb" }}>
        Total: {payload[0]?.value ?? 0}
      </p>
    </div>
  );
};

const DonutChartCard = ({ colors, data, title }) => {
  const [expanded, setExpanded] = useState(false);
  const normalizedData = data.filter((item) => item.value > 0);
  const chartData = normalizedData.length ? normalizedData : [{ label: "Sem dados", value: 1 }];
  const total = normalizedData.reduce((sum, item) => sum + item.value, 0);
  const hasData = normalizedData.length > 0;

  const renderChart = (mode = "compact") => (
    <div
      className={`donut-card ${mode === "expanded" ? "donut-card--expanded" : ""} ${
        !hasData ? "donut-card--empty" : ""
      }`.trim()}
    >
      <div className="donut-card__chart">
        <ResponsiveContainer width="100%" height={mode === "expanded" ? 320 : 240}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              dataKey="value"
              innerRadius={mode === "expanded" ? 88 : 68}
              outerRadius={mode === "expanded" ? 126 : 92}
              paddingAngle={normalizedData.length ? 4 : 0}
              stroke="none"
            >
              {chartData.map((item, index) => (
                <Cell
                  fill={normalizedData.length ? colors[index % colors.length] : "#dbe6f2"}
                  key={item.label}
                />
              ))}
            </Pie>
            <Tooltip content={<TooltipContent />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-card__center">
          <strong>{total}</strong>
          <span>{total ? "Total" : "Sem dados"}</span>
        </div>
      </div>
      {hasData ? (
        <div className="donut-card__legend">
          {data.map((item, index) => {
            const percentage = total ? ((item.value / total) * 100).toFixed(1).replace(".", ",") : "0,0";

            return (
              <div className="donut-card__legend-item" key={item.label}>
                <span className="donut-card__legend-label">
                  <i style={{ background: colors[index % colors.length] }} />
                  {item.label}
                </span>
                <strong>
                  {item.value} ({percentage}%)
                </strong>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );

  return (
    <>
      <ChartCard
        bodyClassName="chart-card__body--chart chart-card__body--donut"
        interactive
        onBodyClick={() => setExpanded(true)}
        title={title}
      >
        {renderChart()}
      </ChartCard>
      {expanded ? (
        <ExpandedChartModal
          bodyClassName="chart-modal__body--no-scroll"
          onClose={() => setExpanded(false)}
          title={title}
        >
          {renderChart("expanded")}
        </ExpandedChartModal>
      ) : null}
    </>
  );
};

export default DonutChartCard;
