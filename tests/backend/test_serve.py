from __future__ import annotations

import subprocess
from pathlib import Path

from nexus.datarepo.git import Git
from nexus.serve import (
    BATCH_ITEMS,
    PUBLIC_EVERY,
    QUIET_SECONDS,
    PublicState,
    app_has_update,
    only_personal,
    publish_public_if_due,
    remote_has_news,
    serve,
    serve_once,
    wait_until_quiet,
)


def _git(cwd: Path, *args: str) -> None:
    subprocess.run(["git", "-c", "user.name=t", "-c", "user.email=t@t", *args],
                   cwd=cwd, check=True, capture_output=True)


def test_remote_has_news_after_other_clone_pushes(tmp_path: Path) -> None:
    bare = tmp_path / "remote.git"
    subprocess.run(["git", "init", "-q", "--bare", "-b", "main", str(bare)], check=True)
    a, b = tmp_path / "a", tmp_path / "b"
    subprocess.run(["git", "clone", "-q", str(bare), str(a)], check=True, capture_output=True)
    (a / "x.txt").write_text("1")
    _git(a, "add", "-A")
    _git(a, "commit", "-q", "-m", "um")
    _git(a, "push", "-q", "origin", "HEAD:main")
    subprocess.run(["git", "clone", "-q", str(bare), str(b)], check=True, capture_output=True)
    assert not remote_has_news(Git(b), "origin", "main")
    assert not serve_once(b)

    (a / "y.txt").write_text("2")
    _git(a, "add", "-A")
    _git(a, "commit", "-q", "-m", "dois")
    _git(a, "push", "-q", "origin", "HEAD:main")
    assert remote_has_news(Git(b), "origin", "main")


def test_quiet_remote_is_checked_without_fetching(tmp_path: Path, monkeypatch) -> None:
    """Sem nada de novo, cada verificação é só um `ls-remote` (barato): o fetch só acontece
    quando o último commit do remoto mudou."""
    bare = tmp_path / "remote.git"
    subprocess.run(["git", "init", "-q", "--bare", "-b", "main", str(bare)], check=True)
    a, b = tmp_path / "a", tmp_path / "b"
    subprocess.run(["git", "clone", "-q", str(bare), str(a)], check=True, capture_output=True)
    (a / "x.txt").write_text("1")
    _git(a, "add", "-A")
    _git(a, "commit", "-q", "-m", "um")
    _git(a, "push", "-q", "origin", "HEAD:main")
    subprocess.run(["git", "clone", "-q", str(bare), str(b)], check=True, capture_output=True)
    git = Git(b)
    calls: list[str] = []
    original = Git.run

    def spy(self: Git, *args: str, **kwargs):  # type: ignore[no-untyped-def]
        calls.append(args[0])
        return original(self, *args, **kwargs)

    monkeypatch.setattr(Git, "run", spy)
    assert not remote_has_news(git, "origin", "main")
    assert "ls-remote" in calls and "fetch" not in calls
    (a / "y.txt").write_text("2")
    _git(a, "add", "-A")
    _git(a, "commit", "-q", "-m", "dois")
    _git(a, "push", "-q", "origin", "HEAD:main")
    assert remote_has_news(git, "origin", "main")
    assert "fetch" in calls


def test_reading_marks_alone_are_not_processed(tmp_path: Path, monkeypatch) -> None:
    """As marcas de leitura (e o registo dos acessos) não passam pelo pipeline: só se traz."""
    import nexus.serve as serve_module

    assert only_personal(["anotacoes/aluna/abc.json", "acessos.yaml"])
    assert not only_personal(["anotacoes/aluna/abc.json", "documentos/abc.yaml"])
    assert not only_personal([])
    bare = tmp_path / "remote.git"
    subprocess.run(["git", "init", "-q", "--bare", "-b", "main", str(bare)], check=True)
    a, b = tmp_path / "a", tmp_path / "b"
    subprocess.run(["git", "clone", "-q", str(bare), str(a)], check=True, capture_output=True)
    (a / "x.txt").write_text("1")
    _git(a, "add", "-A")
    _git(a, "commit", "-q", "-m", "um")
    _git(a, "push", "-q", "origin", "HEAD:main")
    subprocess.run(["git", "clone", "-q", str(bare), str(b)], check=True, capture_output=True)
    (a / "anotacoes" / "aluna").mkdir(parents=True)
    (a / "anotacoes" / "aluna" / "doc.json").write_text("{}")
    _git(a, "add", "-A")
    _git(a, "commit", "-q", "-m", "marcas")
    _git(a, "push", "-q", "origin", "HEAD:main")
    processed: list[Path] = []
    monkeypatch.setattr(serve_module, "wait_until_quiet", lambda *a, **k: None)
    monkeypatch.setattr(serve_module, "process_and_publish",
                        lambda root, **k: processed.append(root))
    assert not serve_once(b)
    assert processed == []
    assert (b / "anotacoes" / "aluna" / "doc.json").exists()  # trazido do remoto


