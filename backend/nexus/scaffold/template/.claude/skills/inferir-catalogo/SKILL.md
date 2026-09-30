---
name: inferir-catalogo
description: Infere a instituição, o curso e as cadeiras (unidades curriculares) a partir do material depositado (fichas de cadeira, cabeçalhos de exames e slides) e propõe um catálogo para o utilizador confirmar. Usa na configuração inicial quando o utilizador escolheu "inferir do material", ou quando houver muitas propostas de cadeira em aberto.
---

# Inferir o catálogo a partir do material

1. `nexus catalogo propostas --json`: propostas já detectadas pelas heurísticas, com
   evidência (documento, página, excerto).
2. Procura evidência adicional: `nexus revisao listar --json` e, para os documentos do tipo
   ficha da cadeira/programa ou com cabeçalhos ricos, `nexus documento texto <id> --paginas 1`.
3. Constrói um rascunho no formato `nexus-catalogo` (vê `nexus catalogo exportar` para o
   formato): instituição, curso(s) e cadeiras com nome, código, sigla, ano curricular,
   semestre, ECTS e docentes **apenas quando estiverem no material**. Não inventes dados.
4. Mostra o rascunho ao utilizador e pede confirmação explícita antes de gravar.
5. Com confirmação: grava-o num ficheiro temporário e corre
   `nexus catalogo importar <ficheiro>`; aceita/rejeita as propostas correspondentes com
   `nexus catalogo aceitar <id>` / `nexus catalogo rejeitar <id>`.
6. `nexus processar --json` para reclassificar o que estava "A rever" e resume.
