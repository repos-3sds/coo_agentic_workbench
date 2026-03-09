# NPA Module Database Schema

Based on the UI components (`CooNpaDashboard`, `NpaAgentDashboard`, `NpaDetail`), the following relational schema is required to populate the application with real data.

## Core Tables

### 1. `npa_projects`
The central entity for the New Product Approval process.

| Column Name | Type | Description | UI Source |
| :--- | :--- | :--- | :--- |
| `id` | UUID (PK) | Unique Identifier | All |
| `project_name` | VARCHAR | Name of the product/project | All |
| `classification` | ENUM | 'Complex' (L1), 'Standard' (L2), 'Light' (L3) | `CooNpaDashboard` |
| `current_stage` | ENUM | 'Discovery', 'DCE Review', 'Risk Assess', 'Governance', 'Sign-Off' | Pipeline Health |
| `owner_id` | UUID (FK) | Reference to `users` table | Data Grids |
| `projected_revenue` | DECIMAL | Financial impact estimate | Top Revenue |
| `probability` | INTEGER | Success prob % (for prospects) | Product Opps |
| `status` | ENUM | 'On Track', 'At Risk', 'Delayed' | KPI/Grids |
| `created_at` | TIMESTAMP | Creation date (for Ageing calc) | Ageing Analysis |
| `updated_at` | TIMESTAMP | Last modification | General |
| `market_cluster_id`| UUID (FK) | Reference to `market_clusters` | Market Clusters |

### 2. `npa_workflow_history`
Tracks the movement of an NPA through stages for audit and cycle time calculation.

| Column Name | Type | Description | UI Source |
| :--- | :--- | :--- | :--- |
| `id` | UUID (PK) | | |
| `npa_id` | UUID (FK) | | |
| `stage_from` | ENUM | | Pipeline Health |
| `stage_to` | ENUM | | Pipeline Health |
| `timestamp` | TIMESTAMP | | Cycle Time KPI |
| `actor_id` | UUID (FK) | User who made the change | Audit Log |

### 3. `market_clusters`
Defines the strategic themes for the "Market Clusters" visualization.

| Column Name | Type | Description | UI Source |
| :--- | :--- | :--- | :--- |
| `id` | UUID (PK) | | |
| `name` | VARCHAR | e.g., "Sustainability", "Digital Assets" | Clusters Grid |
| `growth_rate` | DECIMAL | e.g., +45% | Clusters Grid |
| `color_code` | VARCHAR | Hex or Tailwind class for UI | Clusters Grid |

### 4. `product_prospects`
Early-stage opportunities (Pre-Pipeline) shown in the COO Dashboard.

| Column Name | Type | Description | UI Source |
| :--- | :--- | :--- | :--- |
| `id` | UUID (PK) | | |
| `name` | VARCHAR | | Product Opps List |
| `theme` | VARCHAR | | Product Opps List |
| `est_value` | DECIMAL | | Product Opps List |
| `probability` | INTEGER | | Product Opps List |
| `status` | ENUM | 'Pre-Seed', 'Dropped', 'Converted' | Product Opps List |

## Agent & KB Tables

### 5. `knowledge_bases`
Metadata for the RAG sources shown in the Agent Dashboard.

| Column Name | Type | Description | UI Source |
| :--- | :--- | :--- | :--- |
| `id` | UUID (PK) | | |
| `name` | VARCHAR | e.g., "Historical NPAs" | Agent Dash |
| `doc_count` | INTEGER | | Agent Dash |
| `last_synced` | TIMESTAMP | | Agent Dash |
| `type` | ENUM | 'Vector', 'Policy', 'Template' | Agent Dash |

### 6. `agent_audit_logs`
Logs of agentic actions for the "Active Agent Work Items" view.

| Column Name | Type | Description | UI Source |
| :--- | :--- | :--- | :--- |
| `id` | UUID (PK) | | |
| `job_id` | VARCHAR | e.g., "JOB-992" | Active Work Items |
| `agent_name` | VARCHAR | e.g., "TemplateAutoFill" | Active Work Items |
| `operation` | VARCHAR | Description of task | Active Work Items |
| `status` | ENUM | 'Running', 'Completed', 'Waiting', 'Failed' | Active Work Items |
| `duration_ms` | INTEGER | Execution time | Active Work Items |
| `timestamp` | TIMESTAMP | | |

## Operational & KPI Tables

### 7. `kpi_snapshots`
Daily snapshots of high-level metrics for trend analysis.

| Column Name | Type | Description | UI Source |
| :--- | :--- | :--- | :--- |
| `date` | DATE (PK) | | |
| `pipeline_value` | DECIMAL | | Top KPI Cards |
| `avg_cycle_time` | INTEGER | | Top KPI Cards |
| `pending_governance_count`| INTEGER | | Top KPI Cards |
| `critical_blockers_count` | INTEGER | | Top KPI Cards |

