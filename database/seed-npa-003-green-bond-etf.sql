-- ============================================================
-- SEED: NPA-2026-003 Global Green Bond ESG ETF
-- Complete NPA Draft — All Sections PC.I through APP.6
-- New-to-Group, Full NPA, HIGH risk, cross-border SG+HK+LX
-- ============================================================
SET FOREIGN_KEY_CHECKS=0;

DELETE FROM `npa_form_data` WHERE `project_id` = 'NPA-2026-003';

INSERT IGNORE INTO `npa_form_data` (`project_id`, `field_key`, `field_value`, `lineage`, `confidence_score`) VALUES

-- ================================================================
-- PC.I: PRODUCT SPECIFICATIONS
-- ================================================================
('NPA-2026-003','product_name','Global Green Bond ESG ETF — MBS iShares Climate Conscious Fund','MANUAL',100.00),
('NPA-2026-003','problem_statement','Institutional and HNW clients increasing allocation to ESG-aligned fixed income. MBS has no proprietary ESG ETF product, forcing clients to invest in competitors'' funds (Franklin, Amundi, iShares). No MBS-branded vehicle exists for capturing ESG bond allocation mandates from APAC sovereign wealth funds, pension funds, and family offices.','MANUAL',100.00),
('NPA-2026-003','value_proposition','MBS co-branded ESG bond ETF tracking Bloomberg MSCI Global Green Bond Index, listed on SGX and HKEx. First MBS-branded fixed income ESG ETF. Captures ESG mandate flows from APAC institutional investors. Management fee: 25bps p.a. Target AUM: $500M Year 1, $2B by Year 3.','MANUAL',100.00),
('NPA-2026-003','customer_benefit','(1) Access to diversified global green bond portfolio via single instrument, (2) MBS brand trust and relationship coverage, (3) Listed on SGX and HKEx — easy trading and liquidity, (4) Bloomberg MSCI index methodology — institutional-grade ESG credibility, (5) 25bps management fee competitive vs 30-50bps for comparable active ESG funds.','MANUAL',100.00),
('NPA-2026-003','bu_benefit','Asset Management: $5.2M p.a. management fee on $500M AUM Year 1, scaling to $20M+ by Year 3. Institutional Banking: strengthens MBS ESG franchise and client acquisition. Private Banking: flagship ESG product for HNW ESG-mandate portfolios. Group ESG KPI: MBS ESG AUM target contribution.','MANUAL',100.00),
('NPA-2026-003','product_type','Fund Products','AUTO',99.00),
('NPA-2026-003','underlying_asset','Bloomberg MSCI Global Green Bond Index. Constituents: 500+ investment-grade green bonds from G20 sovereigns and supranationals, corporate issuers with verified green use-of-proceeds. Minimum credit quality: BBB-. All bonds must meet ICMA Green Bond Principles.','MANUAL',100.00),
('NPA-2026-003','currency_denomination','USD (fund base currency). SGX-listed units: USD. HKEx-listed units: HKD (currency hedged share class available).','MANUAL',100.00),
('NPA-2026-003','notional_amount','500000000.00','MANUAL',100.00),
('NPA-2026-003','tenor','Open-ended ETF. No maturity date. Quoted and traded on SGX/HKEx during market hours T+2 settlement.','MANUAL',100.00),
('NPA-2026-003','funding_type','Funded','AUTO',99.00),
('NPA-2026-003','product_role','Fund Manager (MBS Asset Management) and Distributor (MBS Bank Ltd)','MANUAL',100.00),
('NPA-2026-003','product_maturity','Ongoing — evergreen ETF structure','MANUAL',100.00),
('NPA-2026-003','product_lifecycle','New fund launch → SGX/HKEx listing (Q3 2026) → seed investor subscriptions → post-listing market making → annual PIR. Target launch: Q3 2026.','MANUAL',100.00),
('NPA-2026-003','product_features','• Passive: tracks Bloomberg MSCI Global Green Bond Index\n• Physical replication (full/optimised) — no synthetic/swap overlay\n• ESG screening: ICMA Green Bond Principles compliance, MSCI ESG rating ≥ BBB\n• Currency hedge: HKD share class with monthly FX hedge reset\n• Authorised Participants: MBS Vickers, Citibank, Société Générale\n• Creation/redemption: in-kind with cash component option\n• Expense ratio: 0.25% p.a. (15th percentile of ESG bond ETF universe)','MANUAL',100.00),
('NPA-2026-003','revenue_year1','5200000.00','MANUAL',100.00),
('NPA-2026-003','revenue_year1_net','3640000.00','MANUAL',100.00),
('NPA-2026-003','revenue_year2','12480000.00','MANUAL',100.00),
('NPA-2026-003','revenue_year2_net','8736000.00','MANUAL',100.00),
('NPA-2026-003','revenue_year3','20800000.00','MANUAL',100.00),
('NPA-2026-003','revenue_year3_net','14560000.00','MANUAL',100.00),
('NPA-2026-003','expected_volume','Year 1: $500M AUM (25 institutional seed investors × $20M avg). Year 2: $1.2B (secondary market inflows + new mandates). Year 3: $2B target. Distribution: 40% institutional, 30% HNW via MBS Private Banking, 30% retail via MBS iWealth.','MANUAL',100.00),
('NPA-2026-003','target_roi','ROAE: 18% by Year 2 (primarily fee income, low capital requirement). Management fee EBITDA margin: 70% (net of fund expenses). Capital charge: RSF for fund investment (100% RSF on MBS seed investment of $50M).','MANUAL',100.00),
('NPA-2026-003','revenue_streams','• Management fee: 25bps on net AUM p.a.\n• Distribution fee: 10bps (MBS Bank as distributor)\n• Securities lending: up to 5bps on lent-out holdings\n• FX conversion fee: 15bps for HKD/USD unit conversions','MANUAL',100.00),
('NPA-2026-003','gross_margin_split','MBS Asset Management: 60% (management fee), MBS Bank Distribution: 25% (distribution fee), Group ESG: 15% (strategic cost allocation)','MANUAL',100.00),
('NPA-2026-003','cost_allocation','Fund launch cost: $2.8M one-time (SGX/HKEx listing, legal, index licence, audit). Ongoing: $1.3M/year (index licence $800K, fund admin $300K, audit $150K, regulatory $50K). MBS seed investment: $50M (recovered through market unit purchases over 6 months).','MANUAL',100.00),
('NPA-2026-003','spv_involved','No — MBS Global Climate Fund I (Cayman LP structure). Not an SPV in the financing sense — standard Cayman unit trust for ETF listing.','MANUAL',100.00),
('NPA-2026-003','customer_segments','(1) Institutional: APAC pension funds, sovereign wealth funds, insurance companies with ESG mandates, (2) Private Banking: HNW and UHNW clients with ESG portfolio allocations, (3) Retail: MBS iWealth app investors seeking ESG fixed income exposure','MANUAL',100.00),
('NPA-2026-003','customer_restrictions','No restrictions on investor type. Retail tranche: MAS-registered ETF under SFA. Institutional tranche: exempt from prospectus for AI institutional investors. US persons: excluded (Regulation S offering).','MANUAL',100.00),
('NPA-2026-003','customer_suitability','Retail: MAS product suitability framework (complex products checklist). Private Banking: AI suitability assessment. Institutional: professional investor self-certification. All clients: ESG investment risk disclosure.','MANUAL',100.00),
('NPA-2026-003','customer_geographic','Singapore (primary), Hong Kong, Taiwan, ASEAN institutional. US persons excluded. EU: PRIIPs KID required for European institutional investors.','MANUAL',100.00),
('NPA-2026-003','distribution_channels','(1) SGX/HKEx secondary market (brokerage), (2) MBS iWealth digital (retail), (3) MBS Private Banking RM channel (HNW), (4) Institutional Sales direct (SWFs, pensions), (5) Third-party platforms: FundSuperMart, POEMS (future)','MANUAL',100.00),
('NPA-2026-003','sales_suitability','Retail: MAS complex product assessment, ESG risk disclosure. Private Banking: AI suitability on file. Institutional: no suitability requirement (professional investor). All: fund prospectus and PHS (Product Highlights Sheet) provided.','MANUAL',100.00),
('NPA-2026-003','onboarding_process','Seed investors: direct subscription via MBS AM. Post-listing: exchange purchase through broker. Authorised Participants (MBS Vickers, Citi, SocGen): creation/redemption unit via AP agreement.','MANUAL',100.00),
('NPA-2026-003','marketing_plan','Pre-launch: investor roadshow (SWF, pension fund targeting — Singapore, HK, Taiwan). Launch: press release + SGX bell ceremony. Ongoing: monthly ESG newsletter, quarterly fund factsheet, annual sustainability report. MBS green brand integration.','MANUAL',100.00),
('NPA-2026-003','pac_reference','PAC-2025-ESG-102','MANUAL',100.00),
('NPA-2026-003','pac_date','2025-12-01','MANUAL',100.00),
('NPA-2026-003','external_parties_involved','Yes','AUTO',99.00),
('NPA-2026-003','external_party_names','Bloomberg Index Services (index licence), MSCI (ESG data and screening), BNP Paribas Securities Services (fund administrator and custodian), Deloitte Singapore (fund auditor), Latham & Watkins (Singapore fund legal counsel), Baker McKenzie HK (HKEx listing counsel), SGX (listing sponsor), HKEX (listing admission)','MANUAL',100.00),
('NPA-2026-003','esg_data_used','Yes — MSCI ESG Ratings and Bloomberg MSCI Green Bond Index','AUTO',100.00),
('NPA-2026-003','competitive_landscape','Competing ESG bond ETFs in APAC: iShares USD Green Bond ETF (BlackRock), Amundi Global Green Bond ETF, Franklin ESG Bond Fund. MBS advantage: (1) SGX-listed with SGD/HKD access, (2) MBS institutional relationship reach, (3) Competitive 25bps fee vs 30-50bps for active ESG funds. Market growing 40% annually.','ADAPTED',85.00),
('NPA-2026-003','market_opportunity','APAC ESG bond market: $150B AUM and growing 40% p.a. Green bond issuance: $500B+ globally in 2025. APAC institutional ESG mandate AUM: $3T+ with 5-15% fixed income allocation. MBS target: 1% APAC ESG bond ETF market = $1.5B AUM by Year 3.','ADAPTED',82.00),
('NPA-2026-003','break_even_timeline','Month 14: $250M AUM generates $625K/month management fee, covering $550K/month total fund expenses. Profitable at $250M AUM.','MANUAL',100.00),
('NPA-2026-003','kyc_requirements','Retail: standard Singapore KYC (MAS AML guidelines). Institutional: institutional KYC with beneficial ownership verification. US person exclusion check. Cayman fund: no Cayman KYC obligations passed to investors (fund-level).','MANUAL',100.00),
('NPA-2026-003','customer_accreditation','Retail: none required (exchange-traded). Private Banking AI: on file. Institutional: professional investor self-certification. All: prospectus and PHS acknowledgement.','MANUAL',100.00),
('NPA-2026-003','staff_training','MBS AM portfolio managers: Bloomberg MSCI Green Bond Index methodology (4 hours). MBS Vickers AP operations: ETF creation/redemption procedures (3 hours). Private Banking RMs: ESG ETF product certification (2 hours). Mandatory before launch.','MANUAL',100.00),
('NPA-2026-003','customer_objectives','Institutional: ESG mandate fulfillment, risk-adjusted returns on green bond allocation, liquidity via exchange listing. Private Banking: ESG portfolio thematic exposure, lower cost than active ESG funds. Retail: simple ETF access to green bond market.','MANUAL',100.00),
('NPA-2026-003','customer_key_risks','(1) Interest rate risk: bond duration ~7 years, sensitive to rate movements, (2) Credit risk: BBB- floor but spread widening possible, (3) ESG greenwashing risk: index methodology changes could exclude constituents, (4) Liquidity risk: SGX/HKEx bid-ask spread in thin market, (5) Currency risk: HKD class has hedge basis risk','MANUAL',100.00),
('NPA-2026-003','transfer_pricing','MBS AM (fund management) pays distribution fee to MBS Bank: 10bps on net MBS-distributed AUM. Internal FTP on MBS seed investment: SORA + 50bps on $50M seed (= $250K p.a.) charged to fund launch P&L.','MANUAL',100.00),

