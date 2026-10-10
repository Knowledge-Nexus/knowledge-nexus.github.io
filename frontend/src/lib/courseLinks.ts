// Um curso pode ter cadeiras de outras instituições. Na lista de cadeiras de um curso, as da
// mesma instituição escrevem-se só com o slug e as de outra com a chave completa
// ("iscsp/administracao-publica"); o motor aceita as duas formas.

export function unitRef(courseInstitution: string, unitKey: string): string {
  const cut = unitKey.indexOf("/");
  if (cut < 0) return unitKey;
  return unitKey.slice(0, cut) === courseInstitution ? unitKey.slice(cut + 1) : unitKey;
}
