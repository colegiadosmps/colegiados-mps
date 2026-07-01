import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import ChartCard from "./ChartCard";

const DonutChartCard = ({ colors, data, title }) => {
  const normalizedData = data.filter((item) => item.value > 0);
  const chartData = normalizedData.length ? normalizedData : [{ label: "Sem dados", value: 1 }];
  const total = normalizedData.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartCard title={title}>
      <div className="donut-card">
        <div className="donut-card__chart">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                dataKey="value"
                innerRadius={68}
                outerRadius={92}
                paddingAngle={normalizedData.length ? 4 : 0}
                stroke="none"
              >
                {chartData.map((item, index) => (
                  <Cell
                    fill={
                      normalizedData.length
                        ? colors[index % colors.length]
                        : "#dbe6f2"
                    }
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
      </div>
    </ChartCard>
  );
};

export default DonutChartCard;
