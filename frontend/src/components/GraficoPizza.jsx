import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#1f4f82", "#5c8fc7", "#88b4de", "#2f7d4f", "#d8e2ee", "#a54a4a"];

const GraficoPizza = ({ data, dataKey = "value", title }) => (
  <article className="chart-card">
    <div className="section-heading">
      <h3>{title}</h3>
    </div>
    <div className="chart-area">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey="label"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((item, index) => (
              <Cell key={item.label} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className="chart-legend">
      {data.map((item, index) => (
        <span key={item.label}>
          <i style={{ backgroundColor: COLORS[index % COLORS.length] }} />
          {item.label}
        </span>
      ))}
    </div>
  </article>
);

export default GraficoPizza;
