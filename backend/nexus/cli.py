"""CLI `nexus` (comandos em português, como as skills; código em inglês).

Usada pelo GitHub Actions, pelas skills do Claude Code e por quem corre localmente (WSL2).
"""

from __future__ import annotations

import json
import logging
import os
import sys
from pathlib import Path
from typing import Annotated, Any

import typer

from nexus import __version__

app = typer.Typer(help="Motor do depósito da plataforma de estudo Knowledge Nexus.",
                  no_args_is_help=True, add_completion=False)
catalog_app = typer.Typer(help="Catálogo: instituições, cursos e cadeiras.", no_args_is_help=True)
review_app = typer.Typer(help="Fila \"A rever\".", no_args_is_help=True)
document_app = typer.Typer(help="Consultar documentos.", no_args_is_help=True)
sharing_app = typer.Typer(help="Visibilidade: privado ou público, por cadeira ou documento.",
                          no_args_is_help=True)
app.add_typer(catalog_app, name="catalogo")
app.add_typer(review_app, name="revisao")
app.add_typer(document_app, name="documento")
app.add_typer(sharing_app, name="visibilidade")

RepoOption = Annotated[Path, typer.Option(
    "--repo", "-r", help="Raiz do repositório de dados.", envvar="NEXUS_REPO")]
JsonOption = Annotated[bool, typer.Option("--json", help="Saída em JSON.")]


def _repo(path: Path):  # type: ignore[no-untyped-def]
    from nexus.datarepo.store import DataRepo, DataRepoError

    repo = DataRepo(path)
    try:
        repo.check_format()
    except DataRepoError as exc:
        _fail(str(exc))
    return repo


def _fail(message: str, code: int = 1) -> None:
    typer.secho(f"erro: {message}", fg=typer.colors.RED, err=True)
    raise typer.Exit(code)


def _print_json(data: Any) -> None:
    typer.echo(json.dumps(data, ensure_ascii=False, indent=2, default=str))


@app.callback()
def _main(verbose: Annotated[bool, typer.Option("--verbose", "-v")] = False) -> None:
    logging.basicConfig(level=logging.INFO if verbose else logging.WARNING,
                        format="%(levelname)s %(name)s: %(message)s")


@app.command()
def versao() -> None:
    """Mostra a versão do motor."""
    typer.echo(__version__)


@app.command()
def verificar(rapido: Annotated[bool, typer.Option(help="Não testar conversões.")] = False
              ) -> None:
    """Verifica as ferramentas de sistema (OCR, LibreOffice, Pandoc, rar)."""
    from nexus.doctor import run_checks

    failed_required = False
    for check in run_checks(deep=not rapido):
        mark = "ok " if check.ok else ("ERR" if check.required else "-- ")
        typer.echo(f"[{mark}] {check.name:<11} {check.detail}  ({check.purpose})")
        failed_required |= check.required and not check.ok
    if failed_required:
        raise typer.Exit(1)


@app.command()
def scaffold(
    destino: Annotated[Path, typer.Argument(help="Pasta do repositório de dados.")],
    dono: Annotated[str, typer.Option(help="Login GitHub do dono.")],
    app_repo: Annotated[str, typer.Option(help="Repositório da aplicação.")] =
    "Knowledge-Nexus/knowledge-nexus.github.io",
    app_ref: Annotated[str, typer.Option(help="Ramo/tag da aplicação.")] = "main",
    actualizar: Annotated[bool, typer.Option(help="Reescrever ficheiros geridos.")] = False,
) -> None:
    """Cria a estrutura de um repositório de dados (privado)."""
    from nexus.scaffold import scaffold as run_scaffold

    report = run_scaffold(destino, dono, app_repo, app_ref, update=actualizar)
    for rel in report.created:
        typer.echo(f"criado     {rel}")
    for rel in report.updated:
        typer.echo(f"actualizado {rel}")
    typer.echo(f"{len(report.kept)} ficheiros mantidos.")


