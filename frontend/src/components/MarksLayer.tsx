// Camada SVG com as marcas de leitura de uma página, por cima do canvas do pdf.js. Segue a
// rotação e o tamanho do canvas; as marcas não tocam no original.

import type { CSSProperties, Ref } from "react";
import {
  PAGE_UNITS,
  rotatedBox,
  rotationTransform,
  type Stroke,
  strokePath,
} from "../lib/annotations";

/** Altura da página em unidades (a largura vale `PAGE_UNITS`). */
export function pageUnitsHeight(size: { width: number; height: number }): number {
  return Math.round((PAGE_UNITS * size.height) / size.width);
}

function StrokeShape(props: { stroke: Stroke }) {
  const { stroke } = props;
  const color = `var(--color-mark-${stroke.color})`;
  return (
    <path
      d={strokePath(stroke.points)}
      fill="none"
      stroke={color}
      strokeWidth={stroke.width}
      strokeLinecap={stroke.kind === "highlight" ? "butt" : "round"}
      strokeLinejoin="round"
    />
  );
}

export function MarksLayer(props: {
  strokes: Stroke[];
  draft?: Stroke | null;
  /** Altura da página em unidades (`pageUnitsHeight`). */
  height: number;
  rotation: number;
  /** Página em modo noite (cores invertidas): o marcador não pode multiplicar. */
  night?: boolean;
  className?: string;
  style?: CSSProperties;
  svgRef?: Ref<SVGSVGElement>;
}) {
  const all = props.draft ? [...props.strokes, props.draft] : props.strokes;
  const highlights = all.filter((s) => s.kind === "highlight");
  const lines = all.filter((s) => s.kind !== "highlight");
  const [vw, vh] = rotatedBox(props.rotation, PAGE_UNITS, props.height);
  const transform = rotationTransform(props.rotation, PAGE_UNITS, props.height) || undefined;
  return (
    <svg
      ref={props.svgRef}
      viewBox={`0 0 ${vw} ${vh}`}
      preserveAspectRatio="none"
      className={`absolute inset-0 h-full w-full ${props.className ?? ""}`}
      style={props.style}
      aria-hidden="true"
    >
      <g transform={transform}>
        <g
          opacity={props.night ? 0.45 : 0.5}
          style={{ mixBlendMode: props.night ? "screen" : "multiply" }}
        >
          {highlights.map((s) => (
            <StrokeShape key={s.id} stroke={s} />
          ))}
        </g>
        {lines.map((s) => (
          <StrokeShape key={s.id} stroke={s} />
        ))}
      </g>
    </svg>
  );
}
