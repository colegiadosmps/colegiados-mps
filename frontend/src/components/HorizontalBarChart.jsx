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

const HorizontalBarChart = ({ color = "#0b5f8f", data, expandedData, title }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const modalData = expandedData?.length ? expandedData : data;
  const shouldScrollExpanded = modalData.length > 10;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const sync = () => setIsMobile(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  const buildChartMetrics = (rows, mode) => {
    const mobileMode = mode === "compact" ? isMobile : false;
    const maxCharsPerLine = mobileMode ? 16 : mode === "expanded" ? 24 : 18;
    const fontSize = mobileMode ? 11 : 13;
    const lineHeight = fontSize + 5;
    const wrappedLabels = rows.map((item) => wrapLabel(item.label, maxCharsPerLine));
    const totalLineCount = wrappedLabels.reduce((sum, lines) => sum + lines.length, 0);
    const longestLineLength = wrappedLabels.reduce(
      (maxLength, lines) => Math.max(maxLength, ...lines.map((line) => line.length), 0),
      0,
    );
    const rowPadding = mobileMode ? 24 : mode === "expanded" ? 28 : 26;
    const chartHeight = Math.max(
      mode === "expanded"
        ? shouldScrollExpanded
          ? rows.length * 44 + 120
          : rows.length * 40 + 92
        : mobileMode
          ? 170
          : 150,
      totalLineCount * lineHeight + rows.length * rowPadding + 34,
    );
    const estimatedLabelWidth = Math.round(longestLineLength * (fontSize * 0.58));
    const yAxisWidth = mobileMode
      ? Math.min(138, Math.max(88, estimatedLabelWidth + 14))
      : mode === "expanded"
        ? Math.min(260, Math.max(140, estimatedLabelWidth + 26))
        : Math.min(150, Math.max(96, estimatedLabelWidth + 14));

    return {
      chartHeight,
      fontSize,
      maxCharsPerLine,
      yAxisWidth,
      margin:
        mode === "expanded"
          ? { top: 8, right: 42, left: 8, bottom: 8 }
          : mobileMode
            ? { top: 4, right: 16, left: 0, bottom: 4 }
            : { top: 6, right: 24, left: 0, bottom: 6 },
    };
  };

  const renderChart = (rows, mode = "compact") => {
    const { chartHeight, fontSize, margin, maxCharsPerLine, yAxisWidth } = buildChartMetrics(
      rows,
      mode,
    );

    return (
      <div className="chart-area chart-area--horizontal" style={{ height: chartHeight }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={rows} layout="vertical" margin={margin}>
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
        bodyClassName="chart-card__body--chart chart-card__body--horizontal-chart"
        interactive
        onBodyClick={() => setExpanded(true)}
        title={title}
      >
        {renderChart(data)}
      </ChartCard>
      {expanded ? (
        <ExpandedChartModal
          bodyClassName={shouldScrollExpanded ? "chart-modal__body--scroll" : "chart-modal__body--no-scroll"}
          onClose={() => setExpanded(false)}
          title={title}
        >
          {renderChart(modalData, "expanded")}
        </ExpandedChartModal>
      ) : null}
    </>
  );
};

export default HorizontalBarChart;