@app.command()
def processar(
    repo: RepoOption = Path("."),
    push: Annotated[bool, typer.Option("--push/--sem-push", help="Fazer push.")] = True,
    indices: Annotated[bool, typer.Option("--indices/--sem-indices")] = True,
    max_itens: Annotated[int | None, typer.Option(
        "--max-itens", min=1, help="Máximo de itens do depósito por execução.")] = None,
    reclassificar: Annotated[bool, typer.Option(
        help="Reclassificar tudo o que não foi revisto pelo utilizador.")] = False,
    as_json: JsonOption = False,
) -> None:
    """Processa o depósito (etapas 1-5), faz commit/push e publica os índices."""
    from nexus.datarepo.git import GitError
    from nexus.publish import process_and_publish

    _repo(repo)
    try:
        result = process_and_publish(repo, push=push, reclassify=reclassificar,
                                     publish_indices=indices, max_items=max_itens)
    except GitError as exc:
        _fail(str(exc))
        return
    if as_json:
        _print_json(result.as_dict())
    else:
        for line in result.report.summary():
            typer.echo(line)
        typer.echo(f"commit: {result.commit or '(sem alterações)'}"
                   + (" (enviado)" if result.pushed else ""))
        for note in result.notes:
            typer.echo(note)
    if result.report.errors:
        raise typer.Exit(2)


@app.command("publicar-indices")
def publicar_indices(
    repo: RepoOption = Path("."),
    push: Annotated[bool, typer.Option("--push/--sem-push", help="Fazer push.")] = True,
    forcar: Annotated[bool, typer.Option(
        help="Reconstruir mesmo que os publicados já sejam do commit actual.")] = False,
) -> None:
    """Reconstrói e publica os índices do estado actual do repositório."""
    from nexus.datarepo.git import GitError
    from nexus.publish import indices_up_to_date, publish_index_branch

    _repo(repo)
    if push and not forcar and indices_up_to_date(repo):
        typer.echo("índices já actualizados")
        return
    try:
        commit = publish_index_branch(repo, push=push)
    except GitError as exc:
        _fail(str(exc))
        return
    typer.echo(f"índices: {commit or '(gerados localmente)'}"
               + (" (enviados)" if push and commit else ""))


@app.command("servir")
def servir(
    repo: RepoOption = Path("."),
    intervalo: Annotated[int, typer.Option(min=10, help="Segundos entre verificações.")] = 60,
    uma_vez: Annotated[bool, typer.Option(help="Um só ciclo e sai.")] = False,
) -> None:
    """Vigia o repositório de dados e processa os depósitos novos (sem GitHub Actions)."""
    from nexus.serve import serve

    _repo(repo)
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s", datefmt="%H:%M:%S")
    typer.echo(f"a vigiar {repo} a cada {intervalo} s (Ctrl+C para parar)")
    try:
        serve(repo, interval=intervalo, once=uma_vez)
    except KeyboardInterrupt:
        typer.echo("parado")


@app.command("migrar-blobs")
def migrar_blobs(
    repo: RepoOption = Path("."),
    bucket: Annotated[str | None, typer.Option(
        help="Bucket do R2 (por defeito storage.r2_bucket).")] = None,
    max_gb: Annotated[float | None, typer.Option(
        help="Corte de espaço em GB (por defeito storage.max_gb).")] = None,
    simular: Annotated[bool, typer.Option(help="Só contar, sem enviar.")] = False,
) -> None:
    """Envia os originais para o R2 (não apaga nada do repositório)."""
    from nexus.storage.migrate import migrate_originals
    from nexus.storage.r2 import GB, R2BlobStore

    data = _repo(repo)
    name = bucket or data.settings.storage.r2_bucket
    if not name:
        _fail("indica --bucket ou storage.r2_bucket na configuração")
        return
    limit = max_gb if max_gb is not None else data.settings.storage.max_gb
    try:
        store = R2BlobStore(name, int(limit * GB))
        report = migrate_originals(data.layout, store, dry_run=simular)
    except RuntimeError as exc:
        _fail(str(exc))
        return
    verb = "a enviar" if simular else "enviados"
    typer.echo(f"{verb}: {report.uploaded} ({report.bytes_uploaded / GB:.2f} GB)")
    typer.echo(f"já no R2: {report.already_there}")
    if report.mismatched:
        typer.echo(f"com problemas: {len(report.mismatched)}")
    if report.stopped_by_quota:
        typer.echo(f"PARADO: {report.stopped_by_quota}")
    if not report.ok:
        raise typer.Exit(2)