-- ================================================================
-- PC.II: OPERATIONAL & TECHNOLOGY
-- ================================================================
('NPA-2026-003','front_office_model','MBS Asset Management: 2 portfolio managers (bond ETF specialists), 1 ESG analyst. Portfolio management: Bloomberg MSCI index daily rebalancing, ETF creation/redemption management, AP relationship management. MBS Bank Institutional Sales: distribution to SWFs and pension funds.','MANUAL',100.00),
('NPA-2026-003','middle_office_model','MBS AM Middle Office: fund NAV calculation (daily), portfolio reconciliation with BNP fund administrator, securities lending oversight, hedging P&L for HKD share class. Independent NAV verification vs BNP Paribas fund admin.','MANUAL',100.00),
('NPA-2026-003','back_office_model','BNP Paribas Securities Services (outsourced): fund administration, custody, transfer agency, securities settlement via Euroclear/Clearstream/CDPC. MBS Back Office: creation/redemption basket delivery, FX hedging settlements.','MANUAL',100.00),
('NPA-2026-003','third_party_ops','BNP Paribas Securities Services (fund admin + custodian), Bloomberg (index calculation), MSCI (ESG screening data), Deloitte (audit), Latham & Watkins (legal), SGX (listing), BNP Paribas AP: Clearstream settlement for European bond components','MANUAL',100.00),
('NPA-2026-003','booking_system','Summit (fund administration) for MBS internal fund records. BNP Paribas fund admin platform (InfraLink) as primary fund accounting system. Murex for FX hedge (HKD share class). Bloomberg AIM for portfolio management and order routing.','MANUAL',100.00),
('NPA-2026-003','booking_legal_form','Cayman unit trust — MBS Global Climate Fund I. Trust deed under Cayman law. SGX listing via Singapore unit trust registration. HKEx listing via SFC Type IV authorization.','MANUAL',100.00),
('NPA-2026-003','booking_family','Fund Products','MANUAL',100.00),
('NPA-2026-003','booking_typology','ETF — Passive Bond, ESG-labelled','MANUAL',100.00),
('NPA-2026-003','portfolio_allocation','Separate fund legal structure. Not on MBS balance sheet (except seed investment of $50M tagged to MBS AM equity investment portfolio).','MANUAL',100.00),
('NPA-2026-003','settlement_method','T+2 standard exchange settlement (SGX DvP, HKEx CCASS). In-kind creation/redemption with cash equitisation component. Fund NAV calculated daily by BNP Paribas.','MANUAL',100.00),
('NPA-2026-003','settlement_flow','AP creation: AP delivers eligible bonds + cash → BNP receives → issues ETF units to AP → AP sells on exchange. AP redemption: AP delivers ETF units → BNP validates → delivers bonds + cash to AP. Target: T+2 for standard creations.','MANUAL',100.00),
('NPA-2026-003','confirmation_process','Bloomberg AIM: order management + confirmation. BNP fund admin: creation/redemption instruction confirmation. SGX/HKEx: daily ETF unit price and transaction reporting. AP agreement: daily reconciliation between AP and fund administrator.','MANUAL',100.00),
('NPA-2026-003','reconciliation','Daily: MBS AM portfolio vs BNP fund admin holdings. Weekly: Euroclear/Clearstream position reconciliation for European bond components. Monthly: index constituents vs fund holdings (tracking error report). Quarterly: ESG screening re-verification for index constituents.','MANUAL',100.00),
('NPA-2026-003','exception_handling','NAV break (MBS AM vs BNP >0.5 bps): same-day investigation. Settlement fail: BNP standard fail management (buy-in after T+5). Creation/redemption dispute: AP Agreement dispute resolution process (refer to SGX arbitration). ESG screening exception: MSCI review triggers NPA material change assessment.','MANUAL',100.00),
('NPA-2026-003','accounting_treatment','Fund: IFRS-based NAV accounting. MBS seed investment: FVTOCI (Fair Value Through Other Comprehensive Income) — equity investment in Cayman unit trust. MBS management fee income: recognised monthly in arrears. Distribution fee: recognised quarterly.','MANUAL',100.00),
('NPA-2026-003','new_system_changes','Yes — new Bloomberg AIM module for ESG ETF portfolio management. BNP Paribas InfraLink onboarding (new fund admin relationship). No Murex changes for the fund itself; HKD hedge managed in existing Murex FX book.','MANUAL',100.00),
('NPA-2026-003','tech_requirements','(1) Bloomberg AIM: ESG ETF portfolio management module ($180K/year licence), (2) BNP Paribas InfraLink fund admin access (included in admin fee), (3) MSCI ESG data API integration ($280K/year — existing licence expansion), (4) iNAV calculation feed to SGX/HKEx (new build, estimated 8 weeks), (5) Bloomberg MSCI Index API for daily rebalancing signals','MANUAL',100.00),
('NPA-2026-003','system_integration','Bloomberg AIM → BNP InfraLink (daily portfolio data), MSCI API → MBS ESG screening tool (quarterly), Bloomberg Index API → MBS AM rebalancing system (daily), BNP InfraLink → SGX/HKEx (iNAV feed), Murex → HKD hedge positions (daily)','MANUAL',100.00),
('NPA-2026-003','valuation_model','Daily NAV: BNP Paribas pricing (primary) using Bloomberg BVAL for bond prices + accrued interest. MBS AM shadow NAV for verification (tolerance: 0.01%). iNAV (indicative NAV): published every 15 seconds during trading hours using real-time Bloomberg bond prices.','MANUAL',100.00),
('NPA-2026-003','trade_capture_system','Bloomberg AIM (portfolio management), BNP InfraLink (fund accounting)','MANUAL',100.00),
('NPA-2026-003','risk_system','Bloomberg PORT (portfolio risk analytics), MSCI RiskMetrics (ESG and credit factor risk), MBS AM internal risk dashboard. Weekly risk report to MBS AM CIO.','MANUAL',100.00),
('NPA-2026-003','reporting_system','Fund factsheet: monthly (Morningstar, Bloomberg, MBS website). Regulatory: MAS annual fund report, SFC HK annual report. ESG: Annual Sustainability Report (ICMA Green Bond Principles aligned). Client: daily NAV, quarterly fund report.','MANUAL',100.00),
('NPA-2026-003','stp_rate','95% STP for standard creations/redemptions. 5% manual: in-kind basket with illiquid bonds requiring substitution, large block redemptions >$50M.','MANUAL',100.00),
('NPA-2026-003','mktdata_requirements','Bloomberg BVAL (bond prices — daily), Bloomberg MSCI Green Bond Index (daily constituent list and weightings), MSCI ESG data (quarterly screening), Real-time bond price feeds for iNAV calculation. All under existing Bloomberg Enterprise licence expansion.','MANUAL',100.00),
('NPA-2026-003','hsm_required','No','AUTO',100.00),
('NPA-2026-003','security_assessment','BNP Paribas fund admin: ISO 27001 certified. Bloomberg AIM: SOC 2 Type II. MBS AM internal systems: standard MBS ISS controls. No new ISS concerns.','MANUAL',100.00),
('NPA-2026-003','pentest_status','Not Required','AUTO',100.00),
('NPA-2026-003','iss_deviations','No ISS deviations. Fund admin outsourced to BNP Paribas under MBS TPRM framework (Tier 2 vendor assessment completed).','MANUAL',100.00),
('NPA-2026-003','grc_id','BNP-2026-001 (BNP Paribas Securities Services), MSCI-2025-089 (MSCI ESG data)','MANUAL',100.00),
('NPA-2026-003','rto_target','24 hours for fund admin (non-critical — daily NAV cycle). iNAV system: 4 hours (exchange trading continuity).','MANUAL',100.00),
('NPA-2026-003','rpo_target','24 hours for fund accounting (BNP Paribas DR). Real-time replication for iNAV feed (Bloomberg distribution infrastructure).','MANUAL',100.00),
('NPA-2026-003','dr_testing_plan','BNP Paribas: annual fund admin DR test (last test: PASS Q4 2025). Bloomberg: 99.99% availability SLA. MBS AM: annual BCM test aligned with GFM DR schedule.','MANUAL',100.00),
('NPA-2026-003','bcp_requirements','BNP Paribas BCP: fund admin operations covered. MBS AM BCP: manual NAV calculation fallback using pre-agreed Bloomberg price download. SGX trading: automatic market-making from APs maintains liquidity.','MANUAL',100.00),
('NPA-2026-003','bia_considerations','Tier 3 (Standard): ETF fund operations. NAV delay >24h: client notification required under Cayman trust deed. Trading halt: SGX/HKEx market rules govern suspension.','MANUAL',100.00),
('NPA-2026-003','continuity_measures','BNP Paribas multi-site custody, Bloomberg DR data centres (US + EU). MBS AM: manual portfolio management fallback. SGX: market-making obligation from 3 authorised APs ensures liquidity.','MANUAL',100.00),
('NPA-2026-003','limit_structure','Tracking error limit: <30bps annually (vs Bloomberg MSCI index). Single issuer limit: 5% maximum (index-driven). Sector concentration: <30% in any single green bond sector. ESG floor: minimum MSCI BBB rating for all holdings.','MANUAL',100.00),
('NPA-2026-003','limit_monitoring','Daily: Bloomberg PORT tracking error monitoring. Weekly: sector and issuer concentration report. Quarterly: ESG score monitoring for all holdings. Annual: full index rebalancing review.','MANUAL',100.00),
('NPA-2026-003','custody_required','Yes — BNP Paribas Securities Services as fund custodian','MANUAL',100.00),
('NPA-2026-003','custody_details','BNP Paribas: segregated fund custodial account. Sub-custodians: Euroclear (European bonds), DTC (US bonds), CCDC (China green bonds via Bond Connect). All holdings under trust deed — bankruptcy remote from MBS balance sheet.','MANUAL',100.00),

