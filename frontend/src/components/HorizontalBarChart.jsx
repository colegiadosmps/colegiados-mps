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

const HorizontalBarChart = ({ color = "#0b5f8f", data, title }) => (
  <ChartCard title={title}>
    <div className="chart-area chart-area--horizontal">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 6, right: 28, left: 12, bottom: 6 }}
        >
          <CartesianGrid stroke="#d4dfeb" strokeDasharray="2 4" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} />
          <YAxis
            dataKey="label"
            type="category"
            tickLine={false}
            axisLine={false}
            width={110}
          />
          <Tooltip cursor={{ fill: "rgba(11, 95, 143, 0.08)" }} />
          <Bar dataKey="value" fill={color} radius={[0, 10, 10, 0]}>
            <LabelList dataKey="value" position="right" fill="#0b2f4f" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </ChartCard>
);

export default HorizontalBarChart;
