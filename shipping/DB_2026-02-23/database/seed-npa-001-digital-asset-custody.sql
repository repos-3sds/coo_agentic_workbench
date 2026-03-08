-- ============================================================
-- SEED: NPA-2026-001 Digital Asset Custody Expansion
-- Complete NPA Draft — All Sections PC.I through APP.6
-- Run AFTER migration 004_sync_339_fields.sql
-- ============================================================
SET FOREIGN_KEY_CHECKS=0;

DELETE FROM `npa_form_data` WHERE `project_id` = 'NPA-2026-001';

INSERT IGNORE INTO `npa_form_data` (`project_id`, `field_key`, `field_value`, `lineage`, `confidence_score`) VALUES

-- ================================================================
-- PC.I: PRODUCT SPECIFICATIONS
-- ================================================================
('NPA-2026-001','product_name','Digital Asset Custody Expansion','MANUAL',100.00),
('NPA-2026-001','problem_statement','Institutional clients in APAC increasingly demand regulated, bank-grade custody for digital assets (BTC, ETH, stablecoins). MBS currently has no custody capability, forcing clients to use third-party custodians with higher settlement and counterparty risk.','MANUAL',100.00),
('NPA-2026-001','value_proposition','First-mover bank-grade institutional digital asset custody in APAC combining MBS credit strength with Fireblocks MPC technology. Expected to capture $2B AUM within 12 months at 15bps custody fee + 25bps transaction fee.','MANUAL',100.00),
('NPA-2026-001','customer_benefit','Institutional clients gain: (1) Regulated bank custodian with SG MAS and HK SFC oversight, (2) $500M per-client insurance via Lloyds, (3) Segregated cold-wallet storage, (4) Real-time portfolio reporting via MBS portal.','MANUAL',100.00),
('NPA-2026-001','bu_benefit','Treasury & Markets: $12.8M estimated annual revenue Year 1. Positions MBS as institutional digital asset infrastructure provider. Supports Group digital transformation KPI for 2026.','MANUAL',100.00),
('NPA-2026-001','product_type','Custody Services','AUTO',99.00),
('NPA-2026-001','underlying_asset','Bitcoin (BTC), Ethereum (ETH), USD Coin (USDC), Tether (USDT), major regulated stablecoins','MANUAL',100.00),
('NPA-2026-001','currency_denomination','USD','MANUAL',100.00),
('NPA-2026-001','notional_amount','50000000.00','MANUAL',100.00),
('NPA-2026-001','tenor','Ongoing — rolling annual custody agreements','MANUAL',100.00),
('NPA-2026-001','funding_type','Unfunded','AUTO',98.00),
('NPA-2026-001','product_role','Principal','AUTO',95.00),
('NPA-2026-001','product_maturity','Ongoing','MANUAL',100.00),
('NPA-2026-001','product_lifecycle','New product launch → 12-month ramp → steady state. PIR at 90 days post-launch. Annual review thereafter.','MANUAL',100.00),
('NPA-2026-001','product_features','• Multi-asset support: BTC, ETH, major stablecoins\n• Hybrid cold/warm wallet: Fireblocks MPC cold storage + warm wallet for T+0 settlement\n• Institutional reporting: real-time NAV, transaction history, tax lot reporting\n• Insurance: $500M per-client coverage via Lloyds\n• Segregated custody: Client assets held in segregated wallets, bankruptcy-remote','MANUAL',100.00),
('NPA-2026-001','revenue_year1','12800000.00','MANUAL',100.00),
('NPA-2026-001','revenue_year1_net','10240000.00','MANUAL',100.00),
('NPA-2026-001','revenue_year2','19200000.00','MANUAL',100.00),
('NPA-2026-001','revenue_year2_net','15360000.00','MANUAL',100.00),
('NPA-2026-001','revenue_year3','25600000.00','MANUAL',100.00),
('NPA-2026-001','revenue_year3_net','20480000.00','MANUAL',100.00),
('NPA-2026-001','expected_volume','$2B AUM by Month 12; $500M by Month 3, $1B by Month 6','MANUAL',100.00),
('NPA-2026-001','target_roi','ROAE 22%+ by Year 2 (above MBS 15% minimum threshold)','MANUAL',100.00),
('NPA-2026-001','revenue_streams','• 15bps p.a. AUM-based custody fee\n• 25bps per transaction settlement fee\n• Premium reporting package: $5K/month per client\n• FX conversion spread on stablecoin redemptions: ~10bps','MANUAL',100.00),
('NPA-2026-001','gross_margin_split','Product Control: 80% / Digital Assets SU: 20%','MANUAL',100.00),
('NPA-2026-001','cost_allocation','Technology build: $3.2M one-time. Ongoing: $1.8M/year (Fireblocks licence, ops staffing, insurance premium)','MANUAL',100.00),
('NPA-2026-001','spv_involved','No','AUTO',99.00),
('NPA-2026-001','customer_segments','Institutional investors: hedge funds, family offices, asset managers, sovereign wealth funds in SG and HK','MANUAL',100.00),
('NPA-2026-001','customer_restrictions','MAS regulated institutional investors only. Accredited Investor (AI) classification required. No retail clients. No clients from FATF high-risk jurisdictions.','MANUAL',100.00),
('NPA-2026-001','customer_suitability','Client must: (1) meet AI threshold (net assets >$2M), (2) pass enhanced KYC/CDD, (3) sign digital asset custody agreement, (4) complete MBS digital asset risk disclosure acknowledgement','MANUAL',100.00),
('NPA-2026-001','customer_geographic','Singapore, Hong Kong. Planned expansion to Japan and Australia in Year 2.','MANUAL',100.00),
('NPA-2026-001','distribution_channels','MBS Vickers Institutional platform, Direct relationship manager coverage, API integration for large institutional clients','MANUAL',100.00),
('NPA-2026-001','sales_suitability','All sales require: (1) AI suitability assessment, (2) Digital asset risk questionnaire, (3) Director-level approval for clients >$100M. SRM oversight for all transactions.','MANUAL',100.00),
('NPA-2026-001','onboarding_process','Enhanced KYC: Source of funds for digital assets, blockchain address verification, travel rule compliance. Fireblocks wallet provisioning within 3 business days of onboarding completion.','MANUAL',100.00),
('NPA-2026-001','marketing_plan','Soft launch to 12 identified pipeline clients Q1 2026. Press release and institutional roadshow Q2 2026. GFM institutional newsletter coverage.','MANUAL',100.00),
('NPA-2026-001','pac_reference','PAC-2025-DA-089','MANUAL',100.00),
('NPA-2026-001','pac_date','2025-11-10','MANUAL',100.00),
('NPA-2026-001','external_parties_involved','Yes','AUTO',99.00),
('NPA-2026-001','external_party_names','Fireblocks (custody infrastructure), Elliptic (AML blockchain analytics), CoinMetrics (market data), Lloyds of London (insurance), Baker McKenzie HK (legal counsel HK)','MANUAL',100.00),
('NPA-2026-001','esg_data_used','No','AUTO',98.00),
('NPA-2026-001','competitive_landscape','Key competitors: Anchorage Digital (US), Copper.co (UK), BitGo (US). MBS differentiator: regulated bank with existing institutional relationships + onshore SG/HK presence.','ADAPTED',85.00),
('NPA-2026-001','market_opportunity','Global institutional digital asset custody AUM estimated $20T by 2030. APAC institutional segment: $3.5T. MBS target: 5% APAC market share = $175B long-term AUM.','ADAPTED',82.00),
('NPA-2026-001','break_even_timeline','Month 18 post-launch (based on $800M AUM at 15bps = $1.2M/month, covering $1.8M/year opex)','MANUAL',100.00),
('NPA-2026-001','kyc_requirements','Enhanced CDD. Source of wealth for digital assets. Blockchain address whitelisting. Fireblocks KYT (Know Your Transaction) integration. Annual review cycle.','MANUAL',100.00),
('NPA-2026-001','customer_accreditation','AI certification required. Digital asset risk disclosure signed. Custody agreement with MBS Bank Ltd executed.','MANUAL',100.00),
('NPA-2026-001','staff_training','All Digital Assets desk staff to complete: MBS Digital Asset Custody certification (8 hours), Fireblocks operations training (4 hours), AML for digital assets (3 hours). Mandatory before go-live.','MANUAL',100.00),
('NPA-2026-001','customer_objectives','Institutional clients seek: safe, regulated, insured storage of digital assets with institutional-grade reporting, operational efficiency, and bank-grade counterparty relationship.','MANUAL',100.00),
('NPA-2026-001','customer_key_risks','(1) Key management failure / wallet compromise, (2) Regulatory change in digital asset custody rules, (3) Smart contract risk for stablecoin redemptions, (4) Liquidity risk on stablecoins in stress scenario','MANUAL',100.00),

