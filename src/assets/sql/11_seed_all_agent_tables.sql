-- ============================================================
-- SEED ALL AGENT TABLES - Comprehensive data for all 42 tables
-- Covers 11 empty tables + enriches sparse tables
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. AGENT SESSIONS (10 sessions across various NPAs)
-- ────────────────────────────────────────────────────────────

INSERT INTO agent_sessions (id, project_id, user_id, agent_identity, current_stage, handoff_from, started_at, ended_at) VALUES
-- Sarah Lim creating Digital Asset Custody NPA
('SES-001', 'NPA-2026-001', 'USR-001', 'IDEATION_AGENT',       'IDEATION',       NULL,                  '2026-01-15 09:14:00', '2026-01-15 09:36:00'),
('SES-002', 'NPA-2026-001', 'USR-001', 'CLASSIFICATION_AGENT', 'CLASSIFICATION',  'IDEATION_AGENT',      '2026-01-15 09:36:00', '2026-01-15 09:37:00'),
('SES-003', 'NPA-2026-001', 'USR-001', 'TEMPLATE_AUTOFILL',    'DISCOVERY',       'CLASSIFICATION_AGENT','2026-01-15 09:37:00', '2026-01-15 09:42:00'),
-- Michael Chen creating Crypto Custody Prime
('SES-004', 'NPA-2026-004', 'USR-002', 'IDEATION_AGENT',       'IDEATION',       NULL,                  '2026-01-20 10:00:00', '2026-01-20 10:25:00'),
('SES-005', 'NPA-2026-004', 'USR-002', 'GOVERNANCE_AGENT',     'SIGN_OFFS',       'RISK_AGENT',          '2026-01-22 14:00:00', NULL),
-- James Liu on Green Bond ETF
('SES-006', 'NPA-2026-003', 'USR-003', 'IDEATION_AGENT',       'IDEATION',       NULL,                  '2026-01-18 11:00:00', '2026-01-18 11:30:00'),
('SES-007', 'NPA-2026-003', 'USR-003', 'RISK_AGENT',           'RISK_ASSESSMENT', 'CLASSIFICATION_AGENT','2026-01-19 09:00:00', '2026-01-19 09:01:00'),
-- Carbon Credit Exchange session
('SES-008', 'NPA-2026-010', 'USR-005', 'IDEATION_AGENT',       'IDEATION',       NULL,                  '2026-02-01 09:00:00', '2026-02-01 09:28:00'),
-- FX Accumulator monitoring session
('SES-009', 'NPA-2026-007', 'USR-001', 'MONITORING_AGENT',     'MONITORING',      'GOVERNANCE_AGENT',    '2026-02-05 08:00:00', NULL),
-- ESG Trade Finance governance session
('SES-010', 'NPA-2026-008', 'USR-003', 'GOVERNANCE_AGENT',     'SIGN_OFFS',       'RISK_AGENT',          '2026-01-25 10:00:00', NULL);

-- ────────────────────────────────────────────────────────────
-- 2. AGENT MESSAGES (40 messages across sessions)
--    Simulates real agent conversations
-- ────────────────────────────────────────────────────────────

INSERT INTO agent_messages (session_id, role, agent_identity_id, content, agent_confidence, reasoning_chain, citations, timestamp, metadata) VALUES
-- Session 1: Digital Asset Custody NPA Ideation
('SES-001', 'agent', 'MASTER_COO_ORCHESTRATOR', 'Routing to NPA Domain - detected new product creation intent', 97.5, 'Tokenized: "create NPA", "digital asset custody". Matched NPA_DOMAIN with 0.97 confidence.', NULL, '2026-01-15 09:14:01', '{"routing": "NPA_DOMAIN"}'),
('SES-001', 'agent', 'NPA_DOMAIN_ORCHESTRATOR', 'Routing to Ideation Agent for new NPA creation', 95.0, 'Intent=CREATE_NPA, no existing draft found for user USR-001', NULL, '2026-01-15 09:14:02', '{"target": "IDEATION_AGENT"}'),
('SES-001', 'agent', 'IDEATION_AGENT', 'Hello! I''m your NPA Agent. I can help you create New Product Approvals. What product would you like to create an NPA for today?', NULL, NULL, NULL, '2026-01-15 09:14:05', NULL),
('SES-001', 'user',  NULL, 'I want to create an NPA for expanding our Digital Asset Custody service to institutional clients in Hong Kong and Singapore', NULL, NULL, NULL, '2026-01-15 09:14:30', NULL),
('SES-001', 'agent', 'IDEATION_AGENT', 'Excellent! I understand you want to expand **Digital Asset Custody** to institutional clients across **Hong Kong and Singapore**. Let me gather key details:\n\n**1. Product Structure:**\n- What digital assets will be covered? (BTC, ETH, stablecoins?)\n- What custody model? (Hot/Cold/Hybrid wallet?)', 92.0, 'Extracted: product=Digital Asset Custody, geography=HK+SG, segment=institutional. Similar NPA found: TSG2025-089 (87% match).', '["TSG2025-089"]', '2026-01-15 09:15:00', '{"similar_npas": ["TSG2025-089"]}'),
('SES-001', 'user',  NULL, 'BTC, ETH, and major stablecoins. Hybrid wallet model with Fireblocks for cold storage. Target AUM of $2B within 12 months.', NULL, NULL, NULL, '2026-01-15 09:16:00', NULL),
('SES-001', 'agent', 'IDEATION_AGENT', 'Got it! **BTC, ETH, stablecoins** with **hybrid custody via Fireblocks**, targeting **$2B AUM**.\n\n**2. Business Context:**\n- Which business unit will manage this?\n- What''s the revenue model? (Custody fees, transaction fees?)\n- Do you have existing client demand?', 94.0, 'Product structure clear. Need business context for classification.', NULL, '2026-01-15 09:16:30', NULL),
('SES-001', 'user',  NULL, 'Treasury & Markets will manage. Revenue from 15bps annual custody fee plus 25bps transaction fees. We have 12 institutional clients already expressing interest.', NULL, NULL, NULL, '2026-01-15 09:17:30', NULL),
('SES-001', 'agent', 'IDEATION_AGENT', '**Cross-Border Detection:** Identified HK + SG dual jurisdiction requiring MAS and SFC compliance.\n\n**3. Risk & Regulatory:**\n- Any specific regulatory licenses needed?\n- What''s your target timeline for launch?', 96.0, 'Cross-border flag triggered. Revenue model: 15bps+25bps. 12 pipeline clients = strong demand signal.', NULL, '2026-01-15 09:18:00', NULL),
('SES-001', 'user',  NULL, 'We need MAS CMS license extension and SFC Type 1 license. Target launch Q2 2026.', NULL, NULL, NULL, '2026-01-15 09:19:00', NULL),
('SES-001', 'agent', 'IDEATION_AGENT', '**NPA Summary: Digital Asset Custody Expansion**\n- Product: Institutional digital asset custody (BTC, ETH, stablecoins)\n- Custody: Hybrid model via Fireblocks\n- Target AUM: $2B in 12 months\n- Revenue: 15bps custody + 25bps transaction\n- Jurisdictions: Singapore + Hong Kong\n- Timeline: Q2 2026 launch\n\n**AI Analysis:**\n- Similar NPA: TSG2025-089 (87% match)\n- Classification: New-to-Group (institutional custody is new capability)\n- Predicted Timeline: 12-16 weeks\n- Required Sign-offs: 6 parties\n\nReady to generate your NPA draft?', 95.0, 'All 7 discovery questions answered. Classification: NTG (12/20 criteria met, well above 6 threshold). Cross-border complexity adds 2-3 weeks.', '["TSG2025-089", "MAS_CMS_Guidelines_2025"]', '2026-01-15 09:20:00', '{"classification": "NTG", "criteria_met": 12}'),
('SES-001', 'user',  NULL, 'Yes, generate the NPA draft', NULL, NULL, NULL, '2026-01-15 09:21:00', NULL),
('SES-001', 'agent', 'IDEATION_AGENT', '**Processing...**\n\n✅ Prohibited List Check: PASSED\n✅ Classification: New-to-Group → Full NPA\n✅ Template: TSG2025-089 adapted\n✅ Auto-Fill: 74% completion (35/47 fields)\n✅ Risk Prediction: Medium-High, 12-16 weeks\n✅ Sign-off Matrix: 6 mandatory approvers\n\n**Draft NPA Generated!**\nTransitioning to workflow...', 93.0, 'Risk PASSED (all 4 layers clear). Template adapted from TSG2025-089 with custody-specific modifications. 12 fields need manual input.', '["TSG2025-089"]', '2026-01-15 09:22:00', '{"autofill_pct": 74, "manual_fields": 12}'),

