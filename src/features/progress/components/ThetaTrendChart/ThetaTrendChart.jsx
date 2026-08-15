import { useEffect, useRef, useState } from "react";
import "./ThetaTrendChart.css";

const VIEW_H = 220;
const PAD_X = 34;
const PAD_TOP = 16;
const PAD_BOTTOM = 34;
const MAX_VALUE = 4;
const GRID_LINES = [0, 1, 2, 3, 4];
const MAX_DOTS = 24;
const MIN_W = 260;
const DEFAULT_W = 640;

const INNER_H = VIEW_H - PAD_TOP - PAD_BOTTOM;
const BASELINE = PAD_TOP + INNER_H;

const clamp = (value) => Math.max(0, Math.min(MAX_VALUE, Number(value) || 0));

/**
 * Biểu đồ đường cho năng lực (theta) theo thang hiển thị 0–4.
 * `points`: [{ value, label, aria }] đã sắp xếp theo thời gian tăng dần.
 * viewBox bám theo bề rộng thật của khung chứa (1 đơn vị SVG = 1px CSS)
 * nên chữ trên trục giữ đúng cỡ font kể cả trên màn hình hẹp.
 */
export default function ThetaTrendChart({ points = [], ariaLabel = "Diễn biến năng lực" }) {
  const wrapRef = useRef(null);
  const [viewW, setViewW] = useState(DEFAULT_W);

  useEffect(() => {
    const element = wrapRef.current;
    if (!element) return undefined;
    const syncWidth = () => {
      setViewW(Math.max(MIN_W, Math.round(element.clientWidth) || DEFAULT_W));
    };
    syncWidth();
    const observer = new ResizeObserver(syncWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  if (points.length === 0) return null;

  const innerW = viewW - PAD_X * 2;
  const lastIndex = points.length - 1;
  const toX = (index) => (lastIndex === 0 ? viewW / 2 : PAD_X + (index / lastIndex) * innerW);
  const toY = (value) => PAD_TOP + INNER_H - (clamp(value) / MAX_VALUE) * INNER_H;

  const coords = points.map((point, index) => {
    const value = clamp(point.value);
    return { label: point.label, aria: point.aria, value, x: toX(index), y: toY(value) };
  });
  const line = coords.map((point) => `${point.x},${point.y}`).join(" ");
  const showDots = coords.length <= MAX_DOTS;
  const axisIndexes =
    coords.length > 2 ? [0, Math.floor(lastIndex / 2), lastIndex] : coords.map((_, index) => index);

  return (
    <div ref={wrapRef} className="theta-chart-wrap">
      {/* role="group" (không phải img) để screen reader đọc được từng điểm bên trong. */}
      <svg
        className="theta-chart"
        viewBox={`0 0 ${viewW} ${VIEW_H}`}
        role="group"
        aria-label={ariaLabel}
      >
        {GRID_LINES.map((value) => (
          <g key={value}>
            <line
              className="theta-chart__grid"
              x1={PAD_X}
              x2={viewW - PAD_X}
              y1={toY(value)}
              y2={toY(value)}
            />
            <text
              className="theta-chart__axis"
              x={PAD_X - 10}
              y={toY(value) + 4}
              textAnchor="end"
              aria-hidden="true"
            >
              {value}
            </text>
          </g>
        ))}

        {coords.length > 1 && (
          <>
            <polygon
              className="theta-chart__area"
              points={`${coords[0].x},${BASELINE} ${line} ${coords[lastIndex].x},${BASELINE}`}
            />
            <polyline className="theta-chart__line" points={line} />
          </>
        )}

        {showDots &&
          coords.map((point, index) => (
            <g
              key={`dot-${index}`}
              className="theta-chart__point"
              role="img"
              aria-label={point.aria || `${point.label} — năng lực ${point.value.toFixed(2)}/4`}
            >
              <title>{`${point.label} · ${point.value.toFixed(2)} / 4`}</title>
              {/* Vòng chạm vô hình mở rộng vùng hover/touch quanh mỗi điểm. */}
              <circle className="theta-chart__hit" cx={point.x} cy={point.y} r={14} />
              <circle className="theta-chart__dot" cx={point.x} cy={point.y} r={4} />
            </g>
          ))}

        {axisIndexes.map((index) => (
          <text
            key={`axis-${index}`}
            className="theta-chart__axis"
            x={coords[index].x}
            y={VIEW_H - 10}
            textAnchor={index === 0 ? "start" : index === lastIndex ? "end" : "middle"}
            aria-hidden="true"
          >
            {coords[index].label}
          </text>
        ))}
      </svg>
    </div>
  );
}
