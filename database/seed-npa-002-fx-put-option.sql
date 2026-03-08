-- ============================================================
-- SEED: NPA-2026-002 FX Put Option GBP/USD
-- Complete NPA Draft — All Sections PC.I through APP.6
-- NPA Lite, Variation, MEDIUM risk, SG desk
-- ============================================================
SET FOREIGN_KEY_CHECKS=0;

DELETE FROM `npa_form_data` WHERE `project_id` = 'NPA-2026-002';

INSERT IGNORE INTO `npa_form_data` (`project_id`, `field_key`, `field_value`, `lineage`, `confidence_score`) VALUES

-- ================================================================
-- PC.I: PRODUCT SPECIFICATIONS
-- ================================================================
('NPA-2026-002','product_name','FX Vanilla Put Option GBP/USD — Institutional','MANUAL',100.00),
('NPA-2026-002','problem_statement','MBS institutional clients require downside hedging for GBP/USD currency risk. Existing product range covers only GBP/USD spot and forward. Clients holding GBP-denominated assets are exposed to GBP depreciation with no in-house option solution, leading to flow leakage to Barclays and HSBC.','MANUAL',100.00),
('NPA-2026-002','value_proposition','MBS offers institutional-grade GBP/USD put options providing precise downside hedge with defined premium cost, allowing clients to retain GBP upside while capping downside. Expected to capture 30+ institutional clients currently routing this flow to competitors. Annual revenue uplift: $2.8M.','MANUAL',100.00),
('NPA-2026-002','customer_benefit','(1) Defined cost hedge against GBP depreciation, (2) Full GBP upside retained, (3) Flexible tenors from 1 week to 12 months, (4) MBS as onshore SG counterparty (reduced basis vs offshore dealers), (5) Integrated with existing GBP/USD FX franchise for seamless hedging.','MANUAL',100.00),
('NPA-2026-002','bu_benefit','FX & Rates desk: $2.8M annual revenue. Retains institutional FX flow on GBP. Builds options expertise and vol surface for future hedging products. Strengthens position as APAC FX options market maker.','MANUAL',100.00),
('NPA-2026-002','product_type','FX Derivatives','AUTO',99.00),
('NPA-2026-002','underlying_asset','GBP/USD foreign exchange rate. European-style put option — right to sell GBP and buy USD at the agreed strike rate on expiry. Settlement: cash in USD (NDF-style) or physical delivery (physical settlement amendment available).','MANUAL',100.00),
('NPA-2026-002','currency_denomination','USD (premium and P&L). GBP (notional)','MANUAL',100.00),
('NPA-2026-002','notional_amount','25000000.00','MANUAL',100.00),
('NPA-2026-002','tenor','1W, 1M, 3M, 6M, 12M. Most active: 3M and 6M. Standard IMM date maturities. Option premium settled T+2 from trade date.','MANUAL',100.00),
('NPA-2026-002','funding_type','Unfunded','AUTO',99.00),
('NPA-2026-002','product_role','Principal — MBS sells put options to clients, hedges delta exposure via spot and forward positions internally','AUTO',95.00),
('NPA-2026-002','product_maturity','Up to 12 months standard. Illiquid beyond 12 months — desk policy requires Head of FX Desk approval for tenors >12M.','MANUAL',100.00),
('NPA-2026-002','product_lifecycle','Variation of existing vanilla FX options product (NPA-2024-015 GBP/USD Call). Adding put option to complete the options product suite. Immediate go-live after sign-off.','MANUAL',100.00),
('NPA-2026-002','product_features','• European style: exercise at expiry only\n• Put option: right to sell GBP at strike\n• Cash or physical settlement\n• Delta hedging: automated via existing GBP/USD spot and forward book\n• Volatility surface: Bloomberg composite GBP/USD vols\n• Minimum notional: GBP 5M per trade','MANUAL',100.00),
('NPA-2026-002','revenue_year1','2800000.00','MANUAL',100.00),
('NPA-2026-002','revenue_year1_net','2240000.00','MANUAL',100.00),
('NPA-2026-002','revenue_year2','3640000.00','MANUAL',100.00),
('NPA-2026-002','revenue_year2_net','2912000.00','MANUAL',100.00),
('NPA-2026-002','revenue_year3','4368000.00','MANUAL',100.00),
('NPA-2026-002','revenue_year3_net','3494400.00','MANUAL',100.00),
('NPA-2026-002','expected_volume','GBP 500M notional in Year 1. Average deal size: GBP 20-50M. Estimated 20-30 trades per month initially.','MANUAL',100.00),
('NPA-2026-002','target_roi','ROAE 18-22% (unfunded derivative — capital is operational risk only). Hurdle: 15% MBS minimum.','MANUAL',100.00),
('NPA-2026-002','revenue_streams','• Option premium spread: 5-15 bps on notional (depending on tenor and moneyness)\n• Delta hedging spread: earned on spot/forward delta trades\n• Vega P&L: managed within vol book\n• Roll revenue: clients rolling expiring hedges','MANUAL',100.00),
('NPA-2026-002','gross_margin_split','FX Desk: 100% (standalone product with no cross-desk referral)','MANUAL',100.00),
('NPA-2026-002','cost_allocation','No incremental technology cost — using existing Murex FX options infrastructure. Incremental operational cost: nil (existing FX ops team handles). Training: 2 hours staff refresher.','MANUAL',100.00),
('NPA-2026-002','spv_involved','No','AUTO',100.00),
('NPA-2026-002','customer_segments','APAC institutional clients with GBP exposure: (1) APAC asset managers with GBP bond portfolios, (2) Singapore corporates with UK subsidiaries or GBP receivables, (3) APAC hedge funds with cross-currency strategies','MANUAL',100.00),
('NPA-2026-002','customer_restrictions','Institutional clients only (Professional Investors under SFA). Minimum notional GBP 5M. ISDA Master Agreement with CSA required. No retail clients.','MANUAL',100.00),
('NPA-2026-002','customer_suitability','Accredited Investor (SFA) with derivatives trading experience. Currency option risk acknowledgement. Product suitability assessment completed as part of ISDA/IMA onboarding.','MANUAL',100.00),
('NPA-2026-002','customer_geographic','Singapore (primary), Hong Kong, other APAC. No US clients (exempt from CFTC requirements as non-US product on MBS SG entity).','MANUAL',100.00),
('NPA-2026-002','distribution_channels','GFM Institutional Sales (voice execution), Electronic FX platform (MBS FX Now — future phase), Bloomberg FXGO RFQ system','MANUAL',100.00),
('NPA-2026-002','sales_suitability','ISDA/IMA required for all clients. Pre-deal suitability check: Client must have FX options approval in their dealing mandate. Risk disclosure provided at each trade.','MANUAL',100.00),
('NPA-2026-002','onboarding_process','Existing ISDA/IMA clients: immediate access. New clients: ISDA/IMA negotiation (typically 2-4 weeks) + KYC/AML clearance + derivatives risk disclosure acknowledgement.','MANUAL',100.00),
('NPA-2026-002','marketing_plan','Targeted outreach to 35 existing GBP/USD spot/forward clients. FX options explainer note distributed via GFM Insights. Initial pricing sheets provided to key relationship managers.','MANUAL',100.00),
('NPA-2026-002','pac_reference','N/A — PAC not required for NPA Lite Variation','MANUAL',100.00),
('NPA-2026-002','external_parties_involved','No','AUTO',100.00),
('NPA-2026-002','esg_data_used','No','AUTO',100.00),
('NPA-2026-002','competitive_landscape','GBP/USD options market: dominated by Barclays, HSBC, JPM. MBS advantage: SG-onshore execution, strong GBP franchise from UK trade finance clients, existing vol infrastructure from USD/SGD options. MBS currently losing 100% of GBP option flow to offshore banks.','ADAPTED',85.00),
('NPA-2026-002','market_opportunity','GBP/USD options market: $50B+ daily global volume. APAC institutional segment (ex-Japan): est. $5B daily. MBS target share: 1% = $50M daily notional, generating $3-4M annual premium income.','ADAPTED',82.00),
('NPA-2026-002','break_even_timeline','Month 3 — product uses existing infrastructure, zero additional fixed costs. Break-even at first trade.','MANUAL',100.00),
('NPA-2026-002','kyc_requirements','Existing institutional client KYC applies. No new KYC requirements — GBP/USD option clients are existing spot/forward clients.','MANUAL',100.00),
('NPA-2026-002','customer_accreditation','Accredited Investor certification on file for all institutional clients. Currency option-specific risk acknowledgement added to ISDA/IMA.','MANUAL',100.00),
('NPA-2026-002','staff_training','2-hour refresher for FX desk and sales on GBP/USD option pricing and risk. Existing option knowledge from USD/SGD options product. No new certification required.','MANUAL',100.00),
('NPA-2026-002','customer_objectives','Clients seek (1) precise downside protection on GBP/USD at known premium cost, (2) flexibility to participate in GBP appreciation, (3) defined cash flows vs open-ended exposure.','MANUAL',100.00),
('NPA-2026-002','customer_key_risks','(1) Option premium cost if GBP does not depreciate (opportunity cost), (2) Counterparty credit risk (mitigated by ISDA CSA), (3) Liquidity risk on exercise for physical settlement (mitigated by cash settlement option)','MANUAL',100.00),
('NPA-2026-002','transfer_pricing','100% FX desk — no cross-desk transfer pricing. FTP on premium received: SORA overnight, refunded to desk as earned revenue.','MANUAL',100.00),