-- Session 4: Crypto Custody Prime - shorter conversation
('SES-004', 'agent', 'IDEATION_AGENT', 'Hello! What product would you like to create an NPA for?', NULL, NULL, NULL, '2026-01-20 10:00:05', NULL),
('SES-004', 'user',  NULL, 'Crypto Custody Prime - a premium custody service for hedge funds with multi-sig wallets and institutional-grade insurance', NULL, NULL, NULL, '2026-01-20 10:01:00', NULL),
('SES-004', 'agent', 'IDEATION_AGENT', 'I see you want **Crypto Custody Prime** for hedge funds. This is similar to our Digital Asset Custody NPA (NPA-2026-001) but with premium features.\n\nClassification: Likely **Variation** of existing custody product.\n\nLet me gather specifics...', 88.0, 'Detected similarity to NPA-2026-001 (82% match). Variation likely - same asset class, different tier/features.', '["NPA-2026-001"]', '2026-01-20 10:01:30', NULL),
('SES-004', 'user',  NULL, 'Yes, it builds on NPA-2026-001 but adds multi-sig governance, dedicated compliance officer per client, and $500M insurance coverage via Lloyd''s', NULL, NULL, NULL, '2026-01-20 10:03:00', NULL),
('SES-004', 'agent', 'IDEATION_AGENT', '**Classification Update:** Confirming **Variation** (Material) - existing product with significant feature additions.\n\nApproval Track: Full NPA (material variation with insurance component)\nPredicted Timeline: 8-10 weeks\n\nGenerating draft...', 91.0, 'Material variation confirmed: 4/8 variation criteria met (new vendor Lloyd''s, new risk profile with insurance, new customer governance model, new compliance model).', '["NPA-2026-001", "LLOYDS_CRYPTO_INSURANCE_2025"]', '2026-01-20 10:04:00', NULL),

-- Session 5: Governance Agent managing sign-offs for Crypto Custody Prime
('SES-005', 'agent', 'GOVERNANCE_AGENT', 'Sign-off orchestration initiated for NPA-2026-004. Routing to 5 approvers in parallel/sequential mode.\n\nParallel Track: Credit + MLR + Operations\nSequential: Legal → Finance\n\nSLA: 48 hours per approver.', 96.0, 'Approval track=FULL_NPA, 5 mandatory parties identified from ref_signoff_routing_rules. Parallel optimization saves 1.5 days on critical path.', NULL, '2026-01-22 14:00:30', '{"parallel": ["Credit","MLR","Ops"], "sequential": ["Legal","Finance"]}'),
('SES-005', 'agent', 'NOTIFICATION_AGENT', 'Notifications sent to 5 approvers:\n- Jane Tan (Credit): SLA deadline Jan 24 14:00\n- Ahmad Razak (MLR): SLA deadline Jan 24 14:00\n- Kevin Patel (Ops): SLA deadline Jan 24 14:00\n- Lisa Wong (Legal): Queued after parallel track\n- Mark Lee (Finance): Queued after Legal', NULL, NULL, NULL, '2026-01-22 14:01:00', NULL),
('SES-005', 'agent', 'GOVERNANCE_AGENT', '**SLA Warning:** Ahmad Razak (MLR) has not started review. 36-hour mark reached. Auto-reminder sent.', 90.0, 'SLA monitoring: 36h warning threshold hit for MLR reviewer. Pattern: MLR typically reviews within 40h (based on last 50 NPAs).', NULL, '2026-01-24 02:00:00', NULL),
('SES-005', 'agent', 'GOVERNANCE_AGENT', '**Clarification Request:** Jane Tan (Credit) asks: "What is the insurance coverage structure for Lloyd''s policy? Is it per-client or aggregate?"', NULL, 'Loop-back type: APPROVAL_CLARIFICATION. Routing to Conversational Diligence first (68% chance it can answer from KB).', NULL, '2026-01-23 10:15:00', '{"loop_back_type": "CLARIFICATION"}'),
('SES-005', 'agent', 'CONVERSATIONAL_DILIGENCE', 'Based on the NPA draft and Lloyd''s Crypto Insurance Framework (2025): The insurance is **per-client** with aggregate pool backup. Each institutional client gets $500M individual coverage, with a $2B aggregate pool across the platform.\n\n*Source: Lloyd''s Crypto Custody Insurance Terms v3.2, Section 4.1*', 87.0, 'Found answer in KB: Lloyd''s framework doc matched with 91% relevance. Per-client structure confirmed with aggregate backup.', '["LLOYDS_CRYPTO_INSURANCE_TERMS_V3.2"]', '2026-01-23 10:16:00', NULL),