-- ================================================================
-- PC.III: PRICING MODEL
-- ================================================================
('NPA-2026-003','pricing_model_required','No — ETF NAV is a calculation, not a pricing model requiring validation. Bloomberg BVAL provides independent bond prices.','MANUAL',100.00),
('NPA-2026-003','pricing_methodology','NAV = Sum of (Bloomberg BVAL bond prices × holdings) + accrued interest + cash − accrued liabilities. Calculated daily by BNP Paribas. MBS AM verifies independently. iNAV: real-time proxy using Bloomberg 15-second price updates.','MANUAL',100.00),
('NPA-2026-003','roae_analysis','Year 1: ROAE 8% (ramp-up, MBS seed investment earning 25bps). Year 2: 18% ($1.2B AUM, management fees $3M/quarter). Year 3: 24% ($2B AUM, full fee run-rate $5M/quarter). Capital: MBS seed investment RSF + MBS AM operational capital. No RWA for off-balance-sheet fund.','MANUAL',100.00),
('NPA-2026-003','pricing_assumptions','25bps management fee on AUM. Fund expenses: 7bps (admin, audit, legal = $1.3M/year at $500M AUM). Net TER: 25bps − 7bps = 18bps fund cost. MBS revenue: 15bps net (after distribution fee to MBS Bank = 10bps).','MANUAL',100.00),
('NPA-2026-003','bespoke_adjustments','Institutional seed investors (>$50M): distribution fee waivers for first 12 months. Side letter agreements for SWF seed investors approved by MBS AM CEO.','MANUAL',100.00),
('NPA-2026-003','pricing_model_name','Bloomberg MSCI Green Bond Index NAV Methodology','MANUAL',100.00),
('NPA-2026-003','model_validation_date','2025-10-01','MANUAL',100.00),
('NPA-2026-003','model_restrictions','NAV calculation uses closing prices. Stale price policy: bonds not traded for 5+ days flagged for manual repricing. Illiquid constituents (<$10M daily volume): matrix pricing via Bloomberg BVAL fair value model.','MANUAL',100.00),
('NPA-2026-003','simm_treatment','N/A — fund product. No SIMM calculation. HKD hedge class uses FX forwards (existing SIMM FX treatment in MBS FX book).','AUTO',95.00),

