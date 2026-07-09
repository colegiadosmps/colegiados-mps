import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "./ChartCard";

const TooltipContent = ({ active, label, payload }) => {
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
      <p style={{ margin: 0, color: "#0b2f4f", fontWeight: 600 }}>{label}</p>
      <p style={{ margin: "0.35rem 0 0", color: "#2563eb" }}>
        Total: {payload[0]?.value ?? 0}
      </p>
    </div>
  );
};

const GraficoLinha = ({ data, dataKey = "value", title, color = "#2f7d4f" }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const sync = () => setIsMobile(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  return (
    <ChartCard title={title}>
      <div className="chart-area">
        <ResponsiveContainer width="100%" height={isMobile ? 210 : 280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d8e2ee" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: isMobile ? 11 : 13 }}
            interval="preserveStartEnd"
          />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: isMobile ? 11 : 13 }} width={isMobile ? 30 : 42} />
          <Tooltip content={<TooltipContent />} />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={3}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </ChartCard>
  );
};

export default GraficoLinha;