-- Session 6: Green Bond ETF ideation
('SES-006', 'agent', 'IDEATION_AGENT', 'Hello! What product would you like to create an NPA for?', NULL, NULL, NULL, '2026-01-18 11:00:05', NULL),
('SES-006', 'user',  NULL, 'Global Green Bond ETF - an ESG-focused fixed income ETF tracking a custom green bond index', NULL, NULL, NULL, '2026-01-18 11:01:00', NULL),
('SES-006', 'agent', 'IDEATION_AGENT', '**Global Green Bond ETF** - interesting! This is a New-to-Group product as MBS doesn''t currently offer ETF products.\n\n**Key Questions:**\n1. What''s the target index? Custom or existing (e.g., Bloomberg MSCI Green Bond)?\n2. What listing venue(s)? SGX, HKEX?\n3. Target fund size?', 93.0, 'Classification: Clearly NTG - ETF product category is new for MBS. Requires new regulatory licenses (MAS CIS License for fund management).', NULL, '2026-01-18 11:02:00', '{"classification_preliminary": "NTG"}'),
('SES-006', 'user',  NULL, 'Custom green bond index tracked by FTSE Russell. Listing on SGX with potential HKEX dual listing. Target $500M seed, growing to $2B in 3 years.', NULL, NULL, NULL, '2026-01-18 11:04:00', NULL),

-- Session 7: Risk Agent for Green Bond ETF
('SES-007', 'agent', 'RISK_AGENT', '**4-Layer Prohibited Check for NPA-2026-003:**\n\nLayer 1 - Internal Policy: ✅ PASSED (Green bonds align with ESG mandate)\nLayer 2 - Regulatory: ✅ PASSED (MAS supports green finance; CIS License applicable)\nLayer 3 - Sanctions: ✅ PASSED (No sanctioned entity exposure in index methodology)\nLayer 4 - Dynamic: ⚠️ WARNING (Greenwashing scrutiny - enhanced due diligence recommended)\n\n**Result: PASSED with advisory note**', 94.0, 'All 4 layers checked. Layer 4 flagged greenwashing risk per EU Taxonomy Regulation alignment requirements. Not a HARD_STOP but requires enhanced ESG validation.', '["MAS_GREEN_FINANCE_GUIDE_2025", "EU_TAXONOMY_REG_2024"]', '2026-01-19 09:00:30', '{"result": "PASS_WITH_ADVISORY"}'),

-- Session 8: Carbon Credit Exchange ideation
('SES-008', 'agent', 'IDEATION_AGENT', 'Hello! What product would you like to create an NPA for?', NULL, NULL, NULL, '2026-02-01 09:00:05', NULL),
('SES-008', 'user',  NULL, 'Carbon Credit Exchange - a platform for trading voluntary carbon credits and carbon offsets for corporate clients', NULL, NULL, NULL, '2026-02-01 09:01:00', NULL),
('SES-008', 'agent', 'IDEATION_AGENT', '**Carbon Credit Exchange** - this is timely! Strong regulatory tailwind with Singapore''s carbon tax increases.\n\nI''ve found no similar products in our NPA history, so this will likely be **New-to-Group**.\n\nLet me understand the scope...', 90.0, 'KB search: 0 similar NPAs found. Clearly NTG - new asset class (carbon credits), new market infrastructure, new regulatory framework. 14/20 NTG criteria likely met.', NULL, '2026-02-01 09:02:00', NULL),
('SES-008', 'user',  NULL, 'We want to offer Verra VCS and Gold Standard credits. Corporate clients in APAC. Trading via our own marketplace with T+2 settlement. Target $100M volume Year 1.', NULL, NULL, NULL, '2026-02-01 09:04:00', NULL),
('SES-008', 'agent', 'IDEATION_AGENT', 'Got it! **Verra VCS + Gold Standard**, **APAC corporates**, **proprietary marketplace**, **$100M Y1 volume**.\n\nThis triggers multiple NTG criteria:\n- New asset class (carbon credits)\n- New marketplace infrastructure\n- New regulatory landscape (Singapore carbon tax, CORSIA)\n- New settlement mechanism\n- New external dependencies (Verra, Gold Standard registries)\n\n**Classification: New-to-Group (Full NPA)**\n**Predicted Timeline: 16-20 weeks** (regulatory complexity)', 95.0, 'NTG criteria score: 14/20 met across all 4 categories. Full NPA mandatory. Longest timeline prediction due to novel regulatory landscape and marketplace build.', '["SG_CARBON_TAX_ACT_2024", "VERRA_VCS_STANDARD_V4"]', '2026-02-01 09:05:00', NULL),

-- Session 9: Monitoring Agent for FX Accumulator
('SES-009', 'agent', 'MONITORING_AGENT', '**Daily Monitoring Report - NPA-2026-007 (FX Accumulator USD/SGD)**\n\nDay 45 post-launch:\n- Trading Volume: $340M (vs $500M target) ⚠️ 68% of target\n- Realized P&L: $2.1M (on track)\n- VaR Utilization: 73% ⚠️ approaching 80% warning\n- Active Breaches: 1 (counterparty concentration)\n- Counterparty Exposure: $180M / $200M limit\n\n**Alert:** Counterparty concentration with Bank ABC approaching limit.', 91.0, 'Volume below 70% threshold - warning generated. VaR approaching warning level. Counterparty concentration at 90% of limit - breach alert created.', NULL, '2026-02-05 08:00:30', '{"health": "warning", "alerts": 2}'),
('SES-009', 'agent', 'MONITORING_AGENT', '**Breach Alert:** Counterparty exposure to Bank ABC reached $192M against $200M limit. Auto-escalating to Risk Management.\n\nRecommendation: Reduce new trades with Bank ABC or increase limit with Credit Committee approval.', 95.0, 'Hard threshold: $200M per-counterparty. Current: $192M (96%). Auto-escalation triggered at 95% threshold.', NULL, '2026-02-06 10:30:00', '{"breach_type": "COUNTERPARTY_CONCENTRATION"}'),

-- Session 10: Governance for ESG Trade Finance (blocked NPA)
('SES-010', 'agent', 'GOVERNANCE_AGENT', '**Sign-off Status: NPA-2026-008 (ESG-Linked Trade Finance)**\n\n✅ Credit (Jane Tan): APPROVED (Jan 27)\n✅ MLR (Ahmad Razak): APPROVED (Jan 28)\n❌ Operations (Kevin Patel): REJECTED - "Supply chain verification system not ready"\n⏳ Legal (Lisa Wong): ON HOLD (pending ops resolution)\n⏳ Finance (Mark Lee): ON HOLD\n\n**Loop-back #1 initiated.** Routing to Maker for operational readiness fix.', 88.0, 'Loop-back type: CHECKER_REJECTION from Operations. Requires NPA changes (system readiness). Routing to MAKER. Circuit breaker: 1/3 loop-backs used.', NULL, '2026-01-29 11:00:00', '{"loop_back_count": 1, "circuit_breaker": "1/3"}'),
('SES-010', 'agent', 'GOVERNANCE_AGENT', '**Loop-back #2:** Operations rejects again - "Integration testing incomplete for supply chain ESG scoring module."\n\n**Circuit Breaker Status: 2/3** - One more rejection triggers auto-escalation to COO.\n\nRecommendation: Schedule joint workshop between Ops and Tech teams to resolve integration blockers.', 85.0, 'Second rejection from same party (Operations). Pattern detected: technology dependency issue. Circuit breaker at 2/3. Recommending workshop before third attempt.', NULL, '2026-02-03 15:00:00', '{"loop_back_count": 2, "circuit_breaker": "2/3"}');