-- ================================================================
-- PC.II: OPERATIONAL & TECHNOLOGY
-- ================================================================
('NPA-2026-002','front_office_model','GFM FX Desk Singapore: existing FX options team (3 traders + 2 sales). GBP/USD options managed within existing FX options book alongside USD/SGD, EUR/USD options. Delta managed via existing GBP/USD spot/forward book.','MANUAL',100.00),
('NPA-2026-002','middle_office_model','FX Middle Office: existing trade support covers option lifecycle (confirmation, exercise, settlement). Independent Price Verification (IPV) via Bloomberg BVAL. No new MO headcount required.','MANUAL',100.00),
('NPA-2026-002','back_office_model','FX Back Office: existing settlement team. Cash settlement: SWIFT MT300 on expiry date. Physical settlement: SWIFT FX payment instructions T+2 from exercise. Reconciliation with Murex daily.','MANUAL',100.00),
('NPA-2026-002','booking_system','Murex MX.3 — FXD|OPT|EUR typology. Portfolio: MBSSG_GFM_FX_OPT. No new system build — extension of existing FX options module for GBP/USD pair.','MANUAL',100.00),
('NPA-2026-002','booking_legal_form','OTC FX Option — ISDA Master Agreement (2002) with FX & Currency Option Definitions (1998)','MANUAL',100.00),
('NPA-2026-002','booking_family','FX Derivatives (FXD)','MANUAL',100.00),
('NPA-2026-002','booking_typology','FXD|OPT|VANILLA|PUT','MANUAL',100.00),
('NPA-2026-002','portfolio_allocation','MBSSG_GFM_FX_OPT — FX Options Trading Book. Delta hedged against MBSSG_GFM_FX_SPOT portfolio.','MANUAL',100.00),
('NPA-2026-002','settlement_method','Cash Settlement (primary) or Physical Delivery (by election in confirmation). Cash: USD P&L on expiry. Physical: T+2 FX payment.','MANUAL',100.00),
('NPA-2026-002','settlement_flow','Expiry: Murex auto-calculates exercise check (spot vs strike). In-the-money: auto-generates settlement instruction. Cash: SWIFT MT300 USD payment T+0 from expiry. Physical: SWIFT MT300 GBP/USD exchange T+2.','MANUAL',100.00),
('NPA-2026-002','confirmation_process','MarkitWire electronic confirmation T+0 on trade date. ISDA FX Option confirmation template. Client countersigns via MarkitWire portal. Unconfirmed >T+1: trade support follows up. >T+3: escalated to MO Head.','MANUAL',100.00),
('NPA-2026-002','reconciliation','Daily: Murex FX option positions vs Bloomberg risk. Weekly: Vol surface mark reconciliation (Murex vs Bloomberg BVAL). Monthly: Position reconciliation with counterparties. Daily P&L attribution to delta, vega, theta.','MANUAL',100.00),
('NPA-2026-002','exception_handling','Early exercise request: impossible (European-style). Expiry dispute: reference Bloomberg BGN rate. Settlement disagreement: refer to ISDA dispute resolution. System failure on expiry: manual exercise processing via email with FX ops backup procedure.','MANUAL',100.00),
('NPA-2026-002','accounting_treatment','Trading Book — fair value through P&L. Option premium received: immediate P&L. Daily mark-to-market of option position. Delta hedge in banking book creates separate accrual position.','MANUAL',100.00),
('NPA-2026-002','new_system_changes','No','AUTO',100.00),
('NPA-2026-002','tech_requirements','No new technology required. GBP/USD pair added to existing Murex FX options configuration. Bloomberg vol surface GBP/USD already licensed. MarkitWire confirmation template: minor update to add GBP/USD confirmation parameters.','MANUAL',100.00),
('NPA-2026-002','system_integration','No new integrations. Existing: Murex → Bloomberg (vol surface), Murex → MarkitWire (confirmations), Murex → SWIFT (settlements), Murex → MBS risk systems (VaR, P&L reporting).','MANUAL',100.00),
('NPA-2026-002','valuation_model','Black-Scholes (1973). Inputs: GBP/USD spot rate (Bloomberg BGN), forward points (ICAP broker), implied volatility surface (Bloomberg BVAL composite). IPV tolerance: 1 vol point for liquid strikes, 3 vol points for wings.','MANUAL',100.00),
('NPA-2026-002','trade_capture_system','Murex MX.3 (existing)','MANUAL',100.00),
('NPA-2026-002','risk_system','Murex Risk (delta, vega, gamma, theta). MBS internal VaR system (historical simulation, 500-day window). Bloomberg OVDV for vol surface management.','MANUAL',100.00),
('NPA-2026-002','reporting_system','MBS internal risk dashboard (Murex). Bloomberg PORT for portfolio analytics. Internal: daily P&L flash, weekly risk report to Head of FX Desk, monthly report to GFM COO.','MANUAL',100.00),
('NPA-2026-002','stp_rate','95% STP via MarkitWire. 5% manual (non-standard tenors, physical settlement elections, large block trades requiring senior approval).','MANUAL',100.00),
('NPA-2026-002','mktdata_requirements','Bloomberg BVAL: GBP/USD implied volatility surface (ATM, 25D RR, 25D Fly). ICAP: GBP/USD forward points. Bloomberg BGN: spot reference rate. All already licensed in existing FX options infrastructure.','MANUAL',100.00),
('NPA-2026-002','hsm_required','No','AUTO',100.00),
('NPA-2026-002','security_assessment','N/A — No new systems. Existing Murex and Bloomberg infrastructure fully assessed and compliant under MBS ISS framework.','MANUAL',100.00),
('NPA-2026-002','pentest_status','Not Required','AUTO',100.00),
('NPA-2026-002','iss_deviations','No ISS deviations. Standard FX option booking on existing Murex infrastructure.','MANUAL',100.00),
('NPA-2026-002','grc_id','N/A — no new third-party vendors involved','MANUAL',100.00),
('NPA-2026-002','rto_target','4 hours (aligned with GFM FX trading systems RTO — existing BCM policy)','MANUAL',100.00),
('NPA-2026-002','rpo_target','15 minutes (Murex real-time replication to DR site)','MANUAL',100.00),
('NPA-2026-002','dr_testing_plan','Covered under existing GFM BCM plan. Semi-annual DR test for Murex FX systems. Last test: 2025-Q3, result: PASS.','MANUAL',100.00),
('NPA-2026-002','bcp_requirements','No new BCM requirements. Existing GFM FX BCM (SOP-FX-002) covers FX options operations. Manual fallback: paper ticket for trades during Murex outage with same-day booking requirement.','MANUAL',100.00),
('NPA-2026-002','bia_considerations','Tier 2 (Important): FX option trading. Outage >4h: escalated to GFM CITO. Client positions protected by pre-signed confirmations. No new BIA assessment required — same as existing options products.','MANUAL',100.00),
('NPA-2026-002','continuity_measures','Existing: (1) Murex active-active Singapore/DR replication, (2) Bloomberg backup feeds (BVAL + ICE), (3) ICAP voice backup for forward points, (4) MBS Treasury backup FX platform for client-facing confirmations.','MANUAL',100.00),
('NPA-2026-002','limit_structure','GBP/USD vega limit: USD 200K per 1% vol move. Delta limit: GBP 200M. Gamma limit: GBP 50M per 1% spot move. Tenor limit: 12M maximum without Head approval. Single trade limit: GBP 100M without GFM Head approval.','MANUAL',100.00),
('NPA-2026-002','limit_monitoring','Murex real-time limit monitoring. Alerts at 80% of each limit. Breach: automatic hold + GFM Risk notification within 15 minutes. Senior FX trader on-call 24h during active markets.','MANUAL',100.00),
('NPA-2026-002','custody_required','No','AUTO',100.00),

