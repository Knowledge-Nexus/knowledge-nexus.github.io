// Nome de quem vê, repetido em diagonal por cima das páginas, para quem não pode descarregar
// (Observador). Não impede capturas, mas diz de quem vieram. Não apanha cliques.

import { useApp } from "../data/context";

const escapeXml = (text: string) => text.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function pattern(text: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="200"><text x="0" y="120" transform="rotate(-24 180 100)" font-family="Inter, sans-serif" font-size="15" fill="rgb(29,39,51)" fill-opacity="0.16">${escapeXml(text)}</text></svg>`;
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}")`;
}

export function Watermark() {
  const { watermark } = useApp();
  if (!watermark) return null;
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 select-none"
      style={{ backgroundImage: pattern(watermark), backgroundRepeat: "repeat" }}
    />
  );
}

/** Sem menu do botão direito (guardar a imagem) onde há marca de água. */
export function useNoSaveMenu() {
  const { watermark } = useApp();
  return watermark
    ? { onContextMenu: (event: { preventDefault: () => void }) => event.preventDefault() }
    : {};
}
