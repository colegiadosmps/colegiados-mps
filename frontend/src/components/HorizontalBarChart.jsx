import { useEffect, useState } from "react";
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
import ExpandedChartModal from "./ExpandedChartModal";

const wrapLabel = (label, maxCharsPerLine) => {
  const words = String(label || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length <= maxCharsPerLine || !currentLine) {
      currentLine = nextLine;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length ? lines : [String(label || "")];
};

const WrappedYAxisTick = ({ fontSize, maxCharsPerLine, payload, x, y }) => {
  const lines = wrapLabel(payload.value, maxCharsPerLine);
  const lineHeight = fontSize + 5;
  const startY = y - ((lines.length - 1) * lineHeight) / 2;

  return (
    <text fill="#4d6787" fontSize={fontSize} textAnchor="end" x={x - 8} y={startY}>
      {lines.map((line, index) => (
        <tspan key={`${payload.value}-${index}`} x={x - 8} dy={index === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
};

const HorizontalBarChart = ({ color = "#0b5f8f", data, title }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const sync = () => setIsMobile(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  const buildChartMetrics = (mode) => {
    const mobileMode = mode === "compact" ? isMobile : false;
    const maxCharsPerLine = mobileMode ? 16 : mode === "expanded" ? 24 : 18;
    const fontSize = mobileMode ? 11 : 13;
    const lineHeight = fontSize + 5;
    const wrappedLabels = data.map((item) => wrapLabel(item.label, maxCharsPerLine));
    const totalLineCount = wrappedLabels.reduce((sum, lines) => sum + lines.length, 0);
    const rowPadding = mobileMode ? 24 : mode === "expanded" ? 28 : 26;
    const chartHeight = Math.max(
      mode === "expanded" ? 420 : mobileMode ? 220 : 280,
      totalLineCount * lineHeight + data.length * rowPadding + 34,
    );

    return {
      chartHeight,
      fontSize,
      maxCharsPerLine,
      yAxisWidth: mobileMode ? 128 : mode === "expanded" ? 240 : 170,
      margin:
        mode === "expanded"
          ? { top: 8, right: 40, left: 18, bottom: 8 }
          : mobileMode
            ? { top: 4, right: 18, left: 2, bottom: 4 }
            : { top: 6, right: 28, left: 6, bottom: 6 },
    };
  };

  const renderChart = (mode = "compact") => {
    const { chartHeight, fontSize, margin, maxCharsPerLine, yAxisWidth } = buildChartMetrics(mode);

    return (
      <div className="chart-area chart-area--horizontal" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={data} layout="vertical" margin={margin}>
            <CartesianGrid stroke="#d4dfeb" strokeDasharray="2 4" horizontal={false} />
            <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize }} />
            <YAxis
              dataKey="label"
              type="category"
              tick={<WrappedYAxisTick fontSize={fontSize} maxCharsPerLine={maxCharsPerLine} />}
              tickLine={false}
              axisLine={false}
              interval={0}
              width={yAxisWidth}
            />
            <Tooltip
              contentStyle={{ borderRadius: "14px", borderColor: "rgba(10, 45, 94, 0.1)" }}
              cursor={{ fill: "rgba(11, 95, 143, 0.08)" }}
            />
            <Bar dataKey="value" fill={color} maxBarSize={mode === "expanded" ? 34 : 30} radius={[0, 10, 10, 0]}>
              <LabelList
                dataKey="value"
                fill="#0b2f4f"
                fontSize={fontSize}
                position="right"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <>
      <ChartCard
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

export default HorizontalBarChart;