-- ================================================================
-- PC.II: OPERATIONAL & TECHNOLOGY
-- ================================================================
('NPA-2026-001','front_office_model','Digital Assets Desk (Singapore): 3 relationship managers + 1 digital asset specialist. Client onboarding, custody agreement negotiation, ongoing client relationship. Wallets provisioned via Fireblocks API.','MANUAL',100.00),
('NPA-2026-001','middle_office_model','Digital Assets Operations (Singapore): NAV reporting, client portal management, transaction monitoring, Fireblocks dashboard oversight. 2 dedicated staff initially.','MANUAL',100.00),
('NPA-2026-001','back_office_model','Existing MBS settlement operations augmented with digital asset training. Custodian reconciliation with Fireblocks ledger daily. Manual exception handling for on-chain disputes.','MANUAL',100.00),
('NPA-2026-001','third_party_ops','Fireblocks: MPC key management and transaction signing infrastructure. Elliptic: Real-time blockchain AML screening (pre and post-transaction). CoinMetrics: Market data and NAV pricing feeds.','MANUAL',100.00),
('NPA-2026-001','booking_system','Custom/In-House','MANUAL',100.00),
('NPA-2026-001','booking_legal_form','Custody Agreement (bespoke MBS Digital Asset Custody Agreement)','MANUAL',100.00),
('NPA-2026-001','booking_family','CRY (Cryptocurrency)','MANUAL',100.00),
('NPA-2026-001','booking_typology','Custody/Asset Safekeeping','MANUAL',100.00),
('NPA-2026-001','portfolio_allocation','Digital Assets Portfolio — segregated from trading book. Client assets kept off-balance sheet in segregated wallets.','MANUAL',100.00),
('NPA-2026-001','settlement_method','Net Settlement','MANUAL',100.00),
('NPA-2026-001','settlement_flow','Client initiates withdrawal → RM approval for amounts >$1M → Fireblocks warm wallet signing (3-of-5 multisig) → On-chain settlement T+0 for BTC/ETH → Stablecoin redemption: T+1 bank transfer.','MANUAL',100.00),
('NPA-2026-001','confirmation_process','Automated: Fireblocks generates transaction confirmation PDF. On-chain TX hash sent to client. MBS Custody Portal updated in real-time. Daily custody statement emailed at 08:00 SGT.','MANUAL',100.00),
('NPA-2026-001','reconciliation','Daily: Fireblocks ledger vs MBS internal custody ledger. Weekly: Client statement reconciliation. Monthly: Independent third-party address balance check. Any discrepancy >$1K escalated to Ops Head within 1 hour.','MANUAL',100.00),
('NPA-2026-001','exception_handling','Missed transactions: Manual override with dual-control (RM + Ops Supervisor). On-chain reversal requests: legal review required. Unconfirmed transactions after 24h: incident report to Risk Manager.','MANUAL',100.00),
('NPA-2026-001','accounting_treatment','Client digital assets held off-balance sheet. Custody fees recognised monthly on accrual basis. Insurance premium amortised monthly over policy term.','MANUAL',100.00),
('NPA-2026-001','new_system_changes','Yes','MANUAL',100.00),
('NPA-2026-001','tech_requirements','(1) Fireblocks API integration into MBS systems, (2) Digital Asset Custody Portal (new Angular UI module), (3) Elliptic real-time screening webhook, (4) CoinMetrics NAV pricing API, (5) Internal blockchain ledger module','MANUAL',100.00),
('NPA-2026-001','system_integration','Fireblocks → MBS Custody Ledger (real-time webhook), Elliptic → MBS AML system (pre-transaction screening), CoinMetrics → MBS pricing engine (every 15 minutes), MBS Portal → Client-facing reporting','MANUAL',100.00),
('NPA-2026-001','valuation_model','Mark-to-market: CoinMetrics spot price (BTC: Coinbase reference, ETH: Uniswap reference, stablecoins: $1.00 with depeg alert at >0.5% deviation)','MANUAL',100.00),
('NPA-2026-001','trade_capture_system','Custom MBS Digital Asset Custody Ledger (new build)','MANUAL',100.00),
('NPA-2026-001','risk_system','Elliptic + internal MBS risk dashboard. Fireblocks risk controls for transaction limits.','MANUAL',100.00),
('NPA-2026-001','reporting_system','MBS Digital Asset Custody Portal (new). Client statements via portal + email. Regulatory reporting to MAS via existing MAS MASNET.','MANUAL',100.00),
('NPA-2026-001','stp_rate','70% STP for standard deposits/withdrawals. 30% manual for transactions over $10M or from new wallet addresses.','MANUAL',95.00),
('NPA-2026-001','mktdata_requirements','CoinMetrics API: Real-time BTC, ETH prices + stablecoin NAV. Refreshed every 15 minutes for custody NAV. Fireblocks provides on-chain balance data.','MANUAL',100.00),
('NPA-2026-001','hsm_required','Yes','MANUAL',100.00),
('NPA-2026-001','security_assessment','Fireblocks MPC technology eliminates single point of key failure. Thales Luna HSM for internal key fragments. Penetration test by CrowdStrike completed Q4 2025: zero critical findings. SOC2 Type II compliant.','MANUAL',100.00),
('NPA-2026-001','pentest_status','Completed','MANUAL',100.00),
('NPA-2026-001','iss_deviations','HSM key management process partially deviates from MBS ISS Policy 3.2 (designed for traditional securities). Formal ISS deviation approved by CISO on 2025-10-15 (Ref: ISS-DEV-2025-012).','MANUAL',100.00),
('NPA-2026-001','grc_id','FBK-2026-001 (Fireblocks), ELP-2026-002 (Elliptic), CMT-2026-003 (CoinMetrics)','MANUAL',100.00),
('NPA-2026-001','rto_target','4 hours (Tier 1 critical system — client assets inaccessible = critical incident)','MANUAL',100.00),
('NPA-2026-001','rpo_target','0 hours (blockchain ledger is immutable — zero data loss target)','MANUAL',100.00),
('NPA-2026-001','dr_testing_plan','Quarterly DR test: failover to MBS Singapore DR site, Fireblocks backup cloud geographies. Test simulates Fireblocks API outage + manual signing fallback. Last test: Q4 2025, result: PASS at 2.5h RTO.','MANUAL',100.00),
('NPA-2026-001','bcp_requirements','Manual custody operations procedures document (SOP-DA-003) covers: Fireblocks outage (use offline signing ceremony), internet outage (pre-signed transactions), staff unavailability (cross-trained deputies).','MANUAL',100.00),
('NPA-2026-001','bia_considerations','Category A (Critical): Custody availability and withdrawal processing. Outage >4h requires client notification. Outage >24h requires regulatory notification to MAS.','MANUAL',100.00),
('NPA-2026-001','continuity_measures','Fireblocks provides 3-geography resilience (US, EU, Asia nodes). MBS maintains offline emergency signing kit with HSM hardware tokens in Singapore and Hong Kong vaults.','MANUAL',100.00),
('NPA-2026-001','limit_structure','Per-client withdrawal limit: $5M/day auto-approve, $10M RM + Ops Head, >$10M CEO Digital Assets approval. 24h cooling period for new wallet addresses.','MANUAL',100.00),
('NPA-2026-001','limit_monitoring','Fireblocks policy engine enforces real-time limits. MBS custody ops dashboard reviews daily limit utilisation. Alerts at 80% of daily limit.','MANUAL',100.00),
('NPA-2026-001','custody_required','Yes','MANUAL',100.00),
('NPA-2026-001','custody_details','Segregated MPC cold wallet per client. Warm wallet for operational liquidity (max 5% of client AUM). Fireblocks multi-geography key shards. Dual-control withdrawal approval.','MANUAL',100.00),

