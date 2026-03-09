# Stress Testing Methodology — Playbook for NPA (POC)
**Agent:** CF_NPA_RMG  
**Suggested Dify dataset:** `COO Command Center — RMG (Stress Testing)`  
**Last updated:** 2026-02-23

## Purpose
Standardise how the agent requests and documents stress testing for new products:
- what scenarios to use
- how to summarise results in an NPA
- what triggers escalation

---

## 1) Stress test inputs the agent should request
- product payoff description + key risk drivers (rates, FX, vol, spread, correlation)
- hedge assumptions and limitations
- liquidity and funding assumptions
- counterparty set (if relevant)

---

## 2) Scenario families (recommended)
### Market shocks
- parallel rate shift (up/down)
- curve twist/steepener/flattener
- FX devaluation/revaluation
- vol spike / skew shift
- credit spread widening
- correlation breakdown (multi-asset)

### Idiosyncratic shocks
- single name default / downgrade
- clearing house margin shock
- settlement failure / delayed closeout

### Reverse stress
- identify conditions leading to breach of limits or capital buffers

---

## 3) Output format for NPA
**Stress Testing Summary**
- Scenarios tested: {…}
- Worst-case P&L / exposure: {…}
- Limit breaches: {none / list}
- Mitigants: {hedges, limits, kill-switch}
- Launch preconditions: {monitoring, limit setup, escalation contacts}

---

## 4) Escalation triggers
Escalate to senior RMG if:
- stress loss exceeds pre-agreed thresholds
- scenario triggers liquidity crisis / funding infeasibility
- model limitations make results unreliable