-- ────────────────────────────────────────────────────────────
-- 3. KB DOCUMENTS (Knowledge Base entries for RAG)
-- ────────────────────────────────────────────────────────────

INSERT INTO kb_documents (doc_id, filename, doc_type, embedding_id, last_synced) VALUES
('KB-NPA-001', 'NPA_Golden_Template.md',        'GOLDEN_SOURCE',  'emb-gs-001', '2026-02-01 00:00:00'),
('KB-NPA-002', 'NPA_Approvals.md',              'GOLDEN_SOURCE',  'emb-gs-002', '2026-02-01 00:00:00'),
('KB-NPA-003', 'NPA_Classifications.md',        'GOLDEN_SOURCE',  'emb-gs-003', '2026-02-01 00:00:00'),
('KB-NPA-004', 'NPA_Documents_Required.md',     'GOLDEN_SOURCE',  'emb-gs-004', '2026-02-01 00:00:00'),
('KB-NPA-005', 'NPA_Pre_Requisites.md',         'GOLDEN_SOURCE',  'emb-gs-005', '2026-02-01 00:00:00'),
('KB-NPA-006', 'NPA_Filled_Template.md',        'FILLED_TEMPLATE','emb-ft-001', '2026-02-11 00:00:00'),
('KB-NPA-007', 'NPA_Mock_Conversation.md',      'MOCK_DATA',      'emb-mc-001', '2026-02-11 00:00:00'),
('KB-HIST-001','TSG2025-089_Digital_Custody.pdf','HISTORICAL_NPA', 'emb-hn-001', '2025-11-15 00:00:00'),
('KB-HIST-002','TSG2024-156_FX_Options.pdf',    'HISTORICAL_NPA', 'emb-hn-002', '2024-09-20 00:00:00'),
('KB-HIST-003','TSG2025-201_ESG_Bonds.pdf',     'HISTORICAL_NPA', 'emb-hn-003', '2025-12-01 00:00:00'),
('KB-HIST-004','TSG2024-089_Crypto_Spot.pdf',   'HISTORICAL_NPA', 'emb-hn-004', '2024-06-15 00:00:00'),
('KB-HIST-005','TSG2025-045_Carbon_Credits.pdf', 'HISTORICAL_NPA', 'emb-hn-005', '2025-03-10 00:00:00'),
('KB-REG-001', 'MAS_CMS_Guidelines_2025.pdf',   'REGULATORY',     'emb-rg-001', '2025-08-01 00:00:00'),
('KB-REG-002', 'MAS_DPT_License_Guide.pdf',     'REGULATORY',     'emb-rg-002', '2025-06-01 00:00:00'),
('KB-REG-003', 'SFC_Type1_Requirements.pdf',     'REGULATORY',     'emb-rg-003', '2025-07-01 00:00:00'),
('KB-REG-004', 'PBOC_SFC_SwapConnect_Framework.pdf','REGULATORY', 'emb-rg-004', '2025-04-01 00:00:00'),
('KB-REG-005', 'EU_Taxonomy_Regulation_2024.pdf','REGULATORY',     'emb-rg-005', '2024-12-01 00:00:00'),
('KB-POL-001', 'MBS_Prohibited_Products_2026.pdf','POLICY',        'emb-pl-001', '2026-01-01 00:00:00'),
('KB-POL-002', 'MBS_ESG_Investment_Policy.pdf',  'POLICY',         'emb-pl-002', '2025-09-01 00:00:00'),
('KB-POL-003', 'MBS_Digital_Assets_Policy.pdf',  'POLICY',         'emb-pl-003', '2025-11-01 00:00:00');

-- ────────────────────────────────────────────────────────────
-- 4. AGENT ROUTING DECISIONS
-- ────────────────────────────────────────────────────────────

INSERT INTO npa_agent_routing_decisions (session_id, project_id, source_agent, target_agent, routing_reason, confidence, context_payload, decided_at) VALUES
-- NPA-001 routing chain
('SES-001', 'NPA-2026-001', 'MASTER_COO_ORCHESTRATOR', 'NPA_DOMAIN_ORCHESTRATOR', 'User intent: create NPA for digital asset custody', 97.5, '{"intent": "CREATE_NPA", "domain_scores": {"NPA": 0.97, "DESK_SUPPORT": 0.12}}', '2026-01-15 09:14:01'),
('SES-001', 'NPA-2026-001', 'NPA_DOMAIN_ORCHESTRATOR', 'IDEATION_AGENT',          'New NPA creation - route to ideation', 95.0, '{"npa_stage": "IDEATION", "user_id": "USR-001"}', '2026-01-15 09:14:02'),
('SES-002', 'NPA-2026-001', 'NPA_DOMAIN_ORCHESTRATOR', 'CLASSIFICATION_AGENT',    'Ideation complete - route to classification', 96.0, '{"product_attrs": {"asset_class": "digital_custody", "geography": "SG_HK"}}', '2026-01-15 09:36:00'),
('SES-002', 'NPA-2026-001', 'CLASSIFICATION_AGENT',    'RISK_AGENT',              'Classification: NTG. Route to prohibited check', 92.0, '{"classification": "NTG", "criteria_met": 12, "criteria_total": 20}', '2026-01-15 09:37:00'),
('SES-003', 'NPA-2026-001', 'NPA_DOMAIN_ORCHESTRATOR', 'TEMPLATE_AUTOFILL',       'Risk PASSED. Route to template autofill', 94.0, '{"risk_result": "PASS", "template_source": "TSG2025-089"}', '2026-01-15 09:37:30'),
-- NPA-004 routing chain
('SES-004', 'NPA-2026-004', 'MASTER_COO_ORCHESTRATOR', 'NPA_DOMAIN_ORCHESTRATOR', 'Create NPA for Crypto Custody Prime', 96.0, '{"intent": "CREATE_NPA"}', '2026-01-20 10:00:01'),
('SES-004', 'NPA-2026-004', 'NPA_DOMAIN_ORCHESTRATOR', 'IDEATION_AGENT',          'New NPA creation', 95.0, NULL, '2026-01-20 10:00:02'),
('SES-005', 'NPA-2026-004', 'NPA_DOMAIN_ORCHESTRATOR', 'GOVERNANCE_AGENT',        'Sign-offs required. 5 parties identified.', 96.0, '{"approval_track": "FULL_NPA", "parties": 5}', '2026-01-22 14:00:00'),
('SES-005', 'NPA-2026-004', 'GOVERNANCE_AGENT',        'CONVERSATIONAL_DILIGENCE','Clarification from Credit reviewer. Routing to CD for auto-answer.', 88.0, '{"question": "Lloyd insurance structure", "loop_back_type": "CLARIFICATION"}', '2026-01-23 10:15:00'),
-- NPA-003 routing chain
('SES-006', 'NPA-2026-003', 'MASTER_COO_ORCHESTRATOR', 'NPA_DOMAIN_ORCHESTRATOR', 'Create NPA for Green Bond ETF', 95.0, NULL, '2026-01-18 11:00:01'),
('SES-007', 'NPA-2026-003', 'CLASSIFICATION_AGENT',    'RISK_AGENT',              'NTG classification confirmed. 4-layer check required.', 93.0, '{"classification": "NTG"}', '2026-01-19 09:00:00'),
-- NPA-010 routing
('SES-008', 'NPA-2026-010', 'MASTER_COO_ORCHESTRATOR', 'NPA_DOMAIN_ORCHESTRATOR', 'Create NPA for Carbon Credit Exchange', 94.0, NULL, '2026-02-01 09:00:01'),
-- NPA-007 monitoring routing
('SES-009', 'NPA-2026-007', 'NPA_DOMAIN_ORCHESTRATOR', 'MONITORING_AGENT',        'Product launched. Initiating post-launch monitoring.', 97.0, '{"launched_at": "2026-01-20", "monitoring_thresholds_set": true}', '2026-02-05 08:00:00'),
-- NPA-008 governance routing
('SES-010', 'NPA-2026-008', 'NPA_DOMAIN_ORCHESTRATOR', 'GOVERNANCE_AGENT',        'Sign-off orchestration for ESG Trade Finance', 95.0, '{"approval_track": "FULL_NPA"}', '2026-01-25 10:00:00');