-- ================================================================
-- PC.III: PRICING MODEL
-- ================================================================
('NPA-2026-001','pricing_model_required','Yes','MANUAL',100.00),
('NPA-2026-001','pricing_methodology','Fee-based custody model. Annual custody fee: 15bps on AUM, charged monthly in arrears. Transaction fee: 25bps per settlement instruction. No performance / carry fee. Minimum annual fee: $50,000 per client.','MANUAL',100.00),
('NPA-2026-001','roae_analysis','Year 1 ROAE: 8% (ramp up). Year 2 ROAE: 22.4% (at $1.5B AUM). Year 3 ROAE: 28.1% (at $2.5B AUM). Risk-weighted assets: $0 (custody is off-balance-sheet). Capital charge: operational risk AMA.','MANUAL',100.00),
('NPA-2026-001','pricing_assumptions','AUM ramp: $500M Y1Q1 → $1B Y1Q3 → $2B by Month 12. Fee attrition 5% p.a. Fireblocks cost: $450K/year fixed. Elliptic: $120K/year. CoinMetrics: $60K/year. 3 FTE ops staff at $180K each.','MANUAL',100.00),
('NPA-2026-001','bespoke_adjustments','VIP pricing for anchor clients >$200M AUM: 10bps custody / 20bps transaction. Approved by Head of Digital Assets on case-by-case basis with Finance sign-off.','MANUAL',100.00),
('NPA-2026-001','pricing_model_name','MBS Digital Custody Fee Model v1.0','MANUAL',100.00),
('NPA-2026-001','model_validation_date','2025-11-01','MANUAL',100.00),
('NPA-2026-001','model_restrictions','Pricing model does not cover DeFi yields or staking revenues. Not applicable to tokenised assets (separate NPA required). No margin lending against digital assets in scope.','MANUAL',100.00),
('NPA-2026-001','simm_treatment','N/A — Custody product, not a derivative. No SIMM calculation required.','AUTO',98.00),
('NPA-2026-001','transfer_pricing','Internal FTP: 80% product revenue allocated to Digital Assets desk, 20% to T&M head office for infrastructure support.','MANUAL',100.00),

