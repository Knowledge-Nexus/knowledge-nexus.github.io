// Campo de texto com lista de sugestões (datalist): escolhe-se da lista ou escreve-se livre.

import { type InputHTMLAttributes, useId } from "react";
import type { Suggestion } from "../lib/reference";

export function SuggestInput(
  props: InputHTMLAttributes<HTMLInputElement> & { suggestions: Suggestion[] },
) {
  const { suggestions, ...input } = props;
  const id = useId();
  return (
    <>
      <input {...input} list={id} autoComplete="off" />
      <datalist id={id}>
        {suggestions.map((s) => (
          <option key={s.value} value={s.value}>
            {s.hint ?? ""}
          </option>
        ))}
      </datalist>
    </>
  );
}