-- ────────────────────────────────────────────────────────────
-- 5. NPA ESCALATIONS
-- ────────────────────────────────────────────────────────────

INSERT INTO npa_escalations (project_id, escalation_level, trigger_type, trigger_detail, escalated_to, escalated_by, status, resolution, escalated_at, resolved_at) VALUES
-- NPA-008: Operations keeps rejecting
('NPA-2026-008', 1, 'LOOP_BACK_LIMIT', 'Operations rejected twice - supply chain ESG scoring module integration incomplete', 'Kevin Patel (Dept Head)', 'GOVERNANCE_AGENT', 'ACTIVE', NULL, '2026-02-03 15:30:00', NULL),
-- NPA-001: SLA breach on Finance review
('NPA-2026-001', 1, 'SLA_BREACH', 'Finance sign-off exceeded 48-hour SLA by 6 hours', 'Mark Lee (Dept Head)', 'GOVERNANCE_AGENT', 'RESOLVED', 'Finance team reassigned reviewer. Sign-off completed within 4 hours of escalation.', '2026-01-20 14:00:00', '2026-01-20 18:30:00'),
-- NPA-007: Post-launch counterparty concentration
('NPA-2026-007', 2, 'RISK_THRESHOLD', 'Counterparty exposure to Bank ABC at 96% of $200M limit', 'Risk Committee (BU Head)', 'MONITORING_AGENT', 'ACTIVE', NULL, '2026-02-06 10:30:00', NULL),
-- NPA-002: Resolved disagreement between Credit and MLR
('NPA-2026-002', 2, 'DISAGREEMENT', 'Credit and MLR disagreed on GBP/USD put option risk classification', 'BU Head - Treasury', 'GOVERNANCE_AGENT', 'RESOLVED', 'BU Head mediated: classified as Medium risk with enhanced monitoring. Both parties accepted.', '2026-01-25 09:00:00', '2026-01-26 11:00:00');

-- ────────────────────────────────────────────────────────────
-- 6. NPA EXTERNAL PARTIES
-- ────────────────────────────────────────────────────────────

INSERT INTO npa_external_parties (project_id, party_name, party_role, risk_profile_id, vendor_tier, grc_id) VALUES
-- Digital Asset Custody
('NPA-2026-001', 'Fireblocks',          'Digital asset custody and security infrastructure',    'EXT-2026-001', 'TIER_1_CRITICAL', 'FBK-2026-001'),
('NPA-2026-001', 'Elliptic',            'Blockchain analytics and AML compliance monitoring',   'EXT-2026-002', 'TIER_2',          'ELP-2026-002'),
('NPA-2026-001', 'CoinMetrics',         'Real-time pricing feeds and market data provider',     'EXT-2026-003', 'TIER_2',          'CMT-2026-003'),
-- Crypto Custody Prime (inherits + adds)
('NPA-2026-004', 'Fireblocks',          'Cold storage multi-sig custody infrastructure',        'EXT-2026-001', 'TIER_1_CRITICAL', 'FBK-2026-001'),
('NPA-2026-004', 'Lloyd''s of London',  'Crypto custody insurance - $500M per-client coverage', 'EXT-2026-004', 'TIER_1_CRITICAL', 'LLO-2026-004'),
('NPA-2026-004', 'Chainalysis',         'Enhanced transaction monitoring and forensics',        'EXT-2026-005', 'TIER_2',          'CHA-2026-005'),
-- Green Bond ETF
('NPA-2026-003', 'FTSE Russell',        'Custom green bond index provider and calculation agent','EXT-2026-006', 'TIER_1_CRITICAL', 'FTR-2026-006'),
('NPA-2026-003', 'SGX',                 'Primary listing venue for ETF',                         'EXT-2026-007', 'TIER_1_CRITICAL', 'SGX-2026-007'),
-- Carbon Credit Exchange
('NPA-2026-010', 'Verra',               'Verified Carbon Standard (VCS) registry and verification','EXT-2026-008','TIER_1_CRITICAL','VER-2026-008'),
('NPA-2026-010', 'Gold Standard',       'Gold Standard carbon credit certification and registry', 'EXT-2026-009', 'TIER_1_CRITICAL', 'GLD-2026-009'),
('NPA-2026-010', 'Xpansiv',             'Carbon credit market data and pricing benchmarks',      'EXT-2026-010', 'TIER_2',          'XPN-2026-010'),
-- FX Accumulator
('NPA-2026-007', 'Bloomberg',           'FX execution and pricing platform',                     'EXT-2026-011', 'TIER_1_CRITICAL', 'BLM-2026-011'),
-- ESG Trade Finance
('NPA-2026-008', 'EcoVadis',            'Supply chain ESG scoring and assessment platform',      'EXT-2026-012', 'TIER_2',          'ECO-2026-012'),
('NPA-2026-008', 'Sustainalytics',      'ESG risk ratings for trade finance counterparties',     'EXT-2026-013', 'TIER_2',          'SUS-2026-013');

-- ────────────────────────────────────────────────────────────
-- 7. NPA MARKET RISK FACTORS
-- ────────────────────────────────────────────────────────────

