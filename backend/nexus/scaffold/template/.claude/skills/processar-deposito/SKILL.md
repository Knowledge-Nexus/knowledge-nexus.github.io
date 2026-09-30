---
name: processar-deposito
description: Processa o depósito deste repositório de dados localmente (recepção, deduplicação, desempacotamento, extracção com OCR, classificação e arrumação), faz commit e push, e resume o resultado. Usa quando houver ficheiros em deposito/ por processar, quando o GitHub Actions estiver sem minutos, ou quando o utilizador pedir para processar o depósito.
---

# Processar o depósito

Este é um repositório de dados **privado** do Knowledge Nexus. As regras de `CLAUDE.md`
aplicam-se sempre: nunca alterar nem apagar nada em `originais/`, nunca escrever
registos à mão (usa sempre a CLI `nexus`).

1. Confirma que o motor está disponível: `nexus verificar`. Se faltar alguma
   ferramenta (Tesseract com `por`, Pandoc, LibreOffice), diz ao utilizador o que falta;
   os ficheiros que precisem dela ficam no depósito para a próxima execução.
2. Traz o estado mais recente: `git pull --rebase`.
3. Corre `nexus processar --json`. Este comando já faz commit, push (com novas
   tentativas se o remoto tiver avançado) e publica o ramo `indices`.
4. Lê o JSON devolvido e resume ao utilizador, em pt-PT:
   - quantos documentos novos, quantos reenvios do mesmo ficheiro (deduplicados);
   - quantos foram arrumados e quantos ficaram "A rever" (com o motivo principal);
   - propostas de catálogo novas (UCs, cursos, instituições em falta);
   - erros (o ficheiro foi para `deposito/<login>/_erros/` com um `.log`) e itens adiados.
5. Se houver documentos "A rever", sugere correr `/rever-classificacoes`.

Não inventes resultados: se um comando falhar, mostra o erro e pára.