@app.command()
def indexar(
    repo: RepoOption = Path("."),
    saida: Annotated[Path, typer.Option(help="Pasta onde gravar os índices.")] =
    Path(".nexus-cache/indices"),
) -> None:
    """Constrói meta.db e pesquisa.db.gz sem publicar (útil para depurar)."""
    from nexus.datarepo.git import Git
    from nexus.index.builder import build_indices

    data = _repo(repo)
    result = build_indices(data, saida, built_from=Git(repo).head())
    typer.echo(f"{result.documents} documentos, {result.pages} páginas, "
               f"{result.near_duplicates} quase-duplicados → {saida}")


@app.command()
def publicar(
    repo: RepoOption = Path("."),
    push: Annotated[bool, typer.Option("--push/--sem-push", help="Fazer push.")] = True,
    as_json: JsonOption = False,
) -> None:
    """Publica o material marcado como público no repositório público (GitHub Pages)."""
    from nexus.datarepo.git import GitError
    from nexus.public import PublishError, publish_public

    _repo(repo)
    try:
        result = publish_public(repo, token=os.environ.get("NEXUS_PUBLICO_TOKEN"), push=push)
    except (GitError, PublishError) as exc:
        _fail(str(exc))
        return
    if as_json:
        _print_json(result.as_dict())
        return
    if not result.configured:
        typer.echo("publicação não configurada (publishing.public_repo no nexus.yaml)")
        return
    typer.echo(f"{result.documents} documento(s) públicos → {result.target}"
               + (" (publicado)" if result.published else ""))
    for note in result.notes:
        typer.echo(note)


@app.command()
def migrar(repo: RepoOption = Path(".")) -> None:
    """Migra o formato dos ficheiros do repositório de dados."""
    from nexus.formats import migrate

    applied = migrate(repo)
    typer.echo(f"migrações aplicadas: {applied or 'nenhuma'}")


@app.command()
def pesquisar(
    consulta: Annotated[str, typer.Argument()],
    repo: RepoOption = Path("."),
    utilizador: Annotated[str | None, typer.Option(help="Login de quem pesquisa.")] = None,
    uc: Annotated[str | None, typer.Option(help="Chave da cadeira, ex.: ufe/am1.")] = None,
    tipo: Annotated[str | None, typer.Option(help="Slug do tipo de documento.")] = None,
    ano: Annotated[str | None, typer.Option(help="Ano lectivo, ex.: 2023-2024.")] = None,
) -> None:
    """Pesquisa no texto integral (sobre índices construídos localmente)."""
    import tempfile

    from nexus.index.builder import SEARCH_DB, build_indices
    from nexus.index.search import HIGHLIGHT_END, HIGHLIGHT_START, SearchFilters, SqliteFtsSearch

    data = _repo(repo)
    viewer = utilizador or str(data.raw_settings.get("owner", ""))
    with tempfile.TemporaryDirectory() as tmp:
        build_indices(data, Path(tmp))
        hits = SqliteFtsSearch(Path(tmp) / SEARCH_DB).search(
            consulta, viewer, SearchFilters(unit=uc, document_type=tipo, academic_year=ano))
    for hit in hits:
        snippet = hit.snippet.replace(HIGHLIGHT_START, "[").replace(HIGHLIGHT_END, "]")
        typer.echo(f"{hit.doc_id[:8]} p.{hit.page:<3} {hit.title}\n    {snippet}")
    if not hits:
        typer.echo("sem resultados")


