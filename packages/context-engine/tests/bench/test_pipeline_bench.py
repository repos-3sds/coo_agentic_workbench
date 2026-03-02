"""
Performance Benchmarks (Sprint 6 — S6-008)

Measures:
    - p50, p95, p99 assembly latency (with mock adapters)
    - Memory usage per assembly call
    - Token counting throughput (tokens/sec)
    - Budget allocation time

SLO targets:
    - p95 assembly latency < 200ms (excluding network)

Baseline numbers are printed to stdout for CI capture.

Status: IMPLEMENTED
"""

from __future__ import annotations

import statistics
import sys
import time
import tracemalloc
from typing import Any

import pytest

from context_engine import (
    assemble_context,
    count_tokens,
    estimate_tokens,
    allocate_budget,
    trim_to_budget,
    load_contract,
    create_session,
    add_turn,
    compress_history,
    create_trace,
    add_stage_event,
    finalize_trace,
    create_circuit_breaker,
    score_grounding,
    retrieve,
    rerank,
)

pytestmark = pytest.mark.slow


# ── Fixtures ─────────────────────────────────────────────────────────────────

ITERATIONS_FAST = 50
ITERATIONS_FULL = 100


def _mock_adapters() -> dict:
    """Mock adapters simulating realistic data sizes."""
    return {
        "retrieve": lambda query, domain, opts: [
            {"content": f"SOP section {i}: NPA classification criteria require dual "
                        f"scoring methodology for derivatives over SGD 50M notional.",
             "source_id": "bank_sops", "source_type": "bank_sop",
             "authority_tier": 2, "trust_class": "TRUSTED",
             "data_classification": "INTERNAL"}
            for i in range(8)
        ],
        "get_entity_data": lambda entity_ids, domain: [
            {"id": eid, "status": "Active", "type": "derivative",
             "notional": "SGD 75M", "counterparty": "CPTY-ABC",
             "source_id": "npa_project_api", "source_type": "system_of_record",
             "authority_tier": 1, "trust_class": "TRUSTED",
             "data_classification": "CONFIDENTIAL"}
            for eid in entity_ids
        ],
        "get_kb_chunks": lambda query, domain, opts: [
            {"content": f"KB chunk {i}: Risk assessment framework mandates "
                        f"counterparty credit review for cross-border transactions.",
             "source_id": "risk_framework", "source_type": "bank_sop",
             "authority_tier": 2, "trust_class": "TRUSTED",
             "data_classification": "INTERNAL"}
            for i in range(5)
        ],
    }


def _npa_request() -> dict:
    return {
        "agent_id": "NPA_BIZ",
        "entity_ids": ["NPA-200", "NPA-201"],
        "query": "Evaluate viability and risk classification of structured derivative product",
        "system_prompt": "You are a senior business analyst at DBS Bank specializing in NPA evaluation.",
        "conversation_history": [
            {"role": "user", "content": "Analyze the derivative product proposal."},
            {"role": "assistant", "content": "I'll evaluate the product across business, risk, and regulatory dimensions."},
        ],
        "few_shot_examples": [],
        "tool_schemas": [],
        "sources": [],
    }


def _percentile(data: list[float], p: int) -> float:
    """Calculate percentile from sorted data."""
    sorted_data = sorted(data)
    k = (len(sorted_data) - 1) * (p / 100.0)
    f = int(k)
    c = f + 1
    if c >= len(sorted_data):
        return sorted_data[f]
    return sorted_data[f] + (k - f) * (sorted_data[c] - sorted_data[f])


# ── 1. Assembly Latency Benchmarks ───────────────────────────────────────────


