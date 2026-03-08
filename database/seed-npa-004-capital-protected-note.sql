-- ============================================================
-- SEED: NPA-2026-004 Capital Protected Structured Note
-- Complete NPA Draft — All Sections PC.I through APP.6
-- NPA Full, New-to-Group, HIGH risk, Wealth Management
-- ============================================================
SET FOREIGN_KEY_CHECKS=0;

DELETE FROM `npa_form_data` WHERE `project_id` = 'NPA-2026-004';

INSERT IGNORE INTO `npa_form_data` (`project_id`, `field_key`, `field_value`, `lineage`, `confidence_score`) VALUES

-- ================================================================
-- PC.I: PRODUCT SPECIFICATIONS
-- ================================================================
('NPA-2026-004','product_name','Capital Protected Structured Note — APAC Equity Basket Participation','MANUAL',100.00),
('NPA-2026-004','problem_statement','MBS Private Banking clients seeking equity market participation without full capital at risk. Current offering lacks a compliant capital-protected structured note suitable for MAS-regulated AI clients who cannot accept full equity downside. Competitor banks (UBS, Julius Baer) actively offering capital-protected notes (CPNs), causing MBS Private Banking to lose wallet share on structured investment mandates.','MANUAL',100.00),
('NPA-2026-004','value_proposition','100% capital protection at maturity + 80% participation in APAC equity basket (MBS Singapore, HSBC, AIA, Samsung, TSMC) upside. 3-year tenor with quarterly liquidity window at NAV. USD 500K minimum. Expected to generate USD 18M in structured note sales in Year 1 across MBS Private Banking Singapore and Hong Kong.','MANUAL',100.00),
('NPA-2026-004','customer_benefit','(1) 100% capital protection at maturity — zero principal risk, (2) 80% participation in APAC Equity Basket performance (uncapped), (3) Regular quarterly NAV liquidity (not illiquid), (4) Denominated in USD — no FX risk on principal, (5) Suitable for clients seeking equity exposure without accepting full downside.','MANUAL',100.00),
('NPA-2026-004','bu_benefit','Private Banking: USD 18M Year 1 structured note revenue. Gross margin: 1.2% on notional. Builds MBS structured products capability to compete with Swiss private banks. Unlocks equity participation product for conservative HNW clients.','MANUAL',100.00),
('NPA-2026-004','product_type','Structured Products','AUTO',99.00),
('NPA-2026-004','underlying_asset','APAC Equity Basket: MBS Group (40%), HSBC Holdings (20%), AIA Group (15%), Samsung Electronics (15%), TSMC (10%). Equal-weighted rebalanced annually.','MANUAL',100.00),
('NPA-2026-004','currency_denomination','USD','MANUAL',100.00),
('NPA-2026-004','notional_amount','500000.00','MANUAL',100.00),
('NPA-2026-004','tenor','3 years (36 months) from issue date. Maturity: capital protected return of 100% principal + 80% × basket performance (vs strike at issue date).','MANUAL',100.00),
('NPA-2026-004','funding_type','Funded','AUTO',99.00),
('NPA-2026-004','product_role','Principal — MBS issues the structured note from MBS Bank balance sheet. Client buys note from MBS.','AUTO',95.00),
('NPA-2026-004','product_maturity','3 years. Quarterly liquidity: client may request early redemption at quarterly NAV (NAV calculated by MO, may include bid-offer spread of 1-2% vs formula NAV).','MANUAL',100.00),
('NPA-2026-004','product_lifecycle','MBS issues new series of CPNs quarterly. Each series has: issue date, 5-day subscription window, strike date (close of subscription), 3-year tenor. Maturity: capital + participation payment.','MANUAL',100.00),
('NPA-2026-004','product_features','• 100% capital protection at maturity (MBS Bank credit obligation)\n• 80% participation rate in APAC Equity Basket\n• APAC Basket: MBS, HSBC, AIA, Samsung, TSMC (equal weighted, annual rebalance)\n• Quarterly NAV liquidity window (bid-offer: 1.5% of formula NAV)\n• USD denomination, minimum subscription: USD 500,000\n• No coupon — zero-coupon note structure (all return at maturity)\n• ISDA-documented structured note (GMTN issuance program)','MANUAL',100.00),
('NPA-2026-004','revenue_year1','18000000.00','MANUAL',100.00),
('NPA-2026-004','revenue_year1_net','10800000.00','MANUAL',100.00),
('NPA-2026-004','revenue_year2','21600000.00','MANUAL',100.00),
('NPA-2026-004','revenue_year2_net','12960000.00','MANUAL',100.00),
('NPA-2026-004','revenue_year3','25920000.00','MANUAL',100.00),
('NPA-2026-004','revenue_year3_net','15552000.00','MANUAL',100.00),
('NPA-2026-004','expected_volume','Year 1: USD 1.5B notional (3 quarterly series × USD 500M each). Average client: USD 2M per note. 750 client subscriptions estimated. Repeat clients expected at 30% for Year 2 series.','MANUAL',100.00),
('NPA-2026-004','target_roi','ROAE: 14-16% (funded product, RWA for call option component). Capital: 8% RWA on option component ($12M for $150M USD call option). Gross margin 1.2% on notional = $18M on $1.5B notional.','MANUAL',100.00),
('NPA-2026-004','revenue_streams','• Issuance spread: 1.2% on notional at issue\n• Quarterly liquidity bid-offer: 1.5% on early redemptions\n• Annual management fee: 25bps on outstanding notional (embedded in note price)\n• Cross-sell: MBS bank account for USD settlement of note proceeds','MANUAL',100.00),
('NPA-2026-004','gross_margin_split','GFM Structured Products: 70% (hedging P&L and option pricing), Private Banking: 30% (distribution and client service)','MANUAL',100.00),
('NPA-2026-004','cost_allocation','Embedded cost: zero-coupon bond purchase (MBS Treasury) ~85% of notional + call option purchase from GFM desk ~15% of notional. All-in option premium: 12% of notional for 3Y 80% participation call on basket.','MANUAL',100.00),
('NPA-2026-004','spv_involved','No — MBS Bank Ltd direct issuance under GMTN program. No SPV required.','MANUAL',100.00),
('NPA-2026-004','customer_segments','MBS Private Banking clients: HNW (USD 2M-10M net worth) and UHNW (>USD 10M). Age: 45-65 segment seeking capital protection. Conservative investors with equity market interest. Singapore and Hong Kong primary markets.','MANUAL',100.00),
('NPA-2026-004','customer_restrictions','Accredited Investors (SFA) only. Minimum subscription: USD 500,000. No retail clients. No clients from FATF high-risk jurisdictions. ISDA Master Agreement required for institutional clients.','MANUAL',100.00),
('NPA-2026-004','customer_suitability','AI suitability assessment required. Risk profile: Conservative to moderate (capital protection allows conservative client access). Structured product risk acknowledgement form. MBS Private Banking RM sign-off on each subscription.','MANUAL',100.00),
('NPA-2026-004','customer_geographic','Singapore, Hong Kong, Taiwan, Indonesia (APAC-focused Private Banking markets). No US persons (Reg S offering). EU: PRIIPs KID required.','MANUAL',100.00),
('NPA-2026-004','distribution_channels','MBS Private Banking RM channel (voice execution only). MBS Online Banking: settlement instructions only (no self-execution). No third-party distribution.','MANUAL',100.00),
('NPA-2026-004','sales_suitability','Mandatory: AI suitability check, risk profiling, structured note risk disclosure. Senior RM approval for subscriptions >USD 5M. Compliance pre-approval required for politically exposed clients.','MANUAL',100.00),
('NPA-2026-004','onboarding_process','Existing PB clients: immediate access with updated risk profile and structured note disclosure. New clients: standard PB onboarding (KYC, suitability, AI certification) before note subscription.','MANUAL',100.00),
('NPA-2026-004','marketing_plan','Quarterly series: pre-launch RM briefing (1 week before subscription window). Client presentation decks. MBS Treasures Plus and Private Banking investor newsletter. Roadshow for UHNW clients >USD 5M subscription.','MANUAL',100.00),
('NPA-2026-004','pac_reference','PAC-2026-SP-007','MANUAL',100.00),
('NPA-2026-004','external_parties_involved','No — MBS self-issuance. Option hedge placed with MBS GFM desk (internal).','MANUAL',100.00),
('NPA-2026-004','esg_data_used','No','AUTO',100.00),
('NPA-2026-004','competitive_landscape','Capital protected notes highly competitive in APAC private banking. UBS offers similar at 90% protection, 70% participation. Julius Baer: 100% protection, 60% participation. MBS advantage: 80% participation rate (more attractive than Julius Baer), MBS/HSBC/AIA exposure (locally resonant APAC basket), competitive pricing.','ADAPTED',85.00),
('NPA-2026-004','market_opportunity','APAC Structured Products AUM: USD 800B+. Capital protected products: ~20% of structured product AUM. MBS Private Banking structured product AUM: currently USD 2B, target USD 5B by 2028. CPN represents key growth product.','ADAPTED',82.00),
('NPA-2026-004','break_even_timeline','At launch — issuance spread of 1.2% is recognised at Day 1. No ongoing operating cost (MBS balance sheet issuance). Fixed hedging cost (call option) pre-purchased at issuance.','MANUAL',100.00),
('NPA-2026-004','kyc_requirements','Standard Private Banking KYC (Tier 3 Enhanced). Source of wealth verified. Structured note risk suitability form completed. AI certification on file. No new KYC requirements specific to this product.','MANUAL',100.00),
('NPA-2026-004','customer_accreditation','AI certification required and on file for all MBS Private Banking clients. Structured note risk disclosure additionally required at first subscription.','MANUAL',100.00),
('NPA-2026-004','staff_training','Private Banking RMs: 4-hour structured note product certification (refreshed quarterly). GFM desk: APAC equity basket option pricing training (2 hours). Compliance: structured product suitability framework refresher (2 hours).','MANUAL',100.00),
('NPA-2026-004','customer_objectives','Capital preservation (100% principal protection) + equity market participation (80% of APAC basket upside). Target clients: inheritance-driven investors, retirees with equity interest, clients transitioning from term deposits to higher-return products.','MANUAL',100.00),
('NPA-2026-004','customer_key_risks','(1) MBS credit risk (note is a MBS obligation — if MBS defaults, capital protection not guaranteed), (2) Opportunity cost: limited to 80% participation if basket outperforms significantly, (3) Liquidity risk: quarterly window only, not liquid daily, (4) Basket composition change risk: annual rebalancing may affect performance profile','MANUAL',100.00),
('NPA-2026-004','transfer_pricing','GFM Structured Products: sets option price charged internally to MBS PB. PB receives note issuance fee (30% of gross margin). FTP on zero-coupon bond embedding: SORA + 15bps internal funding rate on the "bond component" of the note.','MANUAL',100.00),