-- ================================================================
-- PC.III: PRICING MODEL DETAILS
-- ================================================================
('NPA-2026-002','pricing_model_required','Yes','MANUAL',100.00),
('NPA-2026-002','pricing_methodology','Black-Scholes European option pricing. Inputs: (1) GBP/USD spot (Bloomberg BGN), (2) GBP/USD forward points (ICAP composite), (3) GBP/USD implied vol surface (Bloomberg BVAL — ATM, 25-delta risk reversal, 25-delta butterfly). Client spread: 5-15 vol points above mid, depending on notional and tenor.','MANUAL',100.00),
('NPA-2026-002','roae_analysis','Unfunded derivative: no balance sheet usage except operational risk capital. ROAE estimated 18-22% on regulatory capital charge. Capital charge: operational risk AMA allocation ($150K). Revenue/capital ratio: 18.7x.','MANUAL',100.00),
('NPA-2026-002','pricing_assumptions','GBP/USD vol surface: 3M ATM ~8.5%, 6M ATM ~9.2% (current market). Client premium: mid + 8 vol points spread. Average premium $200K-$500K per $25M notional (depending on moneyness and tenor). No model risk reserve required for vanilla options.','MANUAL',100.00),
('NPA-2026-002','bespoke_adjustments','VIP clients (>GBP 50M notional or top 20 FX relationships): spread compressed to 3-5 vol points. Requires GFM Head approval per trade. Long-dated trades (>6M): additional 2 vol points for liquidity premium.','MANUAL',100.00),
('NPA-2026-002','pricing_model_name','Black-Scholes GBP/USD Put Option Model (Murex implementation)','MANUAL',100.00),
('NPA-2026-002','model_validation_date','2024-06-15','MANUAL',100.00),
('NPA-2026-002','model_restrictions','Model excludes: (1) American-style options (existing products — separate NPA), (2) Barrier options (separate NPA variation), (3) Exotic payoffs. Model valid for European vanilla puts only up to 12M tenor.','MANUAL',100.00),
('NPA-2026-002','simm_treatment','ISDA SIMM Risk Class 1 (FX). Delta margin: GBP/USD delta sensitivity × SIMM FX delta risk weight (7.7%). Vega margin: GBP/USD vega sensitivity × SIMM FX vega risk weight. Curvature: applies for non-linear payoff.','MANUAL',100.00),
('NPA-2026-002','fva_adjustment','FVA: Minimal for standard tenors (<6M). For 12M trades with large notional: FVA charge applied to unsecured counterparties without CSA. Estimated average FVA: 0.5-1 bps on notional.','MANUAL',100.00),
('NPA-2026-002','xva_treatment','CVA: Applied for counterparties without daily CSA. DVA: Not applied per MBS policy. FVA: Applied for net cash outflows from delta hedges. All XVA computed by Middle Office using Murex XVA engine.','MANUAL',100.00),