### 8. `alerts`
System notifications and risk alerts.

| Column Name | Type | Description | UI Source |
| :--- | :--- | :--- | :--- |
| `id` | UUID (PK) | | |
| `npa_id` | UUID (FK) | Linked project | Alerts Panel |
| `severity` | ENUM | 'High', 'Medium', 'Low' | Alerts Panel |
| `message` | VARCHAR | | Alerts Panel |
| `is_read` | BOOLEAN | | |
| `created_at` | TIMESTAMP | | |

## Detailed Project Tables (Detail View)

### 9. `npa_approvals`
Detailed approval status for the Risk Grid in `NpaDetailComponent`.

| Column Name | Type | Description | UI Source |
| :--- | :--- | :--- | :--- |
| `id` | UUID (PK) | | |
| `npa_id` | UUID (FK) | | |
| `department` | VARCHAR | e.g., 'Credit Risk', 'Legal', 'Compliance' | Risk Grid |
| `approver_id` | UUID (FK) | | Risk Grid |
| `status` | ENUM | 'Pending', 'Approved', 'Rejected', 'Conditional' | Risk Grid |
| `comments` | TEXT | | Risk Grid |
| `approval_date` | TIMESTAMP | | Risk Grid |

### 10. `npa_documents`
Files associated with an NPA.

| Column Name | Type | Description | UI Source |
| :--- | :--- | :--- | :--- |
| `id` | UUID (PK) | | |
| `npa_id` | UUID (FK) | | |
| `name` | VARCHAR | | Doc List |
| `type` | VARCHAR | e.g., 'Term Sheet', 'Risk Paper' | Doc List |
| `url` | VARCHAR | Path to storage | Doc List |
| `uploaded_by` | UUID (FK) | | Doc List |
| `is_parsed` | BOOLEAN | | Doc List |
| `validation_status` | ENUM | 'Valid', 'Warning', 'Error' | Doc List |

### 11. `npa_attributes`
Dynamic product specifications extracted from documents.

| Column Name | Type | Description | UI Source |
| :--- | :--- | :--- | :--- |
| `id` | UUID (PK) | | |
| `npa_id` | UUID (FK) | | |
| `attribute_key` | VARCHAR | e.g., "Underlying", "Tenor" | Product Specs |
| `attribute_value` | VARCHAR | e.g., "GBP/USD", "6 Months" | Product Specs |
| `confidence_score` | INTEGER | Extraction confidence (0-100) | Product Specs |
| `source_doc_id` | UUID (FK) | Link to `npa_documents` | Product Specs |

### 12. `npa_risk_analysis`
ML-generated predictions and risk flags.

| Column Name | Type | Description | UI Source |
| :--- | :--- | :--- | :--- |
| `id` | UUID (PK) | | |
| `npa_id` | UUID (FK) | | |
| `approval_likelihood` | INTEGER | Predicted % | Analysis Tab |
| `predicted_days` | DECIMAL | Est. cycle time | Analysis Tab |
| `bottleneck_dept` | VARCHAR | Predicted bottleneck | Analysis Tab |
| `risk_flags` | JSONB | List of flags (Blocking/Warning) | Agent Findings |

### 13. `connected_services`
Status of external integrations shown in the Agent Dashboard.

| Column Name | Type | Description | UI Source |
| :--- | :--- | :--- | :--- |
| `id` | UUID (PK) | | |
| `service_name` | VARCHAR | e.g., "Bloomberg API" | Services Panel |
| `status` | ENUM | 'Online', 'Offline', 'Syncing' | Services Panel |
| `latency_ms` | INTEGER | | Services Panel |
| `last_check` | TIMESTAMP | | Services Panel |

### 14. `npa_chat_messages`
History of the conversation between the user and the NPA Agent.

| Column Name | Type | Description | UI Source |
| :--- | :--- | :--- | :--- |
| `id` | UUID (PK) | | |
| `npa_id` | UUID (FK) | (Optional) if context bound | Chat Tab |
| `sender_type` | ENUM | 'User', 'Agent' | Chat Tab |
| `message_content` | TEXT | | Chat Tab |
| `timestamp` | TIMESTAMP | | Chat Tab |

### 15. `agent_kpis`
High-level performance metrics for the Agent Hero section.

| Column Name | Type | Description | UI Source |
| :--- | :--- | :--- | :--- |
| `id` | UUID (PK) | | |
| `metric_key` | VARCHAR | e.g., "npas_learned", "success_rate" | Agent Hero |
| `metric_value` | DECIMAL | | Agent Hero |
| `last_updated` | TIMESTAMP | | Agent Hero |