INSERT INTO npa_market_risk_factors (project_id, risk_factor, is_applicable, sensitivity_report, var_capture, stress_capture, notes) VALUES
-- Digital Asset Custody (NPA-001)
('NPA-2026-001', 'CRYPTO_DELTA',   1, 1, 1, 1, 'BTC/ETH/stablecoin price movements'),
('NPA-2026-001', 'CRYPTO_VEGA',    1, 1, 1, 1, 'Implied volatility on digital assets'),
('NPA-2026-001', 'FX_DELTA',       1, 1, 1, 1, 'USD/SGD exposure from custody fees'),
('NPA-2026-001', 'CORRELATION',    1, 1, 0, 1, 'Cross-asset correlation risk'),
-- FX Accumulator (NPA-007)
('NPA-2026-007', 'FX_DELTA',       1, 1, 1, 1, 'USD/SGD spot rate sensitivity'),
('NPA-2026-007', 'FX_VEGA',        1, 1, 1, 1, 'USD/SGD implied volatility'),
('NPA-2026-007', 'IR_DELTA',       1, 1, 1, 1, 'Interest rate differential impact'),
('NPA-2026-007', 'CORRELATION',    1, 0, 0, 1, 'FX-rates correlation under stress'),
-- Green Bond ETF (NPA-003)
('NPA-2026-003', 'IR_DELTA',       1, 1, 1, 1, 'Duration risk on green bond portfolio'),
('NPA-2026-003', 'IR_VEGA',        0, 0, 0, 0, 'Not applicable for bond ETF'),
('NPA-2026-003', 'CREDIT_SPREAD',  1, 1, 1, 1, 'Green bond credit spread widening'),
('NPA-2026-003', 'FX_DELTA',       1, 1, 1, 1, 'Multi-currency bond holdings'),
('NPA-2026-003', 'LIQUIDITY',      1, 1, 0, 1, 'ETF creation/redemption liquidity risk'),
-- Carbon Credit Exchange (NPA-010)
('NPA-2026-010', 'COMMODITY',      1, 1, 1, 1, 'Carbon credit price volatility'),
('NPA-2026-010', 'FX_DELTA',       1, 1, 1, 0, 'Multi-currency settlement exposure'),
('NPA-2026-010', 'CORRELATION',    1, 0, 0, 1, 'Carbon-energy correlation risk'),
-- FX Put Option (NPA-002)
('NPA-2026-002', 'FX_DELTA',       1, 1, 1, 1, 'GBP/USD spot sensitivity'),
('NPA-2026-002', 'FX_VEGA',        1, 1, 1, 1, 'GBP/USD implied vol sensitivity'),
('NPA-2026-002', 'FX_GAMMA',       1, 1, 1, 1, 'Second-order delta sensitivity'),
('NPA-2026-002', 'IR_DELTA',       1, 1, 1, 0, 'GBP vs USD rate differential');

-- ────────────────────────────────────────────────────────────
-- 8. NPA MONITORING THRESHOLDS (launched products)
-- ────────────────────────────────────────────────────────────

INSERT INTO npa_monitoring_thresholds (project_id, metric_name, warning_value, critical_value, comparison, is_active) VALUES
-- FX Accumulator (launched, warning status)
('NPA-2026-007', 'monthly_volume',         350000000, 250000000, 'LT', 1),
('NPA-2026-007', 'var_utilization_pct',    80.00,     95.00,     'GT', 1),
('NPA-2026-007', 'counterparty_exposure',  180000000, 195000000, 'GT', 1),
('NPA-2026-007', 'realized_pnl_monthly',   1500000,   500000,    'LT', 1),
('NPA-2026-007', 'active_breaches',        1.00,      3.00,      'GT', 1),
-- Multi-Currency Deposit (launched, healthy)
('NPA-2026-006', 'deposit_volume',         100000000, 50000000,  'LT', 1),
('NPA-2026-006', 'interest_cost_ratio',    2.50,      3.00,      'GT', 1),
('NPA-2026-006', 'customer_churn_pct',     5.00,      10.00,     'GT', 1),
('NPA-2026-006', 'regulatory_breaches',    0.00,      1.00,      'GT', 1);

-- ────────────────────────────────────────────────────────────
-- 9. NPA POST-LAUNCH CONDITIONS
-- ────────────────────────────────────────────────────────────

INSERT INTO npa_post_launch_conditions (project_id, condition_text, owner_party, due_date, status) VALUES
-- FX Accumulator conditions from approval
('NPA-2026-007', 'Implement daily VaR reporting to MLR within 30 days of launch',             'MLR',         '2026-02-20', 'COMPLETED'),
('NPA-2026-007', 'Complete staff training for all FX desk traders on accumulator risk',        'Operations',  '2026-02-15', 'COMPLETED'),
('NPA-2026-007', 'Submit quarterly performance report to Risk Committee',                      'Finance',     '2026-03-31', 'PENDING'),
('NPA-2026-007', 'Conduct 90-day Post-Implementation Review (PIR)',                           'Product Mgmt','2026-04-20', 'PENDING'),
('NPA-2026-007', 'Establish counterparty concentration monitoring with $200M per-name limit', 'Credit',      '2026-01-25', 'COMPLETED'),
-- Multi-Currency Deposit conditions
('NPA-2026-006', 'Update pricing engine for multi-currency interest calculation',              'Technology',  '2026-01-30', 'COMPLETED'),
('NPA-2026-006', 'Conduct anti-money laundering review for cross-border deposits',            'Compliance',  '2026-02-28', 'COMPLETED'),
('NPA-2026-006', 'Submit annual product review to Governance Forum',                           'Product Mgmt','2026-12-31', 'PENDING'),
-- Retail Wealth App (approved, simple conditions)
('NPA-2026-011', 'Complete user acceptance testing with 50 pilot users',                       'Technology',  '2026-02-15', 'COMPLETED'),
('NPA-2026-011', 'Update customer-facing terms and conditions',                                'Legal',       '2026-02-10', 'COMPLETED');

-- ────────────────────────────────────────────────────────────
-- 10. NPA PREREQUISITE RESULTS (for active NPAs)
-- ────────────────────────────────────────────────────────────

-- Digital Asset Custody (NPA-001) - mostly complete
INSERT INTO npa_prerequisite_results (project_id, check_id, status, evidence, validated_by, validated_at)
SELECT 'NPA-2026-001', c.id,
    CASE
        WHEN c.check_code IN ('STR_01','STR_03','STR_04','CLS_01','CLS_02','STK_01','STK_02','STK_03','TEC_01','TEC_02','TEC_03','REG_01','REG_02','RSK_01','RSK_02','RSK_03','FIN_01','PRJ_01','PRJ_02') THEN 'PASS'
        WHEN c.check_code IN ('STR_02','CLS_03','REG_03','REG_04','DAT_01','DAT_02') THEN 'PASS'
        WHEN c.check_code IN ('STK_04','STK_05','TEC_04','FIN_02','FIN_03','DAT_03','PRJ_03') THEN 'PASS'
        ELSE 'PENDING'
    END,
    CASE
        WHEN c.check_code = 'STR_01' THEN 'Business case approved by ExCo Jan 2026'
        WHEN c.check_code = 'REG_01' THEN 'MAS CMS license extension filed, SFC Type 1 application submitted'
        WHEN c.check_code = 'TEC_03' THEN 'Penetration testing completed by CrowdStrike, no critical findings'
        WHEN c.check_code = 'RSK_03' THEN '4-layer prohibited check PASSED on Jan 15 2026'
        ELSE 'Validated by responsible team'
    END,
    CASE
        WHEN c.category_id = (SELECT id FROM ref_prerequisite_categories WHERE category_code='STRATEGIC') THEN 'Sarah Lim'
        WHEN c.category_id = (SELECT id FROM ref_prerequisite_categories WHERE category_code='REGULATORY') THEN 'Lisa Wong'
        WHEN c.category_id = (SELECT id FROM ref_prerequisite_categories WHERE category_code='TECHNICAL') THEN 'Alex Kumar'
        ELSE 'System'
    END,
    '2026-01-14 12:00:00'
