---
name: rever-classificacoes
description: Analisa os documentos da fila "A rever" deste repositório de dados, lê o texto extraído e propõe a classificação (cadeira, tipo, ano lectivo, avaliação, época, enunciado ou resolução) com confiança e justificação, gravando as propostas através da CLI nexus. Usa quando houver documentos por rever ou quando o utilizador pedir para rever classificações.
---

# Rever classificações

Objectivo: resolver ambiguidades que as heurísticas não conseguiram, **sem nunca arrumar à
sorte**. Tu propões; o utilizador confirma na interface (fila "A rever").

1. `nexus revisao listar --json` — documentos com revisão aberta, com os valores
   actuais, as alternativas e os motivos.
2. Para cada documento (começa pelos mais recentes; no máximo 20 por sessão):
   - `nexus documento texto <id> --paginas 1-2` para ler o início;
   - se precisares de contexto do catálogo: `nexus catalogo exportar`.
   - Se o texto estiver vazio ou ilegível (OCR fraco), não adivinhes: deixa como está.
3. Para cada campo em que tenhas uma conclusão fundamentada, prepara um JSON:

   ```json
   {
     "fields": {
       "unit": {"value": "ufe/am1", "confidence": 0.9,
                "justification": "Cabeçalho: 'Unidade Curricular: Análise Matemática I'"},
       "document_type": {"value": "enunciados-avaliacao", "confidence": 0.85,
                         "justification": "Enunciado de exame com cotações por grupo"}
     }
   }
   ```

   - Usa só valores que existam: chaves de cadeira `<instituicao>/<uc>` do catálogo e slugs de
     `catalogo/vocabularios.yaml`. Ano lectivo no formato `2023-2024`.
   - A confiança tem de ser honesta. Abaixo de 0.7 o documento continua "A rever" (as tuas
     alternativas ficam visíveis ao utilizador).
   - A justificação cita o documento (página e excerto curto).
4. Grava: `nexus revisao propor <id> --ficheiro proposta.json` (ou `-` para stdin).
   A CLI marca os campos como `ai:claude-code`; nunca sobrepõe campos do utilizador.
5. Se a cadeira não existir no catálogo, não a inventes: verifica `nexus catalogo propostas`
   e, se fizer sentido, sugere ao utilizador aceitá-la (ou corre `/inferir-catalogo`).
6. No fim: `nexus processar --json` (aplica, arruma o que ficou confiante e publica) e
   resume o que mudou.