-- ================================================================
-- PC.IV: RISK ANALYSIS
-- ================================================================
('NPA-2026-001','risk_classification','HIGH','AUTO',98.00),
('NPA-2026-001','market_risk','Custody product: MBS bears no direct market risk on client assets (off-balance sheet). Residual FX risk on USD-denominated custody fees collected in SGD. Daily VaR on fee book: ~$12K. Within standard GFM Treasury limits.','ADAPTED',88.00),
('NPA-2026-001','mrf_fx_delta','Yes','AUTO',90.00),
('NPA-2026-001','mrf_ir_delta','No','AUTO',95.00),
('NPA-2026-001','mrf_commodity','No','AUTO',95.00),
('NPA-2026-001','mrf_credit','No','AUTO',95.00),
('NPA-2026-001','liquidity_risk','Low direct liquidity risk — product is fee-income based. However, reputational liquidity risk if clients unable to withdraw assets. Warm wallet maintains 5% liquid buffer per client for same-day withdrawals.','MANUAL',90.00),
('NPA-2026-001','liquidity_cost','FTP liquidity cost: N/A (off-balance-sheet). Internal transfer pricing for ops infrastructure: $150K/year allocated to Digital Assets P&L.','MANUAL',90.00),
('NPA-2026-001','credit_risk','No credit exposure to clients — custody is pre-funded. Key counterparty: Fireblocks (technology vendor, not a credit exposure). Elliptic: operational vendor. Insurance counterparty: Lloyds A+ rated.','ADAPTED',88.00),
('NPA-2026-001','counterparty_rating','N/A — no credit extension to clients. Fireblocks: SOC2 Type II certified. Lloyds: A+ (S&P).','MANUAL',100.00),
('NPA-2026-001','credit_support_required','No','AUTO',99.00),
('NPA-2026-001','collateral_framework','N/A — no collateral required for custody product. Client assets ARE the asset under management, not collateral.','MANUAL',100.00),
('NPA-2026-001','custody_risk','PRIMARY RISK: Key management failure — mitigated by Fireblocks MPC (eliminates single HSM key). Wallet compromise — mitigated by Elliptic real-time screening + cold storage. Insider theft — mitigated by dual-control signing, audit logging, segregation of duties.','MANUAL',100.00),
('NPA-2026-001','regulatory_capital','Operational risk capital under AMA (Advanced Measurement Approach). Estimated AMA charge: $2.1M based on BEI historical analysis. Technology + vendor risk weighting applied.','MANUAL',95.00),
('NPA-2026-001','stress_scenarios','Scenario 1: Fireblocks outage 24h — client withdrawals delayed, reputational risk. Mitigant: offline signing, 4h RTO.\nScenario 2: Major BTC crash -70% — client AUM halves, fee income halves. No balance sheet impact.\nScenario 3: Regulatory shutdown — MAS revokes CMS extension. Wind-down within 30 days, client assets fully returnable.','MANUAL',100.00),
('NPA-2026-001','stress_test_results','Stress testing completed as part of initial risk assessment. All scenarios show MBS maintains ability to return client assets. Maximum operational loss scenario: $8M (Fireblocks breach, partial loss before detection). Covered by $500M Lloyds insurance.','MANUAL',100.00),
('NPA-2026-001','reputational_risk','MEDIUM-HIGH. First major bank custody product in SG/HK creates reputational risk if product fails. Mitigants: Phased rollout to 12 known clients, Fireblocks proven infrastructure ($100B+ in assets globally), Lloyds insurance coverage.','MANUAL',100.00),
('NPA-2026-001','negative_impact','Yes — potential for reputational damage if custody breach occurs.','MANUAL',100.00),
('NPA-2026-001','esg_assessment','Neutral to positive. BTC mining energy concerns acknowledged but MBS is a custodian only — not a miner. MBS ESG policy: custody does not constitute endorsement. Client assets include ETH (PoS, low energy) and stablecoins.','MANUAL',90.00),
('NPA-2026-001','esg_classification','Neutral','AUTO',85.00),
('NPA-2026-001','exposure_limits','No credit exposure limits applicable. Operational risk concentration limit: Max 30% of AUM from single client. Max vendor concentration: Fireblocks approved as Tier 1 Critical vendor with MBS TPRM framework.','MANUAL',100.00),
('NPA-2026-001','monitoring_party','RMG-Credit (counterparty screening), MLR (AML monitoring), Technology (vendor risk), Digital Assets Ops (daily custody monitoring)','MANUAL',100.00),
('NPA-2026-001','legal_opinion','Baker McKenzie HK opinion commissioned for SFC Type 1 license assessment. Expected delivery: January 2026. Allen & Gledhill SG opinion completed: MAS CMS extension pathway confirmed. (AG-2025-MBS-2245)','MANUAL',100.00),
('NPA-2026-001','licensing_requirements','Singapore: MAS Capital Markets Services (CMS) licence extension for digital payement token (DPT) service — PS Act amendment filing submitted. Hong Kong: SFC Type 1 (Dealing in Securities) application submitted Nov 2025. Expected: Q2 2026.','MANUAL',100.00),
('NPA-2026-001','primary_regulation','MAS Payment Services Act 2019 (DPT service), SFC Securities and Futures Ordinance (Type 1 licence), MAS Notice 626 (AML for digital assets)','MANUAL',100.00),
('NPA-2026-001','secondary_regulations','FATF Guidelines for Virtual Assets (June 2019), MAS PS-N02 Digital Payment Token Service Notice, SFC Circular on DA custody (Jan 2023), EU MiCA (monitoring for future alignment)','MANUAL',95.00),
('NPA-2026-001','regulatory_reporting','MAS: Monthly DPT service reporting, Suspicious Transaction Report (STR) via STRO. SFC HK: Monthly Type 1 activity report. Internal: weekly custody ops report to Head of Digital Assets.','MANUAL',100.00),
('NPA-2026-001','cross_border_regulations','SG-HK dual jurisdiction: Travel Rule compliance required (FATF R.16). Data residency: Client data stored in SG primary DC (compliant with MAS TRM). HK data: Snowflake HK node for SFC compliance.','MANUAL',100.00),
('NPA-2026-001','legal_docs_required','• MBS Digital Asset Custody Agreement (new)\n• Client Risk Disclosure Form (Digital Assets)\n• AML Enhanced Due Diligence Questionnaire\n• Travel Rule VASP information sharing agreement\n• Lloyds insurance policy (per client)\n• External legal opinion (HK — Baker McKenzie)','MANUAL',100.00),
('NPA-2026-001','sanctions_check','Clear - No Matches','AUTO',100.00),
('NPA-2026-001','aml_considerations','High AML risk product due to digital asset nature. Enhanced CDD for all clients. Elliptic pre-transaction screening. Chainalysis KYT for post-transaction monitoring. Periodic refresh: annually for standard, 180 days for high-risk clients.','MANUAL',100.00),
('NPA-2026-001','tax_impact','Singapore: No GST on custody fees (financial services exemption). Capital gains: N/A (MBS is custodian). Withholding tax on fees from HK clients: 0% under MBS HK treaty. Transfer pricing: annually reviewed FTP policy.','ADAPTED',88.00),
('NPA-2026-001','accounting_book','Banking Book','AUTO',95.00),
('NPA-2026-001','fair_value_treatment','Client digital assets not on MBS balance sheet. Custody fees recognised on accrual basis. Insurance premium: straight-line amortisation over 12 months.','MANUAL',100.00),
('NPA-2026-001','on_off_balance','Off-Balance Sheet','AUTO',99.00),
('NPA-2026-001','tax_jurisdictions','SG: GST Exempt (financial services). HK: Profits Tax — branch income. No US nexus. Transfer pricing: MBS SG principal, MBS HK agent.','MANUAL',100.00),
('NPA-2026-001','model_risk','Key model: CoinMetrics NAV pricing. Risk: stablecoin depeg not immediately reflected. Mitigant: 30-minute refresh cycle + automated depeg alert at >0.1% deviation triggers manual review.','MANUAL',95.00),
('NPA-2026-001','country_risk','SG: Tier 1 (home jurisdiction). HK: Tier 1 (established presence). Risk: regulatory divergence between MAS and SFC digital asset frameworks. Monitored by Regulatory Affairs team quarterly.','MANUAL',100.00),