-- ================================================================
-- PC.IV: RISK ANALYSIS
-- ================================================================
('NPA-2026-003','risk_classification','HIGH','AUTO',98.00),
('NPA-2026-003','market_risk','Interest rate risk: fund duration ~7 years. MBS balance sheet exposure: $50M seed investment. IR01: $35K per 1bps rate shift on seed investment. MBS manages seed investment duration within existing Treasury limits. Fund unit holders bear full market risk — MBS not exposed beyond seed investment.','MANUAL',100.00),
('NPA-2026-003','mrf_ir_delta','Yes','AUTO',90.00),
('NPA-2026-003','mrf_fx_delta','Yes','AUTO',90.00),
('NPA-2026-003','mrf_commodity','No','AUTO',100.00),
('NPA-2026-003','mrf_credit','Yes','AUTO',95.00),
('NPA-2026-003','liquidity_risk','Exchange-traded: primary liquidity from SGX/HKEx secondary market (bid-ask spread ~2-5bps in normal conditions). AP redemption: in-kind basket receivable within T+5. Stress: if primary market liquidity fails, in-kind mechanism provides backstop. Reserve: MBS seed investment provides liquidity buffer for early redemptions.','MANUAL',100.00),
('NPA-2026-003','liquidity_cost','MBS seed investment FTP: SORA + 50bps = ~$250K/year. Included in fund launch P&L and recoverable via MBS AM AUM growth.','MANUAL',100.00),
('NPA-2026-003','credit_risk','Fund credit risk: borne by unit holders. MBS exposed only on $50M seed investment (BBB- minimum quality per index rules). MBS credit risk from AP transactions: T+2 settlement with approved APs (MBS Vickers, Citi, SocGen — all investment grade). Maximum AP exposure: $10M uncollateralised within settlement window.','MANUAL',100.00),
('NPA-2026-003','counterparty_rating','BNP Paribas Securities Services: A+ (S&P). Authorised Participants: MBS Vickers (internal), Citibank A (S&P), Société Générale BBB+ (S&P). All within MBS approved counterparty framework.','MANUAL',100.00),
('NPA-2026-003','credit_support_required','No — AP settlement is T+2 DvP (delivery vs payment) — no credit extension to APs. Fund custodian: BNP Paribas bank-grade creditworthiness.','MANUAL',100.00),
('NPA-2026-003','collateral_framework','N/A for fund. Creation/redemption on DvP basis. No margin lending to unit holders.','MANUAL',100.00),
('NPA-2026-003','custody_risk','BNP Paribas segregated custody. Sub-custodian risk: Euroclear (AAA-rated infrastructure), DTC (US Federal Reserve infrastructure). China green bonds via Bond Connect: CCDC (Chinese sovereign entity). Risk: CCDC is highest concentration — monitored quarterly by MBS AM Risk.','MANUAL',100.00),
('NPA-2026-003','regulatory_capital','MBS seed investment: 100% RSF = $50M × 100% = $50M RSF. MBS AM management: operational risk capital (AMA, estimated $800K). No SA-CCR (fund is not a derivative). Capital impact: $50M balance sheet increase (temporary until seed unwound over 6-12 months).','MANUAL',100.00),
('NPA-2026-003','stress_scenarios','Scenario 1: Global rate shock +200bps — fund NAV falls ~14% ($70M loss for unit holders). MBS seed exposure: $7M unrealised loss. Scenario 2: Credit spread widening (2008-style) — corporate green bonds spread +300bps, NAV falls 8%. Scenario 3: ESG regulatory shock (stricter green bond criteria) — forced index rebalancing, tracking error spikes to 150bps, AUM redemptions. Mitigant: MAS-supervised index methodology.','MANUAL',100.00),
('NPA-2026-003','stress_test_results','MBS seed ($50M) maximum stress loss: $15M (Q4 2008 scenario calibration). Within MBS AM risk appetite ($20M VaR limit). Fund unit holders: fully informed of risks via prospectus. MBS has no guarantee obligation to unit holders.','MANUAL',100.00),
('NPA-2026-003','reputational_risk','MEDIUM — ESG greenwashing risk is highest concern. Mitigants: Bloomberg MSCI index (third-party credibility), ICMA Green Bond Principles compliance, annual independent sustainability report. Risk: if index includes bonds later derecognised as "green", reputational risk to MBS brand. Protocol: immediate communication to investors + potential fund rebalancing.','MANUAL',100.00),
('NPA-2026-003','negative_impact','Yes — greenwashing risk if index methodology fails to exclude non-genuine green bonds.','MANUAL',100.00),
('NPA-2026-003','esg_assessment','HIGHLY POSITIVE — core ESG product. Bloomberg MSCI Green Bond Index: requires ICMA Green Bond Principles alignment + MSCI BBB+ ESG rating. MBS ESG commitment: this fund is a flagship ESG AUM contribution to Group target. Annual sustainability report published per GRI standards.','MANUAL',100.00),
('NPA-2026-003','esg_classification','Green','AUTO',99.00),
('NPA-2026-003','exposure_limits','MBS seed investment: $50M cap (approved by MBS AM Board). Single AP exposure: $10M intraday settlement. Single fund issuer concentration: 5% per index rules. ESG floor: no holding below MSCI BBB ESG rating.','MANUAL',100.00),
('NPA-2026-003','monitoring_party','MBS AM Risk: tracking error, ESG score, concentration. RMG Market Risk: MBS seed investment IR and FX risk. MAS SFC: quarterly ETF reporting. MSCI: quarterly ESG screening (independent).','MANUAL',100.00),
('NPA-2026-003','legal_opinion','Latham & Watkins Singapore: Cayman unit trust structure + MAS ETF registration. Baker McKenzie HK: SFC Type IV authorization. Deloitte: fund audit. All opinions received and attached to prospectus.','MANUAL',100.00),
('NPA-2026-003','licensing_requirements','Singapore: MAS registration under SFA s.286 (collective investment scheme). MBS AM: CMS licence for REIT/Fund management (existing). HK: SFC Type IV authorization (MBS AM HK branch). Cayman: Cayman Islands Monetary Authority registration.','MANUAL',100.00),
('NPA-2026-003','primary_regulation','MAS Securities and Futures Act (CIS registration). SFC Code on Unit Trusts for HK listing. Cayman Monetary Authority registration. ESMA PRIIPs (for EU institutional investors).','MANUAL',100.00),
('NPA-2026-003','secondary_regulations','MAS Notice SFA 07-N01 (CIS reporting). HKMA ETF guidelines. ICMA Green Bond Principles (voluntary but index-required). EU Sustainable Finance Disclosure Regulation (SFDR) Article 8 classification (for EU distribution).','MANUAL',95.00),
('NPA-2026-003','regulatory_reporting','MAS: semi-annual CIS return, annual fund report. SFC HK: quarterly fund return. Cayman: annual CIMA filing. MAS AML: annual report. ESG: annual ICMA Green Bond Standard reporting. Unit holders: CRS/FATCA reporting via BNP transfer agent.','MANUAL',100.00),
('NPA-2026-003','cross_border_regulations','HK: SFC Type IV authorization. EU investors: SFDR Article 8 disclosure required (ESG-promoted fund). US persons: excluded (S Regulation). Cayman fund: automatic AEOI compliance via BNP transfer agent. PRIIPs KID for EU institutional investors.','MANUAL',100.00),
('NPA-2026-003','legal_docs_required','• Cayman trust deed (Latham & Watkins)\n• MAS registered prospectus + Product Highlights Sheet\n• SFC Hong Kong authorized scheme documents\n• Authorised Participant Agreements (MBS Vickers, Citi, SocGen)\n• Fund Custody Agreement (BNP Paribas)\n• Fund Administration Agreement (BNP Paribas InfraLink)\n• Bloomberg MSCI index licence agreement\n• MSCI ESG data licence amendment\n• PRIIPs Key Information Document (for EU institutional investors)','MANUAL',100.00),
('NPA-2026-003','sanctions_check','Clear - No Matches','AUTO',100.00),
('NPA-2026-003','aml_considerations','Fund-level AML: BNP Paribas transfer agent performs investor KYC for direct subscriptions. Exchange investors: KYC by brokerage (not MBS fund responsibility). Institutional seed investors: standard institutional KYC (Enhanced CDD for SWF investors from high-risk jurisdictions).','MANUAL',100.00),
('NPA-2026-003','tax_impact','MBS AM income: Singapore corporate tax (17%) on management and distribution fees. Fund: Cayman-domiciled — no fund-level tax. Unit holders: individual tax treatment per jurisdiction. US WHT: 30% on US-sourced income for non-US funds. China bond components: PBOC-exempt for Bond Connect ETF.','ADAPTED',88.00),
('NPA-2026-003','accounting_book','Banking Book (MBS seed investment)','AUTO',90.00),
('NPA-2026-003','fair_value_treatment','MBS seed investment: FVTOCI (IFRS 9 — equity instrument designated at OCI). Management fee income: accrual basis, recognised monthly. Distribution fee: quarterly recognition on AUM.','MANUAL',100.00),
('NPA-2026-003','on_off_balance','MBS seed investment ($50M): On-Balance Sheet (FVTOCI equity). Fund holdings: Off-Balance Sheet (unit trust structure, not consolidated). Management fee income: recognised on MBS P&L.','AUTO',95.00),
('NPA-2026-003','tax_jurisdictions','Singapore: Fund management income — 17% corporate tax (IRAS). HK: MBS AM HK — 16.5% profits tax on HK-sourced income. Cayman fund: no entity-level tax. US WHT: paid by fund on US corporate bond coupons (15% under Singapore-US tax treaty).','MANUAL',100.00),
('NPA-2026-003','model_risk','Low — Bloomberg BVAL bond pricing is industry standard with extensive validation. Risk: stale prices for illiquid bonds. Mitigant: matrix pricing policy with 5-day stale threshold.','MANUAL',90.00),
('NPA-2026-003','country_risk','China green bonds (Bond Connect): PRC regulatory and settlement risk via CCDC. Mitigant: max 10% of fund in China bonds per index weighting. EU bonds: minimal country risk (EU sovereign issuers). US bonds: minimal (G7 sovereign/AAA corporate).','MANUAL',90.00),

