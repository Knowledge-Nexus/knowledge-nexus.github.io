# Repositório de dados do Knowledge Nexus (PRIVADO)

Contém material de estudo com direitos de autor de __OWNER__. O código do motor vive em
`__APP_REPOSITORY__` (público); aqui só há dados.

## Regras (obrigatórias)
- **Nunca** alterar, mover ou apagar nada em `originais/` (imutável, endereçado por SHA-256).
- **Nunca** editar à mão `documentos/`, `texto/` ou `revisao/`: usa a CLI `nexus`
  (`nexus --help`). Tudo o que é derivado pode ser regenerado com `nexus processar`.
- **Nunca** tornar este repositório público, activar o Pages ou copiar material para fora.
  A única excepção é o material que o dono marcou como "Público" (por cadeira ou por
  documento, na interface ou com `nexus visibilidade`): esse é publicado por
  `nexus publicar` num repositório público à parte (`publishing.public_repo`). Nunca
  mudar a visibilidade de nada sem pedido explícito do dono.
- Tudo o que a IA gera fica marcado como gerado (`ai:claude-code`) e cita a fonte
  (documento + página). Em modo tutor, não dar resoluções completas sem pedido explícito.
- Classificação com pouca confiança fica "A rever": nunca arrumar à sorte.
- Interface e mensagens em português europeu (grafia pré-Acordo: projecto, lectivo).

## Estrutura
- `deposito/<login>/` entrada; `_erros/` falhas com `.log`
- `originais/<aa>/<sha256>.<ext>` originais
- `documentos/<id>.yaml` cópia lógica por utilizador (classificação, estado, notas)
- `texto/<sha256>/` texto extraído (páginas em Markdown + LaTeX, meta.json)
- `catalogo/` instituições, cursos, cadeiras, vocabulários
- `revisao/propostas/` propostas de catálogo
- ramo `indices`: meta.db e pesquisa.db (derivados)

## Skills
- `/processar-deposito`: corre o pipeline localmente e publica
- `/rever-classificacoes`: propõe classificações para a fila "A rever"
- `/inferir-catalogo`: propõe instituição/curso/cadeiras a partir do material
