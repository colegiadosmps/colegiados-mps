import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = ["#1f4f82", "#5c8fc7", "#88b4de", "#2f7d4f", "#d8e2ee", "#a54a4a"];

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
          <Tooltip content={<TooltipContent />} />
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