-- ================================================================
-- PC.V: DATA MANAGEMENT
-- ================================================================
('NPA-2026-003','data_governance','Fund data: governed by BNP Paribas IAM (fund admin). MBS AM: data owner for portfolio data. Data classification: CONFIDENTIAL (investor data), INTERNAL (portfolio data).','MANUAL',100.00),
('NPA-2026-003','data_ownership','MBS Asset Management Ltd (portfolio selection, investment decisions). BNP Paribas Securities Services (fund accounting and investor records). Bloomberg (index data — licensed, not owned by MBS).','MANUAL',100.00),
('NPA-2026-003','data_stewardship','MBS AM COO: overall fund data steward. BNP: investor data steward (transfer agent). MBS AM ESG Analyst: ESG data steward.','MANUAL',100.00),
('NPA-2026-003','data_quality_monitoring','Daily: Bloomberg BVAL price quality (stale price >5 days flagged). Weekly: index constituent accuracy vs Bloomberg MSCI. Quarterly: MSCI ESG score refresh and portfolio re-screening. Annual: fund audit by Deloitte (data completeness and accuracy).','MANUAL',100.00),
('NPA-2026-003','data_privacy','Investor data: handled by BNP transfer agent under PDPA (SG) and PDPO (HK). Institutional investors: PDPA business exemption. Retail investors: standard MBS privacy notice. CCPA (California Privacy) not applicable (US persons excluded from fund).','MANUAL',100.00),
('NPA-2026-003','data_retention','Fund records: 7 years (MAS CIS requirement). Investor records: 5 years post-redemption (MAS AML). Audit records: permanent (SEC requirement if US sub-custodian used). ESG data: maintained continuously for ICMA reporting.','MANUAL',100.00),
('NPA-2026-003','gdpr_compliance','Not applicable (no EU retail investors). EU institutional investors: GDPR B2B exemption. PRIIPs disclosure satisfies EU transparency requirements without personal data obligations.','MANUAL',100.00),
('NPA-2026-003','pure_assessment_id','PURE-2026-ESG-003','MANUAL',100.00),
('NPA-2026-003','pure_purposeful','Investor data used solely for: fund administration, AML compliance, regulatory reporting, and investor communications. MSCI ESG data: used exclusively for index methodology compliance. No secondary use of investor data for MBS marketing without explicit consent.','MANUAL',100.00),
('NPA-2026-003','pure_unsurprising','Retail investors: privacy notice provided at account opening. Monthly fund factsheet distributed. Annual report covers all fund activities. No unexpected use of investor data.','MANUAL',100.00),
('NPA-2026-003','pure_respectful','Investor data minimisation: only collect data required for fund administration and AML. Right to request data deletion upon full redemption (subject to 5-year AML retention).','MANUAL',100.00),
('NPA-2026-003','pure_explainable','Fund prospectus provides full transparency on data collected. DPO contact: dpo@mbs.com. Annual privacy review by BNP Paribas transfer agent.','MANUAL',100.00),
('NPA-2026-003','reporting_requirements','MAS: semi-annual CIS return, MAS SGX ETF reporting. SFC HK: quarterly. ICMA: annual green bond principles report. CRS/FATCA: via BNP transfer agent. Investor: daily NAV, quarterly fund report, annual sustainability report.','MANUAL',100.00),
('NPA-2026-003','automated_reporting','Automated: daily NAV (BNP), iNAV every 15 sec (Bloomberg), MAS ETF reporting (SGX automated). Manual: ICMA annual report (MBS AM writes, Deloitte reviews), SFC HK quarterly (compliance team).','MANUAL',100.00),
('NPA-2026-003','data_lineage','Bloomberg MSCI Index → MBS AM portfolio management → BNP Paribas fund accounting → Unit holders. MSCI ESG data → MBS AM screening → portfolio construction → prospectus disclosure. Full audit trail at BNP and MBS AM levels.','MANUAL',100.00),
('NPA-2026-003','data_classification','Portfolio data: INTERNAL. Investor data: CONFIDENTIAL. NAV data: PUBLIC (SGX/HKEx). ESG screening data: CONFIDENTIAL (licensed from MSCI).','MANUAL',100.00),

