# Documentation Index

> **COO Multi-Agent Workbench** — Enterprise Documentation Hub
> Last Updated: 2026-02-17

---

## Getting Started

| Document | Description | Audience |
|----------|-------------|----------|
| [**PROGRESS.md**](PROGRESS.md) | Detailed progress report — architecture, bugs fixed, troubleshooting playbook, next steps. **Start here for current state.** | All Engineers |
| [SHIPPING_CHECKLIST.md](SHIPPING_CHECKLIST.md) | Stakeholder handoff checklist and delivery criteria. | Project Managers, Tech Leads |

---

## Architecture

| Document | Description | Audience |
|----------|-------------|----------|
| [Agent Architecture](architecture/AGENT_ARCHITECTURE.md) | Complete 13-agent, 4-tier system design. Agent responsibilities, tool mappings, DB access patterns, UI integration. | Architects, Tech Leads |
| [UI Integration Guide](architecture/UI_CHANGES_FOR_AGENT_INTEGRATION.md) | Angular component changes for agent integration — DifyService wiring, envelope protocol, card rendering. | Frontend Engineers |

## Dify Agent Configuration

| Document | Description | Audience |
|----------|-------------|----------|
| [Enterprise Agent Architecture](dify-agents/ENTERPRISE_AGENT_ARCHITECTURE_FREEZE.md) | Phase 0 target architecture for Dify Cloud + Railway MCP + Angular. Freeze specification with validation gates. **Primary reference for agent setup.** | AI Engineers, Architects |

## MCP Tools Server

| Document | Description | Audience |
|----------|-------------|----------|
| [MCP Tools Documentation](mcp-server/MCP_TOOLS_DOCUMENTATION.md) | Complete technical reference for all 71 tools across 18 modules. API reference, agent-to-tool mapping, deployment guide. | Backend Engineers, DevOps |

## Knowledge Base

| Document | Description | Audience |
|----------|-------------|----------|
| [KB Strategy (LLM-First)](knowledge-base/Dify_KB_Strategy_FINAL_LLM_First.md) | Final LLM-first RAG strategy for Knowledge Base ingestion and retrieval. | AI Engineers |
| [NPA Approval Matrix](knowledge-base/KB_NPA_Approval_Matrix.md) | Approval routing rules, authority matrix, delegation hierarchy. | Domain Experts, Compliance |
| [NPA Classification Rules](knowledge-base/KB_NPA_Classification_Rules.md) | NTG scoring criteria, track determination, prohibited screening. | Domain Experts, Risk |
| [NPA Policies](knowledge-base/KB_NPA_Policies.md) | NPA policy documentation for RAG ingestion. | Compliance, Legal |
| [NPA State Machine](knowledge-base/KB_NPA_State_Machine.md) | Workflow states, transitions, gate conditions, loop-back rules. | Process Engineers |
| [NPA Templates](knowledge-base/KB_NPA_Templates.md) | 47-field NPA template structure for AutoFill agent. | Domain Experts |

## Database

| Document | Description | Audience |
|----------|-------------|----------|
| [Database Schema](database/database_schema.md) | 42-table schema with relationships, indexes, and seed data reference. | DBAs, Backend Engineers |

---

## Quick Links

- **Root README:** [../README.md](../README.md)
- **Project Context:** [../PROJECT_CONTEXT.md](../PROJECT_CONTEXT.md)
- **Railway Deployment:** [../RAILWAY_DEPLOYMENT_STATUS.md](../RAILWAY_DEPLOYMENT_STATUS.md)
- **Progress Report:** [PROGRESS.md](PROGRESS.md)