def test_serve_commits_skip_ci(git_root: Path) -> None:
    """O que o `nexus servir` envia já está processado: o push não corre o Actions."""
    from conftest import deposit

    from amostras import gerar

    gerar.pdf_nativo(deposit(git_root, "ficha.pdf"), gerar.FICHA_DESCONHECIDA)
    assert serve_once(git_root, force=True)
    messages = subprocess.run(["git", "log", "--format=%B", "-3"], cwd=git_root, check=True,
                              capture_output=True, text=True).stdout
    assert "nexus: processar depósito" in messages
    for message in messages.split("nexus:")[1:]:
        assert "[skip ci]" in message, message


def test_app_update_is_seen_only_when_pull_is_safe(tmp_path: Path) -> None:
    """O `nexus servir` reinicia quando a aplicação tem uma versão nova (o .bat faz pull)."""
    bare = tmp_path / "app.git"
    subprocess.run(["git", "init", "-q", "--bare", "-b", "main", str(bare)], check=True)
    dev, local = tmp_path / "dev", tmp_path / "local"
    subprocess.run(["git", "clone", "-q", str(bare), str(dev)], check=True, capture_output=True)
    (dev / "pyproject.toml").write_text("[project]\n")
    _git(dev, "add", "-A")
    _git(dev, "commit", "-q", "-m", "um")
    _git(dev, "push", "-q", "origin", "HEAD:main")
    subprocess.run(["git", "clone", "-q", str(bare), str(local)], check=True,
                   capture_output=True)
    assert not app_has_update(local)
    (dev / "x.py").write_text("x = 1\n")
    _git(dev, "add", "-A")
    _git(dev, "commit", "-q", "-m", "dois")
    _git(dev, "push", "-q", "origin", "HEAD:main")
    assert app_has_update(local)
    (local / "pyproject.toml").write_text("[project]\nname = 'mexido'\n")
    assert not app_has_update(local), "com alterações locais o pull podia falhar"


def test_serve_stops_when_the_app_has_a_new_version(tmp_path: Path) -> None:
    sleeps: list[float] = []
    assert serve(tmp_path, interval=600, sleep=sleeps.append, has_update=lambda: True)
    assert sleeps == []
    assert not serve(tmp_path, once=True, has_update=lambda: True)


class _QuietGit:
    """Remoto que recebe um commit novo a meio da espera."""

    def __init__(self, stamps: list[int]) -> None:
        self.stamps = stamps
        self.fetches = 0

    def run(self, *args: str, check: bool = True) -> str:
        if args[0] == "log":
            return str(self.stamps[min(self.fetches, len(self.stamps) - 1)])
        if args[0] == "fetch":
            self.fetches += 1
        return ""


def test_waits_until_the_interface_stops_writing() -> None:
    """Uma série de alterações na interface (ex.: arrastar cadeiras) processa-se de uma vez,
    quando o remoto fica uns segundos parado, em vez de a cada commit."""
    clock = [1000.0]
    git = _QuietGit([995, 1010])  # o último commit tinha 5 s; chega outro durante a espera

    def sleep(seconds: float) -> None:
        clock[0] += seconds

    wait_until_quiet(git, "origin", "main", sleep, lambda: clock[0])  # type: ignore[arg-type]
    assert git.fetches == 2
    assert clock[0] - 1010 >= QUIET_SECONDS


