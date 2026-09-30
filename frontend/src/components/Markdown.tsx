// Markdown + LaTeX (KaTeX). Sem HTML cru: o texto extraído nunca é interpretado como HTML.

import "katex/dist/katex.min.css";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

export function Markdown(props: { children: string }) {
  return (
    <div className="prose-nexus text-sm leading-relaxed text-ink">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {props.children}
      </ReactMarkdown>
    </div>
  );
}