-- ================================================================
-- PC.II: OPERATIONAL & TECHNOLOGY
-- ================================================================
('NPA-2026-004','front_office_model','Private Banking RMs: client origination, subscription coordination, ongoing client service. GFM Structured Products desk: note pricing, option hedge execution, quarterly NAV calculation. Dedicated structured products operations: 2 staff.','MANUAL',100.00),
('NPA-2026-004','middle_office_model','GFM MO: option lifecycle management (delta hedge, quarterly NAV generation). Private Banking MO: client subscriptions, note reconciliation, early redemption processing. Independent NAV verification by MO for quarterly liquidity pricing.','MANUAL',100.00),
('NPA-2026-004','back_office_model','MBS Treasury Back Office: note issuance settlement under GMTN program. Client subscriptions: MBS cash account debit at subscription. Maturity: principal + participation payment from MBS bank account. All note lifecycle events settle via MBS internal accounts.','MANUAL',100.00),
('NPA-2026-004','booking_system','Murex MX.3: vanilla call option on basket (delta-hedged by GFM desk). Summit: structured note issuance register and client subscription tracking. Existing systems — no new builds.','MANUAL',100.00),
('NPA-2026-004','booking_legal_form','MBS GMTN (Global Medium Term Note) Program Prospectus supplement. Structured note term sheet (standalone document per series). ISDA Master Agreement for option hedge (internal GFM-PB ISDA).','MANUAL',100.00),
('NPA-2026-004','booking_family','Structured Products (SP)','MANUAL',100.00),
('NPA-2026-004','booking_typology','SP|CPN|EQ_BASKET|EUR','MANUAL',100.00),
('NPA-2026-004','portfolio_allocation','MBS balance sheet: zero-coupon bond component (Treasury). GFM trading book: call option (delta-managed). Private Banking: client subscriptions register.','MANUAL',100.00),
('NPA-2026-004','settlement_method','At subscription: T+2 MBS account debit. At maturity: T+2 USD credit to client account. Quarterly redemption: T+5 (NAV calculation + client notice required).','MANUAL',100.00),
('NPA-2026-004','settlement_flow','Subscription: RM submits order → Compliance approves → Treasury receives funds → note certificate issued. Maturity: Murex triggers maturity payment → Treasury transfers principal + participation to client account. Early redemption: MO calculates NAV → client confirms → 5-day settlement.','MANUAL',100.00),
('NPA-2026-004','confirmation_process','Client receives: note term sheet acknowledgement (signed by RM), trade confirmation (T+2), note certificate (T+3). Quarterly: NAV statement. Annual: holding statement for regulatory reporting.','MANUAL',100.00),
('NPA-2026-004','reconciliation','Daily: option delta hedge reconciliation (Murex vs GFM risk). Monthly: structured note register reconciliation (Summit). Annual: note outstanding vs Treasury liability reconciliation. Quarterly: NAV calculation verified by MO before client communication.','MANUAL',100.00),
('NPA-2026-004','exception_handling','Early redemption exception: client requests outside quarterly window: declined per term sheet (force majeure clause for hardship cases — Head of PB approval). NAV dispute: MO formula NAV is final (documented in term sheet). basket constituent corporate action: GFM desk adjusts basket per term sheet provisions.','MANUAL',100.00),
('NPA-2026-004','accounting_treatment','MBS as issuer: note liability at amortised cost. Zero-coupon bond asset: FVTOCI (held-to-maturity intent). Call option asset: FVTPL (delta-hedged in trading book). Client as holder: note asset at amortised cost (principal protected = debt instrument).','MANUAL',100.00),
('NPA-2026-004','new_system_changes','No — existing Murex (options), Summit (note register), and GMTN program infrastructure used. New: structured note term sheet template (legal, not tech).','MANUAL',100.00),
('NPA-2026-004','tech_requirements','No new technology required. Murex: vanilla call option on custom basket (existing basket option functionality). Summit: GMTN note register already supports this structure. Quarterly NAV: Excel-based MO calculation with tech sign-off.','MANUAL',100.00),
('NPA-2026-004','system_integration','Murex (option hedge) → Summit (note register). Summit → MBS account management system (subscription and redemption settlement). Quarterly NAV: MO Excel → client communication system (automated email). No new integrations required.','MANUAL',100.00),
('NPA-2026-004','valuation_model','Note NAV = Zero-coupon bond present value (SORA + 15bps, 3Y) + Call option fair value (Black-Scholes on basket, Bloomberg implied vols). Client-facing NAV: standard methodology, verified quarterly by MO.','MANUAL',100.00),
('NPA-2026-004','trade_capture_system','Murex MX.3 (call option), Summit (note issuance register)','MANUAL',100.00),
('NPA-2026-004','risk_system','Murex: delta, vega, gamma, theta for call option component. MBS Group risk: note liability included in interest rate risk reporting. Bloomberg: equity vol surface for basket option pricing.','MANUAL',100.00),
('NPA-2026-004','reporting_system','Client: quarterly NAV statement (automated email). PB: monthly structured note AUM report. GFM: weekly option risk report. Group: monthly structured products outstanding liability report.','MANUAL',100.00),
('NPA-2026-004','stp_rate','70% STP for standard subscriptions and maturities. 30% manual: early redemptions, corporate action adjustments, large block subscriptions.','MANUAL',100.00),
('NPA-2026-004','mktdata_requirements','APAC equity prices: Bloomberg BGN (MBS SGX, HSBC HKEx, AIA HKEx, Samsung KRX, TSMC TWX). Equity implied vols: Bloomberg BVOL. SORA rate for zero-coupon bond pricing. All licences included in existing Bloomberg Enterprise agreement.','MANUAL',100.00),
('NPA-2026-004','hsm_required','No','AUTO',100.00),
('NPA-2026-004','security_assessment','No new systems. Existing Murex/Summit ISS controls apply.','MANUAL',100.00),
('NPA-2026-004','pentest_status','Not Required','AUTO',100.00),
('NPA-2026-004','iss_deviations','No ISS deviations.','MANUAL',100.00),
('NPA-2026-004','grc_id','N/A — no new third-party vendors','MANUAL',100.00),
('NPA-2026-004','rto_target','4 hours (trading systems). 24 hours for note administration (non-trading hours functions).','MANUAL',100.00),
('NPA-2026-004','rpo_target','15 minutes (Murex). 24 hours (Summit note register).','MANUAL',100.00),
('NPA-2026-004','dr_testing_plan','Covered by existing GFM BCM plan. Semi-annual DR test. Summit: quarterly backup.','MANUAL',100.00),
('NPA-2026-004','bcp_requirements','GFM BCM covers option trading. Structured note register: Summit database backup. Manual fallback: Excel-based note register for emergency use during system outage. Client-facing: quarterly NAV can be delayed by 2 days before required client notification.','MANUAL',100.00),
('NPA-2026-004','bia_considerations','Tier 2 (Important): Structured products platform. Option trading halt >4h: escalated to GFM head. Note register outage: non-critical (no real-time user access required). Quarterly NAV: 2-day delay tolerance before client impact.','MANUAL',100.00),
('NPA-2026-004','continuity_measures','Murex DR replication. Summit: MBS Disaster Recovery site backup. GFM desk: manual pricing capability for structured note NAV calculation in case of Murex outage.','MANUAL',100.00),
('NPA-2026-004','limit_structure','Structured note notional outstanding limit: USD 5B (Group limit on all CPN issuance). Single client concentration: max USD 50M per client in this series. Equity basket VaR limit: GFM desk manages within existing equity derivative limits.','MANUAL',100.00),
('NPA-2026-004','limit_monitoring','Monthly: structured note outstanding limit monitoring (Treasury). Daily: option delta and vega monitoring (Murex). Quarterly: concentration monitoring per client.','MANUAL',100.00),
('NPA-2026-004','custody_required','No — notes are registered on MBS note register. No physical certificates. No external custody.','MANUAL',100.00),