class TestAssemblyLatency:
    """Benchmark context assembly pipeline latency."""

    def test_worker_assembly_latency(self):
        """Worker assembly p50/p95/p99 latency (with mock adapters)."""
        request = _npa_request()
        adapters = _mock_adapters()
        latencies: list[float] = []

        # Warmup
        for _ in range(5):
            assemble_context(request=request, archetype="worker",
                             domain="NPA", adapters=adapters)

        # Measure
        for _ in range(ITERATIONS_FULL):
            start = time.perf_counter()
            assemble_context(request=request, archetype="worker",
                             domain="NPA", adapters=adapters)
            elapsed_ms = (time.perf_counter() - start) * 1000
            latencies.append(elapsed_ms)

        p50 = _percentile(latencies, 50)
        p95 = _percentile(latencies, 95)
        p99 = _percentile(latencies, 99)

        print(f"\n[BENCH] Worker Assembly Latency ({ITERATIONS_FULL} iters):")
        print(f"  p50: {p50:.2f}ms  p95: {p95:.2f}ms  p99: {p99:.2f}ms")
        print(f"  min: {min(latencies):.2f}ms  max: {max(latencies):.2f}ms")
        print(f"  mean: {statistics.mean(latencies):.2f}ms  stdev: {statistics.stdev(latencies):.2f}ms")

        # SLO: p95 < 200ms for assembly (excluding network)
        assert p95 < 200, f"SLO BREACH: p95 assembly = {p95:.2f}ms (limit: 200ms)"

    def test_orchestrator_assembly_latency(self):
        """Orchestrator assembly is faster (lightweight profile)."""
        request = {
            "agent_id": "NPA_ORCHESTRATOR", "entity_ids": [],
            "query": "Route request", "system_prompt": "",
            "conversation_history": [], "few_shot_examples": [],
            "tool_schemas": [], "sources": [],
        }
        latencies: list[float] = []

        for _ in range(3):
            assemble_context(request=request, archetype="orchestrator", domain="NPA")

        for _ in range(ITERATIONS_FAST):
            start = time.perf_counter()
            assemble_context(request=request, archetype="orchestrator", domain="NPA")
            elapsed_ms = (time.perf_counter() - start) * 1000
            latencies.append(elapsed_ms)

        p50 = _percentile(latencies, 50)
        p95 = _percentile(latencies, 95)

        print(f"\n[BENCH] Orchestrator Assembly Latency ({ITERATIONS_FAST} iters):")
        print(f"  p50: {p50:.2f}ms  p95: {p95:.2f}ms")

        assert p95 < 200, f"SLO BREACH: p95 orchestrator = {p95:.2f}ms"

    def test_reviewer_assembly_latency(self):
        """Reviewer assembly uses compact profile."""
        request = {
            "agent_id": "NPA_REVIEWER", "entity_ids": [],
            "query": "Review analysis", "system_prompt": "",
            "conversation_history": [], "few_shot_examples": [],
            "tool_schemas": [], "sources": [],
        }
        latencies: list[float] = []

        for _ in range(ITERATIONS_FAST):
            start = time.perf_counter()
            assemble_context(request=request, archetype="reviewer", domain="NPA")
            elapsed_ms = (time.perf_counter() - start) * 1000
            latencies.append(elapsed_ms)

        p95 = _percentile(latencies, 95)
        print(f"\n[BENCH] Reviewer Assembly p95: {p95:.2f}ms")
        assert p95 < 200


# ── 2. Memory Usage Benchmarks ───────────────────────────────────────────────


class TestMemoryUsage:
    """Benchmark memory usage during assembly."""

    def test_assembly_memory_per_call(self):
        """Measure peak memory allocated per assembly call."""
        request = _npa_request()
        adapters = _mock_adapters()

        # Warmup
        assemble_context(request=request, archetype="worker",
                         domain="NPA", adapters=adapters)

        tracemalloc.start()
        snapshot_before = tracemalloc.take_snapshot()

        for _ in range(20):
            assemble_context(request=request, archetype="worker",
                             domain="NPA", adapters=adapters)

        snapshot_after = tracemalloc.take_snapshot()
        tracemalloc.stop()

        stats = snapshot_after.compare_to(snapshot_before, "lineno")
        total_delta_kb = sum(s.size_diff for s in stats) / 1024.0

        print(f"\n[BENCH] Memory delta for 20 assembly calls: {total_delta_kb:.1f} KB")
        print(f"  Per-call estimate: {total_delta_kb / 20:.1f} KB")

        # Sanity: each call should use < 1MB of incremental memory
        per_call_kb = total_delta_kb / 20
        assert per_call_kb < 1024, f"Memory leak? {per_call_kb:.1f} KB/call"

    def test_no_memory_leak_100_calls(self):
        """100 calls should not accumulate unbounded memory."""
        request = _npa_request()
        adapters = _mock_adapters()

        tracemalloc.start()
        baseline = tracemalloc.get_traced_memory()[0]

        for _ in range(100):
            assemble_context(request=request, archetype="worker",
                             domain="NPA", adapters=adapters)

        _, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()

        peak_mb = peak / (1024 * 1024)
        print(f"\n[BENCH] Peak memory after 100 calls: {peak_mb:.2f} MB")

        # Peak should stay under 50MB for 100 in-memory calls
        assert peak_mb < 50, f"Memory exceeded 50MB: {peak_mb:.2f} MB"


# ── 3. Token Counting Throughput ──────────────────────────────────────────────


