import "./ThetaTrendChart.css";

const VIEW_W = 640;
const VIEW_H = 220;
const PAD_X = 34;
const PAD_TOP = 16;
const PAD_BOTTOM = 34;
const MAX_VALUE = 4;
const GRID_LINES = [0, 1, 2, 3, 4];
const MAX_DOTS = 24;

const INNER_W = VIEW_W - PAD_X * 2;
const INNER_H = VIEW_H - PAD_TOP - PAD_BOTTOM;
const BASELINE = PAD_TOP + INNER_H;

const clamp = (value) => Math.max(0, Math.min(MAX_VALUE, Number(value) || 0));

/**
 * Biểu đồ đường cho theta theo thang hiển thị 0–4.
 * `points`: [{ value, label }] đã sắp xếp theo thời gian tăng dần.
 */
export default function ThetaTrendChart({ points = [], ariaLabel = "Diễn biến theta" }) {
  if (points.length === 0) return null;

  const lastIndex = points.length - 1;
  const toX = (index) => (lastIndex === 0 ? VIEW_W / 2 : PAD_X + (index / lastIndex) * INNER_W);
  const toY = (value) => PAD_TOP + INNER_H - (clamp(value) / MAX_VALUE) * INNER_H;

  const coords = points.map((point, index) => {
    const value = clamp(point.value);
    return { label: point.label, value, x: toX(index), y: toY(value) };
  });
  const line = coords.map((point) => `${point.x},${point.y}`).join(" ");
  const showDots = coords.length <= MAX_DOTS;
  const axisIndexes =
    coords.length > 2 ? [0, Math.floor(lastIndex / 2), lastIndex] : coords.map((_, index) => index);

  return (
    <svg
      className="theta-chart"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label={ariaLabel}
    >
      {GRID_LINES.map((value) => (
        <g key={value}>
          <line
            className="theta-chart__grid"
            x1={PAD_X}
            x2={VIEW_W - PAD_X}
            y1={toY(value)}
            y2={toY(value)}
          />
          <text className="theta-chart__axis" x={PAD_X - 10} y={toY(value) + 4} textAnchor="end">
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
          <circle
            key={`dot-${index}`}
            className="theta-chart__dot"
            cx={point.x}
            cy={point.y}
            r={4}
          >
            <title>{`${point.label} · ${point.value.toFixed(2)} / 4`}</title>
          </circle>
        ))}

      {axisIndexes.map((index) => (
        <text
          key={`axis-${index}`}
          className="theta-chart__axis"
          x={coords[index].x}
          y={VIEW_H - 10}
          textAnchor={index === 0 ? "start" : index === lastIndex ? "end" : "middle"}
        >
          {coords[index].label}
        </text>
      ))}
    </svg>
  );
}