-- ================================================================
-- PC.V: DATA MANAGEMENT
-- ================================================================
('NPA-2026-001','data_governance','Data Governance Owner: Head of Digital Assets. Data mapped under MBS Group Data Governance Framework v3.2. Digital asset transaction data classified as CLIENT CONFIDENTIAL.','MANUAL',100.00),
('NPA-2026-001','data_ownership','MBS Bank Ltd Singapore owns client data. Fireblocks holds key fragments only — contractually prohibited from using client data.','MANUAL',100.00),
('NPA-2026-001','data_stewardship','Data Steward: Digital Assets Ops Lead. Secondary steward: Chief Data Officer Office.','MANUAL',100.00),
('NPA-2026-001','data_quality_monitoring','Automated: CoinMetrics feed quality check every 15 minutes. Fireblocks ledger reconciliation daily. Client portal data integrity check: nightly batch. SLA: 99.9% data accuracy target.','MANUAL',100.00),
('NPA-2026-001','data_privacy','MAS TRM compliant data storage (SG primary DC). PDPA compliant — client data processing covered under updated MBS Privacy Policy. HK PDPO compliant for HK clients. No data shared outside SG/HK without client consent.','MANUAL',100.00),
('NPA-2026-001','data_retention','Transaction records: 7 years (MAS regulatory requirement). KYC data: 5 years post-relationship end. Blockchain address data: Permanent (immutable — no retention issue, stored off-chain for compliance).','MANUAL',100.00),
('NPA-2026-001','gdpr_compliance','No','AUTO',98.00),
('NPA-2026-001','pure_assessment_id','PURE-2025-DA-047','MANUAL',100.00),
('NPA-2026-001','pure_purposeful','Client digital asset data used solely for custody services, regulatory compliance, and client reporting. No secondary use for MBS proprietary trading. Fireblocks contractually restricted from secondary use.','MANUAL',100.00),
('NPA-2026-001','pure_unsurprising','Clients explicitly consent to blockchain address monitoring for AML purposes. Travel Rule data sharing disclosed in client agreement. No unexpected data collection.','MANUAL',100.00),
('NPA-2026-001','pure_respectful','Client data minimisation: only collect data required for custody and AML compliance. Right to request data deletion upon relationship termination (subject to 7-year regulatory hold).','MANUAL',100.00),
('NPA-2026-001','pure_explainable','Annual privacy notice to all clients. Client portal provides full transparency on data held. DPO available for queries: dpo@mbs.com','MANUAL',100.00),
('NPA-2026-001','reporting_requirements','MAS: Monthly DPT transaction reports, STR. Internal: Weekly ops dashboard, Monthly P&L to Finance, Quarterly Risk report to Group CRO. Client: Daily statement via portal, Monthly consolidated report.','MANUAL',100.00),
('NPA-2026-001','data_lineage','Transaction lineage: on-chain TX hash → Fireblocks ledger → MBS custody ledger → client portal. Full audit trail maintained. Immutable blockchain record as golden source.','MANUAL',100.00),
('NPA-2026-001','data_classification','CLIENT_CONFIDENTIAL — Tier 2 (Sensitive). Encryption at rest: AES-256. In transit: TLS 1.3. Fireblocks data: encrypted with MPC key fragments.','MANUAL',100.00),
('NPA-2026-001','automated_reporting','Automated: MAS monthly return (MASNET), client daily statement, internal P&L feed to Hyperion. Manual: Suspicious transaction reports (STR) require MLRO review before submission.','MANUAL',100.00),

