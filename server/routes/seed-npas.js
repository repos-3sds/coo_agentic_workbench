// seed-npas.js — Helper: returns array of 8 diverse NPA project definitions
// Modeled after real TSG examples from KB: TSG1917, TSG2042, TSG2339, TSG2055, TSG2543
// Covers: New-to-Group, Variation, Existing/B3, Evergreen, Bundling + all major product categories

// Generate additional form data fields to fill empty template sections
// These fields map to ref_npa_fields entries in sections: SEC_PRICE, SEC_DATA, SEC_REG, SEC_ENTITY, SEC_SIGN, SEC_LEGAL, SEC_DOCS
// Also fills gaps in SEC_PROD, SEC_OPS, SEC_RISK that aren't covered by the core seed data
function getExtraFormData(proj) {
    const t = proj.npa_type;
    const cat = proj.product_category;
    const risk = proj.risk_level;
    const ntl = proj.notional_amount || 0;
    const rev = proj.estimated_revenue || 0;
    const isNtg = t === 'New-to-Group';
    const isHigh = risk === 'HIGH';

    return [
        // ──── Sub-section headers (field_type='header' in DB) ────
        // SEC_PROD sub-headers
        ['hdr_prod_basic', 'Product Specifications (Basic Information)', 'AUTO', 100],
        ['hdr_prod_revenue', 'Revenue & Commercial Viability', 'AUTO', 100],
        // SEC_OPS sub-headers
        ['hdr_ops_operational', 'Operational Information', 'AUTO', 100],
        ['hdr_ops_booking', 'Booking & Settlement', 'AUTO', 100],
        ['hdr_ops_bcp', 'Business Continuity & Security', 'AUTO', 100],
        // SEC_RISK sub-headers
        ['hdr_risk_market', 'A. Market & Liquidity Risk', 'AUTO', 100],
        ['hdr_risk_credit', 'B. Credit Risk & Counterparty Credit Risk', 'AUTO', 100],
        ['hdr_risk_operational', 'C. Operational & Reputational Risk', 'AUTO', 100],
        ['hdr_risk_capital', 'D. Regulatory Capital & Stress Testing', 'AUTO', 100],
        // SEC_PRICE sub-headers
        ['hdr_price_methodology', 'Pricing Model Validation / Assurance', 'AUTO', 100],
        // SEC_DATA sub-headers
        ['hdr_data_principles', 'Data Principles & Management Requirements', 'AUTO', 100],
        // SEC_REG sub-headers
        ['hdr_reg_compliance', 'Legal & Compliance Considerations', 'AUTO', 100],
        // SEC_LEGAL sub-headers
        ['hdr_legal_docs', 'Documentation Requirements', 'AUTO', 100],

        // SEC_PROD gaps
        ['trade_date', proj.kickoff_date || '2026-01-15', 'AUTO', 95],
        ['pac_reference', proj.pac_approval_status === 'Approved' ? `ExCo-2026-${proj.id.split('-')[1]}` : 'N/A — PAC not required for this track', 'AUTO', 90],
        ['funding_type', cat.includes('Fixed Income') || cat.includes('Fund') ? 'Funded position' : 'Unfunded derivative', 'AUTO', 92],
        ['product_maturity', cat.includes('Equity') || cat.includes('Structured') ? '1-3 years' : cat.includes('Commodity') ? '6M-2Y rolling' : '5Y standard', 'AUTO', 88],
        ['product_lifecycle', isNtg ? 'New launch — full lifecycle setup required' : t === 'Existing' ? 'Reactivation of dormant product' : 'Extension of existing product line', 'AUTO', 91],
        ['revenue_year1', `${(rev / 1e6).toFixed(1)}M`, 'MANUAL', 100],
        ['revenue_year2', `${(rev * 1.3 / 1e6).toFixed(1)}M`, 'AUTO', 75],
        ['revenue_year3', `${(rev * 1.6 / 1e6).toFixed(1)}M`, 'AUTO', 70],
        ['target_roi', isHigh ? '18-22% ROAE' : '12-15% ROAE', 'AUTO', 80],
        ['spv_details', cat.includes('Structured') ? 'SPV required: MBS Capital Markets Ltd (Cayman) for note issuance' : 'No SPV required — principal booking on MBS balance sheet', 'AUTO', 85],

        // SEC_OPS gaps
        ['valuation_model', cat.includes('Credit') ? 'ISDA CDS Standard Model (hazard rate bootstrapping)' : cat.includes('FX') ? 'Garman-Kohlhagen for barriers, Black-Scholes for vanilla' : cat.includes('Interest Rate') ? 'LMM/SABR for swaptions, Hull-White for exotic IR' : cat.includes('Equity') ? 'Local volatility surface with Monte Carlo' : cat.includes('Commodity') ? 'Multi-factor Schwartz-Smith model' : 'Discounted cash flow with credit spread adjustment', 'AUTO', 88],
        ['confirmation_process', 'Electronic confirmation via MarkitWire/DTCC. T+1 affirmation target. Unconfirmed trade aging policy: escalation at T+3.', 'AUTO', 90],
        ['reconciliation', 'Daily P&L reconciliation (Front-to-Back). Monthly position reconciliation with custodian. Quarterly regulatory reconciliation.', 'AUTO', 89],
        ['tech_requirements', isNtg ? 'New system integration required — estimated 6-8 weeks build cycle' : 'Minor configuration changes to existing systems — 1-2 weeks', 'AUTO', 85],
        ['front_office_model', `Murex MX.3 — ${cat} module. Real-time pricing and risk. Pre-deal check integration.`, 'AUTO', 92],
        ['middle_office_model', 'Murex Middle Office for trade lifecycle management. Daily P&L attribution. Independent price verification (IPV) via Bloomberg/Markit.', 'AUTO', 91],
        ['back_office_model', 'Murex Back Office for settlement instruction generation. SWIFT/CLS for payment. Nostro reconciliation via SmartStream TLM.', 'AUTO', 90],
        ['booking_legal_form', cat.includes('Fund') ? 'Unit trust structure' : 'OTC bilateral derivative', 'AUTO', 93],
        ['booking_family', cat.replace(' Derivatives', '').replace(' Products', ''), 'AUTO', 95],
        ['booking_typology', `${cat} — ${t}`, 'AUTO', 94],
        ['portfolio_allocation', `MBSSG_GFM_${cat.split(' ')[0].toUpperCase()}`, 'AUTO', 92],
        ['hsm_required', isHigh ? 'Yes — HSM review required for high-risk classification' : 'No — standard risk classification', 'AUTO', 88],
        ['pentest_status', isNtg ? 'Scheduled — pre-launch penetration test required for new systems' : 'Completed — existing infrastructure already pen-tested', 'AUTO', 86],
        ['iss_deviations', 'No ISS deviations identified. Standard booking and settlement model applies.', 'AUTO', 90],

        // SEC_RISK gaps
        ['credit_risk', `**Risk Rating:** ${isHigh ? 'HIGH' : 'MEDIUM'}\n\n**Exposure Profile:**\n- Current MTM exposure: monitored daily\n- Potential Future Exposure (PFE): calculated using SA-CCR methodology\n- ${isHigh ? 'Enhanced credit limits and collateral framework required' : 'Covered by existing ISDA/CSA framework'}\n\n**Key Credit Risk Factors:**\n- Counterparty default risk\n- ${isHigh ? 'Wrong-way risk (counterparty default correlated with market moves)\n- Jump-to-default risk for credit-linked products' : 'Settlement risk during payment/delivery'}\n\n**Mitigation:**\n- Daily mark-to-market monitoring\n- Collateral management under CSA\n- Pre-deal credit limit checks integrated in booking workflow\n- Counterparty exposure alerts at 80% and 100% of limit`, 'AUTO', 87],
        ['operational_risk', `**Risk Rating:** ${isNtg ? 'HIGH' : 'LOW'}\n\n**Key Operational Risks:**\n- Booking errors (incorrect notional, wrong counterparty, pricing mistakes)\n- Settlement failures (missed payments, incorrect settlement instructions)\n- Confirmation backlogs (unmatched trades)\n- ${isNtg ? 'New system integration risks during initial rollout\n- Staff training gaps on new product procedures' : 'Standard operational risks — existing framework applies'}\n\n**Mitigants:**\n- Maker-checker controls for all trade bookings\n- Automated confirmation matching via MarkitWire/DTCC\n- Real-time reconciliation breaks monitoring and escalation\n- ${isNtg ? 'Mandatory staff training before go-live\n- Parallel processing with manual fallback during transition period' : 'Proven operational procedures with established SLAs'}`, 'AUTO', 85],
        ['liquidity_risk', cat.includes('Credit') || cat.includes('Structured') ? 'MEDIUM — CDS market liquidity can deteriorate in stress; index more liquid than single-name. Bid-ask spreads widen 3-5x in stress.' : cat.includes('FX') ? 'LOW — deep and liquid market; NDF liquidity varies by currency pair' : 'LOW — standard exchange-traded or OTC market with adequate liquidity', 'AUTO', 86],
        ['reputational_risk', isNtg ? 'MEDIUM — new product category; reputational risk if credit event handling is poor or client disputes arise' : 'LOW — established product with track record', 'AUTO', 84],
        ['var_capture', `VaR model: ${cat.includes('Credit') ? 'CreditMetrics with Monte Carlo simulation' : 'Historical simulation (500-day window)'}. Coverage: ${isHigh ? '99th percentile, 10-day holding period' : '99th percentile, 1-day holding period'}. Back-testing: monthly with traffic light system.`, 'AUTO', 82],
        ['stress_scenarios', `**Number of Scenarios:** ${isHigh ? '6' : '3'}\n\n**Scenario Definitions:**\n1. Market crash: -20% adverse market move across all risk factors\n2. Interest rate shock: +200bps parallel shift across yield curves\n3. Credit spread widening: 3x current spread levels${isHigh ? '\n4. Liquidity crisis: bid-ask spreads widen 5x, market depth drops 80%\n5. Counterparty default: simultaneous default of top 3 counterparties\n6. Correlation breakdown: historical correlations shift to ±1 extremes' : ''}\n\n**Reporting:**\n- Results reported to ALCO monthly\n- Breach alerts at 80% and 100% of stress loss limits\n- Ad-hoc stress testing for market dislocations`, 'AUTO', 80],
        ['counterparty_default', `Exposure at Default (EAD) calculation via SA-CCR. Loss Given Default (LGD): ${isHigh ? '45% unsecured, 20% collateralized' : '35% standard'}. Wrong-way risk: ${cat.includes('Credit') ? 'Significant — correlated default monitored daily' : 'Not material for this product type'}.`, 'AUTO', 83],
        ['custody_risk', cat.includes('Fund') || cat.includes('Fixed Income') ? 'Securities held with BNP Paribas Securities Services (SG). Segregated client accounts. Daily NAV reconciliation.' : 'Not applicable — unfunded derivative product. No custody of physical assets required.', 'AUTO', 88],
        ['esg_assessment', cat.includes('ESG') ? 'POSITIVE — product specifically targets ESG-aligned investments per GFIT taxonomy. Green bond criteria applied.' : cat.includes('Commodity') && proj.title.includes('Oil') ? 'REQUIRES REVIEW — fossil fuel exposure. MBS Responsible Financing framework applies. Transition finance classification requested.' : 'NEUTRAL — no significant ESG impact identified. Standard MBS sustainability framework applies.', 'AUTO', 78],

        // SEC_PRICE fields
        ['roae_analysis', `Year 1 ROAE: ${isHigh ? '15-18%' : '12-14%'} (above ${isHigh ? '15%' : '12%'} hurdle). Capital consumption: $${(ntl * 0.08 / 1e6).toFixed(0)}M under SA-CCR. Revenue/Capital: ${(rev / (ntl * 0.08) * 100).toFixed(1)}%.`, 'AUTO', 82],
        ['pricing_assumptions', `Base case: ${cat.includes('FX') ? 'Forward curve from Bloomberg. Volatility surface from broker quotes.' : cat.includes('Interest Rate') ? 'SOFR/SORA swap curve. Swaption vol surface from ICAP.' : 'Market data from Bloomberg/Markit. Historical calibration window: 2 years.'}`, 'AUTO', 85],
        ['bespoke_adjustments', isNtg ? 'Bespoke pricing for initial client onboarding — wider spreads (2x) to compensate for model uncertainty in first 3 months' : 'Standard pricing grid applies — no bespoke adjustments required', 'AUTO', 80],
        ['pricing_model_name', cat.includes('Credit') ? 'ISDA CDS Standard Model' : cat.includes('FX') ? 'Garman-Kohlhagen / Black-76' : cat.includes('Interest Rate') ? 'SABR / Hull-White' : cat.includes('Equity') ? 'Local Vol + Monte Carlo' : cat.includes('Commodity') ? 'Schwartz-Smith Two-Factor' : 'DCF with credit spread', 'AUTO', 90],
        ['model_validation_date', '2026-01-10', 'AUTO', 95],
        ['simm_treatment', `ISDA SIMM ${cat.includes('FX') ? 'Risk Class 1 (Interest Rate + FX)' : cat.includes('Credit') ? 'Risk Class 2 (Credit Qualifying)' : cat.includes('Equity') ? 'Risk Class 3 (Equity)' : cat.includes('Commodity') ? 'Risk Class 4 (Commodity)' : 'Risk Class 1 (Interest Rate)'}. Delta, vega, and curvature margin components.`, 'AUTO', 84],

        // SEC_DATA fields
        ['data_retention', `**Retention Schedule:**\n\n| Data Category | Retention Period | Regulation |\n|---|---|---|\n| Trade records | 7 years | MAS Notice SFA 04-N13 |\n| Client communications | 5 years | MAS Notice on Record Keeping |\n| Regulatory filings | 10 years | Banking Act s.47 |\n| KYC/AML records | 5 years post-relationship | MAS Notice 626 |\n\n**Archival:** Automated migration to cold storage after 2 years. Full audit trail maintained.`, 'AUTO', 92],
        ['reporting_requirements', `MAS Trade Repository reporting (T+2). ${proj.is_cross_border ? 'HKMA OTC derivatives reporting for HK leg. ' : ''}Internal: daily risk report, weekly P&L report, monthly ALCO report.`, 'AUTO', 88],
        ['pure_assessment_id', `PURE-${proj.id.split('-')[1]}-${cat.split(' ')[0].toUpperCase()}`, 'AUTO', 95],
        ['gdpr_compliance', proj.is_cross_border ? 'Not applicable — no EU exposure. PDPA (Singapore) applies. Cross-border data sharing governed by SCCs with HK/CN counterparties.' : 'Not applicable — PDPA (Singapore) governs. No cross-border personal data transfer.', 'AUTO', 90],
        ['data_ownership', `**Data Ownership Matrix:**\n\n| Data Domain | Owner | Steward |\n|---|---|---|\n| Trade data | Front Office | Trade Support |\n| Risk data | Risk Management | Risk Analytics |\n| Regulatory reporting | Compliance | Regulatory Reporting Team |\n| Client data | Relationship Management | Client Onboarding |\n| Financial data | Finance | Financial Control |\n\n**Governance:** Data Governance Council provides oversight and adjudicates ownership disputes. Quarterly data quality reviews.`, 'AUTO', 88],

        // SEC_REG fields
        ['primary_regulation', `MAS Notice 637 (Capital adequacy). ${cat.includes('Equity') ? 'SFA Part XIII (Securities).' : cat.includes('Fund') ? 'SFA Division 2 (Collective Investment Schemes).' : 'SFA Part VIA (OTC Derivatives).'}`, 'AUTO', 88],
        ['secondary_regulations', `MAS Notice SFA 04-N13 (Reporting). ${proj.is_cross_border ? 'HKMA SPM OR-1 (Operational Risk). SFC Code of Conduct.' : ''} Basel III SA-CCR framework. ISDA protocol adherence.`, 'AUTO', 85],
        ['regulatory_reporting', `MAS Trade Repository: T+2 reporting via DTCC. ${proj.is_cross_border ? 'HKMA: monthly position report. ' : ''}MAS 610/1003: quarterly capital adequacy returns. Internal: daily risk dashboard.`, 'AUTO', 87],
        ['sanctions_check', 'Automated sanctions screening via Dow Jones Risk & Compliance. Daily screening against OFAC, EU, UN, MAS lists. Pre-deal counterparty check integrated in Murex.', 'AUTO', 92],

        // SEC_ENTITY fields
        ['booking_entity', 'MBS Bank Ltd — Singapore (Head Office)', 'AUTO', 98],
        ['counterparty', isNtg ? 'New counterparty onboarding required. Institutional clients only — banks, asset managers, hedge funds, insurance companies.' : 'Existing client base. No new counterparty types.', 'AUTO', 88],
        ['counterparty_rating', `Minimum counterparty rating: ${isHigh ? 'BBB- (investment grade) for uncollateralized, no minimum for fully collateralized under CSA' : 'BB+ for standard OTC derivatives with CSA'}`, 'AUTO', 85],
        ['strike_price', cat.includes('FX') || cat.includes('Equity') ? `Strike determined at trade inception based on spot reference. Barrier levels: ${cat.includes('FX') ? '±5-10% from spot for knock-in' : '90-110% of initial fixing for participation notes'}.` : 'Not applicable — no embedded optionality in this product structure', 'AUTO', 82],
        ['ip_considerations', 'No proprietary IP involved. Standard market product structure. MBS branding on client-facing term sheets and trade confirmations.', 'AUTO', 90],

        // SEC_SIGN fields
        ['required_signoffs', isNtg ? 'Full sign-off matrix: Risk, Legal, Compliance, Finance, Operations, Technology, Product Head (7 parties)' : `Lite sign-off: ${t === 'Existing' ? 'Risk, Compliance (2 parties)' : 'Risk, Legal, Compliance (3 parties)'}`, 'AUTO', 92],
        ['signoff_order', isNtg ? 'Sequential: Risk → Legal → Compliance → Operations → Technology → Finance → Product Head' : 'Parallel: all parties review simultaneously', 'AUTO', 90],

        // SEC_LEGAL fields
        ['isda_agreement', cat.includes('FX') || cat.includes('Interest Rate') || cat.includes('Credit') ? `ISDA Master Agreement (2002) with Schedule and CSA. ${cat.includes('Credit') ? 'ISDA 2014 Credit Derivatives Definitions supplement required.' : 'Standard ISDA definitions apply.'} Negotiation status: ${isNtg ? 'New ISDA required for CDS' : 'Existing ISDA covers this product'}.` : cat.includes('Fund') ? 'Not applicable — fund subscription agreement governs.' : 'ISDA Master Agreement in place with existing counterparties.', 'AUTO', 88],
        ['tax_impact', `${proj.is_cross_border ? 'Cross-border withholding tax review required. SG-HK DTA applies (0% WHT on interest). ' : ''}GST: exempt financial supply (input tax apportionment applies). Income tax: trading book P&L taxed at 17% corporate rate. Transfer pricing: arm\'s length pricing for cross-entity bookings.`, 'AUTO', 82],

        // SEC_DOCS fields
        ['term_sheet', `${proj.title} — Term Sheet v2.0 (attached)`, 'MANUAL', 100],
        ['supporting_documents', `${isNtg ? 'PAC approval memo, product proposal, risk assessment report, legal opinion, technology impact assessment, operational readiness checklist' : 'Product variation memo, risk update, compliance sign-off'}`, 'AUTO', 88],

        // ──── NEW FIELDS: Commercialization (PC.I.3) ────
        ['distribution_channels', `**Primary Channels:**\n- ${cat.includes('Fund') || cat.includes('Structured') ? 'MBS Private Banking — Relationship Manager assisted\n- MBS Treasures — Digital and RM channels\n- Institutional Sales — Direct coverage' : 'Institutional Sales — Direct client coverage\n- Electronic trading platform (API and GUI)\n- 24/7 trading desk for voice execution'}\n\n**Rationale for Multi-Channel:**\n${cat.includes('Fund') || cat.includes('Structured') ? 'Wealth management products require RM-assisted distribution for suitability assessment. Digital channel for repeat purchases by qualified clients.' : 'Institutional clients require both electronic (low-touch, algorithmic) and voice (high-touch, block trades) execution channels to accommodate diverse trading strategies and order sizes.'}`, 'AUTO', 85],

        ['sales_suitability', `**Customer Qualification:**\n- ${isHigh ? 'Accredited Investors only (SFA s.4A / SFO PI)\n- Minimum 2 years derivatives trading experience\n- Completed product-specific risk acknowledgement' : 'Professional / Institutional Investors\n- Standard client suitability assessment completed'}\n\n**Onboarding Requirements:**\n- KYC/AML clearance and ongoing monitoring\n- Appropriate ISDA/Master Agreement in place\n- ${isNtg ? 'Mandatory product training session before first trade' : 'Existing product knowledge assessment on file'}\n\n**Suitability Controls:**\n- Pre-deal suitability check integrated in order workflow\n- Annual client review and re-certification\n- Product complexity classification: ${isHigh ? 'Complex (SFA Schedule 1)' : 'Standard (non-complex)'}`, 'AUTO', 84],

        ['marketing_plan', `**Go-to-Market Strategy:**\n- ${isNtg ? 'Soft launch with 10-15 anchor clients (3-month pilot)\n- Full commercial launch following successful PIR\n- Institutional seminar series (quarterly)' : 'Targeted outreach to existing client base\n- Product update communication to active traders'}\n\n**Marketing Materials:**\n- Product term sheet and fact sheet\n- ${cat}-specific risk disclosure document\n- ${isNtg ? 'Educational webinar series on product mechanics\n- White paper on market opportunity' : 'Updated product brochure'}\n\n**Communication Plan:**\n- Monthly market commentary and product insights\n- ${cat} market research distribution to qualified clients\n- Regulatory update alerts for relevant jurisdictions`, 'AUTO', 80],

        // ──── NEW FIELDS: Market Risk Factor Matrix (PC.IV.B.1.table) ────
        ['mrf_ir_delta', `${cat.includes('Interest Rate') || cat.includes('Fixed Income') ? 'Yes | Yes | Yes | Yes' : cat.includes('FX') || cat.includes('Credit') ? 'Yes | Yes | Yes | Yes' : 'No | N/A | N/A | N/A'}`, 'AUTO', 90],
        ['mrf_ir_vega', `${cat.includes('Interest Rate') ? 'Yes | Yes | Yes | Yes' : cat.includes('FX') ? 'Yes | Yes | Yes | No' : 'No | N/A | N/A | N/A'}`, 'AUTO', 90],
        ['mrf_fx_delta', `${cat.includes('FX') ? 'Yes | Yes | Yes | Yes' : proj.is_cross_border ? 'Yes | Yes | Yes | Yes' : 'No | N/A | N/A | N/A'}`, 'AUTO', 90],
        ['mrf_fx_vega', `${cat.includes('FX') ? 'Yes | Yes | Yes | No' : 'No | N/A | N/A | N/A'}`, 'AUTO', 90],
        ['mrf_eq_delta', `${cat.includes('Equity') ? 'Yes | Yes | Yes | Yes' : 'No | N/A | N/A | N/A'}`, 'AUTO', 90],
        ['mrf_commodity', `${cat.includes('Commodity') ? 'Yes | Yes | Yes | Yes' : 'No | N/A | N/A | N/A'}`, 'AUTO', 90],
        ['mrf_credit', `${cat.includes('Credit') ? 'Yes | Yes | Yes | Yes' : cat.includes('Fixed Income') ? 'Yes | Yes | Yes | Yes' : 'No | N/A | N/A | N/A'}`, 'AUTO', 90],
        ['mrf_correlation', `${isHigh ? 'Yes | Yes | No | Yes' : 'No | N/A | N/A | N/A'}`, 'AUTO', 85],

        // ──── NEW FIELDS: Financial Crime Risk Areas (Appendix 3) ────
        ['aml_assessment', `**AML Risk Rating:** ${isHigh ? 'HIGH' : 'MEDIUM'}\n\n**Key AML Risks:**\n- ${isNtg ? 'New counterparty types requiring enhanced due diligence\n- Complex transaction structures may obscure beneficial ownership' : 'Standard counterparty base with existing KYC on file'}\n- ${proj.is_cross_border ? 'Cross-border transaction flows require enhanced monitoring\n- Multiple jurisdictions increase layering risk' : 'Domestic transactions with standard monitoring'}\n\n**Mitigants:**\n- Automated transaction monitoring via TCS BANCS AML\n- Enhanced due diligence for high-risk counterparties\n- Suspicious Transaction Report (STR) escalation procedures\n- ${cat.includes('Credit') || cat.includes('Commodity') ? 'Blockchain analytics for digital asset components' : 'Standard SWIFT/payment monitoring'}`, 'AUTO', 82],

        ['terrorism_financing', `**TF Risk Assessment:** ${proj.is_cross_border ? 'MEDIUM — cross-border flows' : 'LOW — domestic institutional counterparties'}\n\n**Risk Factors:**\n- ${proj.is_cross_border ? 'Multi-jurisdictional fund flows require enhanced TF screening' : 'Standard institutional counterparties — low TF risk profile'}\n- All counterparties screened against FATF/APG lists\n\n**Controls:**\n- Pre-deal counterparty screening against MAS, OFAC, EU, UN lists\n- Ongoing name-matching and adverse media monitoring\n- MBS Financial Intelligence Unit (FIU) oversight\n- Annual TF risk assessment review`, 'AUTO', 80],

        ['sanctions_assessment', `**Sanctions Screening Framework:**\n\n**Lists Monitored:**\n- MAS Targeted Financial Sanctions list\n- OFAC SDN (Specially Designated Nationals)\n- EU Consolidated Sanctions\n- UN Security Council Sanctions\n\n**Screening Procedures:**\n- Real-time pre-deal screening integrated in booking workflow\n- Daily batch screening against updated sanctions lists\n- ${proj.is_cross_border ? 'Enhanced screening for cross-border counterparties\n- Jurisdiction-specific sanctions risk assessment (SG, HK' + (proj.jurisdictions && proj.jurisdictions.includes && proj.jurisdictions.includes('CN') ? ', CN' : '') + ')' : 'Standard screening protocols for domestic counterparties'}\n\n**Escalation:** Automated escalation to Compliance for potential matches. 24-hour resolution SLA for false positives.`, 'AUTO', 83],

        ['fraud_risk', `**Fraud Risk Rating:** ${isHigh ? 'MEDIUM' : 'LOW'}\n\n**Key Fraud Risks:**\n- Unauthorized trading or exceeding position limits\n- ${isNtg ? 'New system controls may have gaps during initial rollout' : 'Existing controls tested and operational'}\n- Market manipulation (spoofing, layering, wash trades)\n\n**Controls:**\n- Maker-checker controls for all trade bookings\n- Real-time position limit monitoring\n- Trade surveillance system (Nasdaq SMARTS) for market abuse detection\n- Daily P&L reconciliation and outlier analysis\n- Segregation of duties (Front/Middle/Back Office)`, 'AUTO', 80],

        ['bribery_corruption', `**B&C Risk Assessment:** LOW\n\n**Assessment:**\n- ${cat} trading is institutional/wholesale — no retail distribution\n- No government procurement or public sector contracts involved\n- ${proj.is_cross_border ? 'Cross-border operations governed by MBS Anti-Bribery Policy' : 'Domestic operations with standard anti-bribery framework'}\n\n**Controls:**\n- MBS Code of Conduct and Anti-Bribery Policy compliance\n- Gifts, entertainment, and hospitality register\n- Third-party intermediary due diligence\n- Annual compliance training and certification\n- Whistleblower reporting mechanism`, 'AUTO', 78],

        // ──── NEW FIELDS: Appendix 5 Trading Products ────
        ['collateral_types', `${cat.includes('Fund') || cat.includes('Fixed Income') ? '**Securities Collateral:**\n- Government bonds (G7 + SG, HK, KR — 0-2% haircut)\n- Investment-grade corporate bonds (5-10% haircut)\n- Equities from major indices (15-25% haircut)\n\n**Custody:**\n- BNP Paribas Securities Services (SG)\n- Segregated client accounts per MAS Notice 757\n- Daily collateral valuation and margin calls' : '**CSA Eligible Collateral (per ISDA Credit Support Annex):**\n- Cash (USD, SGD, EUR — 0% haircut)\n- Government bonds (G10 — 2-5% haircut)\n\n**Collateral Management:**\n- Daily mark-to-market and margin calls\n- Independent collateral valuation (Middle Office)\n- Rehypothecation rights per CSA terms\n- Minimum Transfer Amount: $500K'}`, 'AUTO', 84],

        ['valuation_method', `**Independent Price Verification (IPV):**\n- ${cat.includes('FX') || cat.includes('Interest Rate') ? 'Bloomberg BVAL + Markit composite pricing' : cat.includes('Credit') ? 'Markit CDS spreads + dealer polling' : cat.includes('Equity') ? 'Exchange closing prices + Bloomberg valuation service' : cat.includes('Commodity') ? 'Platts/Argus daily assessments' : 'Bloomberg composite pricing'}\n- Middle Office IPV vs Front Office marks\n- Tolerance threshold: ${isHigh ? '1bps' : '2bps'} for liquid products, ${isHigh ? '5bps' : '10bps'} for illiquid\n- Stale price detection: >2 days without update triggers escalation\n\n**Valuation Adjustments:**\n- Bid-ask reserve for illiquid positions\n- Credit Valuation Adjustment (CVA)\n- Funding Valuation Adjustment (FVA)\n- ${isHigh ? 'Model uncertainty reserve (MUR) for complex payoffs' : 'No MUR required — standard products'}`, 'AUTO', 82],

        ['funding_source', `**Funding Structure:**\n- ${cat.includes('Fund') || cat.includes('Fixed Income') ? 'Treasury funding via MBS internal FTP (Funds Transfer Pricing)\n- Asset-backed funding for bond positions\n- Repo market access for short-term funding needs' : 'Derivative positions: unfunded (no upfront cash requirement)\n- Margin funding via MBS Treasury (internal FTP)\n- Variation margin: daily cash settlement'}\n\n**FTP Rate:** ${cat.includes('Fund') ? 'SORA + 15bps (12M)' : 'SORA flat (overnight)'}\n**Liquidity Contingency:** Central Treasury backstop facility for margin calls`, 'AUTO', 80],

        ['booking_schema', `**Booking Architecture:**\n- Trade capture: ${cat.includes('Fund') ? 'Summit' : 'Murex MX.3'} → STP to booking system\n- Booking entity: MBS Bank Ltd (${proj.is_cross_border ? 'SG + HK branches' : 'Singapore'})\n- Portfolio hierarchy: Business Unit → Desk → Strategy → Book\n\n**Lifecycle Management:**\n- Trade amendments: Maker-checker workflow with audit trail\n- ${cat.includes('Structured') ? 'Auto-callable event processing and barrier monitoring' : cat.includes('Credit') ? 'Credit event lifecycle (succession, restructuring, auction)' : 'Standard lifecycle events (exercise, expiry, settlement)'}\n- End-of-day processing: automated P&L, risk, and regulatory reporting\n\n**Cross-Product Integration:**\n- ${proj.is_cross_border ? 'Inter-branch booking with transfer pricing' : 'Single-entity booking'}\n- Risk aggregation across product books for VaR and stress testing`, 'AUTO', 82]
    ];
}