class TestTokenCountingThroughput:
    """Benchmark token counting speed."""

    def test_count_tokens_throughput(self):
        """Measure tokens/sec for count_tokens."""
        # ~500 tokens of text
        text = ("The NPA classification criteria require dual scoring methodology. "
                "For structured products exceeding SGD 50M notional value, "
                "enhanced due diligence and counterparty risk assessment are mandatory. ") * 10

        iterations = 200
        total_tokens = 0

        start = time.perf_counter()
        for _ in range(iterations):
            count = count_tokens(text)
            total_tokens += count
        elapsed = time.perf_counter() - start

        tokens_per_sec = total_tokens / elapsed
        calls_per_sec = iterations / elapsed

        print(f"\n[BENCH] Token Counting Throughput:")
        print(f"  {calls_per_sec:.0f} calls/sec")
        print(f"  {tokens_per_sec:.0f} tokens/sec")
        print(f"  Avg tokens per call: {total_tokens / iterations:.0f}")

        # Should handle at least 100 calls/sec
        assert calls_per_sec > 100, f"Token counting too slow: {calls_per_sec:.0f}/sec"

    def test_estimate_tokens_throughput(self):
        """estimate_tokens should be much faster than exact counting."""
        text = "Quick estimation test. " * 200
        char_count = len(text)

        iterations = 1000
        start = time.perf_counter()
        for _ in range(iterations):
            estimate_tokens(char_count)
        elapsed = time.perf_counter() - start

        calls_per_sec = iterations / elapsed
        print(f"\n[BENCH] Token Estimation: {calls_per_sec:.0f} calls/sec")

        # Estimation should be very fast — 1000+ calls/sec
        assert calls_per_sec > 500, f"Estimation too slow: {calls_per_sec:.0f}/sec"


# ── 4. Budget Allocation Benchmarks ──────────────────────────────────────────


class TestBudgetAllocationBenchmarks:
    """Benchmark budget allocation and trimming."""

    def test_allocate_budget_latency(self):
        """Budget allocation should be sub-millisecond."""
        contract = load_contract("worker")
        context = {
            "system_prompt_context": {"content": "You are an analyst.", "tokens": 50},
            "entity_data": {"content": "Entity data here.", "tokens": 200},
            "knowledge_chunks": {"content": "KB content.", "tokens": 300},
        }
        latencies: list[float] = []

        for _ in range(ITERATIONS_FAST):
            start = time.perf_counter()
            allocate_budget(context, contract)
            elapsed_ms = (time.perf_counter() - start) * 1000
            latencies.append(elapsed_ms)

        p95 = _percentile(latencies, 95)
        print(f"\n[BENCH] Budget Allocation p95: {p95:.3f}ms")
        assert p95 < 10, f"Budget allocation too slow: {p95:.3f}ms"

    def test_trim_to_budget_latency(self):
        """trim_to_budget with large context."""
        context = {
            "system_prompt_context": {"content": "You are an analyst." * 50, "tokens": 500, "priority": "FIXED"},
            "entity_data": {"content": "Entity record data. " * 200, "tokens": 2000, "priority": "HIGH"},
            "knowledge_chunks": {"content": "Knowledge base chunk. " * 500, "tokens": 5000, "priority": "MEDIUM"},
            "conversation_history": {"content": "Previous turns. " * 1000, "tokens": 10000, "priority": "LOW"},
        }
        contract = load_contract("worker")
        latencies: list[float] = []

        for _ in range(ITERATIONS_FAST):
            start = time.perf_counter()
            trim_to_budget(context, contract)
            elapsed_ms = (time.perf_counter() - start) * 1000
            latencies.append(elapsed_ms)

        p95 = _percentile(latencies, 95)
        print(f"\n[BENCH] trim_to_budget p95: {p95:.3f}ms")
        assert p95 < 50, f"Trimming too slow: {p95:.3f}ms"


# ── 5. Component Benchmarks ──────────────────────────────────────────────────