FROM ref_prerequisite_checks c;

-- Green Bond ETF (NPA-003) - partially complete (in risk assessment)
INSERT INTO npa_prerequisite_results (project_id, check_id, status, evidence, validated_by, validated_at)
SELECT 'NPA-2026-003', c.id,
    CASE
        WHEN c.check_code IN ('STR_01','STR_02','STR_03','CLS_01','CLS_02','RSK_01','RSK_03') THEN 'PASS'
        WHEN c.check_code IN ('STK_01','STK_02','STK_03','REG_01','REG_02','FIN_01','PRJ_01') THEN 'PASS'
        WHEN c.check_code IN ('STR_04','TEC_01','TEC_02','TEC_03','DAT_01') THEN 'PASS'
        WHEN c.check_code IN ('RSK_02','REG_03','REG_04') THEN 'PENDING'
        ELSE 'PENDING'
    END,
    'Auto-validated during NPA creation',
    'James Liu',
    CASE
        WHEN c.check_code IN ('RSK_02','REG_03','REG_04') THEN NULL
        ELSE '2026-01-18 12:00:00'
    END
FROM ref_prerequisite_checks c;

-- Carbon Credit Exchange (NPA-010) - early stage (discovery)
INSERT INTO npa_prerequisite_results (project_id, check_id, status, evidence, validated_by, validated_at)
SELECT 'NPA-2026-010', c.id,
    CASE
        WHEN c.check_code IN ('STR_01','STR_02','CLS_01','CLS_02','PRJ_01') THEN 'PASS'
        WHEN c.check_code IN ('STR_03','STR_04','STK_01') THEN 'PASS'
        WHEN c.is_critical = 1 THEN 'PENDING'
        ELSE 'PENDING'
    END,
    CASE WHEN c.check_code IN ('STR_01','STR_02','CLS_01','CLS_02','PRJ_01','STR_03','STR_04','STK_01') THEN 'Completed during ideation phase' ELSE NULL END,
    'Alex Rivera',
    CASE WHEN c.check_code IN ('STR_01','STR_02','CLS_01','CLS_02','PRJ_01','STR_03','STR_04','STK_01') THEN '2026-02-01 10:00:00' ELSE NULL END
FROM ref_prerequisite_checks c;

-- ────────────────────────────────────────────────────────────
-- 11. NPA RISK CHECKS (4-layer results per NPA)
-- ────────────────────────────────────────────────────────────

INSERT INTO npa_risk_checks (project_id, check_layer, result, matched_items, checked_by, checked_at) VALUES
-- NPA-001: All clear
('NPA-2026-001', 'INTERNAL_POLICY', 'PASS', NULL,                              'RISK_AGENT', '2026-01-15 09:37:01'),
('NPA-2026-001', 'REGULATORY',      'PASS', NULL,                              'RISK_AGENT', '2026-01-15 09:37:02'),
('NPA-2026-001', 'SANCTIONS',       'PASS', NULL,                              'RISK_AGENT', '2026-01-15 09:37:03'),
('NPA-2026-001', 'DYNAMIC',         'PASS', NULL,                              'RISK_AGENT', '2026-01-15 09:37:04'),
-- NPA-003: Pass with advisory
('NPA-2026-003', 'INTERNAL_POLICY', 'PASS', NULL,                              'RISK_AGENT', '2026-01-19 09:00:10'),
('NPA-2026-003', 'REGULATORY',      'PASS', NULL,                              'RISK_AGENT', '2026-01-19 09:00:11'),
('NPA-2026-003', 'SANCTIONS',       'PASS', NULL,                              'RISK_AGENT', '2026-01-19 09:00:12'),
('NPA-2026-003', 'DYNAMIC',         'WARNING', '["Greenwashing scrutiny advisory"]','RISK_AGENT', '2026-01-19 09:00:13'),
-- NPA-004: All clear
('NPA-2026-004', 'INTERNAL_POLICY', 'PASS', NULL,                              'RISK_AGENT', '2026-01-21 10:00:01'),
('NPA-2026-004', 'REGULATORY',      'PASS', NULL,                              'RISK_AGENT', '2026-01-21 10:00:02'),
('NPA-2026-004', 'SANCTIONS',       'PASS', NULL,                              'RISK_AGENT', '2026-01-21 10:00:03'),
('NPA-2026-004', 'DYNAMIC',         'PASS', NULL,                              'RISK_AGENT', '2026-01-21 10:00:04'),
-- NPA-007: All clear (pre-launch)
('NPA-2026-007', 'INTERNAL_POLICY', 'PASS', NULL,                              'RISK_AGENT', '2026-01-10 09:00:01'),
('NPA-2026-007', 'REGULATORY',      'PASS', NULL,                              'RISK_AGENT', '2026-01-10 09:00:02'),
('NPA-2026-007', 'SANCTIONS',       'PASS', NULL,                              'RISK_AGENT', '2026-01-10 09:00:03'),
('NPA-2026-007', 'DYNAMIC',         'PASS', NULL,                              'RISK_AGENT', '2026-01-10 09:00:04'),
-- NPA-010: Carbon credits pass with warning
('NPA-2026-010', 'INTERNAL_POLICY', 'PASS', NULL,                              'RISK_AGENT', '2026-02-01 09:30:01'),
('NPA-2026-010', 'REGULATORY',      'WARNING', '["Novel regulatory landscape - Singapore Carbon Tax Act"]', 'RISK_AGENT', '2026-02-01 09:30:02'),
('NPA-2026-010', 'SANCTIONS',       'PASS', NULL,                              'RISK_AGENT', '2026-02-01 09:30:03'),
('NPA-2026-010', 'DYNAMIC',         'PASS', NULL,                              'RISK_AGENT', '2026-02-01 09:30:04'),
-- NPA-012: PROHIBITED - Leveraged Crypto CFD
('NPA-2026-012', 'INTERNAL_POLICY', 'FAIL', '["PRH_IP_02","PRH_IP_03"]',       'RISK_AGENT', '2026-02-08 14:00:01'),
('NPA-2026-012', 'REGULATORY',      'FAIL', '["PRH_RG_01"]',                   'RISK_AGENT', '2026-02-08 14:00:02'),
('NPA-2026-012', 'SANCTIONS',       'PASS', NULL,                              'RISK_AGENT', '2026-02-08 14:00:03'),
('NPA-2026-012', 'DYNAMIC',         'PASS', NULL,                              'RISK_AGENT', '2026-02-08 14:00:04'),
-- NPA-002: FX Put Option - all clear
('NPA-2026-002', 'INTERNAL_POLICY', 'PASS', NULL,                              'RISK_AGENT', '2026-01-12 11:00:01'),
('NPA-2026-002', 'REGULATORY',      'PASS', NULL,                              'RISK_AGENT', '2026-01-12 11:00:02'),
('NPA-2026-002', 'SANCTIONS',       'PASS', NULL,                              'RISK_AGENT', '2026-01-12 11:00:03'),
('NPA-2026-002', 'DYNAMIC',         'PASS', NULL,                              'RISK_AGENT', '2026-01-12 11:00:04'),
-- NPA-008: ESG Trade Finance
('NPA-2026-008', 'INTERNAL_POLICY', 'PASS', NULL,                              'RISK_AGENT', '2026-01-22 09:00:01'),
('NPA-2026-008', 'REGULATORY',      'PASS', NULL,                              'RISK_AGENT', '2026-01-22 09:00:02'),
('NPA-2026-008', 'SANCTIONS',       'PASS', NULL,                              'RISK_AGENT', '2026-01-22 09:00:03'),
('NPA-2026-008', 'DYNAMIC',         'PASS', NULL,                              'RISK_AGENT', '2026-01-22 09:00:04'),
-- NPA-009: Algo FX Hedging
('NPA-2026-009', 'INTERNAL_POLICY', 'PASS', NULL,                              'RISK_AGENT', '2026-01-28 10:00:01'),
('NPA-2026-009', 'REGULATORY',      'PASS', NULL,                              'RISK_AGENT', '2026-01-28 10:00:02'),
('NPA-2026-009', 'SANCTIONS',       'PASS', NULL,                              'RISK_AGENT', '2026-01-28 10:00:03'),
('NPA-2026-009', 'DYNAMIC',         'PASS', NULL,                              'RISK_AGENT', '2026-01-28 10:00:04');