-- ================================================================
-- PC.III: PRICING MODEL
-- ================================================================
('NPA-2026-004','pricing_model_required','Yes','MANUAL',100.00),
('NPA-2026-004','pricing_methodology','Two-component pricing:\n1. Zero-coupon bond: PV of USD 100% principal at 3Y SORA + 15bps discount = ~86% of notional\n2. Call option: 3Y ATM call on APAC Equity Basket × 80% participation = ~12% of notional\n3. MBS margin: ~2% of notional (includes 1.2% front-end fee + 0.8% embedded spread)\nAll-in cost to MBS: 98% of notional. Client pays 100%. Margin: 2% = 1.2% + 0.8% embedded annual margin.','MANUAL',100.00),
('NPA-2026-004','roae_analysis','Capital efficient: zero-coupon bond held-to-maturity (no RWA if investment grade). Call option: SA-CCR RWA ~$120M per USD 1.5B notional. Margin: $18M gross / $120M RWA = 15% ROAE Year 1. Year 2: higher with repeat issuance reducing launch costs.','MANUAL',100.00),
('NPA-2026-004','pricing_assumptions','3Y SORA forward: 2.8%. Zero-coupon bond PV: 86.2% (2.8% × 3Y). Basket call option: 3Y ATM, basket vol (weighted av. individual vols + correlation discount): ~18% implied vol. Call premium: 12.1% of notional at 80% participation. Model: Black-Scholes with basket option pricing (Gaussian copula for corr).','MANUAL',100.00),
('NPA-2026-004','bespoke_adjustments','UHNW clients (>USD 10M subscription): 90% participation rate (instead of 80%) — approved by Head of Structured Products and Head of Private Banking.','MANUAL',100.00),
('NPA-2026-004','pricing_model_name','MBS Capital Protected Note Pricing Model v2.1 (Murex + Excel MO validation)','MANUAL',100.00),
('NPA-2026-004','model_validation_date','2025-09-15','MANUAL',100.00),
('NPA-2026-004','model_restrictions','Basket option model valid for: max 5 basket constituents, correlation range 0.2-0.8, vol range 10-40%, tenor 1-5Y. Out of range: escalate to Quant team for exotic model review.','MANUAL',100.00),
('NPA-2026-004','simm_treatment','ISDA SIMM Risk Class 3 (Equity). Delta margin: basket equity sensitivities × SIMM equity risk weights (15-40% per underlying). Vega: basket implied vol sensitivity × SIMM equity vega weight. Applied only for ISDA clients (institutional — not PB clients who are non-ISDA).','MANUAL',100.00),