class TestComponentBenchmarks:
    """Benchmark individual pipeline components."""

    def test_session_lifecycle_throughput(self):
        """Memory session create + add turns + compress."""
        iterations = ITERATIONS_FAST
        start = time.perf_counter()

        for i in range(iterations):
            session = create_session(f"bench-{i}", {"domain": "NPA"})
            for j in range(5):
                session = add_turn(session, {"role": "user", "content": f"Turn {j}"})
                session = add_turn(session, {"role": "assistant", "content": f"Response {j}"})
            compress_history(session, max_tokens=500)

        elapsed = time.perf_counter() - start
        ops_per_sec = iterations / elapsed

        print(f"\n[BENCH] Session lifecycle (create+10turns+compress): {ops_per_sec:.0f} ops/sec")
        assert ops_per_sec > 50, f"Session lifecycle too slow: {ops_per_sec:.0f}/sec"

    def test_tracer_throughput(self):
        """Tracer create + stages + finalize."""
        iterations = ITERATIONS_FULL
        start = time.perf_counter()

        for i in range(iterations):
            trace = create_trace(f"bench-{i}")
            for stage in ("CLASSIFY", "SCOPE", "RETRIEVE", "RANK", "BUDGET", "ASSEMBLE", "TAG"):
                trace = add_stage_event(trace, stage, {
                    "duration_ms": 1.0, "items_in": 10, "items_out": 8,
                    "tokens_in": 100, "tokens_out": 200,
                })
            finalize_trace(trace)

        elapsed = time.perf_counter() - start
        ops_per_sec = iterations / elapsed

        print(f"\n[BENCH] Tracer lifecycle (7 stages): {ops_per_sec:.0f} ops/sec")
        assert ops_per_sec > 100, f"Tracer too slow: {ops_per_sec:.0f}/sec"

    def test_circuit_breaker_throughput(self):
        """Circuit breaker call overhead."""
        breaker = create_circuit_breaker({"failure_threshold": 5})
        iterations = 1000

        start = time.perf_counter()
        for _ in range(iterations):
            breaker["call"](lambda: "ok")
        elapsed = time.perf_counter() - start

        calls_per_sec = iterations / elapsed
        print(f"\n[BENCH] Circuit breaker: {calls_per_sec:.0f} calls/sec")
        assert calls_per_sec > 1000, f"Breaker overhead too high: {calls_per_sec:.0f}/sec"

    def test_grounding_scorer_latency(self):
        """Grounding scorer with realistic input."""
        text = ("The NPA is classified as Complex per SOPv3.2_NPA_Classification_Criteria. "
                "Risk assessment requires enhanced due diligence for cross-border derivatives.")
        ctx = {
            "_metadata": {"stages": [{
                "stage": "TAG",
                "provenance": [{
                    "source_id": "SOPv3.2_NPA_Classification_Criteria",
                    "source_type": "bank_sop", "trust_class": "TRUSTED",
                    "authority_tier": 2, "ttl_seconds": 86400,
                }],
            }]},
        }

        latencies: list[float] = []
        for _ in range(ITERATIONS_FAST):
            start = time.perf_counter()
            score_grounding(text, ctx)
            elapsed_ms = (time.perf_counter() - start) * 1000
            latencies.append(elapsed_ms)

        p95 = _percentile(latencies, 95)
        print(f"\n[BENCH] Grounding scorer p95: {p95:.3f}ms")
        assert p95 < 50, f"Grounding scorer too slow: {p95:.3f}ms"

    def test_rag_rerank_latency(self):
        """RAG reranking with 40 chunks."""
        chunks = [
            {"content": f"Chunk {i} about NPA classification criteria and risk assessment.",
             "source_id": f"source_{i % 5}", "source_type": "bank_sop",
             "authority_tier": (i % 4) + 1, "relevance_score": 0.9 - (i * 0.02)}
            for i in range(40)
        ]

        latencies: list[float] = []
        for _ in range(ITERATIONS_FAST):
            start = time.perf_counter()
            rerank("NPA classification criteria", chunks, top_k=8)
            elapsed_ms = (time.perf_counter() - start) * 1000
            latencies.append(elapsed_ms)

        p95 = _percentile(latencies, 95)
        print(f"\n[BENCH] RAG rerank (40 chunks → 8) p95: {p95:.3f}ms")
        assert p95 < 50, f"RAG rerank too slow: {p95:.3f}ms"


# ── Summary Reporter ──────────────────────────────────────────────────────────


class TestBenchmarkSummary:
    """Print a summary of all benchmark baselines."""

    def test_print_baseline_summary(self):
        """Run a final summary to capture baseline numbers."""
        request = _npa_request()
        adapters = _mock_adapters()

        # Assembly latency
        latencies = []
        for _ in range(30):
            start = time.perf_counter()
            assemble_context(request=request, archetype="worker",
                             domain="NPA", adapters=adapters)
            latencies.append((time.perf_counter() - start) * 1000)

        # Token throughput
        text = "NPA classification criteria and risk methodology. " * 20
        token_start = time.perf_counter()
        total_tok = 0
        for _ in range(100):
            total_tok += count_tokens(text)
        token_elapsed = time.perf_counter() - token_start

        print("\n" + "=" * 60)
        print("PERFORMANCE BASELINE SUMMARY")
        print("=" * 60)
        print(f"Assembly (worker, NPA, mock adapters):")
        print(f"  p50: {_percentile(latencies, 50):.2f}ms")
        print(f"  p95: {_percentile(latencies, 95):.2f}ms")
        print(f"  p99: {_percentile(latencies, 99):.2f}ms")
        print(f"Token counting: {total_tok / token_elapsed:.0f} tokens/sec")
        print(f"SLO target: p95 < 200ms")
        print(f"SLO status: {'PASS' if _percentile(latencies, 95) < 200 else 'FAIL'}")
        print("=" * 60)
