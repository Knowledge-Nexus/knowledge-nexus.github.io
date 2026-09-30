"""Leitura e escrita de YAML determinística (o mesmo conteúdo produz sempre o mesmo texto)."""

from __future__ import annotations

import json
import os
import tempfile
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel


class _Dumper(yaml.SafeDumper):
    pass


def _str_representer(dumper: yaml.SafeDumper, data: str) -> yaml.ScalarNode:
    style = "|" if "\n" in data else None
    return dumper.represent_scalar("tag:yaml.org,2002:str", data, style=style)


_Dumper.add_representer(str, _str_representer)


def dump_yaml(data: Any) -> str:
    return yaml.dump(
        data,
        Dumper=_Dumper,
        allow_unicode=True,
        sort_keys=False,
        default_flow_style=False,
        width=100,
    )


def read_yaml(path: Path) -> Any:
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def model_to_data(model: BaseModel) -> Any:
    return model.model_dump(mode="json", exclude_none=True)


def write_text_if_changed(path: Path, text: str) -> bool:
    """Escreve atomicamente só se o conteúdo mudar. Devolve True se escreveu."""
    if path.exists() and path.read_text(encoding="utf-8") == text:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, prefix=".tmp-", suffix=path.suffix)
    try:
        with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as fh:
            fh.write(text)
        os.replace(tmp, path)
    except BaseException:
        Path(tmp).unlink(missing_ok=True)
        raise
    return True


def write_yaml_if_changed(path: Path, data: Any) -> bool:
    if isinstance(data, BaseModel):
        data = model_to_data(data)
    return write_text_if_changed(path, dump_yaml(data))


def write_json_if_changed(path: Path, data: Any) -> bool:
    if isinstance(data, BaseModel):
        data = model_to_data(data)
    text = json.dumps(data, ensure_ascii=False, indent=2, sort_keys=False) + "\n"
    return write_text_if_changed(path, text)
