// Arrastar para mover a página quando ela não cabe (com zoom): no visualizador da página do
// documento e de «A rever» e no modo de leitura (só com a ferramenta «Ler»). Só com o rato ou
// a caneta: no ecrã táctil o dedo já desloca (e, no leitor, desliza para virar a página).

import { type RefObject, useEffect } from "react";

// Nada disto começa um arrasto: continuam a funcionar como sempre.
const INTERACTIVE = "button, a, input, select, textarea, label, [role='slider']";

interface Drag {
  pointer: number;
  x: number;
  y: number;
  left: number;
  top: number;
}

export function useDragScroll(ref: RefObject<HTMLElement | null>, enabled: boolean): void {
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled) return;
    let drag: Drag | null = null;
    const overflows = () =>
      element.scrollWidth > element.clientWidth + 1 ||
      element.scrollHeight > element.clientHeight + 1;
    // A mão aparece só quando há para onde mover (o zoom pode mudar sem o rato se mexer).
    const showHand = () => {
      element.style.cursor = drag ? "grabbing" : overflows() ? "grab" : "";
    };

    function down(event: PointerEvent) {
      if (event.button !== 0 || event.pointerType === "touch" || !overflows()) return;
      if (event.target instanceof Element && event.target.closest(INTERACTIVE)) return;
      drag = {
        pointer: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        left: element!.scrollLeft,
        top: element!.scrollTop,
      };
      element!.setPointerCapture(event.pointerId);
      showHand();
      // Sem seleccionar texto nem arrastar a imagem da página.
      event.preventDefault();
    }

    function move(event: PointerEvent) {
      if (!drag || event.pointerId !== drag.pointer) {
        if (event.pointerType !== "touch") showHand();
        return;
      }
      element!.scrollLeft = drag.left - (event.clientX - drag.x);
      element!.scrollTop = drag.top - (event.clientY - drag.y);
    }

    function up(event: PointerEvent) {
      if (!drag || event.pointerId !== drag.pointer) return;
      drag = null;
      if (element!.hasPointerCapture(event.pointerId))
        element!.releasePointerCapture(event.pointerId);
      showHand();
    }

    function leave() {
      if (!drag) element!.style.cursor = "";
    }

    element.addEventListener("pointerdown", down);
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", up);
    element.addEventListener("pointercancel", up);
    element.addEventListener("pointerleave", leave);
    return () => {
      element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", up);
      element.removeEventListener("pointercancel", up);
      element.removeEventListener("pointerleave", leave);
      element.style.cursor = "";
    };
  }, [ref, enabled]);
}