-- ================================================================
-- PC.IV: RISK ANALYSIS
-- ================================================================
('NPA-2026-002','risk_classification','MEDIUM','AUTO',95.00),
('NPA-2026-002','market_risk','Primary risks: (1) Delta: GBP/USD spot exposure from option delta. Hedged daily via spot/forward. Residual delta: <GBP 5M. (2) Vega: GBP/USD vol exposure. Managed within vol book with Bloomberg BVAL hedges. (3) Gamma: short gamma position for MBS (client buys puts, MBS sells). Gamma risk most significant on expiry date. (4) Theta: positive theta (time decay benefits MBS as option seller). Residual market risk within standard FX desk limits.','MANUAL',100.00),
('NPA-2026-002','mrf_fx_delta','Yes','AUTO',99.00),
('NPA-2026-002','mrf_fx_vega','Yes','AUTO',99.00),
('NPA-2026-002','mrf_ir_delta','Yes','AUTO',90.00),
('NPA-2026-002','mrf_ir_vega','No','AUTO',95.00),
('NPA-2026-002','mrf_ir_gamma','No','AUTO',95.00),
('NPA-2026-002','mrf_commodity','No','AUTO',100.00),
('NPA-2026-002','mrf_credit','No','AUTO',100.00),
('NPA-2026-002','mrf_correlation','No','AUTO',100.00),
('NPA-2026-002','liquidity_risk','Low — GBP/USD is the world''s 4th most traded currency pair. Deep spot and forward liquidity for delta hedging. Vol market liquid up to 12M tenor. Bid-ask spreads: typically 0.2-0.5 vol points. Stress: spreads can widen to 2-3 vol points in extreme market events (e.g., Brexit referendum). Manageable within desk limits.','MANUAL',100.00),
('NPA-2026-002','liquidity_cost','FTP on premium received: SORA overnight × days to expiry. Net cost: immaterial for short-dated options. 12M options: FTP ~$15K per $25M notional — included in option pricing spread.','MANUAL',100.00),
('NPA-2026-002','credit_risk','Counterparty credit risk arises when option is in-the-money for MBS (MBS has net positive fair value = receivable from client). CSA required for all institutional counterparties. Daily margin calls if exposure exceeds threshold. Wrong-way risk: Not material for vanilla FX options (GBP depreciation does not correlate with UK client creditworthiness).','MANUAL',100.00),
('NPA-2026-002','counterparty_rating','Minimum BBB- (investment grade) for counterparties without CSA. No minimum with daily-margin CSA in place. Current pipeline: 15 BBB+ and above clients, 5 with existing CSA.','MANUAL',100.00),
('NPA-2026-002','credit_support_required','Yes — for counterparties without daily CSA','MANUAL',100.00),
('NPA-2026-002','collateral_framework','ISDA Credit Support Annex (CSA). Eligible collateral: cash (USD/GBP), G7 government bonds. Minimum Transfer Amount: $500K. Independent Amount: required for counterparties below BBB. Threshold: zero for sub-investment grade. Daily valuation and margin calls.','MANUAL',100.00),
('NPA-2026-002','custody_risk','N/A — no physical securities involved. FX option is an unfunded derivative. No custody arrangement required.','MANUAL',100.00),
('NPA-2026-002','regulatory_capital','Trading Book treatment. SA-CCR for options: replacement cost + PFE add-on. FX options delta adjusted add-on per Basel III. Estimated capital charge: $450K for GBP 500M notional Year 1 book. FRTB SA applies — GBP/USD is liquid currency pair with low capital weight.','MANUAL',100.00),
('NPA-2026-002','stress_scenarios','Scenario 1: GBP flash crash -15% (2016 Brexit replay) — large in-the-money position, clients exercise, MBS pays USD P&L (mitigated by delta hedge). Scenario 2: Vol spike to 25% (from 8.5% ATM) — mark-to-market loss on short vega position. Scenario 3: Simultaneous GBP crash + vol spike — maximum combined loss $8M on current book size. Within MBS stress loss limit for FX desk.','MANUAL',100.00),
('NPA-2026-002','stress_test_results','Back-test on 2016 GBP/USD crash: MBS short vega position loss = $2.3M at current book size. Acceptable within $10M FX desk stress buffer. Brexit scenario: residual delta risk fully mitigated by spot hedge. All stress scenarios within approved risk appetite.','MANUAL',100.00),
('NPA-2026-002','reputational_risk','LOW — vanilla FX option is a standard institutional product. No reputational risk beyond standard FX hedging considerations.','MANUAL',100.00),
('NPA-2026-002','negative_impact','No','AUTO',100.00),
('NPA-2026-002','esg_assessment','Neutral — currency hedge product with no ESG implications. No fossil fuel exposure. No ESG considerations in GBP/USD currency markets.','AUTO',90.00),
('NPA-2026-002','esg_classification','Neutral','AUTO',90.00),
('NPA-2026-002','exposure_limits','Delta limit: GBP 200M. Vega limit: USD 200K/vol point. Gamma PnL limit: USD 500K/1% spot. Tenor limit: 12M standard. Counterparty credit exposure limit: per existing RMG credit framework (counterparty-specific limits).','MANUAL',100.00),
('NPA-2026-002','monitoring_party','GFM Market Risk: daily delta, vega, gamma, theta monitoring. RMG Credit: counterparty limit usage. MLR: none (pure FX product). MO: IPV and P&L reconciliation.','MANUAL',100.00),
('NPA-2026-002','legal_opinion','No new legal opinion required. Existing ISDA/IMA with GBP/USD FX definitions covers this product. Allen & Gledhill standing legal opinion on FX options under Singapore law confirmed as applicable.','MANUAL',100.00),
('NPA-2026-002','licensing_requirements','No new licensing. MBS holds MAS CMS licence covering FX derivatives. GBP/USD options within existing licence scope.','MANUAL',100.00),
('NPA-2026-002','primary_regulation','MAS Securities and Futures Act (SFA). MAS Notice 637 (Capital Requirements). ISDA 1998 FX Definitions.','MANUAL',100.00),
('NPA-2026-002','secondary_regulations','MAS Notice SFA 04-N12 (Reporting). UK FCA EMIR reporting (cross-border trades). HKMA OTC derivatives reporting (HK counterparties). ISDA Resolution Stay Protocol adherence.','MANUAL',95.00),
('NPA-2026-002','regulatory_reporting','MAS Trade Repository (T+2). Internal: daily P&L flash, weekly risk report. For UK-domiciled clients: UK FCA EMIR reporting. DTCC GTR submission via existing infrastructure.','MANUAL',100.00),
('NPA-2026-002','cross_border_regulations','UK counterparties: UK FCA EMIR reporting obligation. HK counterparties: HKMA OTC derivatives reporting. SG primary regulation. No additional cross-border issues — same framework as existing FX options.','MANUAL',100.00),
('NPA-2026-002','legal_docs_required','• ISDA Master Agreement (2002) — existing for most clients\n• FX and Currency Option Definitions (ISDA 1998) — supplement\n• Credit Support Annex (CSA) — for clients without existing CSA\n• Deal-level Confirmation (MarkitWire template — standard)','MANUAL',100.00),
('NPA-2026-002','sanctions_check','Clear - No Matches','AUTO',100.00),
('NPA-2026-002','aml_considerations','Low AML risk — institutional FX options are standard hedging instruments. Existing AML framework for institutional FX clients applies. No enhanced CDD required beyond existing client profiles.','MANUAL',100.00),
('NPA-2026-002','tax_impact','Singapore: GST exempt (financial services) on option premium. UK clients: no UK withholding tax on FX option premium payments. Transfer pricing: Single-entity product — no cross-entity TP. Accounting: IFRS 9 — trading book, fair value through P&L.','ADAPTED',88.00),
('NPA-2026-002','accounting_book','Trading Book','AUTO',99.00),
('NPA-2026-002','fair_value_treatment','Fair value through P&L. Daily mark-to-market vs Bloomberg BVAL. Option premium recognised immediately on trade date. Delta hedge position: accrual accounting in banking book hedge.','MANUAL',100.00),
('NPA-2026-002','on_off_balance','Off-Balance Sheet (derivative instrument — SFP disclosure required at fair value)','AUTO',90.00),
('NPA-2026-002','tax_jurisdictions','SG: GST Exempt. UK: No WHT. No other jurisdictions unless client specific. Transfer pricing: N/A (MBS SG-only booking).','MANUAL',100.00),
('NPA-2026-002','model_risk','Model: Black-Scholes is industry standard. Risk: model misspecification for fat-tail events (GBP crash). Mitigant: stress test complement to model VaR. Vanna-volga adjustment applied for wing strikes beyond 10-delta.','MANUAL',90.00),
('NPA-2026-002','wrong_way_risk','Not material for GBP/USD vanilla put options. GBP depreciation (which drives option into-the-money for client) does not create correlated counterparty credit risk for UK institutional counterparties (UK institutions are generally better hedged against GBP moves).','MANUAL',85.00),
('NPA-2026-002','cva_dva_impact','CVA: Applied for clients without CSA. Estimated CVA range: 0.1-0.5 bps on notional for BBB-rated clients at current vol levels. DVA: Not applied. CVA computed daily by MO XVA desk.','MANUAL',90.00),
('NPA-2026-002','netting_agreements','Close-out netting under ISDA Master Agreement. MAN applies for all clients. Single master netting agreement nets all FX derivatives (spot, forward, options) per counterparty for exposure calculation.','MANUAL',100.00),
('NPA-2026-002','isda_master','Yes — ISDA 2002 Master Agreement required for all counterparties','MANUAL',100.00),
('NPA-2026-002','csa_in_place','Yes — recommended for all counterparties. Mandatory for sub-investment grade. Daily margining preferred.','MANUAL',100.00),
('NPA-2026-002','country_risk','UK: Tier 1 (well-regulated jurisdiction, G7). GBP/USD political risk: elevated post-Brexit but manageable within standard FX risk framework. No country risk capital charge for UK counterparties.','MANUAL',90.00),