-- ================================================================
-- PC.VI: OTHER RISK IDENTIFICATION
-- ================================================================
('NPA-2026-003','other_risks_exist','Yes','MANUAL',100.00),
('NPA-2026-003','operational_risk','(1) ESG greenwashing risk: index constituent derecognition — mitigated by MSCI quarterly re-screening and MBS AM active monitoring. (2) ETF premium/discount risk: if iNAV feed fails, premium/discount widens — mitigated by 3 APs providing liquidity. (3) Key person risk: 2 portfolio managers — succession plan required (MBS AM risk). (4) NAV error risk: manual override required for stale bonds — mitigated by maker-checker and BNP independence.','MANUAL',100.00),
('NPA-2026-003','additional_risk_mitigants','• Annual ICMA Green Bond audit by independent verifier\n• Bloomberg MSCI index methodology — third-party credibility\n• 3 authorised participants ensuring ETF creation/redemption liquidity\n• Deloitte annual fund audit\n• Quarterly MBS AM ESG review committee\n• MAS-registered prospectus with full risk disclosure','MANUAL',100.00),

-- ================================================================
-- PC.VII: TRADING PRODUCT ASSESSMENT
-- ================================================================
('NPA-2026-003','trading_product','No','AUTO',99.00),
('NPA-2026-003','appendix5_required','No','AUTO',99.00),