-- ================================================================
-- PC.VI: OTHER RISK IDENTIFICATION
-- ================================================================
('NPA-2026-001','other_risks_exist','Yes','MANUAL',100.00),
('NPA-2026-001','operational_risk','Key operational risks:\n1. Fireblocks API failure — mitigated by offline signing and 4h RTO\n2. Staff key person risk (3 trained custodians) — cross-training program initiated\n3. Blockchain network congestion — warm wallet buffer and gas fee monitoring\n4. Stablecoin depeg event — depeg alert system, instant redemption halt protocol','MANUAL',100.00),
('NPA-2026-001','additional_risk_mitigants','• 24/7 on-call Digital Assets Ops team\n• Real-time Elliptic blockchain monitoring\n• Annual third-party security audit (CrowdStrike)\n• Cold wallet balance verified by independent blockchain explorer daily\n• Staff background checks — all custody ops staff MBS Enhanced Clearance','MANUAL',100.00),

-- ================================================================
-- PC.VII: TRADING PRODUCT ASSESSMENT
-- ================================================================
('NPA-2026-001','trading_product','No','AUTO',99.00),
('NPA-2026-001','appendix5_required','No','AUTO',99.00),

-- ================================================================
-- APP.1: ENTITY / LOCATION
-- ================================================================
('NPA-2026-001','booking_entity','MBS Bank Ltd, Singapore (primary). MBS Bank (Hong Kong) Limited for HK-domiciled clients.','MANUAL',100.00),
('NPA-2026-001','sales_entity','MBS Vickers Securities (Singapore), MBS Asia Capital Limited (Hong Kong)','MANUAL',100.00),
('NPA-2026-001','booking_location','Singapore (primary data centre)','MANUAL',100.00),
('NPA-2026-001','sales_location','Singapore, Hong Kong','MANUAL',100.00),
('NPA-2026-001','risk_taking_entity','MBS Bank Ltd Singapore','MANUAL',100.00),
('NPA-2026-001','risk_taking_location','Singapore','MANUAL',100.00),
('NPA-2026-001','processing_entity','MBS Bank Ltd Singapore (Digital Assets Operations)','MANUAL',100.00),
('NPA-2026-001','processing_location','Singapore','MANUAL',100.00),
('NPA-2026-001','counterparty','Various institutional clients (SG AI investors / HK professional investors)','MANUAL',100.00),
('NPA-2026-001','hedge_entity','N/A — no hedging required (custody product, off-balance-sheet)','MANUAL',100.00),

