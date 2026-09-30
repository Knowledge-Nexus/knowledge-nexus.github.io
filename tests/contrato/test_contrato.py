from __future__ import annotations

import json
from pathlib import Path

from nexus.domain.text import normalize

HERE = Path(__file__).parent


def test_normalization_vectors() -> None:
    for text, expected in json.loads((HERE / "normalizacao.json").read_text()):
        assert normalize(text) == expected, text


def test_contract_index_builds(tmp_path: Path) -> None:
    from gerar_indice import build

    build(tmp_path)
    expected = json.loads((tmp_path / "esperado.json").read_text())
    assert expected["documents"] and expected["search"]["sucessao"]
    assert expected["search_other_viewer"] == []