-- ================================================================
-- APP.1: ENTITY / LOCATION
-- ================================================================
('NPA-2026-003','booking_entity','MBS Global Climate Fund I (Cayman unit trust) managed by MBS Asset Management Ltd (Singapore)','MANUAL',100.00),
('NPA-2026-003','sales_entity','MBS Bank Ltd (Institutional Sales), MBS Vickers Securities (retail/brokerage), MBS Asset Management (direct subscriptions)','MANUAL',100.00),
('NPA-2026-003','booking_location','Singapore (MBS AM principal management). Fund domicile: Cayman Islands.','MANUAL',100.00),
('NPA-2026-003','sales_location','Singapore (primary), Hong Kong (secondary), ASEAN (institutional direct)','MANUAL',100.00),
('NPA-2026-003','risk_taking_entity','MBS Asset Management Ltd (portfolio management decisions). MBS Bank Ltd (seed investment risk).','MANUAL',100.00),
('NPA-2026-003','risk_taking_location','Singapore','MANUAL',100.00),
('NPA-2026-003','processing_entity','BNP Paribas Securities Services Singapore (fund admin, custody, transfer agency)','MANUAL',100.00),
('NPA-2026-003','processing_location','Singapore (BNP), Luxembourg (Clearstream for European bonds)','MANUAL',100.00),
('NPA-2026-003','counterparty','All SGX/HKEx investors (secondary market). Direct seed investors: APAC pension funds and SWFs. APs: MBS Vickers, Citibank, Société Générale.','MANUAL',100.00),
('NPA-2026-003','hedge_entity','MBS Bank Ltd Singapore (FX hedge for HKD share class)','MANUAL',100.00),

-- ================================================================
-- APP.2: INTELLECTUAL PROPERTY
-- ================================================================
('NPA-2026-003','mbs_ip_exists','Yes — MBS Global Climate Fund I brand name, MBS AM portfolio management processes, custom iNAV calculation engine','MANUAL',100.00),
('NPA-2026-003','mbs_ip_details','MBS brand on fund name. Custom iNAV calculation engine (MBS AM build). MBS AM ESG screening overlay model (proprietary ESG tilt methodology on top of MSCI index).','MANUAL',100.00),
('NPA-2026-003','third_party_ip_exists','Yes','MANUAL',100.00),
('NPA-2026-003','third_party_ip_details','Bloomberg MSCI Global Green Bond Index: licensed from Bloomberg Index Services ($800K/year). MSCI ESG Ratings data: licensed from MSCI ($280K/year expansion). BNP Paribas InfraLink: SaaS fund admin (included in admin fee).','MANUAL',100.00),
('NPA-2026-003','ip_licensing','Bloomberg Index licence: $800K/year. MSCI ESG data: $280K/year (expansion of existing licence). All IP licensing terms reviewed by Legal — sub-licensing restrictions apply (cannot use index in third-party ETF without Bloomberg approval).','MANUAL',100.00),