-- ================================================================
-- PC.IV: RISK ANALYSIS
-- ================================================================
('NPA-2026-004','risk_classification','HIGH','AUTO',98.00),
('NPA-2026-004','market_risk','Option hedge risk: delta, vega, gamma, theta on APAC equity basket call. Key risk: vega (vol change). MBS GFM desk delta-hedges daily using MBS/HSBC/AIA/Samsung/TSMC equity trades. Vega: managed within GFM equity derivatives vol limits. Zero-coupon bond: held-to-maturity (no P&L impact unless MBS credit risk, which is internal). Residual risk: basket correlation changes (model risk, see PC.V).','MANUAL',100.00),
('NPA-2026-004','mrf_fx_delta','Yes — basket includes KRX (KRW) and TWX (TWD) stocks. FX conversion to USD: MBS FX desk hedges currency components','AUTO',90.00),
('NPA-2026-004','mrf_credit','No','AUTO',100.00),
('NPA-2026-004','mrf_commodity','No','AUTO',100.00),
('NPA-2026-004','liquidity_risk','Note: quarterly liquidity windows only. No daily liquidity. Clients accept this in term sheet. Option hedge: daily liquidity in equity spot markets. Basket constituents: all top-10 market cap APAC stocks (high liquidity). Risk: if many clients request simultaneous early redemption — mitigated by quarterly window and 5-day settlement.','MANUAL',100.00),
('NPA-2026-004','liquidity_cost','Option hedge: daily transaction costs for delta rebalancing. Estimated: 2-3bps p.a. on notional. Included in the 0.8% embedded annual margin. FTP on zero-coupon bond: SORA + 15bps (internal, included in note pricing).','MANUAL',100.00),
('NPA-2026-004','credit_risk','Client view: MBS credit risk (note is MBS obligation). MBS credit risk internal: managed by MBS balance sheet — not an exposure to record separately. Option counterparty: internal GFM (no external credit risk). MBS credit risk to clients: nil (client pays upfront).','MANUAL',100.00),
('NPA-2026-004','counterparty_rating','MBS Bank Ltd (issuer): AA- (S&P, SG-listed). Clients: uncollateralised (they buy and pay upfront — no credit extension from MBS).','MANUAL',100.00),
('NPA-2026-004','credit_support_required','No — clients pay 100% upfront. MBS has no receivable from clients.','MANUAL',100.00),
('NPA-2026-004','collateral_framework','Not applicable — fully funded structured note. Client subscription received upfront.','MANUAL',100.00),
('NPA-2026-004','custody_risk','N/A — notes are MBS-issued liabilities, not securities held in custody. Client holds a note (MBS liability), not a security in a custodian.','MANUAL',100.00),
('NPA-2026-004','regulatory_capital','Zero-coupon bond: 0% RWA (MBS internal asset). Call option: SA-CCR (equity derivative) ~8% RWA = $12M per USD 150M call exposure. Total RWA: ~$12M per USD 1.5B series. Capital efficiency: 99.2% of notional is zero-coupon (0% RWA) + 0.8% option.','MANUAL',100.00),
('NPA-2026-004','stress_scenarios','Scenario 1: APAC equity basket -40% (worst case 3-year scenario) — option expires worthless, clients receive 100% capital (MBS pays from zero-coupon proceeds). MBS P&L: option purchase cost written off (embedded in pricing). Scenario 2: basket +100% — MBS pays 80% participation ($50M per $500M series). Funded by call option purchase. No surprise to MBS. Scenario 3: SORA spike +300bps — zero-coupon bond mark-to-market loss for MBS (HTM intent, no P&L impact unless forced sale).','MANUAL',100.00),
('NPA-2026-004','stress_test_results','Stress scenarios modelled at option purchase time. MBS in all scenarios: capital obligation fully funded by zero-coupon proceeds at maturity. Participation obligation: fully covered by call option cost (pre-purchased). No unhedged MBS residual risk.','MANUAL',100.00),
('NPA-2026-004','reputational_risk','LOW-MEDIUM — capital protection reputation at stake. Risk: MBS credit event would threaten capital protection (mitigated by MBS AA- rating and SG government link). Client perception risk if basket underperforms (but clients accept no return as part of capital protection). Managed through clear client communication and term sheet.','MANUAL',100.00),
('NPA-2026-004','negative_impact','No','AUTO',100.00),
('NPA-2026-004','esg_assessment','Neutral — APAC equity basket includes companies with mixed ESG ratings. MBS and HSBC have strong ESG commitments. Samsung and TSMC improving. AIA: strong ESG governance. No dedicated green label for this product.','MANUAL',85.00),
('NPA-2026-004','esg_classification','Neutral','AUTO',85.00),
('NPA-2026-004','exposure_limits','Outstanding CPN notional limit: USD 5B (Group Structured Products limit). Single client: USD 50M (PB client limit). Single series notional: USD 500M target. Equity basket VaR: within GFM equity derivatives VaR sub-limit.','MANUAL',100.00),
('NPA-2026-004','monitoring_party','GFM Market Risk: option delta, vega, gamma daily. RMG Credit: MBS credit rating monitoring (triggers review if MBS downgraded below A-). Private Banking MO: client subscription register, quarterly NAV. Group Treasury: zero-coupon bond monitoring.','MANUAL',100.00),
('NPA-2026-004','legal_opinion','Allen & Gledhill: structured note issued under SFA (GMTN Program) is not a collective investment scheme. Opinion confirms capital protected note classification as debt instrument for MAS regulatory purposes. Received 2025-11-20. Baker McKenzie HK: equivalent opinion for HK distribution.','MANUAL',100.00),
('NPA-2026-004','licensing_requirements','MAS: MBS holds CMS licence for structured products distribution. GMTN Programme: existing MAS-registered Programme. No new licences required. HK: SFC Product Authorisation required for HK retail. HK institutional: private placement exemption.','MANUAL',100.00),
('NPA-2026-004','primary_regulation','MAS Securities and Futures Act (SFA). MAS Notice 637. GMTN Programme: MAS-registered. Structured product guidelines: MAS FAA-N01 (advisory guidelines for capital-protected products).','MANUAL',100.00),
('NPA-2026-004','secondary_regulations','MAS FAA-N03 (Financial Advisers Act guidelines on structured products). SFC Circular on Structured Products Distribution (for HK). EU PRIIPs (for any EU institutional clients). PDPA for client data handling.','MANUAL',95.00),
('NPA-2026-004','regulatory_reporting','MAS: structured product reporting under SFA. Private Banking MAS client reporting: quarterly statement showing note position. HK SFC: client portfolio reporting. Internal: monthly structured products AUM report to Group Finance.','MANUAL',100.00),
('NPA-2026-004','cross_border_regulations','HK: SFC distribution rules (private placement exemption for AI). Singapore: MAS FAA-N01 compliance. No US persons (Reg S). EU institutional: PRIIPs KID required. Taiwan: distribution via MBS Taiwan subject to FSC Taiwan structured product rules.','MANUAL',100.00),
('NPA-2026-004','legal_docs_required','• MBS GMTN Programme Prospectus and Supplement (series-specific)\n• Structured Note Term Sheet (individual client)\n• Risk Acknowledgement Form (signed by client and RM)\n• AI Suitability Assessment (on client file)\n• ISDA Master Agreement (for institutional subscriptions)\n• PRIIPs Key Information Document (EU institutions)','MANUAL',100.00),
('NPA-2026-004','sanctions_check','Clear - No Matches','AUTO',100.00),
('NPA-2026-004','aml_considerations','Private Banking: enhanced KYC completed for all HNW/UHNW clients. Source of wealth verified for subscriptions >USD 2M. No new AML requirements specific to capital protected note (MBS standard PB AML procedures apply).','MANUAL',100.00),
('NPA-2026-004','tax_impact','Client: note proceeds at maturity — capital gain vs income: tax treatment depends on jurisdiction (SG: no capital gains tax, HK: no capital gains tax, TW/ID: consult local tax adviser). MBS: management fee income — Singapore 17% corporate tax. Interest deduction: not applicable (no actual interest payments).','ADAPTED',88.00),
('NPA-2026-004','accounting_book','Banking Book (structured note liability, zero-coupon bond asset). Trading Book (call option hedge).','AUTO',90.00),
('NPA-2026-004','fair_value_treatment','Note liability: MBS balance sheet at amortised cost (debt issuance). Zero-coupon bond: FVTOCI (HTM intent). Call option: FVTPL (trading book). Client holding: amortised cost (capital protected note — no expected credit loss above MBS default probability).','MANUAL',100.00),
('NPA-2026-004','on_off_balance','On-balance sheet: note liability (MBS), zero-coupon bond asset (MBS). Off-balance sheet: call option (derivative, disclosed at fair value in SFP notes).','AUTO',90.00),
('NPA-2026-004','tax_jurisdictions','Singapore: MBS fee income — 17% corporate tax. Withholding tax: no WHT on note proceeds (Singapore-domiciled MBS Bank). HK: distribution income — 16.5% HK profits tax. No other jurisdictions for primary MBS booking.','MANUAL',100.00),
('NPA-2026-004','model_risk','Basket option model: Black-Scholes with Gaussian copula for correlation. Model risk: correlation assumptions (~0.5 for APAC basket). Risk: correlation breakdown in stress (MBS, HSBC, AIA may co-move more than modelled in financial crisis). Mitigant: conservative correlation assumption (0.4 vs observed 0.55). Quarterly model review vs realised correlation.','MANUAL',90.00),
('NPA-2026-004','country_risk','Singapore (MBS, HSBC SG-listed): Tier 1. HK (HSBC, AIA): Tier 1, minor HK political risk. Korea (Samsung KRX): Tier 2 (DPRK geopolitical risk). Taiwan (TSMC): Tier 2 (cross-strait risk). Country risk premium: embedded in equity vol assumptions for Samsung and TSMC. Max KRX + TWX weight: 25%, within MBS country risk limits.','MANUAL',90.00),