@app.command("exportar-arvore")
def exportar_arvore(
    destino: Annotated[Path, typer.Argument()],
    repo: RepoOption = Path("."),
    utilizador: Annotated[str | None, typer.Option()] = None,
    modo: Annotated[str, typer.Option(help="copia | ligacao")] = "copia",
) -> None:
    """Exporta a biblioteca como <curso>/<uc>/<tipo>/<ano-lectivo>_<descricao>.<ext>."""
    from nexus.export import export_tree

    if modo not in {"copia", "ligacao"}:
        _fail("modo inválido (copia | ligacao)")
    report = export_tree(_repo(repo), destino, utilizador,
                         "copy" if modo == "copia" else "link")
    typer.echo(f"{len(report.written)} ficheiros exportados para {destino}")


@app.command()
def vigiar(
    pasta: Annotated[Path, typer.Argument(help="Pasta local a vigiar.")],
    repositorio: Annotated[str, typer.Option(help="dono/nome do repositório de dados.")],
    token_env: Annotated[str, typer.Option(help="Variável com o token.")] = "NEXUS_TOKEN",
    uma_vez: Annotated[bool, typer.Option(help="Enviar o que existe e sair.")] = False,
    polling: Annotated[bool, typer.Option(help="Forçar polling (ex.: /mnt/c no WSL).")] =
    False,
) -> None:
    """Vigia uma pasta local e envia o que lá for largado para o depósito (pela API)."""
    from nexus.github.watch import watch

    token = os.environ.get(token_env)
    if not token:
        _fail(f"define o token em {token_env} (fine-grained, só este repositório)")
        return
    watch(pasta, repositorio, token, once=uma_vez, force_polling=polling)


# --- catálogo ---------------------------------------------------------------------------


@catalog_app.command("importar")
def catalogo_importar(ficheiro: Annotated[Path, typer.Argument()],
                      repo: RepoOption = Path(".")) -> None:
    """Importa (funde) um catálogo no formato nexus-catalogo."""
    from nexus.datarepo.catalog_io import CatalogError, import_bundle
    from nexus.datarepo.yamlio import read_yaml

    data = _repo(repo)
    try:
        report = import_bundle(data.layout, read_yaml(ficheiro))
    except (CatalogError, ValueError) as exc:
        _fail(str(exc))
        return
    typer.echo(f"criados: {len(report.created)}, actualizados: {len(report.updated)}, "
               f"iguais: {len(report.unchanged)}")


@catalog_app.command("exportar")
def catalogo_exportar(repo: RepoOption = Path("."),
                      saida: Annotated[Path | None, typer.Option()] = None) -> None:
    """Exporta o catálogo num único ficheiro YAML."""
    from nexus.datarepo.catalog_io import export_bundle
    from nexus.datarepo.yamlio import dump_yaml

    text = dump_yaml(export_bundle(_repo(repo).layout))
    if saida:
        saida.write_text(text, encoding="utf-8")
    else:
        typer.echo(text)


@catalog_app.command("propostas")
def catalogo_propostas(repo: RepoOption = Path("."), as_json: JsonOption = False) -> None:
    """Lista propostas de catálogo (cadeiras, cursos, instituições em falta)."""
    data = _repo(repo)
    proposals = sorted(data.proposals.values(), key=lambda p: p.id)
    if as_json:
        _print_json([p.model_dump(mode="json", exclude_none=True) for p in proposals])
        return
    for p in proposals:
        typer.echo(f"{p.status:<9} {p.id}  ({len(p.evidence)} evidências)")


