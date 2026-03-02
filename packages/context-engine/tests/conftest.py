"""Shared pytest fixtures for context-engine tests."""

import json
import pytest
from pathlib import Path

PACKAGE_ROOT = Path(__file__).resolve().parent.parent
CONFIG_DIR = PACKAGE_ROOT / "config"
CONTRACTS_DIR = PACKAGE_ROOT / "contracts"


@pytest.fixture
def config_dir():
    return CONFIG_DIR


@pytest.fixture
def contracts_dir():
    return CONTRACTS_DIR


@pytest.fixture
def sample_provenance_tag():
    """A valid provenance tag for testing."""
    return {
        "source_id": "SoR:npa_projects:142",
        "source_type": "system_of_record",
        "authority_tier": 1,
        "fetched_at": "2026-03-01T09:15:00+00:00",
        "ttl_seconds": 3600,
        "trust_class": "TRUSTED",
        "data_classification": "CONFIDENTIAL",
    }


@pytest.fixture
def orchestrator_contract():
    """Load the real orchestrator contract."""
    fp = CONTRACTS_DIR / "orchestrator.json"
    return json.loads(fp.read_text(encoding="utf-8"))


@pytest.fixture
def worker_contract():
    """Load the real worker contract."""
    fp = CONTRACTS_DIR / "worker.json"
    return json.loads(fp.read_text(encoding="utf-8"))


@pytest.fixture
def reviewer_contract():
    """Load the real reviewer contract."""
    fp = CONTRACTS_DIR / "reviewer.json"
    return json.loads(fp.read_text(encoding="utf-8"))