-- ================================================================
-- PC.V: DATA MANAGEMENT
-- ================================================================
('NPA-2026-004','data_governance','Structured note client data: CONFIDENTIAL. Data owner: Head of Private Banking. Data steward: PB Operations Manager. Summit register: authoritative source for all note holdings.','MANUAL',100.00),
('NPA-2026-004','data_ownership','MBS Bank Ltd owns all client and trade data. Summit register: MBS proprietary system. Bloomberg market data: licensed use.','MANUAL',100.00),
('NPA-2026-004','data_stewardship','PB Operations Manager (client subscriptions, note register). GFM Risk (option pricing data). MBS AM (quarterly NAV data).','MANUAL',100.00),
('NPA-2026-004','data_quality_monitoring','Daily: Murex option mark vs Bloomberg BVOL (tolerance: 2 vol points). Monthly: Summit note register completeness audit. Quarterly: NAV calculation double-check by independent MO.','MANUAL',100.00),
('NPA-2026-004','data_privacy','Private Banking client data: PDPA Tier 3 (Sensitive — financial data). Client subscription amount classified as CONFIDENTIAL. PDPA consent obtained at PB onboarding. Data shared only with BCA (beneficial ownership registry as required by MAS).','MANUAL',100.00),
('NPA-2026-004','data_retention','Note subscription records: 7 years (MAS SFA). Client KYC: 5 years post-relationship. NAV calculation records: 7 years. All records archived to MBS cold storage after 3 years.','MANUAL',100.00),
('NPA-2026-004','gdpr_compliance','Not applicable. No EU retail investors. EU institutional clients: GDPR B2B exemption.','MANUAL',100.00),
('NPA-2026-004','pure_assessment_id','N/A — Private Banking structured note. No PURE assessment required (AI institutional investor product — no consumer data analytics).','MANUAL',100.00),
('NPA-2026-004','reporting_requirements','Regulatory: MAS structured product reporting (SFA). Client: quarterly NAV, annual holding statement. Internal: monthly structured products AUM and P&L report. PB: daily note subscription status report.','MANUAL',100.00),
('NPA-2026-004','automated_reporting','Automated: quarterly NAV email to clients, Summit note register daily update, Murex daily P&L flash. Manual: MAS SFA structured product returns (compliance files annually), PRIIPs KID preparation per series.','MANUAL',100.00),
('NPA-2026-004','data_lineage','Client subscription → Summit note register → MBS Treasury → Maturity payment. Option hedge: GFM Murex → daily P&L. NAV: Murex option fair value + SORA discounted principal → NAV calculation sheet → client statement.','MANUAL',100.00),
('NPA-2026-004','data_classification','Client holding data: CONFIDENTIAL. Option pricing: TRADING (internal GFM, not shared). NAV: CONFIDENTIAL (shared with client only).','MANUAL',100.00),