-- ────────────────────────────────────────────────────────────
-- 12. CLASSIFICATION ASSESSMENTS for more NPAs
-- ────────────────────────────────────────────────────────────

-- NPA-003 Green Bond ETF (NTG - 11/20 criteria met)
INSERT INTO npa_classification_assessments (project_id, criteria_id, score, evidence, assessed_by, confidence)
SELECT 'NPA-2026-003', c.id,
    CASE
        WHEN c.criterion_code IN ('NTG_PI_01','NTG_MC_01','NTG_MC_04','NTG_RR_01','NTG_RR_02','NTG_FO_01','NTG_FO_02','NTG_FO_03','NTG_FO_04','NTG_FO_05','NTG_PI_04') THEN 2
        WHEN c.criterion_code IN ('NTG_PI_02','NTG_MC_02','NTG_MC_03','NTG_RR_03') THEN 1
        ELSE 0
    END,
    CASE
        WHEN c.criterion_code = 'NTG_PI_01' THEN 'ETF product category entirely new for MBS'
        WHEN c.criterion_code = 'NTG_RR_01' THEN 'MAS CIS License for fund management required'
        WHEN c.criterion_code = 'NTG_FO_01' THEN 'New ETF creation/redemption booking infrastructure'
        ELSE 'Auto-assessed'
    END,
    'CLASSIFICATION_AGENT', 91.0
FROM ref_classification_criteria c WHERE c.indicator_type = 'NTG';

-- NPA-004 Crypto Custody Prime (Variation - 5/8 variation criteria met)
INSERT INTO npa_classification_assessments (project_id, criteria_id, score, evidence, assessed_by, confidence)
SELECT 'NPA-2026-004', c.id,
    CASE
        WHEN c.criterion_code IN ('VAR_03','VAR_06','VAR_07') THEN 2
        WHEN c.criterion_code IN ('VAR_01','VAR_04') THEN 1
        ELSE 0
    END,
    CASE
        WHEN c.criterion_code = 'VAR_03' THEN 'Premium tier targeting hedge funds specifically'
        WHEN c.criterion_code = 'VAR_07' THEN 'New vendor: Lloyd''s of London for insurance'
        ELSE 'Auto-assessed'
    END,
    'CLASSIFICATION_AGENT', 88.0
FROM ref_classification_criteria c WHERE c.indicator_type = 'VARIATION';

-- NPA-010 Carbon Credit Exchange (NTG - 14/20 criteria met)
INSERT INTO npa_classification_assessments (project_id, criteria_id, score, evidence, assessed_by, confidence)
SELECT 'NPA-2026-010', c.id,
    CASE
        WHEN c.criterion_code IN ('NTG_PI_01','NTG_PI_02','NTG_PI_03','NTG_PI_04','NTG_PI_05','NTG_MC_01','NTG_MC_02','NTG_MC_04','NTG_MC_05','NTG_RR_01','NTG_RR_02','NTG_RR_03','NTG_FO_01','NTG_FO_02') THEN 2
        WHEN c.criterion_code IN ('NTG_MC_03','NTG_RR_04','NTG_RR_05','NTG_FO_03') THEN 1
        ELSE 0
    END,
    CASE
        WHEN c.criterion_code = 'NTG_PI_03' THEN 'Carbon credits - entirely new asset class'
        WHEN c.criterion_code = 'NTG_PI_05' THEN 'Custom marketplace platform required'
        WHEN c.criterion_code = 'NTG_RR_01' THEN 'Singapore Carbon Tax Act compliance + CORSIA framework'
        ELSE 'Auto-assessed'
    END,
    'CLASSIFICATION_AGENT', 95.0
FROM ref_classification_criteria c WHERE c.indicator_type = 'NTG';

-- ────────────────────────────────────────────────────────────
-- 13. ENRICH EXISTING AUDIT LOG with agent reasoning
-- ────────────────────────────────────────────────────────────

UPDATE npa_audit_log SET
    confidence_score = 95.0,
    reasoning = 'Automated classification based on 20 NTG criteria assessment',
    model_version = 'CLASSIFICATION_AGENT_v1.0'
WHERE action_type = 'AGENT_CLASSIFIED' AND confidence_score IS NULL;

UPDATE npa_audit_log SET
    confidence_score = 92.0,
    reasoning = 'Template autofill from similar NPA with field-level confidence scoring',
    model_version = 'TEMPLATE_AUTOFILL_v1.0'
WHERE action_type LIKE '%AUTO_FILL%' AND confidence_score IS NULL;

UPDATE npa_audit_log SET
    confidence_score = 98.0,
    reasoning = '4-layer prohibited check executed in 0.3 seconds',
    model_version = 'RISK_AGENT_v1.0'
WHERE action_type LIKE '%PROHIBITED%' AND confidence_score IS NULL;

-- ────────────────────────────────────────────────────────────
-- VERIFY FINAL STATE
-- ────────────────────────────────────────────────────────────

SELECT 'Seed complete. Final table counts:' AS status;
SELECT TABLE_NAME, TABLE_ROWS
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'npa_workbench'
ORDER BY TABLE_NAME;
