# Decisões

| # | Decisão | Motivo |
|---|---|---|
| 1 | **Arquitectura "só GitHub"**: interface no Pages, dados num repositório privado, pipeline no Actions | Escolha do utilizador. O Pages é estático e público, por isso os dados e o processamento têm de estar num repositório privado |
| 2 | Frontend **React + Vite** (SPA, HashRouter) | Ecossistema (pdf.js, KaTeX, i18next). O HashRouter funciona no Pages sem truques de 404 e não envia caminhos ao servidor |
| 3 | **Sem Docker** na fase 1 | Uso local nativo (WSL2). No Actions instalam-se só as ferramentas de que o lote precisa |
| 4 | **IA só pelo Claude Code** na fase 1 | Sem custos de API. A interface de providers fica para as funções dentro da interface (fase 2 em diante) |
| 5 | pt-PT com a **grafia pré-Acordo** | Escolha do utilizador. A classificação aceita as duas grafias |
| 6 | **YAML como fonte de verdade**, SQLite derivado | Diffs legíveis, fusão sem conflitos binários, histórico no git |
| 7 | Ramo `indices` órfão com **um só commit** | Os índices mudam a cada execução e não devem inchar o histórico |
| 8 | Versões PDF (Office) em `texto/<sha>/render.pdf` no `main` | Criadas uma vez por blob. No ramo `indices` teriam de ser copiadas a cada execução |
| 9 | **Sem Git LFS** | O browser não consegue enviar para o LFS (CORS). Limite de 95 MB por ficheiro |
| 10 | Pedidos de catálogo em `catalogo/_importar/` | A lógica de fusão do catálogo fica num só sítio (Python) |
| 11 | Projectos de código como **zip determinístico** + manifesto | Mantêm-se juntos como unidade. O mesmo conteúdo dá o mesmo SHA-256 |
| 12 | Entradas de arquivos guardadas também como blobs próprios | Cada ficheiro pode ser aberto e citado. O arquivo original também se mantém (custo: espaço) |
| 13 | OCR com o **Tesseract directamente**, por página (e não com OCRmyPDF) | Não guardamos PDFs com OCR, só o texto por página. Precisamos da confiança por página para detectar manuscritos e matemática |
| 14 | Classificação **heurística e explicável**; IA só para o que fica ambíguo | Nunca arrumar à sorte. As justificações são verificáveis e traduzíveis |
| 15 | Identificadores UUIDv7 e chaves `inst/uc` | Estáveis entre repositórios e prontos para migrar para um servidor |
| 16 | **PyMuPDF (AGPL)** atrás de uma interface de extracção | Não afecta o uso pessoal. Na fase 5 decide-se entre a licença AGPL e o pypdfium2 |
| 17 | Na interface diz-se **"cadeira"**, não "UC" | "UC" confunde-se com Universidade de Coimbra. No código continua `unit` |
| 18 | **Público/privado por cadeira**, com excepções por documento; privado por defeito | Escolha do utilizador: decide o que partilha e respeita pedidos dos docentes |
| 19 | Material público num **repositório público separado**, servido pelo Pages | O repositório de dados continua privado (fronteira de segurança). Mesma origem que a interface: sem token, sem CORS, sem limites da API. Um só commit, para que despartilhar remova mesmo |

## Por decidir

- Nome definitivo do repositório de dados.
- Licença do código.
- Limiares de confiança finais, afinados com material real.
- Repartição dos índices quando crescerem.
- Fase 5: repositórios federados (por grupo) ou backend próprio (FastAPI + PostgreSQL/pgvector + S3).