-- ================================================================
-- PC.V: DATA MANAGEMENT
-- ================================================================
('NPA-2026-002','data_governance','No new data governance requirements. GBP/USD option data captured in existing Murex FX data model. Data owner: GFM FX Desk Head.','MANUAL',100.00),
('NPA-2026-002','data_ownership','MBS Bank Ltd Singapore. Trade data: Murex golden source. Client data: existing ISDA/KYC records.','MANUAL',100.00),
('NPA-2026-002','data_stewardship','FX Desk Data Steward: FX Operations Manager. Risk data: GFM Market Risk CRO delegate.','MANUAL',100.00),
('NPA-2026-002','data_quality_monitoring','Daily: Murex P&L reconciliation. Bloomberg vol surface quality check. MarkitWire confirmation matching rate monitored (target: 95% by T+1). Unmatched confirmations flagged to trade support.','MANUAL',100.00),
('NPA-2026-002','data_privacy','No retail customer data. Institutional counterparty data (legal entity, ISDA/LEI) classified as BUSINESS CONFIDENTIAL. PDPA not applicable to institutional contracts.','MANUAL',100.00),
('NPA-2026-002','data_retention','Trade records: 7 years (MAS SFA requirement). Client communications: 5 years. Confirmation records: 7 years (ISDA requirement). Automated archival to MBSSG cold storage after 2 years.','MANUAL',100.00),
('NPA-2026-002','gdpr_compliance','Not applicable. No EU retail clients. UK institutional clients: UK GDPR (B2B exceptions apply for financial institution data).','MANUAL',100.00),
('NPA-2026-002','pure_assessment_id','N/A — no personal data processed for institutional FX options. No PURE assessment required.','MANUAL',100.00),
('NPA-2026-002','reporting_requirements','MAS Trade Repository: T+2. Internal: daily risk flash, weekly P&L, monthly GFM COO report. Portfolio analytics: Bloomberg OVDV daily. Regulatory: DTCC GTR submission T+2.','MANUAL',100.00),
('NPA-2026-002','automated_reporting','Automated: MAS TR submission via DTCC, Murex daily P&L, Bloomberg vol surface reconciliation. Manual: UK EMIR reporting (for UK clients) — manually submitted via Regis-TR.','MANUAL',100.00),
('NPA-2026-002','data_lineage','Trade → Murex → risk systems → regulatory reporting. Bloomberg vol surface → Murex pricing → IPV. Full audit trail maintained in Murex for all lifecycle events.','MANUAL',100.00),
('NPA-2026-002','data_classification','BUSINESS_CONFIDENTIAL — Standard classification for GFM wholesale trading data. No sensitive personal data. Encryption per MBS data security standards (AES-256 at rest, TLS 1.3 in transit).','MANUAL',100.00),