function getNpaProfiles(now) {
    const sla3d = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    const sla2d = new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');

    const profiles = [
        // ═══ NPA #1: Full NPA / New-to-Group / Credit Derivatives / HIGH ═══
        // Modeled after TSG2042 NAFMII Repo — new legal framework, new market
        {
            project: {
                id: 'TSG2026-101', title: 'APAC Credit Default Swap Index Trading Platform',
                description: 'New-to-Group product establishing MBS as a market maker in iTraxx Asia ex-Japan CDS Index and single-name CDS on APAC investment-grade credits. The platform enables institutional clients to access credit protection and relative value strategies across APAC sovereign and corporate credit markets. This requires new ISDA Credit Derivatives Definitions, dedicated credit risk infrastructure, and real-time credit event monitoring systems. MBS will act as principal dealer providing two-way pricing on iTraxx Asia IG indices (Series 40+) and single-name CDS on 50+ APAC reference entities. Settlement via DTCC Trade Information Warehouse with physical/auction settlement for credit events.',
                product_category: 'Credit Derivatives', npa_type: 'New-to-Group', risk_level: 'HIGH',
                is_cross_border: true, notional_amount: 300000000.00, currency: 'USD',
                current_stage: 'SIGN_OFF', status: 'At Risk',
                submitted_by: 'Ravi Krishnan', product_manager: 'Ravi Krishnan',
                pm_team: 'APAC Credit Trading Desk', template_name: 'Full NPA v1.0',
                kickoff_date: '2026-01-20', proposal_preparer: 'Ravi Krishnan',
                pac_approval_status: 'Approved', approval_track: 'FULL_NPA',
                estimated_revenue: 8500000.00, predicted_approval_likelihood: 62.00,
                predicted_timeline_days: 14.00, predicted_bottleneck: 'Legal & Compliance',
                classification_confidence: 92.0, classification_method: 'AGENT'
            },
            jurisdictions: ['SG', 'HK'],
            formData: [
                ['product_name', 'APAC Credit Default Swap Index Trading Platform', 'AUTO', 97.0],
                ['product_type', 'Credit Derivatives', 'AUTO', 98.0],
                ['desk', 'APAC Credit Trading Desk — Singapore', 'AUTO', 99.0],
                ['business_unit', 'Global Financial Markets (GFM)', 'AUTO', 99.0],
                ['underlying_asset', 'iTraxx Asia ex-Japan IG Index (Series 40+), single-name CDS on 50+ APAC investment-grade reference entities including sovereign (SG, KR, CN, ID, TH) and corporate credits. Reference obligations are senior unsecured bonds denominated in USD.', 'AUTO', 94.0],
                ['tenor', '5Y standard (matching iTraxx index tenor), 1Y-10Y for single-name CDS. Roll dates: March and September (IMM dates). Coupon: Fixed 100bps (IG) / 500bps (HY) with upfront payment.', 'AUTO', 92.0],
                ['notional_amount', '300000000', 'MANUAL', 100.0],
                ['product_role', 'Principal dealer providing two-way market making on iTraxx Asia indices and single-name CDS. MBS warehouses credit risk positions and hedges through index-single name basis trading, cross-currency basis swaps, and bond-CDS basis positions.', 'AUTO', 93.0],
                ['booking_system', 'Murex — CRD|CDS|INDEX typology for index trades, CRD|CDS|SNGL for single-name. Portfolio: MBSSG_GFM_CREDIT. Generator: iTraxx Asia IG CDS. Settlement via DTCC Trade Information Warehouse.', 'AUTO', 95.0],
                ['settlement_method', 'DTCC Trade Information Warehouse for trade registration and lifecycle events. Physical settlement or auction settlement following ISDA Credit Event Determination Committee rulings. Quarterly premium payments via CLS.', 'AUTO', 91.0],
                ['pricing_methodology', 'ISDA CDS Standard Model (CDSW equivalent) using hazard rate bootstrapping from market CDS spreads. Mark-to-market using CDS spread curves from Markit. Greeks: CS01 (credit delta), CR01 (recovery rate sensitivity), jump-to-default risk. Spread: 2-5 bps for index, 5-15 bps for single-name depending on liquidity.', 'AUTO', 90.0],
                ['risk_classification', 'HIGH — Jump-to-default risk with potentially large P&L impact on credit events. Cross-border counterparty credit risk. Basis risk between index and single-name positions. Regulatory capital intensive under SA-CCR with high add-on factors for credit derivatives.', 'AUTO', 89.0],
                ['market_risk', 'CS01: Credit spread sensitivity across APAC reference entities. Jump-to-default: Potential 60-90% loss on notional for credit events. Index-single name basis: Correlation risk between index and constituent CDS. Recovery rate risk: Uncertain recovery values post-credit event. Wrong-way risk: Counterparty default correlated with reference entity default.', 'AUTO', 88.0],
                ['customer_segments', 'Institutional investors (hedge funds, asset managers) seeking APAC credit exposure or hedging. Banks managing credit portfolio concentration risk. Insurance companies hedging credit exposure in investment portfolios. Corporate treasury hedging counterparty credit risk.', 'AUTO', 92.0],
                ['legal_opinion', 'ISDA 2014 Credit Derivatives Definitions required. Master Confirmation Agreement for iTraxx Asia trades. Single-name CDS trade confirmations via DTCC. Legal opinion from Allen & Gledhill on Singapore enforceability of credit event determination and auction settlement procedures.', 'AUTO', 90.0],
                ['business_rationale', 'APAC credit derivative market has grown 25% annually with institutional demand for credit hedging and relative value strategies. MBS has strong positioning in APAC credit markets through its loan book and bond underwriting franchise. CDS market making enables MBS to offer comprehensive credit solutions to institutional clients, recycle credit risk from its banking book, and generate market-making revenue. Competitive analysis: APAC CDS market dominated by global banks (JPM, GS, Citi) with no regional bank competitor — MBS has first-mover advantage.', 'MANUAL', 100.0],
                ['npa_process_type', 'Full NPA — New-to-Group. CDS trading is an entirely new asset class for MBS requiring new legal frameworks (ISDA Credit Derivatives Definitions), new risk management infrastructure (credit event monitoring, auction settlement), and new booking/settlement systems (DTCC integration). NTG triggers: new product, new role (principal CDS dealer), new infrastructure.', 'MANUAL', 100.0],
                ['business_case_status', 'PAC Approved — Executive Committee approved on January 15, 2026. PAC Reference: ExCo-2026-CR-003. Conditions: (1) Start with iTraxx index only, add single-name after 6-month PIR, (2) Notional limit $500M in Year 1, (3) Mandatory PIR within 6 months.', 'MANUAL', 100.0],
                ['regulatory_capital', 'Trading Book assignment. SA-CCR for counterparty credit risk with alpha=1.4 and credit derivative-specific add-on factors. CVA capital charge under BA-CVA. Incremental Risk Charge (IRC) for default and migration risk in trading book credit positions.', 'AUTO', 86.0],
                ['data_privacy', 'No retail customer data. Institutional counterparty data covered under existing PDPA commercial data exemption. DTCC data sharing governed by DTCC User Agreement. Cross-border data transfer SG↔HK covered by existing SCCs.', 'AUTO', 94.0]
            ],
            documents: [
                ['APAC_CDS_Index_Platform_Term_Sheet_v2.pdf', 'TERM_SHEET', '3.8 MB', 'pdf', 'Product Specs', 'VALID', 'Ravi Krishnan'],
                ['Credit_Event_Risk_Framework_Assessment.pdf', 'RISK_MEMO', '2.9 MB', 'pdf', 'Risk Analysis', 'VALID', 'Janet Teo'],
                ['ISDA_Credit_Derivatives_Definitions_2014.pdf', 'ISDA', '4.1 MB', 'pdf', 'Legal', 'VALID', 'David Chen'],
                ['DTCC_Integration_Technical_Spec.pdf', 'TERM_SHEET', '1.6 MB', 'pdf', 'Technology', 'PENDING', 'Rachel Ng'],
                ['MAS_Notice_637_CDS_Capital_Treatment.pdf', 'RISK_MEMO', '980 KB', 'pdf', 'Regulatory', 'VALID', 'Mark Lee'],
                ['iTraxx_Asia_Market_Analysis_2026.pdf', 'RISK_MEMO', '1.3 MB', 'pdf', 'Risk Analysis', 'VALID', 'Ravi Krishnan']
            ],
            signoffs: [
                ['Market & Liquidity Risk', 'Risk Management', 'APPROVED', 'janet.teo', 'Janet Teo', 'janet.teo@mbs.com', now, sla3d, 0, 'CS01 limits set at $200K/bp. Jump-to-default limits per reference entity approved. IRC model calibrated for APAC credits. Index-single name basis risk limits documented.', 0],
                ['Credit Risk', 'Risk Management', 'APPROVED', 'mike.ross', 'Mike Ross', 'mike.ross@mbs.com', now, sla3d, 0, 'Counterparty credit limits for CDS dealers approved. Wrong-way risk framework validated. Collateral requirements under CSA strengthened for CDS counterparties.', 0],
                ['Technology Architecture', 'Technology & Operations', 'APPROVED', 'rachel.ng', 'Rachel Ng', 'rachel.ng@mbs.com', now, sla3d, 0, 'DTCC integration architecture approved. Murex CDS booking module configured. Credit event monitoring system deployed. Real-time CDS spread feed from Markit validated.', 0],
                ['Operations', 'Technology & Operations', 'UNDER_REVIEW', 'peter.loh', 'Peter Loh', 'peter.loh@mbs.com', null, sla3d, 0, 'Reviewing credit event settlement procedures and DTCC lifecycle event processing. Auction settlement operational readiness pending.', 0],
                ['Legal', 'Legal, Compliance & Secretariat', 'UNDER_REVIEW', 'lisa.wong', 'Lisa Wong', 'lisa.wong@mbs.com', null, sla3d, 0, 'ISDA Credit Derivatives Definitions review in progress. Master Confirmation Agreement template under negotiation. Credit event determination committee procedures being documented.', 0],
                ['Compliance', 'Legal, Compliance & Secretariat', 'APPROVED', 'ahmad.razak', 'Ahmad Razak', 'ahmad.razak@mbs.com', now, sla3d, 0, 'AML/KYC framework covers CDS institutional counterparties. Trade reporting to MAS and DTCC validated. Market manipulation surveillance rules for CDS configured.', 0],
                ['Finance', 'Finance', 'PENDING', null, null, null, null, sla3d, 0, 'Awaiting SA-CCR capital impact analysis and IRC model validation for APAC credit portfolio. ROAE sensitivity analysis requested.', 0]
            ],
            workflowStates: [
                ['INITIATION', 'COMPLETED', '2026-01-20 09:00:00', '2026-01-23 17:00:00', null],
                ['REVIEW', 'COMPLETED', '2026-01-24 09:00:00', '2026-02-05 17:00:00', null],
                ['SIGN_OFF', 'IN_PROGRESS', '2026-02-06 09:00:00', null, JSON.stringify(['Legal — ISDA Credit Derivatives Definitions review pending', 'Finance — SA-CCR capital impact analysis required', 'Operations — Credit event settlement readiness pending'])],
                ['LAUNCH', 'NOT_STARTED', null, null, null],
                ['MONITORING', 'NOT_STARTED', null, null, null]
            ],
            scorecard: {
                total_score: 26, calculated_tier: 'New-to-Group',
                breakdown: {
                    criteria: [
                        { criterion: 'Product Innovation', score: 5, maxScore: 5, reasoning: 'CDS trading is entirely new for MBS — new asset class, new legal framework, new settlement infrastructure.' },
                        { criterion: 'Market Expansion', score: 4, maxScore: 5, reasoning: 'Targets institutional credit derivative market across APAC. New counterparty base (hedge funds, asset managers).' },
                        { criterion: 'Risk Complexity', score: 5, maxScore: 5, reasoning: 'Jump-to-default risk, credit event complexity, wrong-way risk, basis risk, auction settlement. Highest risk complexity tier.' },
                        { criterion: 'Regulatory Impact', score: 3, maxScore: 5, reasoning: 'SA-CCR with credit derivative add-ons. IRC charge. MAS derivatives reporting. No new licensing required — covered under existing CMS license.' },
                        { criterion: 'Technology Change', score: 4, maxScore: 5, reasoning: 'New DTCC integration, credit event monitoring system, Murex CDS module configuration. Significant but using existing infrastructure.' },
                        { criterion: 'Operational Complexity', score: 3, maxScore: 5, reasoning: 'Credit event settlement requires new procedures. DTCC lifecycle management. However, standard OTC derivative operational model applies.' },
                        { criterion: 'Financial Impact', score: 2, maxScore: 5, reasoning: '$300M notional Year 1. $8.5M revenue target. ROAE above hurdle rate but capital-intensive under SA-CCR.' }
                    ],
                    overall_confidence: 92, prohibited_match: { matched: false },
                    mandatory_signoffs: ['Market & Liquidity Risk', 'Credit Risk', 'Technology Architecture', 'Operations', 'Legal', 'Compliance', 'Finance']
                }
            },
            assessments: [
                ['STRATEGIC', 'PASS', 88, '{"observation": "Strong strategic fit — MBS has APAC credit expertise from its loan book and bond franchise. CDS market making is a natural extension. First-mover among regional banks."}'],
                ['RISK', 'WARN', 55, '{"observation": "High risk profile — jump-to-default, wrong-way risk, credit event complexity. Mitigated by conservative position limits and index-focus in Year 1."}'],
                ['LEGAL', 'WARN', 58, '{"observation": "New ISDA framework — Credit Derivatives Definitions 2014 not previously used by MBS. Master Confirmation Agreement template needs negotiation. Credit event determination procedures require legal documentation."}'],
                ['FINANCE', 'PASS', 72, '{"observation": "ROAE 18% by Year 2 above 12% hurdle. However SA-CCR capital charges for CDS are significant. IRC model needs validation for APAC credit correlations."}'],
                ['TECH', 'PASS', 85, '{"observation": "DTCC integration architecture approved. Murex CDS module proven at other banks. Credit event monitoring system deployed on existing infrastructure."}'],
                ['OPS', 'WARN', 62, '{"observation": "Credit event settlement procedures are new and complex. Auction settlement requires real-time coordination with ISDA DC. DTCC lifecycle management training needed."}']
            ],
            breaches: [
                ['ISDA Credit Derivatives Agreement — Legal Review Timeline', 'WARNING', 'Legal review of ISDA Credit Derivatives Definitions and Master Confirmation Agreement behind schedule. External counsel Allen & Gledhill flagged complexity of credit event determination provisions.', 'Agreement finalized by Mar 2026', 'Draft v2 under Legal review', 'Legal & Compliance', 24, 'OPEN'],
                ['SA-CCR Capital Impact — Finance Review Pending', 'WARNING', 'Finance team requires updated SA-CCR capital consumption analysis including IRC charges for APAC credit trading book. Capital allocation may need upward revision from initial $18M to $24M.', '$18M capital allocation', '$24M projected under SA-CCR', 'Finance + CRO Office', 48, 'OPEN']
            ],
            postLaunchConditions: [
                ['Monthly credit risk exposure report to Risk Committee covering CS01, jump-to-default limits, counterparty concentration, and basis risk positions', 'Market & Liquidity Risk'],
                ['Quarterly PIR (mandatory NTG) assessing trading volume, client adoption, revenue vs projections, risk metrics, and operational incidents', 'Product Manager'],
                ['Semi-annual credit event simulation exercise testing auction settlement procedures and DTCC coordination', 'Operations']
            ]
        },

        // ═══ NPA #2: NPA Lite / Variation / FX Derivatives (NDF) / MEDIUM ═══
        // Modeled after standard FX desk product variation
        {
            project: {
                id: 'TSG2026-102', title: 'KRW/USD Non-Deliverable Forward with Knock-In Barrier',
                description: 'Variation of existing vanilla KRW/USD NDF product (TSG2024-018) to include European knock-in barrier feature. The barrier NDF allows corporate treasury clients to achieve enhanced forward rates contingent on spot KRW/USD touching a pre-defined barrier level. This addresses demand from Korean export corporates hedging USD receivables. Uses existing Murex NDF infrastructure with barrier monitoring module. Risk profile change: introduction of Vega risk and discontinuous payoff at barrier. Classified as Variation because it modifies the payoff structure of an approved product without changing asset class or booking model.',
                product_category: 'FX Derivatives', npa_type: 'Variation', risk_level: 'MEDIUM',
                is_cross_border: false, notional_amount: 75000000.00, currency: 'USD',
                current_stage: 'REVIEW', status: 'On Track',
                submitted_by: 'James Park', product_manager: 'James Park',
                pm_team: 'SG FX Trading Desk', template_name: 'NPA Lite v1.0',
                kickoff_date: '2026-02-10', proposal_preparer: 'James Park',
                pac_approval_status: 'Not Required', approval_track: 'NPA_LITE',
                estimated_revenue: 2200000.00, predicted_approval_likelihood: 88.00,
                predicted_timeline_days: 5.00, predicted_bottleneck: 'RMG-MLR',
                classification_confidence: 91.0, classification_method: 'AGENT'
            },
            jurisdictions: ['SG'],
            formData: [
                ['product_name', 'KRW/USD Non-Deliverable Forward with Knock-In Barrier', 'AUTO', 97.0],
                ['product_type', 'FX Derivatives', 'AUTO', 98.0],
                ['desk', 'FX Trading Desk — Singapore', 'AUTO', 99.0],
                ['business_unit', 'Global Financial Markets (GFM)', 'AUTO', 99.0],
                ['underlying_asset', 'KRW/USD (Korean Won vs US Dollar). Non-deliverable pair settled in USD based on KRW fixing rate published by Seoul Money Brokerage Services (SMBS) at 3:30pm KST on fixing date.', 'AUTO', 95.0],
                ['tenor', '1M to 12M standard tenors. Most active: 3M and 6M matching Korean corporate hedging cycles. Barrier observation: continuous during Asian trading hours (09:00-15:30 KST).', 'AUTO', 92.0],
                ['notional_amount', '75000000', 'MANUAL', 100.0],
                ['booking_system', 'Murex — existing FX NDF booking with barrier module. Murex typology: FXD|NDF|BARRIER. Portfolio: MBSSG_GFM_FX. No new system build required.', 'AUTO', 96.0],
                ['settlement_method', 'Cash settlement in USD on value date (T+2). NDF fixing against SMBS KRW rate. SWIFT MT300 confirmation. If barrier not touched, contract expires unexercised.', 'AUTO', 93.0],
                ['pricing_methodology', 'Black-Scholes barrier option model adapted for NDF. Key inputs: KRW/USD spot, forward points, KRW implied volatility surface, barrier level. Greeks: Delta, Gamma, Vega, Theta. Spread: 5-15 pips depending on tenor and notional.', 'AUTO', 90.0],
                ['risk_classification', 'MEDIUM — Introduces Vega risk and discontinuous payoff not present in vanilla NDF. However, barrier options are standard FX derivatives with established hedging methodology.', 'AUTO', 91.0],
                ['customer_segments', 'Korean export corporates hedging USD receivables. APAC institutional investors seeking enhanced yield on KRW exposure. Corporate treasury with KRW/USD hedging mandates.', 'AUTO', 93.0],
                ['legal_opinion', 'Existing ISDA Master Agreement with FX Definitions (2021 Edition) covers barrier NDF. No additional documentation required. Confirmation template updated to include barrier parameters.', 'AUTO', 94.0],
                ['business_rationale', 'Strong demand from 40+ existing KRW NDF clients for enhanced forward rates. Barrier NDFs offered by all major FX dealers (Citi, HSBC, SCB). MBS losing client flow to competitors. Expected $2.2M revenue uplift from spread enhancement.', 'MANUAL', 100.0],
                ['npa_process_type', 'NPA Lite — Variation of existing product TSG2024-018 (Vanilla KRW/USD NDF). Barrier feature modifies payoff structure but retains same underlying, booking model, settlement, and counterparty framework.', 'MANUAL', 100.0]
            ],
            documents: [
                ['KRW_NDF_Barrier_Product_Spec_v1.pdf', 'TERM_SHEET', '1.8 MB', 'pdf', 'Product Specs', 'VALID', 'James Park'],
                ['FX_Barrier_NDF_Risk_Assessment.pdf', 'RISK_MEMO', '1.2 MB', 'pdf', 'Risk Analysis', 'VALID', 'Wei Lin'],
                ['Murex_Barrier_Module_UAT_Report.pdf', 'TERM_SHEET', '950 KB', 'pdf', 'Technology', 'VALID', 'Rachel Ng'],
                ['ISDA_Confirmation_Template_Barrier_NDF.pdf', 'ISDA', '380 KB', 'pdf', 'Legal', 'VALID', 'Lisa Wong']
            ],
            signoffs: [
                ['Market & Liquidity Risk', 'Risk Management', 'APPROVED', 'wei.lin', 'Wei Lin', 'wei.lin@mbs.com', now, sla3d, 0, 'Barrier NDF risk profile acceptable. Vega limits set at $500K per 1% vol move. Monte Carlo VaR model validated for barrier discontinuity.', 0],
                ['Operations', 'Technology & Operations', 'APPROVED', 'peter.loh', 'Peter Loh', 'peter.loh@mbs.com', now, sla3d, 0, 'Murex barrier module UAT completed. NDF fixing process unchanged. Settlement workflow validated for knock-in and expiry scenarios.', 0],
                ['Technology Architecture', 'Technology & Operations', 'APPROVED', 'rachel.ng', 'Rachel Ng', 'rachel.ng@mbs.com', now, sla3d, 0, 'Murex FXD|NDF|BARRIER typology configured and tested. Barrier monitoring engine operational. Extension of existing module — no new build.', 0]
            ],
            workflowStates: [
                ['INITIATION', 'COMPLETED', '2026-02-08 09:00:00', '2026-02-10 12:00:00', null],
                ['REVIEW', 'IN_PROGRESS', '2026-02-10 14:00:00', null, null],
                ['SIGN_OFF', 'NOT_STARTED', null, null, null],
                ['LAUNCH', 'NOT_STARTED', null, null, null],
                ['MONITORING', 'NOT_STARTED', null, null, null]
            ],
            scorecard: {
                total_score: 14, calculated_tier: 'Variation',
                breakdown: {
                    criteria: [
                        { criterion: 'Product Innovation', score: 2, maxScore: 5, reasoning: 'Barrier NDF is standard FX product widely available in market.' },
                        { criterion: 'Market Expansion', score: 1, maxScore: 5, reasoning: 'Same client base, same market. No geographic or segment expansion.' },
                        { criterion: 'Risk Complexity', score: 3, maxScore: 5, reasoning: 'Introduces Vega and discontinuous payoff. Well-understood with established hedging.' },
                        { criterion: 'Regulatory Impact', score: 1, maxScore: 5, reasoning: 'No new regulatory requirements. Existing MAS framework covers barrier NDFs.' },
                        { criterion: 'Technology Change', score: 2, maxScore: 5, reasoning: 'Murex barrier module exists for other FX products. Configuration only.' },
                        { criterion: 'Operational Complexity', score: 2, maxScore: 5, reasoning: 'Automated barrier monitoring. Settlement identical to vanilla NDF.' },
                        { criterion: 'Financial Impact', score: 3, maxScore: 5, reasoning: '$75M notional within desk limits. Incremental $2.2M revenue.' }
                    ],
                    overall_confidence: 91, prohibited_match: { matched: false },
                    mandatory_signoffs: ['Market & Liquidity Risk', 'Operations', 'Technology Architecture']
                }
            },
            assessments: [
                ['STRATEGIC', 'PASS', 88, '{"observation": "Competitive need — MBS losing KRW barrier NDF flow to Citi and HSBC. 40+ existing clients requesting this product."}'],
                ['RISK', 'PASS', 78, '{"observation": "Moderate risk increase from vanilla NDF. Vega and discontinuity risks well-understood. Hedging infrastructure in place."}'],
                ['TECH', 'PASS', 95, '{"observation": "Murex barrier module exists and is proven. Configuration change only. UAT completed."}']
            ],
            breaches: [],
            postLaunchConditions: [
                ['Monthly barrier NDF Vega exposure report to MLR for first 6 months post-launch', 'Market & Liquidity Risk'],
                ['Quarterly review of barrier NDF hedging effectiveness and P&L attribution', 'Product Manager']
            ]
        },

        // ═══ NPA #3: NPA Lite B3 / Existing (Dormant Reactivation) / Interest Rate Swap / LOW ═══
        // Modeled after TSG1917 reactivation pattern — dormant product fast-track
        {
            project: {
                id: 'TSG2026-103', title: 'SGD Interest Rate Swap — HK Desk Reactivation',
                description: 'Fast-track dormant reactivation (NPA Lite B3) of SGD plain vanilla Interest Rate Swap for the Hong Kong Rates desk. Originally approved under TSG2024-031 for Singapore Rates desk, dormant in HK for 18 months. Original PIR completed September 2025. No variations to product features, booking model, or risk profile. All 5 B3 criteria met: (1) existing live trade history, (2) not prohibited, (3) PIR completed, (4) no variation, (5) no booking change. 48-hour no-objection notice sent to original approvers.',
                product_category: 'Interest Rate Derivatives', npa_type: 'Existing', risk_level: 'LOW',
                is_cross_border: true, notional_amount: 200000000.00, currency: 'SGD',
                current_stage: 'LAUNCH', status: 'On Track',
                submitted_by: 'Kevin Lau', product_manager: 'Kevin Lau',
                pm_team: 'HK Rates Trading Desk', template_name: 'NPA Lite B3 v1.0',
                kickoff_date: '2026-02-05', proposal_preparer: 'Kevin Lau',
                pac_approval_status: 'Not Required', approval_track: 'NPA_LITE',
                estimated_revenue: 1800000.00, predicted_approval_likelihood: 97.00,
                predicted_timeline_days: 2.00, predicted_bottleneck: 'Operations',
                classification_confidence: 96.0, classification_method: 'AGENT'
            },
            jurisdictions: ['HK', 'SG'],
            formData: [
                ['product_name', 'SGD Interest Rate Swap (Vanilla) — SORA-based', 'AUTO', 99.0],
                ['product_type', 'Interest Rate Derivatives', 'AUTO', 99.0],
                ['desk', 'Rates Trading Desk — Hong Kong', 'AUTO', 99.0],
                ['business_unit', 'Global Financial Markets (GFM)', 'AUTO', 99.0],
                ['underlying_asset', 'SGD SORA (Singapore Overnight Rate Average). Fixed leg pays fixed coupon; floating leg pays SORA compounded in arrears. Day count: ACT/365 fixed, ACT/365 floating.', 'AUTO', 97.0],
                ['tenor', '1Y to 30Y. Most liquid: 2Y, 5Y, 10Y. Payment frequency: semi-annual. Standard IMM dates for rolls.', 'AUTO', 95.0],
                ['notional_amount', '200000000', 'MANUAL', 100.0],
                ['booking_system', 'Murex — existing IRD|IRS|Vanilla typology. MBSHK booking entity. Portfolio: MBSHK_GFM_RATES. Generator: SGD SORA IRS VANILLA. Identical to SG desk setup.', 'AUTO', 98.0],
                ['settlement_method', 'Cash settlement via CLS on payment dates. SWIFT MT360/MT362 confirmations. Standard ISDA IRS settlement procedures.', 'AUTO', 96.0],
                ['pricing_methodology', 'Discounted Cash Flow using SGD SORA swap curve bootstrapped from Bloomberg. Greeks: IR01 (DV01), Gamma, Theta. Mid-market with 0.5-2 bps spread.', 'AUTO', 95.0],
                ['risk_classification', 'LOW — Vanilla IRS is the most liquid and well-understood derivatives product. Deep SGD SORA market. Proven risk management.', 'AUTO', 97.0],
                ['npa_process_type', 'NPA Lite B3 — Fast-Track Dormant Reactivation. All 5 eligibility criteria met. 48-hour no-objection notice. Reference NPA: TSG2024-031.', 'MANUAL', 100.0],
                ['business_rationale', 'HK Rates desk receiving client requests for SGD IRS hedging from corporates with Singapore operations. Currently referring to SG desk causing delays. Reactivation captures $1.8M annual revenue.', 'MANUAL', 100.0]
            ],
            documents: [
                ['SGD_IRS_HK_Reactivation_Brief.pdf', 'TERM_SHEET', '680 KB', 'pdf', 'Product Specs', 'VALID', 'Kevin Lau'],
                ['TSG2024-031_Original_NPA_Reference.pdf', 'TERM_SHEET', '2.1 MB', 'pdf', 'Product Specs', 'VALID', 'Kevin Lau'],
                ['TSG2024-031_PIR_Completion_Sep2025.pdf', 'RISK_MEMO', '1.4 MB', 'pdf', 'Risk Analysis', 'VALID', 'Andrew Wong']
            ],
            signoffs: [
                ['Market & Liquidity Risk', 'Risk Management', 'APPROVED', 'wei.lin', 'Wei Lin', 'wei.lin@mbs.com', now, sla2d, 0, 'No objection — SGD IRS risk profile unchanged from original approval TSG2024-031.', 0],
                ['Finance', 'Finance', 'APPROVED', 'mark.lee', 'Mark Lee', 'mark.lee@mbs.com', now, sla2d, 0, 'No objection — Cross-border SG↔HK transfer pricing confirmed.', 0],
                ['Operations', 'Technology & Operations', 'APPROVED', 'peter.loh', 'Peter Loh', 'peter.loh@mbs.com', now, sla2d, 0, 'No objection — Murex MBSHK IRS configuration validated and tested.', 0],
                ['Credit Risk', 'Risk Management', 'APPROVED', 'mike.ross', 'Mike Ross', 'mike.ross@mbs.com', now, sla2d, 0, 'No objection — HK counterparty credit framework covers IRS. CSA terms in place.', 0],
                ['Technology Architecture', 'Technology & Operations', 'APPROVED', 'rachel.ng', 'Rachel Ng', 'rachel.ng@mbs.com', now, sla2d, 0, 'No objection — Existing Murex IRS infrastructure. Zero system changes required.', 0]
            ],
            workflowStates: [
                ['INITIATION', 'COMPLETED', '2026-02-05 09:00:00', '2026-02-05 11:00:00', null],
                ['REVIEW', 'COMPLETED', '2026-02-05 14:00:00', '2026-02-06 10:00:00', null],
                ['SIGN_OFF', 'COMPLETED', '2026-02-06 10:00:00', '2026-02-08 10:00:00', null],
                ['LAUNCH', 'IN_PROGRESS', '2026-02-10 09:00:00', null, null],
                ['MONITORING', 'NOT_STARTED', null, null, null]
            ],
            scorecard: {
                total_score: 8, calculated_tier: 'Existing',
                breakdown: {
                    criteria: [
                        { criterion: 'Product Innovation', score: 1, maxScore: 5, reasoning: 'Vanilla SGD IRS — zero innovation. Exact same product as SG desk.' },
                        { criterion: 'Market Expansion', score: 2, maxScore: 5, reasoning: 'Existing product to new location (HK). Same client type.' },
                        { criterion: 'Risk Complexity', score: 1, maxScore: 5, reasoning: 'Lowest risk derivative. Deep liquidity, proven risk management.' },
                        { criterion: 'Regulatory Impact', score: 1, maxScore: 5, reasoning: 'HKMA framework covers IRS. No new licensing.' },
                        { criterion: 'Technology Change', score: 1, maxScore: 5, reasoning: 'Zero tech change — Murex already configured for MBSHK IRS.' },
                        { criterion: 'Operational Complexity', score: 1, maxScore: 5, reasoning: 'Identical operational model to SG desk.' },
                        { criterion: 'Financial Impact', score: 1, maxScore: 5, reasoning: '$200M notional within limits. $1.8M incremental revenue.' }
                    ],
                    overall_confidence: 96, prohibited_match: { matched: false },
                    mandatory_signoffs: ['Market & Liquidity Risk', 'Finance', 'Operations', 'Credit Risk', 'Technology Architecture']
                }
            },
            assessments: [
                ['STRATEGIC', 'PASS', 92, '{"observation": "Clear business need — HK clients requesting SGD IRS for Singapore subsidiary hedging."}'],
                ['RISK', 'PASS', 95, '{"observation": "Lowest risk category. Vanilla IRS with proven infrastructure."}'],
                ['OPS', 'PASS', 97, '{"observation": "Identical to SG desk. Murex configured and tested."}']
            ],
            breaches: [],
            postLaunchConditions: [
                ['Standard post-launch monitoring — quarterly volume and P&L review', 'Product Manager']
            ]
        },

        // ═══ NPA #4: Evergreen / Structured Products (DCD) / LOW ═══
        // Pre-approved Evergreen bundle — Dual Currency Deposit
        {
            project: {
                id: 'TSG2026-104', title: 'Dual Currency Deposit — USD/SGD (Evergreen)',
                description: 'Evergreen renewal of Dual Currency Deposit (DCD) product for Private Banking and Wealth Management clients. DCD combines a time deposit with an embedded FX option, allowing clients to earn enhanced yield in exchange for accepting currency conversion risk at maturity. This is a pre-approved Evergreen bundle (FX Option + LNBR/Deposit) per GFM COO Office approved bundles list. Product has been continuously active since 2019 with current 3-year Evergreen validity. Annual review by NPA Working Group completed January 2026. Within all Evergreen limits: total notional below $500M cap, deal count within 20/month retail cap.',
                product_category: 'Structured Products', npa_type: 'Existing', risk_level: 'LOW',
                is_cross_border: false, notional_amount: 150000000.00, currency: 'USD',
                current_stage: 'MONITORING', status: 'Completed',
                submitted_by: 'Priya Sharma', product_manager: 'Priya Sharma',
                pm_team: 'Wealth Management Products', template_name: 'Evergreen v1.0',
                kickoff_date: '2026-01-15', proposal_preparer: 'Priya Sharma',
                pac_approval_status: 'Not Required', approval_track: 'EVERGREEN',
                estimated_revenue: 4200000.00, predicted_approval_likelihood: 99.00,
                predicted_timeline_days: 0.05, predicted_bottleneck: 'None',
                classification_confidence: 98.0, classification_method: 'AGENT'
            },
            jurisdictions: ['SG'],
            formData: [
                ['product_name', 'Dual Currency Deposit — USD/SGD', 'AUTO', 99.0],
                ['product_type', 'Structured Products', 'AUTO', 99.0],
                ['desk', 'Wealth Management Products — Singapore', 'AUTO', 99.0],
                ['business_unit', 'Consumer Banking Group / Wealth Management', 'AUTO', 99.0],
                ['underlying_asset', 'USD/SGD FX rate. Client deposits USD and sells a USD put / SGD call option to MBS. At maturity, if spot is below strike, client receives SGD at the strike rate; otherwise receives USD principal plus enhanced yield.', 'AUTO', 96.0],
                ['tenor', '1W, 2W, 1M, 3M standard tenors. Most popular: 2W and 1M for Private Banking clients seeking short-term yield enhancement on USD deposits.', 'AUTO', 95.0],
                ['notional_amount', '150000000', 'MANUAL', 100.0],
                ['booking_system', 'Murex — FXD|OPT|DCD typology. Portfolio: MBSSG_WM_STRUCTURED. Standard DCD generator. Fully automated STP from client order to Murex booking.', 'AUTO', 98.0],
                ['risk_classification', 'LOW — Pre-approved Evergreen product. Vanilla FX option embedded in deposit structure. Deep USD/SGD liquidity. Standard hedging via FX option desk.', 'AUTO', 97.0],
                ['customer_segments', 'Private Banking clients (Accredited Investors >$2M AUM), Treasures clients with >$350K deposits. Retail banking clients via digital channel for smaller denominations ($10K minimum).', 'AUTO', 95.0],
                ['npa_process_type', 'Evergreen — Pre-approved bundle (FX Option + Deposit). Auto-approved within Evergreen limits. 3-year validity with annual NPA Working Group review. Last review: January 2026.', 'MANUAL', 100.0],
                ['business_rationale', 'Core wealth management product generating $4.2M annual revenue. 15,000+ active clients. Top 3 structured product by volume. Essential for competitive positioning against UOB and OCBC wealth offerings.', 'MANUAL', 100.0]
            ],
            documents: [
                ['DCD_USD_SGD_Product_Sheet_2026.pdf', 'TERM_SHEET', '520 KB', 'pdf', 'Product Specs', 'VALID', 'Priya Sharma'],
                ['Evergreen_Annual_Review_Jan2026.pdf', 'RISK_MEMO', '890 KB', 'pdf', 'Risk Analysis', 'VALID', 'NPA Working Group'],
                ['DCD_Client_Suitability_Framework.pdf', 'RISK_MEMO', '440 KB', 'pdf', 'Compliance', 'VALID', 'Ahmad Razak']
            ],
            signoffs: [
                ['GFM COO Office', 'GFM COO', 'APPROVED', 'npa.team', 'NPA Working Group', 'npa.team@mbs.com', now, sla2d, 0, 'Evergreen annual review completed. Product within all limits. No significant changes since last approval. Continued Evergreen status confirmed.', 0]
            ],
            workflowStates: [
                ['INITIATION', 'COMPLETED', '2026-01-15 09:00:00', '2026-01-15 09:30:00', null],
                ['REVIEW', 'COMPLETED', '2026-01-15 09:30:00', '2026-01-15 10:00:00', null],
                ['SIGN_OFF', 'COMPLETED', '2026-01-15 10:00:00', '2026-01-15 10:05:00', null],
                ['LAUNCH', 'COMPLETED', '2026-01-15 10:05:00', '2026-01-15 10:10:00', null],
                ['MONITORING', 'IN_PROGRESS', '2026-01-15 10:10:00', null, null]
            ],
            scorecard: {
                total_score: 7, calculated_tier: 'Existing',
                breakdown: {
                    criteria: [
                        { criterion: 'Product Innovation', score: 1, maxScore: 5, reasoning: 'DCD has been offered since 2019. Zero innovation.' },
                        { criterion: 'Market Expansion', score: 1, maxScore: 5, reasoning: 'Same market, same clients, same channels.' },
                        { criterion: 'Risk Complexity', score: 1, maxScore: 5, reasoning: 'Vanilla FX option. Deep USD/SGD liquidity. Standard hedging.' },
                        { criterion: 'Regulatory Impact', score: 1, maxScore: 5, reasoning: 'Fully compliant. Annual review confirms no regulatory changes.' },
                        { criterion: 'Technology Change', score: 1, maxScore: 5, reasoning: 'Zero technology change. Fully automated STP.' },
                        { criterion: 'Operational Complexity', score: 1, maxScore: 5, reasoning: 'Fully automated. 15,000+ clients served without operational issues.' },
                        { criterion: 'Financial Impact', score: 1, maxScore: 5, reasoning: 'Within Evergreen limits. $4.2M steady revenue. No capital impact change.' }
                    ],
                    overall_confidence: 98, prohibited_match: { matched: false },
                    mandatory_signoffs: ['GFM COO Office']
                }
            },
            assessments: [
                ['STRATEGIC', 'PASS', 95, '{"observation": "Core wealth product. Top 3 by volume. Essential for competitive positioning."}'],
                ['RISK', 'PASS', 96, '{"observation": "Lowest risk. Vanilla FX option with deep liquidity. 7 years of operating history."}']
            ],
            breaches: [],
            metrics: { days_since_launch: 2190, total_volume: 2800000000.00, volume_currency: 'USD', realized_pnl: 12600000.00, active_breaches: 0, counterparty_exposure: 150000000.00, var_utilization: 12.00, collateral_posted: 0.00, next_review_date: '2027-01-15', health_status: 'healthy' },
            postLaunchConditions: [
                ['Annual Evergreen review by NPA Working Group — next review January 2027', 'GFM COO Office']
            ]
        },

        // ═══ NPA #5: Bundling / Equity-Linked Note (ELN) / MEDIUM ═══
        // 8-condition bundling gate — Equity Option + LNBR
        {
            project: {
                id: 'TSG2026-105', title: 'Equity-Linked Note — Hang Seng Index (Bundling)',
                description: 'Bundling NPA for Equity-Linked Note (ELN) referencing Hang Seng Index for Hong Kong Private Banking clients. The ELN bundles an equity put option on HSI with a structured note (LNBR), providing clients with enhanced coupon in exchange for principal-at-risk if HSI falls below the knock-in barrier. All 8 bundling conditions satisfied: (1) booked in Murex — EQD|OPT|ELN and FI|NOTE|LNBR, (2) no proxy booking, (3) no leverage, (4) no collateral issues, (5) no third parties, (6) PDD submitted for each block, (7) no SCF, (8) correct cashflow settlement. Arbitration Team review completed.',
                product_category: 'Equity Derivatives', npa_type: 'Variation', risk_level: 'MEDIUM',
                is_cross_border: true, notional_amount: 50000000.00, currency: 'HKD',
                current_stage: 'SIGN_OFF', status: 'On Track',
                submitted_by: 'Michelle Kwok', product_manager: 'Michelle Kwok',
                pm_team: 'HK Structured Products Desk', template_name: 'Bundling NPA v1.0',
                kickoff_date: '2026-02-03', proposal_preparer: 'Michelle Kwok',
                pac_approval_status: 'Not Required', approval_track: 'BUNDLING',
                estimated_revenue: 1500000.00, predicted_approval_likelihood: 85.00,
                predicted_timeline_days: 9.00, predicted_bottleneck: 'Arbitration Team',
                classification_confidence: 88.0, classification_method: 'AGENT'
            },
            jurisdictions: ['HK', 'SG'],
            formData: [
                ['product_name', 'Equity-Linked Note — Hang Seng Index', 'AUTO', 97.0],
                ['product_type', 'Equity Derivatives', 'AUTO', 98.0],
                ['desk', 'Structured Products Desk — Hong Kong', 'AUTO', 99.0],
                ['business_unit', 'Global Financial Markets (GFM)', 'AUTO', 99.0],
                ['underlying_asset', 'Hang Seng Index (HSI). European-style observation with knock-in barrier at 80% of initial HSI fixing. If HSI closes below barrier at any observation date, client receives HSI-linked return instead of full principal at maturity.', 'AUTO', 94.0],
                ['tenor', '3M, 6M, 12M standard. Most popular: 6M for HK Private Banking clients. Observation: monthly fixing dates. Auto-callable feature at 100% of initial fixing.', 'AUTO', 92.0],
                ['notional_amount', '50000000', 'MANUAL', 100.0],
                ['booking_system', 'Murex — Two legs: EQD|OPT|ELN (equity put option) + FI|NOTE|LNBR (structured note). Portfolio: MBSHK_GFM_STRPROD. Both legs booked simultaneously via structured product generator.', 'AUTO', 95.0],
                ['risk_classification', 'MEDIUM — Principal-at-risk product for clients. Equity market risk through HSI exposure. Barrier monitoring required. However, standard ELN structure with established hedging via HSI futures and options.', 'AUTO', 90.0],
                ['customer_segments', 'HK Private Banking clients (Professional Investors under SFO). Accredited Investors seeking yield enhancement on HKD deposits with equity market view. Minimum investment: HKD 500,000.', 'AUTO', 93.0],
                ['npa_process_type', 'Bundling NPA — Equity Option + LNBR structured note. All 8 bundling conditions met. Pre-approved bundle category (Equity-Linked Note = Equity Option + LNBR per GFM COO Office). Arbitration Team review completed.', 'MANUAL', 100.0],
                ['business_rationale', 'HSI ELN is a core HK Private Banking structured product. Strong client demand in current market (HSI trading at multi-year support levels). Revenue from option premium embedded in ELN coupon structure. Competitive product offered by all major HK banks.', 'MANUAL', 100.0],
                ['bundling_rationale', 'Client need: enhanced yield on HKD deposits with bullish HSI view. Bundling vs separate: clients want a single investment product, not separate option and deposit. Economic substance: option premium funds the enhanced coupon. Hedging: equity put option hedged via HSI futures and listed options on HKEX.', 'MANUAL', 100.0]
            ],
            documents: [
                ['HSI_ELN_Term_Sheet_6M_v2.pdf', 'TERM_SHEET', '1.4 MB', 'pdf', 'Product Specs', 'VALID', 'Michelle Kwok'],
                ['Bundling_8Condition_Checklist_ELN.pdf', 'RISK_MEMO', '580 KB', 'pdf', 'Product Specs', 'VALID', 'NPA Team'],
                ['Arbitration_Team_Review_ELN_HSI.pdf', 'RISK_MEMO', '720 KB', 'pdf', 'Risk Analysis', 'VALID', 'GFM COO Office'],
                ['ELN_HSI_Risk_Assessment.pdf', 'RISK_MEMO', '1.1 MB', 'pdf', 'Risk Analysis', 'VALID', 'Janet Teo'],
                ['PDD_Equity_Option_Block.pdf', 'TERM_SHEET', '340 KB', 'pdf', 'Compliance', 'VALID', 'Ahmad Razak'],
                ['PDD_LNBR_Note_Block.pdf', 'TERM_SHEET', '310 KB', 'pdf', 'Compliance', 'VALID', 'Ahmad Razak']
            ],
            signoffs: [
                ['Market & Liquidity Risk', 'Risk Management', 'APPROVED', 'janet.teo', 'Janet Teo', 'janet.teo@mbs.com', now, sla3d, 0, 'HSI ELN risk profile acceptable. Equity delta and vega limits set. Barrier monitoring validated. Hedging via HKEX HSI futures confirmed.', 0],
                ['Compliance', 'Legal, Compliance & Secretariat', 'APPROVED', 'ahmad.razak', 'Ahmad Razak', 'ahmad.razak@mbs.com', now, sla3d, 0, 'PDD forms submitted for both blocks. SFC PI suitability requirements met. Product disclosure document approved.', 0],
                ['Operations', 'Technology & Operations', 'UNDER_REVIEW', 'peter.loh', 'Peter Loh', 'peter.loh@mbs.com', null, sla3d, 0, 'Reviewing ELN lifecycle events — auto-call processing, barrier breach notification, maturity settlement. Murex structured product generator under validation.', 0],
                ['Finance', 'Finance', 'APPROVED', 'mark.lee', 'Mark Lee', 'mark.lee@mbs.com', now, sla3d, 0, 'Revenue model validated. HKD funding costs confirmed. Cross-border booking SG↔HK transfer pricing approved.', 0]
            ],
            workflowStates: [
                ['INITIATION', 'COMPLETED', '2026-02-03 09:00:00', '2026-02-04 17:00:00', null],
                ['REVIEW', 'COMPLETED', '2026-02-05 09:00:00', '2026-02-10 17:00:00', null],
                ['SIGN_OFF', 'IN_PROGRESS', '2026-02-11 09:00:00', null, JSON.stringify(['Operations — ELN lifecycle event processing validation pending'])],
                ['LAUNCH', 'NOT_STARTED', null, null, null],
                ['MONITORING', 'NOT_STARTED', null, null, null]
            ],
            scorecard: {
                total_score: 15, calculated_tier: 'Variation',
                breakdown: {
                    criteria: [
                        { criterion: 'Product Innovation', score: 2, maxScore: 5, reasoning: 'ELN is a standard structured product. HSI as underlying is well-established.' },
                        { criterion: 'Market Expansion', score: 2, maxScore: 5, reasoning: 'HK Private Banking market. MBS has existing client base for structured products.' },
                        { criterion: 'Risk Complexity', score: 3, maxScore: 5, reasoning: 'Principal-at-risk with barrier. Equity delta, vega, and discontinuity risk. Standard hedging available.' },
                        { criterion: 'Regulatory Impact', score: 2, maxScore: 5, reasoning: 'SFC Professional Investor requirements. Product disclosure obligations. No new licensing.' },
                        { criterion: 'Technology Change', score: 2, maxScore: 5, reasoning: 'Murex ELN generator exists. Two-leg booking is standard for structured products.' },
                        { criterion: 'Operational Complexity', score: 2, maxScore: 5, reasoning: 'Auto-call monitoring, barrier breach processing, maturity settlement — standard structured product operations.' },
                        { criterion: 'Financial Impact', score: 2, maxScore: 5, reasoning: 'HKD 50M within limits. $1.5M revenue. Standard capital treatment for equity derivatives.' }
                    ],
                    overall_confidence: 88, prohibited_match: { matched: false },
                    mandatory_signoffs: ['Market & Liquidity Risk', 'Compliance', 'Operations', 'Finance']
                }
            },
            assessments: [
                ['STRATEGIC', 'PASS', 85, '{"observation": "Core HK Private Banking product. Strong client demand with HSI at multi-year support levels."}'],
                ['RISK', 'PASS', 76, '{"observation": "Standard ELN risk profile. Principal-at-risk mitigated by barrier structure and hedging via HKEX."}'],
                ['LEGAL', 'PASS', 90, '{"observation": "Standard ISDA and structured note documentation. SFC product disclosure requirements met."}']
            ],
            breaches: [],
            postLaunchConditions: [
                ['Monthly ELN position and barrier proximity report to MLR', 'Market & Liquidity Risk'],
                ['Quarterly client suitability review for ELN product per SFC requirements', 'Compliance']
            ]
        },

        // ═══ NPA #6: Full NPA / New-to-Group / Commodity Derivatives / HIGH ═══
        // New market entry — commodity swaps for APAC corporates
        {
            project: {
                id: 'TSG2026-106', title: 'Commodity Swap — Crude Oil & LNG Hedging Platform',
                description: 'New-to-Group product establishing MBS commodity derivatives capability for APAC energy corporates. Platform enables hedging of Brent Crude, Dubai Crude, and JKM LNG (Japan Korea Marker) through commodity swaps and Asian options. MBS will act as principal dealer intermediating between APAC energy corporates and global commodity houses. Requires new Murex commodity module, ISDA Commodity Definitions, and dedicated commodity risk management infrastructure. Addresses strong demand from Singapore-based commodity trading houses and APAC airline/shipping companies for regional commodity hedging solutions. New-to-Group triggers: new asset class (commodities), new role (commodity dealer), new infrastructure (commodity pricing feeds, Platts/Argus integration).',
                product_category: 'Commodity Derivatives', npa_type: 'New-to-Group', risk_level: 'HIGH',
                is_cross_border: true, notional_amount: 400000000.00, currency: 'USD',
                current_stage: 'INITIATION', status: 'On Track',
                submitted_by: 'Daniel Tan', product_manager: 'Daniel Tan',
                pm_team: 'APAC Commodities Desk', template_name: 'Full NPA v1.0',
                kickoff_date: '2026-02-15', proposal_preparer: 'Daniel Tan',
                pac_approval_status: 'Approved', approval_track: 'FULL_NPA',
                estimated_revenue: 12000000.00, predicted_approval_likelihood: 58.00,
                predicted_timeline_days: 16.00, predicted_bottleneck: 'Technology & Operations',
                classification_confidence: 94.0, classification_method: 'AGENT'
            },
            jurisdictions: ['SG', 'HK', 'LN'],
            formData: [
                ['product_name', 'Commodity Swap — Crude Oil & LNG Hedging Platform', 'AUTO', 96.0],
                ['product_type', 'Commodity Derivatives', 'AUTO', 97.0],
                ['desk', 'APAC Commodities Desk — Singapore (newly established under GFM)', 'AUTO', 99.0],
                ['business_unit', 'Global Financial Markets (GFM)', 'AUTO', 99.0],
                ['underlying_asset', 'Brent Crude Oil (ICE), Dubai Crude Oil (Platts), JKM LNG (Platts). Pricing: monthly average of Platts assessments for Asian commodity swaps. Settlement index published by S&P Global Platts and Argus Media.', 'AUTO', 93.0],
                ['tenor', '1M to 36M for crude oil swaps. 1M to 24M for LNG swaps. Most active: 3M-12M matching corporate hedging cycles and fiscal year budgets. Calendar spread swaps available for crude oil.', 'AUTO', 91.0],
                ['notional_amount', '400000000', 'MANUAL', 100.0],
                ['booking_system', 'Murex — New commodity module required. Typology: CMD|SWP|CRUDE for oil swaps, CMD|SWP|LNG for gas swaps, CMD|OPT|ASIAN for Asian options. Portfolio: MBSSG_GFM_CMDTY (new). Integration with Platts and Argus pricing feeds required.', 'AUTO', 88.0],
                ['risk_classification', 'HIGH — New asset class with commodity-specific risks: physical delivery risk, basis risk between Brent/Dubai/JKM, seasonal volatility patterns, geopolitical supply disruption risk, storage and logistics risk (for physical-settled contracts). Multi-jurisdictional operations across SG, HK, London.', 'AUTO', 87.0],
                ['customer_segments', 'Singapore commodity trading houses (Trafigura, Vitol, Gunvor). APAC airlines (SIA, Cathay Pacific) hedging jet fuel via crack spread. Shipping companies hedging bunker fuel. Indonesian and Thai energy producers hedging crude oil output. LNG importers (Japan/Korea utilities).', 'AUTO', 91.0],
                ['npa_process_type', 'Full NPA — New-to-Group. Commodity derivatives is an entirely new asset class for MBS. Triggers: new product, new role (commodity dealer), new infrastructure (Murex commodity module, Platts/Argus integration), new market data feeds.', 'MANUAL', 100.0],
                ['business_case_status', 'PAC Approved — Executive Committee approved February 10, 2026. PAC Reference: ExCo-2026-CMD-001. Conditions: (1) Start with financial-settled swaps only (no physical delivery in Year 1), (2) Notional limit $500M Year 1, (3) PIR within 6 months.', 'MANUAL', 100.0],
                ['business_rationale', 'Singapore is the world\'s 3rd largest commodity trading hub. MBS has 500+ corporate clients in energy/commodities sector with no in-house hedging solution — currently losing $12M+ annual revenue to competitors (Macquarie, StanChart, HSBC). APAC LNG market growing rapidly with JKM emerging as regional benchmark. MBS strategic advantage: strong APAC corporate relationships, Singapore commodity hub proximity, regional banking infrastructure.', 'MANUAL', 100.0]
            ],
            documents: [
                ['Commodity_Swap_Platform_Business_Case.pdf', 'TERM_SHEET', '4.5 MB', 'pdf', 'Product Specs', 'VALID', 'Daniel Tan'],
                ['Commodity_Risk_Framework_Draft.pdf', 'RISK_MEMO', '3.2 MB', 'pdf', 'Risk Analysis', 'PENDING', 'Janet Teo'],
                ['Murex_Commodity_Module_RFP.pdf', 'TERM_SHEET', '2.8 MB', 'pdf', 'Technology', 'PENDING', 'Rachel Ng'],
                ['Platts_Argus_Data_Feed_Integration_Spec.pdf', 'TERM_SHEET', '1.1 MB', 'pdf', 'Technology', 'PENDING', 'Rachel Ng'],
                ['ISDA_Commodity_Definitions_Overview.pdf', 'ISDA', '1.9 MB', 'pdf', 'Legal', 'PENDING', 'Lisa Wong']
            ],
            signoffs: [
                ['Market & Liquidity Risk', 'Risk Management', 'PENDING', null, null, null, null, sla3d, 0, 'Commodity risk framework under development. Waiting for Platts data feed validation and commodity VaR model calibration.', 0],
                ['Credit Risk', 'Risk Management', 'PENDING', null, null, null, null, sla3d, 0, 'Commodity counterparty credit assessment framework needed. Commodity trading houses have different risk profiles from traditional banking counterparties.', 0],
                ['Technology Architecture', 'Technology & Operations', 'PENDING', null, null, null, null, sla3d, 0, 'Murex commodity module RFP issued. Platts/Argus data feed integration specification under review. Build timeline estimated at 4-6 months.', 0],
                ['Operations', 'Technology & Operations', 'PENDING', null, null, null, null, sla3d, 0, 'Commodity settlement procedures need to be designed. Platts pricing verification workflow required. Commodity-specific reconciliation processes to be developed.', 0],
                ['Legal', 'Legal, Compliance & Secretariat', 'PENDING', null, null, null, null, sla3d, 0, 'ISDA Commodity Definitions review required. Commodity-specific confirmation templates need drafting. MAS regulatory assessment for commodity derivatives pending.', 0],
                ['Compliance', 'Legal, Compliance & Secretariat', 'PENDING', null, null, null, null, sla3d, 0, 'Commodity trading AML/KYC framework enhancement needed for commodity trading house counterparties. Sanctions screening for commodity flows to be assessed.', 0],
                ['Finance', 'Finance', 'PENDING', null, null, null, null, sla3d, 0, 'Capital treatment for commodity derivatives under SA-CCR to be assessed. ROAE analysis pending commodity-specific capital charges. Transfer pricing for multi-jurisdictional operations.', 0]
            ],
            workflowStates: [
                ['INITIATION', 'IN_PROGRESS', '2026-02-15 09:00:00', null, JSON.stringify(['Murex commodity module build timeline to be confirmed', 'Commodity risk framework design phase', 'ISDA Commodity Definitions legal review scheduling'])],
                ['REVIEW', 'NOT_STARTED', null, null, null],
                ['SIGN_OFF', 'NOT_STARTED', null, null, null],
                ['LAUNCH', 'NOT_STARTED', null, null, null],
                ['MONITORING', 'NOT_STARTED', null, null, null]
            ],
            scorecard: {
                total_score: 29, calculated_tier: 'New-to-Group',
                breakdown: {
                    criteria: [
                        { criterion: 'Product Innovation', score: 5, maxScore: 5, reasoning: 'Commodity derivatives is entirely new for MBS. New asset class, new pricing sources, new settlement mechanisms.' },
                        { criterion: 'Market Expansion', score: 5, maxScore: 5, reasoning: 'New client segment (commodity trading houses, airlines, shipping). New geographic markets (London for Brent, APAC for JKM).' },
                        { criterion: 'Risk Complexity', score: 5, maxScore: 5, reasoning: 'Commodity-specific risks: basis risk, seasonal volatility, geopolitical disruption, physical delivery (future phase). Multi-commodity correlation risk.' },
                        { criterion: 'Regulatory Impact', score: 3, maxScore: 5, reasoning: 'MAS derivatives framework covers commodity derivatives. No new licensing. However, commodity-specific reporting and position limit rules apply.' },
                        { criterion: 'Technology Change', score: 5, maxScore: 5, reasoning: 'New Murex commodity module. New Platts/Argus data feed integration. New commodity pricing engine. 4-6 month build timeline.' },
                        { criterion: 'Operational Complexity', score: 4, maxScore: 5, reasoning: 'New settlement procedures, Platts pricing verification, commodity-specific reconciliation, multi-timezone operations (SG/HK/London).' },
                        { criterion: 'Financial Impact', score: 2, maxScore: 5, reasoning: '$400M notional Year 1. $12M revenue target. Significant technology investment ($3M+) for Murex module and data feeds.' }
                    ],
                    overall_confidence: 94, prohibited_match: { matched: false },
                    mandatory_signoffs: ['Market & Liquidity Risk', 'Credit Risk', 'Technology Architecture', 'Operations', 'Legal', 'Compliance', 'Finance']
                }
            },
            assessments: [
                ['STRATEGIC', 'PASS', 90, '{"observation": "Singapore commodity hub positioning. 500+ existing commodity sector clients. $12M+ revenue opportunity from competitive displacement."}'],
                ['RISK', 'WARN', 48, '{"observation": "New asset class with commodity-specific risks. No internal expertise or infrastructure. Risk framework needs to be built from scratch."}'],
                ['TECH', 'WARN', 42, '{"observation": "Major technology build required. Murex commodity module, Platts/Argus integration, commodity pricing engine. 4-6 month timeline."}'],
                ['LEGAL', 'WARN', 50, '{"observation": "ISDA Commodity Definitions new to MBS Legal. Commodity-specific confirmation templates needed. MAS regulatory assessment pending."}']
            ],
            breaches: [],
            postLaunchConditions: [
                ['Monthly commodity position and risk report to Risk Committee', 'Market & Liquidity Risk'],
                ['Quarterly PIR (mandatory NTG) within 6 months of first trade', 'Product Manager'],
                ['Semi-annual commodity risk model calibration review', 'Market & Liquidity Risk']
            ]
        },

        // ═══ NPA #7: Full NPA / Variation (High-Risk) / Fixed Income / MEDIUM ═══
        // Modeled after TSG2339 Swap Connect — new infrastructure for existing product
        {
            project: {
                id: 'TSG2026-107', title: 'China Onshore Bond Trading via Bond Connect Southbound',
                description: 'High-risk Variation enabling MBS to trade China onshore government bonds (CGBs) and policy bank bonds via Bond Connect Southbound channel. While CNY bonds are an existing product for MBS, Bond Connect Southbound represents a new infrastructure/market access channel that fundamentally changes the operational model — similar to TSG2339 Swap Connect. Requires HKMA Bond Connect membership, CFETS (China Foreign Exchange Trade System) integration, and China Interbank Bond Market (CIBM) settlement via CCDC/Shanghai Clearing House. High-risk Variation triggers: new infrastructure, new settlement mechanism, new regulatory framework (PBOC/SAFE cross-border bond trading rules).',
                product_category: 'Fixed Income', npa_type: 'Variation', risk_level: 'MEDIUM',
                is_cross_border: true, notional_amount: 500000000.00, currency: 'CNY',
                current_stage: 'REVIEW', status: 'At Risk',
                submitted_by: 'William Chen', product_manager: 'William Chen',
                pm_team: 'APAC Fixed Income Desk', template_name: 'Full NPA v1.0',
                kickoff_date: '2026-01-28', proposal_preparer: 'William Chen',
                pac_approval_status: 'Not Required', approval_track: 'FULL_NPA',
                estimated_revenue: 5500000.00, predicted_approval_likelihood: 72.00,
                predicted_timeline_days: 12.00, predicted_bottleneck: 'Technology & Compliance',
                classification_confidence: 87.0, classification_method: 'AGENT'
            },
            jurisdictions: ['SG', 'HK', 'CN'],
            formData: [
                ['product_name', 'China Onshore Bond Trading via Bond Connect Southbound', 'AUTO', 96.0],
                ['product_type', 'Fixed Income', 'AUTO', 98.0],
                ['desk', 'APAC Fixed Income Desk — Singapore', 'AUTO', 99.0],
                ['business_unit', 'Global Financial Markets (GFM)', 'AUTO', 99.0],
                ['underlying_asset', 'China Government Bonds (CGBs), China Development Bank bonds, Agricultural Development Bank bonds, Export-Import Bank bonds. Denominated in CNY (onshore). Traded on CIBM via Bond Connect Southbound.', 'AUTO', 93.0],
                ['tenor', '1Y to 30Y CGBs and policy bank bonds. Most liquid: 5Y, 10Y CGBs. Trading via CFETS request-for-quote (RFQ) and click-to-trade protocols. T+1 settlement via CCDC.', 'AUTO', 91.0],
                ['notional_amount', '500000000', 'MANUAL', 100.0],
                ['booking_system', 'Murex — FI|BOND|CNYGOV typology for CGBs, FI|BOND|CNYPOL for policy bank bonds. Portfolio: MBSSG_GFM_FI_CN. CFETS integration for trade execution. CCDC/SCH for settlement and custody.', 'AUTO', 90.0],
                ['risk_classification', 'MEDIUM — China onshore bonds are high-quality sovereign/quasi-sovereign credit. However, cross-border settlement risk, CNY FX conversion risk (SAFE regulations), and China regulatory framework complexity increase the risk profile beyond standard bond trading.', 'AUTO', 88.0],
                ['customer_segments', 'Institutional investors seeking CNY bond exposure (index inclusion demand from FTSE Russell/Bloomberg Barclays). Central banks diversifying reserves into CNY. APAC asset managers with China allocation mandates.', 'AUTO', 92.0],
                ['npa_process_type', 'Full NPA — High-Risk Variation. Bond trading exists at MBS but Bond Connect Southbound is a new infrastructure channel (similar to TSG2339 Swap Connect). Variation triggers: new infrastructure, new settlement (CCDC), new regulatory framework (PBOC/SAFE).', 'MANUAL', 100.0],
                ['business_rationale', 'CNY bond market is the world\'s 2nd largest ($20T+). Bond Connect Southbound launched 2024 enables international investors to trade onshore bonds. Strong institutional demand driven by CNY bond index inclusion. MBS positioned as leading APAC bank with China expertise. Expected $5.5M revenue from market-making spreads and client facilitation.', 'MANUAL', 100.0]
            ],
            documents: [
                ['Bond_Connect_Southbound_Product_Spec.pdf', 'TERM_SHEET', '3.1 MB', 'pdf', 'Product Specs', 'VALID', 'William Chen'],
                ['CFETS_Integration_Technical_Spec.pdf', 'TERM_SHEET', '2.2 MB', 'pdf', 'Technology', 'PENDING', 'Rachel Ng'],
                ['China_Bond_Risk_Assessment.pdf', 'RISK_MEMO', '1.8 MB', 'pdf', 'Risk Analysis', 'VALID', 'Janet Teo'],
                ['PBOC_SAFE_Regulatory_Analysis.pdf', 'LEGAL_OPINION', '2.5 MB', 'pdf', 'Regulatory', 'PENDING', 'Lisa Wong'],
                ['CCDC_Settlement_Procedures.pdf', 'TERM_SHEET', '1.3 MB', 'pdf', 'Operational', 'PENDING', 'Peter Loh']
            ],
            signoffs: [
                ['Market & Liquidity Risk', 'Risk Management', 'APPROVED', 'janet.teo', 'Janet Teo', 'janet.teo@mbs.com', now, sla3d, 0, 'China bond risk framework acceptable. IR01 limits set for CNY duration. FX hedging requirements documented. Liquidity risk assessment completed for CIBM.', 0],
                ['Credit Risk', 'Risk Management', 'APPROVED', 'mike.ross', 'Mike Ross', 'mike.ross@mbs.com', now, sla3d, 0, 'Sovereign/quasi-sovereign credit risk minimal. CCDC custodian risk assessed. No counterparty credit concerns for Bond Connect.', 0],
                ['Technology Architecture', 'Technology & Operations', 'UNDER_REVIEW', 'rachel.ng', 'Rachel Ng', 'rachel.ng@mbs.com', null, sla3d, 0, 'CFETS integration architecture under review. API connectivity testing in progress. CCDC settlement interface specification being validated.', 0],
                ['Operations', 'Technology & Operations', 'UNDER_REVIEW', 'peter.loh', 'Peter Loh', 'peter.loh@mbs.com', null, sla3d, 0, 'T+1 settlement procedures with CCDC under review. CNY FX conversion workflow (SAFE compliance) being documented. Bond custody procedures for onshore holdings.', 0],
                ['Legal', 'Legal, Compliance & Secretariat', 'UNDER_REVIEW', 'lisa.wong', 'Lisa Wong', 'lisa.wong@mbs.com', null, sla3d, 0, 'PBOC/SAFE regulatory framework analysis in progress. Bond Connect membership agreement under review. Cross-border data transfer assessment (China PIPL compliance).', 0],
                ['Compliance', 'Legal, Compliance & Secretariat', 'APPROVED', 'ahmad.razak', 'Ahmad Razak', 'ahmad.razak@mbs.com', now, sla3d, 0, 'AML/KYC framework covers Bond Connect transactions. PBOC reporting requirements mapped. No sanctions concerns for sovereign bond trading.', 0],
                ['Finance', 'Finance', 'APPROVED', 'mark.lee', 'Mark Lee', 'mark.lee@mbs.com', now, sla3d, 0, 'ROAE analysis: 16% by Year 2 above hurdle. Capital treatment confirmed under standardized approach (0% RW for CGBs). CNY funding cost analysis completed.', 0]
            ],
            workflowStates: [
                ['INITIATION', 'COMPLETED', '2026-01-28 09:00:00', '2026-01-31 17:00:00', null],
                ['REVIEW', 'IN_PROGRESS', '2026-02-03 09:00:00', null, JSON.stringify(['Technology — CFETS API integration testing pending', 'Operations — CCDC T+1 settlement procedure documentation', 'Legal — PBOC/SAFE regulatory framework analysis'])],
                ['SIGN_OFF', 'NOT_STARTED', null, null, null],
                ['LAUNCH', 'NOT_STARTED', null, null, null],
                ['MONITORING', 'NOT_STARTED', null, null, null]
            ],
            scorecard: {
                total_score: 21, calculated_tier: 'Variation',
                breakdown: {
                    criteria: [
                        { criterion: 'Product Innovation', score: 2, maxScore: 5, reasoning: 'CNY bonds are existing product. Bond Connect is new channel/infrastructure.' },
                        { criterion: 'Market Expansion', score: 4, maxScore: 5, reasoning: 'Onshore China bond market access. New institutional investor segment. $20T+ market opportunity.' },
                        { criterion: 'Risk Complexity', score: 3, maxScore: 5, reasoning: 'Cross-border settlement, CNY FX conversion risk, China regulatory complexity. Bond credit risk is minimal (sovereign).' },
                        { criterion: 'Regulatory Impact', score: 4, maxScore: 5, reasoning: 'PBOC/SAFE cross-border framework, HKMA Bond Connect requirements, China PIPL data compliance. Multi-jurisdictional regulatory.' },
                        { criterion: 'Technology Change', score: 4, maxScore: 5, reasoning: 'CFETS integration, CCDC settlement interface, new market data feeds. Significant infrastructure build.' },
                        { criterion: 'Operational Complexity', score: 3, maxScore: 5, reasoning: 'T+1 settlement with CCDC, CNY FX conversion workflow, onshore custody management. New operational procedures.' },
                        { criterion: 'Financial Impact', score: 1, maxScore: 5, reasoning: 'CNY 500M within limits. 0% RWA for CGBs. $5.5M revenue. Low capital impact.' }
                    ],
                    overall_confidence: 87, prohibited_match: { matched: false },
                    mandatory_signoffs: ['Market & Liquidity Risk', 'Credit Risk', 'Technology Architecture', 'Operations', 'Legal', 'Compliance', 'Finance']
                }
            },
            assessments: [
                ['STRATEGIC', 'PASS', 92, '{"observation": "$20T+ China bond market. Index inclusion driving institutional demand. MBS uniquely positioned with APAC + China expertise."}'],
                ['RISK', 'PASS', 75, '{"observation": "Sovereign credit risk minimal. Cross-border settlement and regulatory risks manageable with proper controls."}'],
                ['TECH', 'WARN', 55, '{"observation": "CFETS and CCDC integration are non-trivial. API testing in progress. Build timeline 3-4 months for full integration."}'],
                ['LEGAL', 'WARN', 58, '{"observation": "PBOC/SAFE regulatory framework complex. Multi-jurisdictional (SG/HK/CN) legal compliance. China PIPL data transfer assessment pending."}']
            ],
            breaches: [
                ['CFETS Integration Timeline Risk', 'WARNING', 'CFETS API integration testing behind schedule. Vendor support for sandbox environment delayed by 2 weeks. Full integration target at risk.', 'Integration by Apr 2026', 'Sandbox testing delayed to Mar 2026', 'Technology Architecture', 48, 'OPEN']
            ],
            postLaunchConditions: [
                ['Monthly China bond position and CNY exposure report to Risk Committee', 'Market & Liquidity Risk'],
                ['Quarterly PBOC/SAFE regulatory compliance review', 'Compliance'],
                ['Semi-annual PIR assessing Bond Connect volume, revenue, and operational incidents', 'Product Manager']
            ]
        },

        // ═══ NPA #8: NPA Lite B1 / Existing / Fund Products / LOW ═══
        // Modeled after TSG2055 ETF Subscription — impending deal fast-track
        {
            project: {
                id: 'TSG2026-108', title: 'APAC ESG Bond ETF — Institutional Subscription (Impending Deal)',
                description: 'NPA Lite B1 (Impending Deal) for institutional subscription to Nikko AM APAC ESG Bond ETF on behalf of a professional counterparty client. Back-to-back deal with institutional client — MBS subscribes to ETF units and immediately transfers to client. Qualifies for B1 48-hour express approval as: (1) back-to-back deal with professional counterparty, (2) ETF subscription is existing approved product category at MBS, (3) Singapore-approved NPA applicable regionally. 48-hour no-objection notice sent to relevant SOPs.',
                product_category: 'Fund Products', npa_type: 'Existing', risk_level: 'LOW',
                is_cross_border: false, notional_amount: 25000000.00, currency: 'USD',
                current_stage: 'MONITORING', status: 'Completed',
                submitted_by: 'Sarah Lim', product_manager: 'Sarah Lim',
                pm_team: 'Institutional Sales — Singapore', template_name: 'NPA Lite B1 v1.0',
                kickoff_date: '2026-02-12', proposal_preparer: 'Sarah Lim',
                pac_approval_status: 'Not Required', approval_track: 'NPA_LITE',
                estimated_revenue: 375000.00, predicted_approval_likelihood: 96.00,
                predicted_timeline_days: 2.00, predicted_bottleneck: 'None',
                classification_confidence: 95.0, classification_method: 'AGENT',
                launched_at: '2026-02-14 10:00:00'
            },
            jurisdictions: ['SG'],
            formData: [
                ['product_name', 'APAC ESG Bond ETF — Institutional Subscription', 'AUTO', 98.0],
                ['product_type', 'Fund Products', 'AUTO', 99.0],
                ['desk', 'Institutional Sales — Singapore', 'AUTO', 99.0],
                ['business_unit', 'Institutional Banking Group (IBG)', 'AUTO', 99.0],
                ['underlying_asset', 'Nikko AM APAC ESG Bond ETF (SGX-listed). Tracks Bloomberg MSCI APAC ESG Bond Index. Holdings: APAC sovereign and corporate bonds meeting ESG criteria. NAV: ~$500M AUM.', 'AUTO', 96.0],
                ['tenor', 'Open-ended ETF. Subscription settlement T+2. Client holding period: 12-36 months (institutional mandate).', 'AUTO', 95.0],
                ['notional_amount', '25000000', 'MANUAL', 100.0],
                ['booking_system', 'Summit — FUND|ETF|SUBSCRIPTION typology. Portfolio: MBSSG_IBG_FUNDS. Standard fund subscription workflow via Nikko AM transfer agent.', 'AUTO', 97.0],
                ['risk_classification', 'LOW — Back-to-back deal with immediate transfer to client. MBS holds no market risk beyond settlement period. Standard ETF subscription process.', 'AUTO', 97.0],
                ['customer_segments', 'Institutional investors with ESG mandates. Sovereign wealth funds. Pension funds seeking APAC fixed income ESG allocation.', 'AUTO', 94.0],
                ['npa_process_type', 'NPA Lite B1 — Impending Deal (48-hour express). Back-to-back with professional counterparty. ETF subscription is approved product category. 48-hour no-objection period.', 'MANUAL', 100.0],
                ['business_rationale', 'Client (APAC sovereign wealth fund) requires immediate ESG bond allocation. $25M subscription represents 5% of ETF AUM. Revenue from subscription fee (1.5%) = $375K. Strategic relationship building with major institutional client.', 'MANUAL', 100.0]
            ],
            documents: [
                ['APAC_ESG_Bond_ETF_Subscription_Form.pdf', 'TERM_SHEET', '420 KB', 'pdf', 'Product Specs', 'VALID', 'Sarah Lim'],
                ['Client_Suitability_Assessment.pdf', 'RISK_MEMO', '280 KB', 'pdf', 'Compliance', 'VALID', 'Ahmad Razak']
            ],
            signoffs: [
                ['Compliance', 'Legal, Compliance & Secretariat', 'APPROVED', 'ahmad.razak', 'Ahmad Razak', 'ahmad.razak@mbs.com', now, sla2d, 0, 'No objection — Professional investor suitability confirmed. ESG bond ETF compliant with MAS guidelines. Standard subscription process.', 0],
                ['Operations', 'Technology & Operations', 'APPROVED', 'peter.loh', 'Peter Loh', 'peter.loh@mbs.com', now, sla2d, 0, 'No objection — Standard ETF subscription via Nikko AM transfer agent. Settlement T+2. Back-to-back transfer to client.', 0]
            ],
            workflowStates: [
                ['INITIATION', 'COMPLETED', '2026-02-12 09:00:00', '2026-02-12 10:00:00', null],
                ['REVIEW', 'COMPLETED', '2026-02-12 10:00:00', '2026-02-12 14:00:00', null],
                ['SIGN_OFF', 'COMPLETED', '2026-02-12 14:00:00', '2026-02-14 09:00:00', null],
                ['LAUNCH', 'COMPLETED', '2026-02-14 09:00:00', '2026-02-14 10:00:00', null],
                ['MONITORING', 'IN_PROGRESS', '2026-02-14 10:00:00', null, null]
            ],
            scorecard: {
                total_score: 7, calculated_tier: 'Existing',
                breakdown: {
                    criteria: [
                        { criterion: 'Product Innovation', score: 1, maxScore: 5, reasoning: 'ETF subscription is standard. No innovation.' },
                        { criterion: 'Market Expansion', score: 1, maxScore: 5, reasoning: 'Existing institutional client, existing product.' },
                        { criterion: 'Risk Complexity', score: 1, maxScore: 5, reasoning: 'Back-to-back deal. Zero market risk for MBS.' },
                        { criterion: 'Regulatory Impact', score: 1, maxScore: 5, reasoning: 'Standard MAS fund distribution framework.' },
                        { criterion: 'Technology Change', score: 1, maxScore: 5, reasoning: 'Existing Summit booking. No changes.' },
                        { criterion: 'Operational Complexity', score: 1, maxScore: 5, reasoning: 'Standard subscription via transfer agent.' },
                        { criterion: 'Financial Impact', score: 1, maxScore: 5, reasoning: '$25M within limits. $375K revenue. Minimal capital.' }
                    ],
                    overall_confidence: 95, prohibited_match: { matched: false },
                    mandatory_signoffs: ['Compliance', 'Operations']
                }
            },
            assessments: [
                ['STRATEGIC', 'PASS', 90, '{"observation": "Strategic relationship with major SWF client. ESG mandate alignment. Revenue from subscription fees."}'],
                ['RISK', 'PASS', 97, '{"observation": "Back-to-back deal. Zero residual market risk. Standard ETF settlement."}']
            ],
            breaches: [],
            metrics: { days_since_launch: 6, total_volume: 25000000.00, volume_currency: 'USD', realized_pnl: 375000.00, active_breaches: 0, counterparty_exposure: 0.00, var_utilization: 0.00, collateral_posted: 0.00, next_review_date: '2026-08-14', health_status: 'healthy' },
            postLaunchConditions: [
                ['Standard post-trade confirmation and settlement verification', 'Operations']
            ]
        }
    ];

    // Enrich: merge extra formData fields into each profile (fills empty template sections)
    for (const profile of profiles) {
        const extra = getExtraFormData(profile.project);
        const existingKeys = new Set(profile.formData.map(fd => fd[0]));
        for (const field of extra) {
            if (!existingKeys.has(field[0])) {
                profile.formData.push(field);
            }
        }
    }

    return profiles;
}

module.exports = { getNpaProfiles };
