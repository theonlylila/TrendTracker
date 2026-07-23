type Point = { label: string; value: number };

type Props = {
  points: Point[];
  unit?: string;
  color?: string;
};

const WIDTH = 640;
const HEIGHT = 180;
const PAD_X = 30;
const PAD_Y = 22;

export function SimpleLineChart({ points, unit = "", color = "#d24b91" }: Props) {
  if (points.length === 0) return null;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = range * 0.15;
  const yMin = Math.max(0, min - padding);
  const yMax = max + padding;
  const yRange = yMax - yMin || 1;

  const innerW = WIDTH - PAD_X * 2;
  const innerH = HEIGHT - PAD_Y * 2;

  function x(i: number) {
    return points.length === 1 ? PAD_X + innerW / 2 : PAD_X + (i / (points.length - 1)) * innerW;
  }
  function y(v: number) {
    return PAD_Y + innerH - ((v - yMin) / yRange) * innerH;
  }

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.value)}`).join(" ");
  const labelStep = Math.max(1, Math.ceil(points.length / 6));

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto">
      <line
        x1={PAD_X}
        y1={PAD_Y + innerH}
        x2={WIDTH - PAD_X}
        y2={PAD_Y + innerH}
        stroke="#f6d3e6"
      />

      <text x={PAD_X} y={PAD_Y - 8} fontSize={10} className="fill-muted font-mono">
        {max.toFixed(0)} {unit}
      </text>
      <text x={PAD_X} y={PAD_Y + innerH + 4} fontSize={10} className="fill-muted font-mono">
        {yMin.toFixed(0)} {unit}
      </text>

      <path d={path} fill="none" stroke={color} strokeWidth={2} />

      {points.map((p, i) => {
        const showLabel = i % labelStep === 0 || i === points.length - 1;
        return (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.value)} r={showLabel ? 3.5 : 2.5} fill={color} />
            {showLabel && (
              <text
                x={x(i)}
                y={HEIGHT - 4}
                textAnchor="middle"
                fontSize={9}
                className="fill-muted font-mono"
              >
                {p.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
