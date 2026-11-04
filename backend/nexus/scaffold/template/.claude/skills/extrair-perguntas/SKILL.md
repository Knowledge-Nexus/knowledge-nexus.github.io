---
name: extrair-perguntas
description: Divide os enunciados de avaliação (exames, testes, frequências) deste repositório de dados nas suas perguntas, tal e qual, e grava-as no banco de perguntas através da CLI nexus, que confirma cada uma no texto do ficheiro. Usa quando o utilizador pedir para extrair perguntas ou para preparar o banco de perguntas.
---

# Extrair perguntas (banco de perguntas, fase A)

Objectivo: as perguntas de cada enunciado **exactamente como estão no ficheiro**. Tu só dizes
onde começa e acaba cada pergunta; o motor confirma que o texto está no ficheiro tal e qual e
grava o texto do ficheiro, não o teu. Se tiveres dúvidas num enunciado, não o proponhas: é
melhor ficar sem perguntas do que ter uma errada.

1. `nexus perguntas pendentes --json`: enunciados arrumados, com texto do próprio ficheiro
   (sem OCR), ainda sem perguntas. No máximo 15 por sessão.
2. Para cada um: `nexus documento texto <id>` (todas as páginas) e lê-o até ao fim.
3. Prepara um JSON com os blocos **pela ordem em que aparecem**:

   ```json
   {
     "blocks": [
       {"kind": "context", "label": "Grupo I",
        "text": "Ana vendeu a Bruno um automóvel por 5000 euros, mas não lhe entregou os documentos. Bruno recusa-se a pagar."},
       {"kind": "question", "label": "1",
        "text": "1. Qualifique o contrato celebrado entre Ana e Bruno, justificando a resposta."},
       {"kind": "question", "label": "2",
        "text": "2. Pode Bruno recusar o pagamento? Fundamente."}
     ]
   }
   ```

   - `question`: uma pergunta inteira, com as alíneas (a), b)…) e desde o número até ao fim.
     `label` é o número: `1`, `2`, `3`… ou, se a numeração recomeçar em cada grupo, `I.1`,
     `I.2`, `II.1`…
   - `context`: o texto comum a várias perguntas (o caso prático de um grupo, «Considere…»),
     logo antes da primeira pergunta que o usa. Serve às perguntas seguintes até ao próximo
     caso ou cabeçalho de grupo.
   - **Copia o texto letra a letra**, sem corrigir gralhas, sem resumir, sem juntar nem tirar
     palavras. Só os espaços e as quebras de linha podem ser diferentes.
   - Não incluas cabeçalhos («Grupo II (8 valores)»), cotações, instruções nem rodapés: ficam
     entre os blocos. Mas não deixes de fora nenhuma pergunta nem alínea.
4. Grava: `nexus perguntas propor <id> --ficheiro perguntas.json` (ou `-` para stdin).
   - O motor recusa (e não grava nada) se o texto não estiver no ficheiro tal e qual, se a
     numeração não estiver completa, se ficar texto de uma pergunta por fora ou se o
     documento não for um enunciado com texto do próprio ficheiro. Lê a razão e corrige a
     tua proposta **só se o erro for teu** (texto mal copiado, pergunta esquecida). Se o
     enunciado for estranho (sem números, perguntas com figuras pelo meio), passa ao
     seguinte.
   - Perguntas que falam de figuras, tabelas ou anexos, ou com matemática, ficam gravadas mas
     não se mostram (sem a figura ou com a fórmula estragada estariam incompletas).
5. Nunca escrevas respostas, resoluções nem perguntas tuas: o banco de perguntas é só o que
   está nos enunciados.
6. No fim: `nexus processar --json` (grava e publica os índices) e resume: quantos
   enunciados, quantas perguntas visíveis, quantas ficaram de fora e porquê, e os enunciados
   recusados.