-- ================================================================
-- PC.VI: OTHER RISK IDENTIFICATION
-- ================================================================
('NPA-2026-004','other_risks_exist','No','AUTO',100.00),
('NPA-2026-004','operational_risk','LOW — structured note is well-understood product type. Key operational risks: (1) Option booking error (wrong basket weights): maker-checker control in Murex. (2) Corporate action on basket equities: GFM desk manages per term sheet provisions. (3) NAV calculation error: independent MO verification before client communication.','MANUAL',100.00),

-- ================================================================
-- PC.VII: TRADING PRODUCT ASSESSMENT
-- ================================================================
('NPA-2026-004','trading_product','No','AUTO',99.00),
('NPA-2026-004','appendix5_required','No','AUTO',99.00),

-- ================================================================
-- APP.1: ENTITY / LOCATION
-- ================================================================
('NPA-2026-004','booking_entity','MBS Bank Ltd, Singapore (GMTN programme issuer)','MANUAL',100.00),
('NPA-2026-004','sales_entity','MBS Bank Ltd, Singapore (Private Banking). MBS Bank (Hong Kong) Ltd for HK-domiciled clients.','MANUAL',100.00),
('NPA-2026-004','booking_location','Singapore','MANUAL',100.00),
('NPA-2026-004','sales_location','Singapore, Hong Kong, Taiwan, Indonesia (APAC Private Banking)','MANUAL',100.00),
('NPA-2026-004','risk_taking_entity','MBS Bank Ltd Singapore (GFM Structured Products desk)','MANUAL',100.00),
('NPA-2026-004','risk_taking_location','Singapore','MANUAL',100.00),
('NPA-2026-004','processing_entity','MBS Bank Ltd Singapore (Private Banking Operations, GFM Operations)','MANUAL',100.00),
('NPA-2026-004','processing_location','Singapore','MANUAL',100.00),
('NPA-2026-004','counterparty','Accredited Investor clients of MBS Private Banking (HNW, UHNW). Internal GFM Structured Products desk (option hedge counterparty).','MANUAL',100.00),
('NPA-2026-004','hedge_entity','MBS Bank Ltd Singapore (GFM Equity Derivatives desk — manages basket call option and delta hedge)','MANUAL',100.00),

