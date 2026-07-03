import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ChartCard from "./ChartCard";
import ExpandedChartModal from "./ExpandedChartModal";

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
            <Tooltip />
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
        <ExpandedChartModal onClose={() => setExpanded(false)} title={title}>
          {renderChart("expanded")}
        </ExpandedChartModal>
      ) : null}
    </>
  );
};

export default DonutChartCard;
