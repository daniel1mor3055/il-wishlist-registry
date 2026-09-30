from pathlib import Path

import pytest
from importlinter.application.use_cases import lint_imports
from importlinter.configuration import configure

_API_ROOT = Path(__file__).resolve().parents[1]


def test_module_boundaries(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.chdir(_API_ROOT)
    monkeypatch.syspath_prepend(str(_API_ROOT))
    # Settings start empty; the CLI registers these adapters at import.
    configure()
    passed = lint_imports(
        config_filename=str(_API_ROOT / "pyproject.toml"),
        cache_dir=None,
    )
    assert passed is True