@catalog_app.command("aceitar")
def catalogo_aceitar(
    proposta: Annotated[str, typer.Argument()],
    repo: RepoOption = Path("."),
    slug: Annotated[str | None, typer.Option()] = None,
    instituicao: Annotated[str | None, typer.Option()] = None,
    codigo: Annotated[str | None, typer.Option()] = None,
    sigla: Annotated[str | None, typer.Option()] = None,
) -> None:
    """Aceita uma proposta de cadeira e cria-a no catálogo."""
    from nexus.review import ReviewError, accept_unit_proposal

    try:
        unit = accept_unit_proposal(_repo(repo), proposta, slug, instituicao, codigo, sigla)
    except ReviewError as exc:
        _fail(str(exc))
        return
    typer.echo(f"Cadeira criada: {unit.key}")


@catalog_app.command("rejeitar")
def catalogo_rejeitar(proposta: Annotated[str, typer.Argument()],
                      repo: RepoOption = Path(".")) -> None:
    """Rejeita uma proposta (não volta a ser sugerida)."""
    from nexus.review import ReviewError, set_proposal_status

    try:
        set_proposal_status(_repo(repo), proposta, "rejected")
    except ReviewError as exc:
        _fail(str(exc))


# --- revisão ----------------------------------------------------------------------------


@review_app.command("listar")
def revisao_listar(repo: RepoOption = Path("."), as_json: JsonOption = False) -> None:
    """Documentos com revisão aberta."""
    from nexus.review import describe, pending

    docs = pending(_repo(repo))
    if as_json:
        _print_json([describe(d) for d in docs])
        return
    for doc in docs:
        codes = ", ".join(r.code for r in doc.review.reasons) if doc.review else ""
        typer.echo(f"{doc.id[:8]}  {doc.display_name}  [{codes}]")
    typer.echo(f"{len(docs)} por rever")


@review_app.command("propor")
def revisao_propor(
    documento: Annotated[str, typer.Argument()],
    ficheiro: Annotated[str, typer.Option(help="JSON com {fields: {...}} ou - (stdin).")],
    repo: RepoOption = Path("."),
    metodo: Annotated[str, typer.Option(help="Identificação do agente.")] = "ai:claude-code",
) -> None:
    """Grava uma proposta de classificação feita por IA (nunca sobrepõe o utilizador)."""
    from nexus.review import ReviewError, propose

    raw = sys.stdin.read() if ficheiro == "-" else Path(ficheiro).read_text(encoding="utf-8")
    try:
        payload = json.loads(raw)
        doc = propose(_repo(repo), documento, payload.get("fields", {}), metodo)
    except (json.JSONDecodeError, ReviewError) as exc:
        _fail(str(exc))
        return
    typer.echo(f"proposta gravada em {doc.id}; corre `nexus processar` para aplicar")


@review_app.command("resolver")
def revisao_resolver(
    documento: Annotated[str, typer.Argument()],
    campo: Annotated[list[str], typer.Option(help="nome=valor (repetível).")],
    repo: RepoOption = Path("."),
    login: Annotated[str | None, typer.Option()] = None,
) -> None:
    """Confirma/corrige campos como o utilizador faria na interface."""
    from nexus.review import ReviewError, resolve

    data = _repo(repo)
    values: dict[str, Any] = {}
    for item in campo:
        name, sep, value = item.partition("=")
        if not sep:
            _fail(f"usa nome=valor: {item}")
        values[name] = int(value) if name == "assessment_number" else value
    try:
        doc = resolve(data, documento, values, login or str(data.raw_settings.get("owner")))
    except ReviewError as exc:
        _fail(str(exc))
        return
    typer.echo(f"resolvido {doc.id}")


# --- documentos -------------------------------------------------------------------------