-- ================================================================
-- APP.2: INTELLECTUAL PROPERTY
-- ================================================================
('NPA-2026-004','mbs_ip_exists','Yes — MBS Capital Protected Note Series branded product, MBS APAC Equity Basket (proprietary weighting methodology)','MANUAL',100.00),
('NPA-2026-004','mbs_ip_details','MBS APAC Equity Basket: MBS proprietary weighting methodology (40/20/15/15/10). MBS Capital Protected Note brand. Note term sheet template (MBS Legal).','MANUAL',100.00),
('NPA-2026-004','third_party_ip_exists','No — all basket constituents are publicly traded securities, no licensed index required','MANUAL',100.00),
('NPA-2026-004','ip_licensing','Bloomberg equity data: licensed under existing Bloomberg Enterprise agreement (no incremental cost). No additional IP licensing required.','MANUAL',100.00),

-- ================================================================
-- APP.3: FINANCIAL CRIME
-- ================================================================
('NPA-2026-004','aml_assessment','LOW RISK — Private Banking institutional product with enhanced KYC. All subscribers are AI-certified with source of wealth verified. No anonymous note subscriptions. Note subscriptions via MBS bank accounts only (no cash or third-party wire).','MANUAL',100.00),
('NPA-2026-004','terrorism_financing','LOW — note subscriptions require MBS bank account (full KYC on file). No anonymous note purchases. TF risk: minimal for capital protected note targeting HNW investors.','MANUAL',100.00),
('NPA-2026-004','sanctions_assessment','All subscribers screened at onboarding and periodic refresh. Note transfer: not permitted (no secondary market for listed notes). MBS basket constituents: MBS, HSBC, AIA, Samsung, TSMC — all screened, no sanctions exposure.','MANUAL',100.00),
('NPA-2026-004','fraud_risk','LOW — note is a MBS balance sheet obligation. Subscription via established PB client account. Key risks: (1) RM mis-selling: mitigated by suitability check and compliance oversight. (2) Fictitious subscriptions: mitigated by dual approval and back-office confirmation.','MANUAL',100.00),
('NPA-2026-004','bribery_corruption','LOW — Private Banking clients; arm''s length relationship. Anti-bribery policy applies to all RM relationships. Gift/entertainment limit: $150 per client per year under MBS policy.','MANUAL',100.00),
('NPA-2026-004','fc_risk_rating','LOW','MANUAL',100.00),
('NPA-2026-004','fc_mitigation_measures','• All subscriptions from pre-KYC''d MBS bank accounts\n• AI suitability assessment for every client subscription\n• RM dual-control approval for large subscriptions\n• Monthly note subscription AML review by compliance\n• Annual AML testing of structured products distribution by Internal Audit','MANUAL',100.00),