-- ================================================================
-- APP.2: INTELLECTUAL PROPERTY
-- ================================================================
('NPA-2026-001','mbs_ip_exists','Yes','MANUAL',100.00),
('NPA-2026-001','mbs_ip_details','MBS Digital Asset Custody Portal (new Angular-based client portal). MBS proprietary operational SOP for custody. MBS Digital Asset Custody Agreement template.','MANUAL',100.00),
('NPA-2026-001','third_party_ip_exists','Yes','MANUAL',100.00),
('NPA-2026-001','third_party_ip_details','Fireblocks: MPC technology (licensed), Elliptic: blockchain analytics engine (licensed), CoinMetrics: pricing data (licensed). All IP licensed to MBS, not owned.','MANUAL',100.00),
('NPA-2026-001','ip_licensing','Fireblocks Enterprise License: $450K/year. Elliptic Integration License: $120K/year. CoinMetrics professional: $60K/year. All agreements include data confidentiality and sub-licensing restrictions.','MANUAL',100.00),

-- ================================================================
-- APP.3: FINANCIAL CRIME
-- ================================================================
('NPA-2026-001','aml_assessment','HIGH RISK product. All clients subject to Enhanced CDD.\nRisk factors: (1) Digital assets: pseudonymous, cross-border, irreversible. (2) Institutional clients with complex structures. (3) HK cross-border flows.\nMitigants: Elliptic pre-screening, Chainalysis KYT, MBS AML Enhanced Procedures DA-001.','MANUAL',100.00),
('NPA-2026-001','terrorism_financing','Digital assets carry elevated TF risk due to anonymous nature. Mitigated by: wallet address whitelisting, Travel Rule compliance (FATF R.16), daily screening against UN/OFAC/MAS lists via Elliptic. No TF exposure identified in pipeline clients.','MANUAL',100.00),
('NPA-2026-001','sanctions_assessment','All counterparties screened against: OFAC SDN, UN Consolidated, EU Sanctions, MAS sanctions lists. Blockchain addresses screened via Elliptic for sanctioned entity association. Continuous monitoring — any flagged transaction auto-frozen pending MLRO review.','MANUAL',100.00),
('NPA-2026-001','fraud_risk','Key fraud risks: (1) Social engineering targeting custody ops staff — mitigated by withdrawal approval matrix and phone verification. (2) Fake client impersonation — mitigated by 2FA on MBS custody portal. (3) Internal fraud — mitigated by dual control signing and comprehensive audit logging.','MANUAL',100.00),
('NPA-2026-001','bribery_corruption','Low risk — MBS Digital Assets staff subject to MBS Code of Conduct and Anti-Bribery policy. Annual anti-bribery training mandatory. Gift and entertainment policy applies.','MANUAL',100.00),
('NPA-2026-001','fc_risk_rating','HIGH','MANUAL',100.00),
('NPA-2026-001','fc_mitigation_measures','• Elliptic real-time blockchain screening (pre + post transaction)\n• Enhanced KYC with annual refresh for all digital asset clients\n• Travel Rule compliance system (TRUST, Singapore VASP)\n• 24/7 transaction monitoring alerts\n• MLRO review for any suspicious transactions\n• Fireblocks transaction history immutable audit trail','MANUAL',100.00),
('NPA-2026-001','fc_policy_framework','MBS AML/CFT Policy (Group), MBS Digital Asset AML Procedures DA-001 (new — pending MLRO approval), MAS Notice 626 (AML for DPT licensees)','MANUAL',100.00),
('NPA-2026-001','fc_screening_controls','Pre-transaction: Elliptic address screening (OFAC, EU, UN, custom watchlists) — 100% coverage. Post-transaction: Chainalysis KYT for ongoing monitoring. Alert SLA: 15 minutes for high-risk flags.','MANUAL',100.00),
('NPA-2026-001','fc_transaction_monitoring','Elliptic + MBS FCRM system. Rules: (1) Transaction >$100K auto-triggers enhanced review, (2) New wallet address: 24h hold, (3) High-risk token (mixing, privacy coins): block + MLRO review.','MANUAL',100.00),
('NPA-2026-001','fc_suspicious_reporting','MLRO reviews all Elliptic high-risk flags within 4 hours. STR filed with STRO within 15 days if reasonable grounds. Tipping-off controls: no client notification of STR filing.','MANUAL',100.00),
('NPA-2026-001','fc_record_keeping','All KYC, transaction, and screening records retained for 7 years (MAS PS Act requirement). Blockchain TX hashes stored in MBS FCRM as immutable evidence.','MANUAL',100.00),
('NPA-2026-001','fc_staff_training','Mandatory: MBS AML Digital Assets module (3 hours, updated Q4 2025). Annual recertification. Fireblocks security training (4 hours). Completion required before go-live access.','MANUAL',100.00),
('NPA-2026-001','fc_independent_testing','Annual independent AML testing by Internal Audit. Elliptic semi-annual technology audit. Penetration test: CrowdStrike annually.','MANUAL',100.00),
('NPA-2026-001','fc_surveillance_tools','Elliptic (primary AML/blockchain analytics), Chainalysis KYT (secondary), MBS FCRM (internal case management), Firco Continuity (OFAC/UN sanctions screening)','MANUAL',100.00),
('NPA-2026-001','fc_regulatory_reporting','MAS: Monthly DPT transaction reports via MASNET. STR: STRO portal. HK SFC: Quarterly AML return. INTERPOL: As required for law enforcement requests.','MANUAL',100.00),
('NPA-2026-001','fc_data_privacy_compliance','Elliptic and Chainalysis data processing agreements executed. PDPA compliance: blockchain addresses are pseudonymous, not personal data per MAS guidance. AML data retained separately from client personal data.','MANUAL',100.00),