def test_busy_remote_is_not_an_error(tmp_path: Path, monkeypatch, caplog) -> None:
    import logging

    from nexus import serve as serve_module
    from nexus.datarepo.git import RemoteBusy

    def busy(*args, **kwargs):
        raise RemoteBusy("o repositório continua a mudar")

    monkeypatch.setattr(serve_module, "serve_once", busy)
    with caplog.at_level(logging.INFO, logger="nexus.serve"):
        assert serve(tmp_path, interval=600, sleep=lambda s: None, has_update=lambda: True)
    assert [r.levelno for r in caplog.records if "continua a mudar" in r.message] == [logging.INFO]


def test_serve_migrates_and_processes_in_batches(git_root: Path, monkeypatch) -> None:
    """Sem o Actions, o servir faz o que ele fazia: migra o formato dos ficheiros e trata um
    depósito grande aos bocados (o que já está feito aparece logo na biblioteca)."""
    import nexus.serve as serve_module
    from nexus.pipeline.run import RunReport
    from nexus.publish import ProcessResult

    calls: list[int | None] = []
    remaining = [True, True, False]

    def fake_process(root: Path, **kwargs):  # type: ignore[no-untyped-def]
        calls.append(kwargs.get("max_items"))
        return ProcessResult(report=RunReport(remaining_items=remaining.pop(0)))

    migrated: list[Path] = []
    monkeypatch.setattr(serve_module, "process_and_publish", fake_process)
    monkeypatch.setattr(serve_module, "migrate", lambda root: migrated.append(root) or [])
    assert serve_once(git_root, force=True)
    assert migrated == [git_root]
    assert calls == [BATCH_ITEMS] * 3


def test_public_material_is_published_when_it_may_have_changed(git_root: Path,
                                                               monkeypatch) -> None:
    """O material público publica-se no servir (antes só o Actions o fazia): só quando muda
    alguma coisa de que depende, no máximo de 5 em 5 minutos, e uma falha não pára nada."""
    import nexus.serve as serve_module
    from nexus.datarepo.layout import Layout
    from nexus.datarepo.yamlio import read_yaml, write_yaml_if_changed
    from nexus.public import PublicResult, PublishError

    state = PublicState()
    clock = [1000.0]
    calls: list[str | None] = []

    def fake_publish(root: Path, token: str | None = None):  # type: ignore[no-untyped-def]
        calls.append(token)
        return PublicResult(configured=True, target="aluna/estudo-publico", published=True)

    monkeypatch.setattr(serve_module, "publish_public", fake_publish)
    monkeypatch.setenv("NEXUS_PUBLICO_TOKEN", "segredo")
    assert not publish_public_if_due(git_root, state, now=lambda: clock[0])  # não configurado

    layout = Layout(git_root)
    data = read_yaml(layout.settings_file)
    data["publishing"] = {"public_repo": "aluna/estudo-publico"}
    write_yaml_if_changed(layout.settings_file, data)
    _git(git_root, "commit", "-qam", "publicar")
    assert publish_public_if_due(git_root, state, now=lambda: clock[0])
    assert calls == ["segredo"]
    assert not publish_public_if_due(git_root, state, now=lambda: clock[0] + 10_000)  # igual

    (git_root / "documentos").mkdir(exist_ok=True)
    (git_root / "documentos" / "x.yaml").write_text("id: x\n")
    _git(git_root, "add", "-A")
    _git(git_root, "commit", "-qm", "outro documento")
    clock[0] += 60
    assert not publish_public_if_due(git_root, state, now=lambda: clock[0])  # cedo demais
    clock[0] += PUBLIC_EVERY
    assert publish_public_if_due(git_root, state, now=lambda: clock[0])
    assert len(calls) == 2

    def failing(root: Path, token: str | None = None):  # type: ignore[no-untyped-def]
        raise PublishError("sem acesso")

    monkeypatch.setattr(serve_module, "publish_public", failing)
    (git_root / "documentos" / "y.yaml").write_text("id: y\n")
    _git(git_root, "add", "-A")
    _git(git_root, "commit", "-qm", "mais um")
    clock[0] += PUBLIC_EVERY
    assert publish_public_if_due(git_root, state, now=lambda: clock[0])
    clock[0] += PUBLIC_EVERY  # depois de uma falha, espera meia hora
    assert not publish_public_if_due(git_root, state, now=lambda: clock[0])
