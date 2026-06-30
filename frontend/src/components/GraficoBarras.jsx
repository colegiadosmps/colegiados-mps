import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const GraficoBarras = ({ data, dataKey = "value", title, color = "#1f4f82" }) => (
  <article className="chart-card">
    <div className="section-heading">
      <h3>{title}</h3>
    </div>
    <div className="chart-area">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d8e2ee" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} />
          <YAxis tickLine={false} axisLine={false} />
          <Tooltip />
          <Bar dataKey={dataKey} fill={color} radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </article>
);

export default GraficoBarras;