@document_app.command("mostrar")
def documento_mostrar(documento: Annotated[str, typer.Argument()],
                      repo: RepoOption = Path(".")) -> None:
    """Mostra o registo completo de um documento (JSON)."""
    from nexus.review import ReviewError, _get

    try:
        doc = _get(_repo(repo), documento)
    except ReviewError as exc:
        _fail(str(exc))
        return
    _print_json(doc.model_dump(mode="json", exclude_none=True))


@document_app.command("texto")
def documento_texto(
    documento: Annotated[str, typer.Argument()],
    repo: RepoOption = Path("."),
    paginas: Annotated[str | None, typer.Option(help="Ex.: 1-3 ou 2.")] = None,
) -> None:
    """Texto extraído de um documento, página a página."""
    from nexus.review import ReviewError, _get

    data = _repo(repo)
    try:
        doc = _get(data, documento)
    except ReviewError as exc:
        _fail(str(exc))
        return
    texts = data.page_texts(doc.blob.sha256)
    first, last = 1, len(texts)
    if paginas:
        start, _, end = paginas.partition("-")
        first, last = int(start), int(end or start)
    for number in range(first, min(last, len(texts)) + 1):
        typer.echo(f"<!-- página {number} -->\n{texts[number - 1]}")


def main() -> None:
    app()


if __name__ == "__main__":
    main()


# --- visibilidade -----------------------------------------------------------------------

VisibilityArg = Annotated[str, typer.Argument(
    help="publico, privado ou cadeira (seguir a escolha da cadeira).")]


@sharing_app.command("documento")
def visibilidade_documento(documento: Annotated[str, typer.Argument()],
                           valor: VisibilityArg, repo: RepoOption = Path(".")) -> None:
    """Define a visibilidade de um documento (excepção à escolha da cadeira)."""
    from nexus.sharing import SharingError, set_document_visibility

    try:
        doc = set_document_visibility(_repo(repo), documento, valor)
    except SharingError as exc:
        _fail(str(exc))
        return
    typer.echo(f"{doc.id}: {doc.visibility or 'segue a cadeira'}")


@sharing_app.command("cadeira")
def visibilidade_cadeira(
    cadeira: Annotated[str, typer.Argument(help="Chave da cadeira, ex.: ufe/am1.")],
    valor: VisibilityArg,
    repo: RepoOption = Path("."),
    login: Annotated[str | None, typer.Option(help="Dono (por defeito, o do nexus.yaml).")]
    = None,
) -> None:
    """Define a visibilidade de todo o material de uma cadeira."""
    from nexus.sharing import SharingError, set_unit_visibility

    data = _repo(repo)
    owner = login or str(data.raw_settings.get("owner", ""))
    try:
        user = set_unit_visibility(data, owner, cadeira, None if valor == "cadeira" else valor)
    except SharingError as exc:
        _fail(str(exc))
        return
    typer.echo(f"{cadeira}: {user.sharing.units.get(cadeira, 'private')}")


@sharing_app.command("tipo")
def visibilidade_tipo(
    cadeira: Annotated[str, typer.Argument(help="Chave da cadeira, ex.: ufe/am1.")],
    tipo: Annotated[str, typer.Argument(help="Tipo de documento, ex.: fichas.")],
    valor: VisibilityArg,
    repo: RepoOption = Path("."),
    login: Annotated[str | None, typer.Option(help="Dono (por defeito, o do nexus.yaml).")]
    = None,
) -> None:
    """Define a visibilidade de um tipo de material dentro de uma cadeira."""
    from nexus.domain.visibility import type_key
    from nexus.sharing import SharingError, set_type_visibility

    data = _repo(repo)
    owner = login or str(data.raw_settings.get("owner", ""))
    try:
        user = set_type_visibility(data, owner, cadeira, tipo,
                                   None if valor == "cadeira" else valor)
    except SharingError as exc:
        _fail(str(exc))
        return
    typer.echo(f"{cadeira} ({tipo}): "
               f"{user.sharing.types.get(type_key(cadeira, tipo), 'segue a cadeira')}")