-- ================================================================
-- PC.VI: OTHER RISK IDENTIFICATION
-- ================================================================
('NPA-2026-002','other_risks_exist','No','AUTO',100.00),
('NPA-2026-002','operational_risk','LOW — Vanilla FX options well within existing FX operations expertise. Key risks: (1) Booking errors (wrong strike/expiry): mitigated by maker-checker and MO verification. (2) Missed expiry processing: automated Murex expiry workflow with MO backup. (3) Confirmation disputes: MarkitWire electronic matching minimises disputes.','MANUAL',100.00),

-- ================================================================
-- PC.VII: TRADING PRODUCT ASSESSMENT
-- ================================================================
('NPA-2026-002','trading_product','Yes','AUTO',99.00),
('NPA-2026-002','appendix5_required','Yes','AUTO',99.00),

-- ================================================================
-- APP.1: ENTITY / LOCATION
-- ================================================================
('NPA-2026-002','booking_entity','MBS Bank Ltd, Singapore','MANUAL',100.00),
('NPA-2026-002','sales_entity','MBS Bank Ltd, Singapore (GFM Institutional Sales)','MANUAL',100.00),
('NPA-2026-002','booking_location','Singapore','MANUAL',100.00),
('NPA-2026-002','sales_location','Singapore. HK clients handled by GFM HK desk (sub-delegation under SG licence).','MANUAL',100.00),
('NPA-2026-002','risk_taking_entity','MBS Bank Ltd, Singapore (FX Trading Desk)','MANUAL',100.00),
('NPA-2026-002','risk_taking_location','Singapore','MANUAL',100.00),
('NPA-2026-002','processing_entity','MBS Bank Ltd, Singapore (GFM FX Operations)','MANUAL',100.00),
('NPA-2026-002','processing_location','Singapore','MANUAL',100.00),
('NPA-2026-002','counterparty','Institutional clients: asset managers, corporates, hedge funds. Existing ISDA/IMA counterparties. No new counterparty types.','MANUAL',100.00),
('NPA-2026-002','hedge_entity','MBS Bank Ltd, Singapore (FX Spot/Forward Book)','MANUAL',100.00),