-- ================================================================
-- APP.4: RISK DATA AGGREGATION
-- ================================================================
('NPA-2026-001','rda_compliance','BCBS 239 compliance applicable (MBS is a D-SIB). Digital asset custody data integrated into MBS Group risk data aggregation framework. AMA operational risk data feeds updated to include custody risk events.','MANUAL',95.00),
('NPA-2026-001','rda_data_sources','(1) Fireblocks ledger — custody positions, transaction history\n(2) CoinMetrics — market prices, NAV\n(3) Elliptic — AML risk scores\n(4) MBS FCRM — case management\n(5) Internal P&L system — fee income','MANUAL',100.00),
('NPA-2026-001','rda_aggregation_method','Daily batch aggregation: blockchain positions → MBS custody ledger → risk reports. Frequency: T+0 for positions, T+1 for MIS reports. Exception: manual escalation for breaches flagged same-day.','MANUAL',100.00),
('NPA-2026-001','rda_data_quality','Target: 99.9% accuracy. Blockchain data: immutable (100% accurate). CoinMetrics pricing: ±0.05% tolerance accepted. Reconciliation failures >$1K: immediate escalation to Ops Head.','MANUAL',100.00),

-- ================================================================
-- APP.6: THIRD-PARTY PLATFORMS (Fireblocks)
-- ================================================================
('NPA-2026-001','third_party_platform','Yes','MANUAL',100.00),
('NPA-2026-001','platform_name','Fireblocks MPC Custody Platform','MANUAL',100.00),
('NPA-2026-001','tp_use_case_description','Fireblocks provides MPC (Multi-Party Computation) key management infrastructure for MBS Digital Asset Custody. Manages cold wallet key signing, transaction approval workflows, and portfolio administration for all client digital assets.','MANUAL',100.00),
('NPA-2026-001','tp_business_justification','Building proprietary HSM-based custody from scratch would take 24+ months and $15M+. Fireblocks is the industry standard ($100B+ global AUM on platform) with proven institutional grade security. Time-to-market critical.','MANUAL',100.00),
('NPA-2026-001','tp_risk_rating','HIGH (Tier 1 Critical Vendor)','MANUAL',100.00),
('NPA-2026-001','tp_risk_mitigants','(1) Fireblocks enterprise agreement with 99.99% SLA, (2) MBS Fireblocks offline signing backup kit, (3) Contractual data portability clause (30-day exit), (4) Multi-geography nodes (US, EU, Asia redundancy)','MANUAL',100.00),
('NPA-2026-001','tp_data_classification','CLIENT_CONFIDENTIAL — Fireblocks holds key fragments only, NOT client assets. MBS retains full custody of assets.','MANUAL',100.00),
('NPA-2026-001','tp_integration_scope','API-based integration: Fireblocks Custody API → MBS Custody Ledger. Webhook-based real-time notifications. Admin portal for MBS ops team.','MANUAL',100.00),
('NPA-2026-001','tp_encryption_standards','All data encrypted: AES-256 at rest, TLS 1.3 in transit. Fireblocks MPC key fragments: additional layer of cryptographic protection. Hardware-backed within AWS KMS (FIPS 140-2 Level 3).','MANUAL',100.00),
('NPA-2026-001','tp_access_controls','Role-based: MBS ops staff (read), MBS ops supervisors (approve), MBS digital assets head (admin). Multi-factor authentication mandatory. IP allowlisting for MBS office networks.','MANUAL',100.00),
('NPA-2026-001','tp_audit_logging','Yes','MANUAL',100.00),
('NPA-2026-001','tp_certifications','SOC2 Type II, ISO 27001, FIPS 140-2 Level 3 (HSM modules), PCI DSS Level 1','MANUAL',100.00),
('NPA-2026-001','tp_cyber_assessment','CrowdStrike penetration test on MBS-Fireblocks integration: 2025-Q4. Result: 0 critical, 2 medium (patched). Fireblocks independent security audit: annually by Deloitte.','MANUAL',100.00),
('NPA-2026-001','tp_pdpa_compliance','Fireblocks Data Processing Agreement executed. Fireblocks processes key fragments only — no personal data. PDPA compliant as Fireblocks is a data processor under MBS instructions.','MANUAL',100.00),
('NPA-2026-001','info_security_assessment','Fireblocks ISS assessment completed: MBS ISS-2025-VENDOR-089. Result: APPROVED with conditions — quarterly security review, annual penetration test, immediate notification of any security incident.','MANUAL',100.00),
('NPA-2026-001','platform_risk_assessment','Overall risk: HIGH (critical dependency). Residual risk after mitigants: MEDIUM. Vendor concentration risk: MEDIUM (Fireblocks has no viable immediate substitute, 30-day exit clause contractual protection).','MANUAL',100.00),
('NPA-2026-001','data_residency','Primary key fragments: AWS Singapore region (ap-southeast-1). Backup: AWS Tokyo region. No data stored outside SG/JP without explicit MBS approval. Compliant with MAS TRM cloud guidelines.','MANUAL',100.00);

SET FOREIGN_KEY_CHECKS=1;