-- ================================================================
-- APP.4: RISK DATA AGGREGATION
-- ================================================================
('NPA-2026-004','rda_compliance','Structured note outstanding: included in MBS Group balance sheet RDA reporting. Option position: in GFM trading book risk aggregation. BCBS 239 compliant — existing infrastructure covers structured note and option data.','MANUAL',95.00),
('NPA-2026-004','rda_data_sources','Summit note register (note liability), Murex (option delta and fair value), Bloomberg BVOL (equity vol surface for option pricing), SORA (zero-coupon bond discounting)','MANUAL',100.00),
('NPA-2026-004','rda_aggregation_method','Daily: Murex option risk → GFM risk report. Monthly: Summit note outstanding → Group balance sheet report. Quarterly: structured products AUM report to Group Finance.','MANUAL',100.00),
('NPA-2026-004','rda_data_quality','Summit note register: 100% accuracy target (reconciled monthly). Murex option mark: verified vs Bloomberg BVOL daily (tolerance: 2 vol points). SORA: MAS published rate — 100% accuracy.','MANUAL',100.00),

-- ================================================================
-- APP.6: THIRD-PARTY PLATFORMS
-- ================================================================
('NPA-2026-004','third_party_platform','No','AUTO',100.00);

SET FOREIGN_KEY_CHECKS=1;