-- ================================================================
-- APP.2: INTELLECTUAL PROPERTY
-- ================================================================
('NPA-2026-002','mbs_ip_exists','No','AUTO',100.00),
('NPA-2026-002','third_party_ip_exists','No','AUTO',100.00),
('NPA-2026-002','ip_licensing','N/A — all market data already licensed (Bloomberg BVAL, ICAP). Murex FX options module covered under existing enterprise licence.','MANUAL',100.00),

-- ================================================================
-- APP.3: FINANCIAL CRIME
-- ================================================================
('NPA-2026-002','aml_assessment','LOW RISK. Institutional FX options are standard hedging instruments. All counterparties are existing ISDA clients with KYC/AML on file. Existing monitoring framework applies.','MANUAL',100.00),
('NPA-2026-002','terrorism_financing','LOW — institutional counterparties in regulated jurisdictions. Existing TF screening framework applies via Firco Continuity. No enhanced TF risk from vanilla FX options.','MANUAL',100.00),
('NPA-2026-002','sanctions_assessment','All counterparties screened against OFAC, EU, UN, MAS sanctions lists at onboarding and periodic refresh. GBP/USD as currency pair: no sanctions implications (both USD and GBP are non-sanctioned currencies).','MANUAL',100.00),
('NPA-2026-002','fraud_risk','LOW. Risks: (1) Trade fraud (fictitious trades): mitigated by dual-control booking + MO confirmation matching. (2) Market manipulation: trade surveillance via Nasdaq SMARTS covers FX options. (3) Internal fraud: segregation of duties (FO books, MO confirms, BO settles).','MANUAL',100.00),
('NPA-2026-002','bribery_corruption','LOW — institutional wholesale product. No government procurement. Standard MBS anti-bribery and gifts/entertainment policy applies to all FX desk staff.','MANUAL',100.00),
('NPA-2026-002','fc_risk_rating','LOW','MANUAL',100.00),
('NPA-2026-002','fc_mitigation_measures','• Existing ISDA counterparty AML/KYC on file\n• Firco Continuity sanctions screening at onboarding and periodic refresh\n• Nasdaq SMARTS trade surveillance covers FX options\n• MarkitWire electronic confirmation eliminates manual confirmation fraud risk','MANUAL',100.00),