-- ================================================================
-- APP.3: FINANCIAL CRIME
-- ================================================================
('NPA-2026-003','aml_assessment','MEDIUM risk. Direct subscription investors: standard enhanced institutional DD. Exchange investors: KYC responsibility with brokers (not MBS fund). Key risks: (1) Money laundering via fund subscription: mitigated by BNP transfer agent AML procedures. (2) Sanctions evasion via fund: mitigated by screening at subscription. (3) Beneficial ownership through nominee structures: enhanced DD required.','MANUAL',100.00),
('NPA-2026-003','terrorism_financing','LOW — institutional ESG fund not a TF risk vehicle. Standard AML controls apply.','MANUAL',100.00),
('NPA-2026-003','sanctions_assessment','All direct subscribers screened against OFAC, MAS, UN, EU sanctions. Fund bond portfolio: no holdings in sanctioned jurisdictions. China bonds: PRC issuers only — PBOC Green Bond Catalogue verified (excludes coal/fossil fuel).','MANUAL',100.00),
('NPA-2026-003','fraud_risk','LOW — ETF structure limits fraud vectors. Key risk: false green bond certification in index — mitigated by MSCI independent verification. Internal fraud: MBS AM dual control for all investment decisions and fund transfers.','MANUAL',100.00),
('NPA-2026-003','bribery_corruption','LOW — fund management fees are transparent and regulated. Standard MBS anti-bribery policy applies. MSCI and Bloomberg relationships: arm''s length commercial agreements.','MANUAL',100.00),
('NPA-2026-003','fc_risk_rating','MEDIUM','MANUAL',100.00),
('NPA-2026-003','fc_mitigation_measures','• BNP Paribas transfer agent performs investor AML/KYC\n• ICMA Green Bond Principles annual audit (greenwashing prevention)\n• OFAC/MAS/UN sanctions screening on all direct subscribers\n• Portfolio: no holdings in sanctioned country issuers\n• Quarterly MSCI ESG re-screening of portfolio','MANUAL',100.00),

-- ================================================================
-- APP.4: RISK DATA AGGREGATION
-- ================================================================
('NPA-2026-003','rda_compliance','Fund data integrated into MBS Group risk data aggregation. MBS seed investment ($50M): included in MBS balance sheet risk reporting. Fund NAV and AUM tracked in MBS AM risk database. BCBS 239 compliance maintained.','MANUAL',95.00),
('NPA-2026-003','rda_data_sources','Bloomberg MSCI Green Bond Index (constituent data), Bloomberg BVAL (bond prices), MSCI ESG database (ESG scores), BNP Paribas InfraLink (fund NAV and AUM), MBS AM internal risk database','MANUAL',100.00),
('NPA-2026-003','rda_aggregation_method','Daily: BNP Paribas NAV → MBS AM risk system → MBS Group MIS. Quarterly: MSCI ESG re-screening. Annual: Deloitte fund audit. Data aggregation aligned with existing MBS AM reporting infrastructure.','MANUAL',100.00),
('NPA-2026-003','rda_data_quality','NAV accuracy: 0.01% tolerance (MBS AM vs BNP). Bloomberg pricing: 99.9% coverage (stale escalation for remainder). ESG data: MSCI quarterly refresh + MBS AM continuous monitoring. Annual Deloitte audit confirms data completeness.','MANUAL',100.00),

-- ================================================================
-- APP.6: THIRD-PARTY PLATFORMS
-- ================================================================
('NPA-2026-003','third_party_platform','Yes','MANUAL',100.00),
('NPA-2026-003','platform_name','BNP Paribas Securities Services — InfraLink Fund Administration Platform','MANUAL',100.00),
('NPA-2026-003','tp_use_case_description','BNP Paribas InfraLink provides complete fund administration for MBS Global Climate Fund I: daily NAV calculation, fund accounting, transfer agency (investor registry), custody settlement, and regulatory reporting. Critical dependency for fund operations.','MANUAL',100.00),
('NPA-2026-003','tp_business_justification','Building fund admin in-house: not feasible ($10M+ build, 24+ months). BNP Paribas is a top-3 global fund administrator with $2T+ AUM under administration. Established APAC presence with Singapore and Hong Kong operations. Existing MBS AM relationship for other fund mandates.','MANUAL',100.00),
('NPA-2026-003','tp_risk_rating','MEDIUM (Tier 2 Critical Vendor — fund operations dependency)','MANUAL',100.00),
('NPA-2026-003','tp_risk_mitigants','(1) BNP Paribas A+ credit rated — robust financial strength, (2) Contractual SLA: 99.9% platform availability, (3) Transfer of fund records possible within 30 days (exit clause), (4) Disaster recovery: BNP multi-site infrastructure (SG + LX + NY)','MANUAL',100.00),
('NPA-2026-003','tp_pdpa_compliance','BNP Paribas data processing agreement executed. BNP compliant with PDPA (SG), PDPO (HK), MiFID II (EU). Annual data protection review clause in fund administration agreement.','MANUAL',100.00),
('NPA-2026-003','info_security_assessment','BNP Paribas ISS assessment: MBS ISS-2025-VENDOR-092. Result: APPROVED. BNP holds ISO 27001, SOC 2 Type II certification. Data encrypted at rest (AES-256) and in transit (TLS 1.3).','MANUAL',100.00),
('NPA-2026-003','platform_risk_assessment','Overall vendor risk: MEDIUM. BNP A+ rating and established infrastructure reduce concentration risk. Exit risk: 30-day transfer clause contractually protected. Residual risk: system migration complexity if exit required.','MANUAL',100.00),
('NPA-2026-003','data_residency','Singapore primary data centre (MAS TRM compliant). Luxembourg secondary: Clearstream integration (EU Green Bond components). No data in jurisdictions without MBS approval. Chinese bond data: CCDC maintained onshore (China).','MANUAL',100.00);

SET FOREIGN_KEY_CHECKS=1;
