import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard from "./ChartCard";

const HorizontalBarChart = ({ color = "#0b5f8f", data, title }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const sync = () => setIsMobile(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  const chartHeight = useMemo(() => {
    const rowHeight = isMobile ? 44 : 52;
    const baseHeight = isMobile ? 70 : 88;
    const minHeight = isMobile ? 170 : 220;
    const maxHeight = isMobile ? 280 : 420;
    return Math.min(maxHeight, Math.max(minHeight, data.length * rowHeight + baseHeight));
  }, [data.length, isMobile]);

  return (
    <ChartCard title={title}>
      <div className="chart-area chart-area--horizontal">
        <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={data}
          layout="vertical"
          margin={isMobile ? { top: 4, right: 18, left: 0, bottom: 4 } : { top: 6, right: 28, left: 12, bottom: 6 }}
        >
          <CartesianGrid stroke="#d4dfeb" strokeDasharray="2 4" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: isMobile ? 11 : 13 }} />
          <YAxis
            dataKey="label"
            type="category"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: isMobile ? 11 : 13 }}
            width={isMobile ? 88 : 110}
          />
          <Tooltip cursor={{ fill: "rgba(11, 95, 143, 0.08)" }} />
          <Bar dataKey="value" fill={color} radius={[0, 10, 10, 0]}>
            <LabelList dataKey="value" position="right" fill="#0b2f4f" fontSize={isMobile ? 11 : 13} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </ChartCard>
  );
};

export default HorizontalBarChart;