-- ================================================================
-- APP.4: RISK DATA AGGREGATION
-- ================================================================
('NPA-2026-002','rda_compliance','GBP/USD FX options data integrated into existing MBS risk data aggregation framework. Murex is golden source. No new BCBS 239 impact — same data model as existing FX options.','MANUAL',95.00),
('NPA-2026-002','rda_data_sources','Murex MX.3 (position and P&L), Bloomberg BVAL (vol surface and mark), ICAP (forward points), MarkitWire (confirmation data)','MANUAL',100.00),
('NPA-2026-002','rda_aggregation_method','Real-time: Murex position updates. T+0: Daily P&L flash. T+1: Risk report. Regulatory: T+2 MAS TR submission. Same aggregation methodology as existing FX options book.','MANUAL',100.00),
('NPA-2026-002','rda_data_quality','99.95% data quality target. Bloomberg vol surface: cross-checked daily vs ICAP composite. P&L breaks >$10K: investigated by MO within same day. Confirmation mismatch: real-time MarkitWire alert.','MANUAL',100.00),

-- ================================================================
-- APP.5: TRADING PRODUCTS
-- ================================================================
('NPA-2026-002','app5_revenue_sharing','100% to GFM FX Desk — no revenue sharing arrangement. Single desk product.','MANUAL',100.00),
('NPA-2026-002','app5_capital_allocation','SA-CCR capital: estimated $450K for Year 1 GBP 500M notional book. Allocated from GFM FX Desk capital budget. No incremental capital request — within existing FX options capital envelope.','MANUAL',100.00),
('NPA-2026-002','app5_hedge_purpose','No — MBS sells options to clients and delta-hedges (not a designated hedge relationship under IFRS 9)','MANUAL',100.00),
('NPA-2026-002','collateral_types','CSA eligible: Cash (USD/GBP, 0% haircut), G7 Govt Bonds (2-5% haircut). MBS does not accept equities as collateral for FX options.','MANUAL',100.00),
('NPA-2026-002','valuation_method','Black-Scholes fair value. IPV: Bloomberg BVAL composite verified daily by MO. Tolerance: 1 vol point for liquid strikes/tenors (<6M, 10-90 delta). Wing strikes: 3 vol points tolerance.','MANUAL',100.00),
('NPA-2026-002','funding_source','Unfunded derivative. Premium received from client funds any collateral payments under CSA. Net cash flows: minimal for delta hedges (spot market).','MANUAL',100.00),
('NPA-2026-002','booking_schema','Murex FXD|OPT|EUR|PUT. Single-leg option. Delta hedge: separate FX spot/forward booking in MBSSG_GFM_FX_SPOT. P&L aggregation: option book + delta hedge book combined for desk P&L reporting.','MANUAL',100.00),
('NPA-2026-002','lifecycle_management','Trade date: booking + confirmation. Daily: delta rebalancing, theta accrual. Expiry - 5 days: client notification of upcoming expiry. Expiry: automated exercise check, settlement instruction generation. Post-expiry: trade closure, premium settlement reconciliation.','MANUAL',100.00),
('NPA-2026-002','trade_reporting','MAS Trade Repository via DTCC GTR (T+2). UK EMIR reporting for UK clients. Standard GFM FX reporting infrastructure covers GBP/USD options with no additional reporting build required.','MANUAL',100.00),
('NPA-2026-002','clearing_obligation','No central clearing for OTC FX options — ISDA bilateral clearing exemption applies for all tenors. G20 clearing mandate does not cover vanilla FX options.','MANUAL',100.00),

-- ================================================================
-- APP.6: THIRD-PARTY PLATFORMS
-- ================================================================
('NPA-2026-002','third_party_platform','No','AUTO',100.00);

SET FOREIGN_KEY_CHECKS=1;
