/**
 * NPA Template Definition — Part C + Appendices
 * ──────────────────────────────────────────────
 * Mirrors the official "NPA Template (RMG OR Version Jun 2025)" — 20-page
 * Confluence document used by MBS for New Product Approvals.
 *
 * Part A (Basic Product Info) and Part B (Sign-off Parties) are handled
 * outside of this template editor.  This tree covers:
 *   • Part C  — Sections I–VII  (product detail completed by Proposing Unit)
 *   • Appendices 1–6            (entity, IP, financial crime, risk data, trading, 3rd-party)
 *
 * Each leaf node maps to one or more atomic `field_key` values stored in
 * `npa_form_data`.  The Doc View renderer walks this tree to produce the
 * hierarchical document layout; the Form View continues to use the flat
 * NpaSection[]/NpaField[] arrays unchanged.
 */

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────

export type TemplateNodeType =
  | 'part'           // Part C wrapper
  | 'section'        // Roman numeral section (I, II, III…)
  | 'topic'          // Numbered topic within a section (1, 2, 3…)
  | 'sub_question'   // Lettered sub-question (a, b, c…)
  | 'detail'         // Numbered sub-detail (1.1, 1.2…)
  | 'table'          // Structured table (risk matrix, entity table)
  | 'appendix';      // Appendix 1–6

export interface TableRowMapping {
  rowLabel: string;
  fieldKey: string;
}

export interface TemplateNode {
  /** Unique node ID following a dotted path: 'PC.I.1.a' */
  id: string;
  /** Node type — drives CSS and indentation in the renderer */
  type: TemplateNodeType;
  /** Display label, e.g. "Product Specifications (Basic Information)" */
  label: string;
  /** Pre-computed numbering string: "I", "1", "a)", "1.1", "Appendix 1" */
  numbering: string;
  /** Italic guidance / instructional text from the official template */
  guidance?: string;
  /** Atomic field_keys whose values render under this node */
  fieldKeys?: string[];
  /** Child nodes (recursion) */
  children?: TemplateNode[];
  /** For table-type nodes: column header labels */
  tableColumns?: string[];
  /** For table-type nodes: row label → field_key mapping */
  tableFieldMapping?: TableRowMapping[];
}

// ────────────────────────────────────────────────────────────
// Part C — Product Information to be Completed by Proposing Unit
// ────────────────────────────────────────────────────────────

export const NPA_PART_C_TEMPLATE: TemplateNode = {
  id: 'PART_C',
  type: 'part',
  label: 'Part C: Product Information to be Completed by Proposing Unit',
  numbering: '',
  children: [

    // ═══════════════════════════════════════════════════════
    // I  Product Specifications (Basic Information)
    // ═══════════════════════════════════════════════════════
    {
      id: 'PC.I',
      type: 'section',
      label: 'Product Specifications (Basic Information)',
      numbering: 'I',
      children: [

        // ── 1. Description ────────────────────────────────
        {
          id: 'PC.I.1',
          type: 'topic',
          label: 'Description',
          numbering: '1',
          children: [
            {
              id: 'PC.I.1.a',
              type: 'sub_question',
              label: 'Purpose or Rationale for Proposal',
              numbering: 'a)',
              guidance: 'Describe the purpose or rationale for the proposal — what are the benefits to customers or BU/SU? Set out what problem it aims to solve. The summary should address the problem statement or articulate the value proposition.',
              fieldKeys: ['business_rationale', 'problem_statement', 'value_proposition', 'customer_benefit', 'bu_benefit', 'competitive_landscape', 'market_opportunity']
            },
            {
              id: 'PC.I.1.b',
              type: 'sub_question',
              label: 'Scope and Parameters of Product/Service',
              numbering: 'b)',
              guidance: 'Describe the scope and parameters including: Role of PU (manufacturer, distributor, principal, agent); Product Features (currency denomination, funded vs unfunded, tenor, repricing info); Product Life Cycle.',
              fieldKeys: ['product_name', 'product_type', 'underlying_asset', 'currency_denomination', 'tenor', 'funding_type', 'repricing_info', 'product_role', 'product_maturity', 'product_lifecycle', 'product_features', 'product_currency_pair', 'product_benchmark']
            },
            {
              id: 'PC.I.1.c',
              type: 'sub_question',
              label: 'Expected Transaction Volume and Revenue per Annum',
              numbering: 'c)',
              guidance: 'Provide revenue estimate by year, gross and net of transfer pricing.',
              fieldKeys: ['notional_amount', 'expected_volume', 'revenue_year1', 'revenue_year1_net', 'revenue_year2', 'revenue_year2_net', 'revenue_year3', 'revenue_year3_net', 'product_notional_ccy', 'transfer_pricing']
            },
            {
              id: 'PC.I.1.d',
              type: 'sub_question',
              label: 'Business Model',
              numbering: 'd)',
              guidance: 'Highlight how the product/service (including SPV/SPE if applicable) sources revenue for MBS. Include revenue streams, gross margin split, and target ROI.',
              fieldKeys: ['target_roi', 'revenue_streams', 'gross_margin_split', 'cost_allocation', 'break_even_timeline']
            },
            {
              id: 'PC.I.1.e',
              type: 'sub_question',
              label: 'Special Purpose Vehicles (SPV)',
              numbering: 'e)',
              guidance: 'Highlight any SPVs involved including the Arranger, country of incorporation, and responsibility for booking/monitoring.',
              fieldKeys: ['spv_involved', 'spv_details', 'spv_arranger', 'spv_country']
            }
          ]
        },

        // ── 2. Target Customer ────────────────────────────
        {
          id: 'PC.I.2',
          type: 'topic',
          label: 'Target Customer',
          numbering: '2',
          children: [
            {
              id: 'PC.I.2.a',
              type: 'sub_question',
              label: 'Target Customer Segment',
              numbering: 'a)',
              guidance: 'Identify the target customer segments for this product.',
              fieldKeys: ['customer_segments']
            },
            {
              id: 'PC.I.2.b',
              type: 'sub_question',
              label: 'Regulatory Restrictions',
              numbering: 'b)',
              guidance: 'Describe any regulatory-driven restrictions on customer eligibility.',
              fieldKeys: ['customer_restrictions']
            },
            {
              id: 'PC.I.2.c',
              type: 'sub_question',
              label: 'Customer Suitability & Domicile',
              numbering: 'c)',
              guidance: 'Describe suitability criteria and domicile requirements for target customers.',
              fieldKeys: ['customer_suitability', 'customer_accreditation']
            },
            {
              id: 'PC.I.2.d',
              type: 'sub_question',
              label: 'Target Customer Profile',
              numbering: 'd)',
              guidance: 'Describe the target customer profile including minimum turnover and risk-based criteria.',
              fieldKeys: ['customer_min_turnover']
            },
            {
              id: 'PC.I.2.e',
              type: 'sub_question',
              label: 'Customer Objectives & Risk Profile',
              numbering: 'e)',
              guidance: 'Describe the target customers\u0027 investment objectives and risk appetite.',
              fieldKeys: ['customer_objectives']
            },
            {
              id: 'PC.I.2.f',
              type: 'sub_question',
              label: 'Target Markets / Locations',
              numbering: 'f)',
              guidance: 'Specify the geographic markets and locations where the product will be offered.',
              fieldKeys: ['customer_geographic']
            },
            {
              id: 'PC.I.2.g',
              type: 'sub_question',
              label: 'Key Risks Faced by Target Customers',
              numbering: 'g)',
              guidance: 'Describe the key risks that target customers face with this product.',
              fieldKeys: ['customer_key_risks']
            }
          ]
        },

        // ── 3. Commercialization Approach ─────────────────
        {
          id: 'PC.I.3',
          type: 'topic',
          label: 'Commercialization Approach',
          numbering: '3',
          children: [
            {
              id: 'PC.I.3.a',
              type: 'sub_question',
              label: 'Channel Availability',
              numbering: 'a)',
              guidance: 'Specify which channels will sell this product (e.g. MBS Bank, MBSV, etc.) and, if more than one entity/location, include the rationale.',
              fieldKeys: ['distribution_channels', 'channel_rationale']
            },
            {
              id: 'PC.I.3.b',
              type: 'sub_question',
              label: 'Sales Suitability',
              numbering: 'b)',
              guidance: 'Document the customer onboarding process and suitability assessment. Describe how qualified customers have access to the product/service.',
              fieldKeys: ['sales_suitability', 'onboarding_process', 'kyc_requirements', 'complaints_handling']
            },
            {
              id: 'PC.I.3.c',
              type: 'sub_question',
              label: 'Marketing & Communication',
              numbering: 'c)',
              guidance: 'Describe the marketing and communication plan for the product/service.',
              fieldKeys: ['marketing_plan']
            },
            {
              id: 'PC.I.3.d',
              type: 'sub_question',
              label: 'Sales Surveillance',
              numbering: 'd)',
              guidance: 'Describe the sales surveillance process to monitor sales practices and customer outcomes.',
              fieldKeys: ['sales_surveillance']
            },
            {
              id: 'PC.I.3.e',
              type: 'sub_question',
              label: 'Staff Training',
              numbering: 'e)',
              guidance: 'Describe staff training requirements for product knowledge, sales practices, and regulatory compliance.',
              fieldKeys: ['staff_training']
            }
          ]
        },

        // ── 4. Conditions Imposed by PAC ──────────────────
        {
          id: 'PC.I.4',
          type: 'topic',
          label: 'Conditions Imposed by Product Approval Committee (PAC)',
          numbering: '4',
          guidance: 'For New-to-Group product/service, list any conditions imposed by the PAC.',
          fieldKeys: ['pac_reference', 'pac_conditions', 'pac_date']
        },

        // ── 5. External Parties ───────────────────────────
        {
          id: 'PC.I.5',
          type: 'topic',
          label: 'Involvement of External Parties in the Initiative',
          numbering: '5',
          guidance: 'Provide details of all external parties involved in the end-to-end process. Include Risk Profiling ID reference as per the Risk Data Assessment Sourcing Principles (RASP) baseline. Is any commercially related data (e.g. "green", "bond", "sustainable", "ESG") being utilized?',
          fieldKeys: ['external_parties_involved', 'ip_considerations', 'external_party_names', 'rasp_reference', 'esg_data_used']
        }
      ]
    },

    // ═══════════════════════════════════════════════════════
    // II  Operational & Technology Information
    // ═══════════════════════════════════════════════════════
    {
      id: 'PC.II',
      type: 'section',
      label: 'Operational & Technology Information',
      numbering: 'II',
      children: [

        // ── 1. Operational Information ────────────────────
        {
          id: 'PC.II.1',
          type: 'topic',
          label: 'Operational Information',
          numbering: '1',
          children: [
            {
              id: 'PC.II.1.a',
              type: 'sub_question',
              label: 'Operating Model',
              numbering: 'a)',
              guidance: 'Provide details on how trading parties are involved in the end-to-end process. Describe functional responsibilities between Front Office, Middle Office, Back Office, Operations, and any third parties, including additional requirements (e.g. collateral management).',
              fieldKeys: ['front_office_model', 'middle_office_model', 'back_office_model', 'third_party_ops', 'collateral_mgmt_ops']
            },
            {
              id: 'PC.II.1.b',
              type: 'sub_question',
              label: 'Booking Process in Operations',
              numbering: 'b)',
              guidance: 'Provide details of end-to-end transaction flow — front-to-back settlement, accounting, valuation, including exception and manual handling.',
              fieldKeys: ['booking_legal_form', 'booking_family', 'booking_typology', 'portfolio_allocation', 'confirmation_process', 'reconciliation', 'exception_handling', 'accounting_treatment', 'settlement_flow', 'stp_rate', 'nostro_accounts']
            },
            {
              id: 'PC.II.1.c',
              type: 'sub_question',
              label: 'Operational Adequacy',
              numbering: 'c)',
              guidance: 'Confirm operational adequacy by checking each applicable item: staffing, process documentation, system readiness, controls, monitoring, escalation procedures, and audit trails.',
              fieldKeys: ['ops_adequacy_checklist']
            },
            {
              id: 'PC.II.1.d',
              type: 'sub_question',
              label: 'Operating Account Controls',
              numbering: 'd)',
              guidance: 'Describe the controls in place for operating accounts (GL alignment, deposit accounts, reconciliation controls).',
              fieldKeys: ['operating_account_controls']
            },
            {
              id: 'PC.II.1.e',
              type: 'sub_question',
              label: 'Limit Structure & Monitoring',
              numbering: 'e)',
              guidance: 'Describe the limit structure, limit monitoring process, and breach escalation procedures.',
              fieldKeys: ['limit_structure', 'limit_monitoring']
            },
            {
              id: 'PC.II.1.f',
              type: 'sub_question',
              label: 'Manual Process Fallback',
              numbering: 'f)',
              guidance: 'Are there any manual process fallbacks? If yes, describe the manual processes and planned automation timeline.',
              fieldKeys: ['manual_fallback', 'manual_fallback_details']
            },
            {
              id: 'PC.II.1.g',
              type: 'sub_question',
              label: 'Collateral Management',
              numbering: 'g)',
              guidance: 'Describe the collateral management framework: eligible collateral, haircuts, margining frequency, and dispute resolution.',
              fieldKeys: ['collateral_eligibility', 'collateral_haircuts', 'margin_frequency', 'collateral_disputes']
            },
            {
              id: 'PC.II.1.h',
              type: 'sub_question',
              label: 'Custody Account',
              numbering: 'h)',
              guidance: 'Is a custody account required? If yes, describe the custody arrangement and controls.',
              fieldKeys: ['custody_required', 'custody_details']
            },
            {
              id: 'PC.II.1.i',
              type: 'sub_question',
              label: 'Trade Repository / ESFR Reporting',
              numbering: 'i)',
              guidance: 'Describe trade repository obligations, ESFR reporting requirements, and data submission processes.',
              fieldKeys: ['trade_repository_reporting']
            },
            {
              id: 'PC.II.1.j',
              type: 'sub_question',
              label: 'SFEMC / Code of Conduct',
              numbering: 'j)',
              guidance: 'Describe relevant SFEMC references, code of conduct obligations, and industry best practices.',
              fieldKeys: ['sfemc_references']
            }
          ]
        },

        // ── 2. Technical Platform ─────────────────────────
        {
          id: 'PC.II.2',
          type: 'topic',
          label: 'Technical Platform',
          numbering: '2',
          children: [
            {
              id: 'PC.II.2.a',
              type: 'sub_question',
              label: 'System Requirements',
              numbering: 'a)',
              guidance: 'Does the proposal involve new changes to application systems, technology solutions, and/or IT infrastructure? If yes, describe the scope and integration.',
              fieldKeys: ['new_system_changes', 'booking_system', 'tech_requirements', 'system_integration', 'trade_capture_system', 'risk_system', 'reporting_system']
            },
            {
              id: 'PC.II.2.b',
              type: 'sub_question',
              label: 'Front Office / Internet Facing System',
              numbering: 'b)',
              guidance: 'Describe the front office or internet-facing system for impact analysis. Include details of system changes.',
              fieldKeys: ['valuation_model', 'fo_system_changes', 'mktdata_requirements']
            },
            {
              id: 'PC.II.2.c',
              type: 'sub_question',
              label: 'Back End / Supporting Systems',
              numbering: 'c)',
              guidance: 'Describe back-end and supporting systems for impact analysis. Include details of systems and any manual work-around.',
              fieldKeys: ['settlement_method', 'be_system_changes', 'manual_workarounds']
            }
          ]
        },

        // ── 3. Information Security ───────────────────────
        {
          id: 'PC.II.3',
          type: 'topic',
          label: 'Information Security',
          numbering: '3',
          guidance: 'Does the proposal involve any system or major system enhancements? Describe any requirements related to information security. Are there any deviations from ISS policies?',
          fieldKeys: ['system_enhancements', 'iss_deviations', 'pentest_status', 'security_assessment']
        },

        // ── 4. Technology Resiliency ──────────────────────
        {
          id: 'PC.II.4',
          type: 'topic',
          label: 'Technology Resiliency',
          numbering: '4',
          guidance: 'Describe external party risk management (include GRC ID), system design and recovery details (RTO/RPO), and DR testing plan.',
          fieldKeys: ['grc_id', 'hsm_required', 'rto_target', 'rpo_target', 'dr_testing_plan']
        },

        // ── 5. Business Continuity Management ─────────────
        {
          id: 'PC.II.5',
          type: 'topic',
          label: 'Business Continuity Management',
          numbering: '5',
          guidance: 'Describe BIA considerations, updated BCP requirements, and any additional continuity measures.',
          fieldKeys: ['bia_considerations', 'bcp_requirements', 'continuity_measures',
            'bcm_critical_processes', 'bcm_recovery_strategy', 'bcm_alternate_site',
            'bcm_communication_plan', 'bcm_testing_frequency', 'bcm_vendor_dependencies',
            'bcm_staff_awareness', 'bcm_regulatory_compliance', 'bcm_incident_response']
        }
      ]
    },

    // ═══════════════════════════════════════════════════════
    // III  Pricing Model Details
    // ═══════════════════════════════════════════════════════
    {
      id: 'PC.III',
      type: 'section',
      label: 'Pricing Model Details',
      numbering: 'III',
      children: [
        {
          id: 'PC.III.1',
          type: 'topic',
          label: 'Pricing Model Validation / Assurance',
          numbering: '1',
          guidance: 'Is there a requirement for pricing model validation? If yes, has pricing model assurance been done?',
          fieldKeys: ['pricing_model_required', 'pricing_methodology', 'roae_analysis', 'pricing_assumptions', 'bespoke_adjustments', 'fva_adjustment', 'xva_treatment', 'day_count_convention']
        },
        {
          id: 'PC.III.2',
          type: 'topic',
          label: 'Model Name and Validation Date',
          numbering: '2',
          guidance: 'State the model name, validation date, and any model restrictions approved by risk team. Refer to the Risk Data Assessment tool.',
          fieldKeys: ['pricing_model_name', 'model_validation_date', 'model_restrictions', 'risk_data_assessment_ref']
        },
        {
          id: 'PC.III.3',
          type: 'topic',
          label: 'Standardised Initial Margin Model (SIMM) Treatment',
          numbering: '3',
          guidance: 'Describe the SIMM sensitivities and margin treatment for this product.',
          fieldKeys: ['simm_treatment', 'simm_sensitivities', 'simm_backtesting']
        }
      ]
    },

    // ═══════════════════════════════════════════════════════
    // IV  Risk Analysis
    // ═══════════════════════════════════════════════════════
    {
      id: 'PC.IV',
      type: 'section',
      label: 'Risk Analysis',
      numbering: 'IV',
      children: [

        // ── A. Operational Risk ───────────────────────────
        {
          id: 'PC.IV.A',
          type: 'topic',
          label: 'Operational Risk',
          numbering: 'A',
          children: [
            {
              id: 'PC.IV.A.1',
              type: 'sub_question',
              label: 'Legal & Compliance Considerations',
              numbering: '1',
              guidance: 'Address regulatory compliance, licensing requirements, cross-border regulations, legal documentation requirements, and any sanctions or AML considerations.',
              fieldKeys: ['legal_opinion', 'licensing_requirements', 'primary_regulation', 'secondary_regulations', 'regulatory_reporting', 'cross_border_regulations', 'legal_docs_required', 'sanctions_check', 'aml_considerations']
            },
            {
              id: 'PC.IV.A.2',
              type: 'sub_question',
              label: 'Finance and Tax',
              numbering: '2',
              guidance: 'Describe the accounting treatment (Trading Book vs Banking Book, Fair Value, On/Off Balance Sheet) and tax considerations across jurisdictions.',
              fieldKeys: ['tax_impact', 'accounting_book', 'fair_value_treatment', 'on_off_balance', 'tax_jurisdictions',
                'service_output_fees', 'service_fee_structure', 'service_fee_allocation',
                'reg_matching_ifrs', 'reg_matching_mas', 'reg_matching_gst', 'reg_matching_wht']
            },
            {
              id: 'PC.IV.A.3',
              type: 'sub_question',
              label: 'Financial Crimes & Financial Security',
              numbering: '3',
              guidance: 'Address conduct considerations, market abuse regulation (MAR) assessment with MAS references, and MRA boundary tests.',
              fieldKeys: ['fc_conduct_considerations', 'fc_mar_assessment', 'fc_mar_sub_items', 'fc_mra_boundary_test', 'fc_mra_details']
            },
            {
              id: 'PC.IV.A.D',
              type: 'sub_question',
              label: 'Funding Liquidity Risk',
              numbering: 'D',
              guidance: 'Describe LCR/NSFR/EAFL metrics, liquidity coverage ratio, HQLA qualification, cashflow modeling, liquidity facilities, and limit implementation.',
              fieldKeys: ['flr_lcr_nsfr_metrics', 'flr_hqla_qualification', 'flr_cashflow_modeling', 'flr_liquidity_facility', 'flr_limit_implementation']
            }
          ]
        },

        // ── B. Market & Liquidity ─────────────────────────
        {
          id: 'PC.IV.B',
          type: 'topic',
          label: 'Market & Liquidity',
          numbering: 'B',
          children: [
            {
              id: 'PC.IV.B.1',
              type: 'sub_question',
              label: 'Market Risk',
              numbering: '1',
              guidance: 'If applicable, complete the market risk factor table. Indicate the relevant pricing parameters, sensitivity reports, VaR capture, and stress capture for each risk factor.',
              fieldKeys: ['market_risk', 'risk_classification', 'pricing_parameters', 'model_risk']
            },
            {
              id: 'PC.IV.B.1.table',
              type: 'table',
              label: 'Market Risk Factor Matrix',
              numbering: '',
              tableColumns: ['Risk Factor', 'Applicable?', 'Sensitivity Reports?', 'Captured in VaR?', 'Captured in Stress?'],
              tableFieldMapping: [
                { rowLabel: 'IR Delta', fieldKey: 'mrf_ir_delta' },
                { rowLabel: 'IR Vega', fieldKey: 'mrf_ir_vega' },
                { rowLabel: 'IR Gamma', fieldKey: 'mrf_ir_gamma' },
                { rowLabel: 'FX Delta', fieldKey: 'mrf_fx_delta' },
                { rowLabel: 'FX Vega', fieldKey: 'mrf_fx_vega' },
                { rowLabel: 'Equity Delta', fieldKey: 'mrf_eq_delta' },
                { rowLabel: 'Equity Vega', fieldKey: 'mrf_eq_vega' },
                { rowLabel: 'Commodity', fieldKey: 'mrf_commodity' },
                { rowLabel: 'Credit', fieldKey: 'mrf_credit' },
                { rowLabel: 'Correlation', fieldKey: 'mrf_correlation' }
              ]
            },
            {
              id: 'PC.IV.B.2',
              type: 'sub_question',
              label: 'Funding / Liquidity Risk',
              numbering: '2',
              guidance: 'Describe how the product will be captured in the existing liquidity risk metrics. Indicate what the corporate risk liquidity cost is. Identify if there is any contingent cash flow driven by market events.',
              fieldKeys: ['liquidity_risk', 'liquidity_cost', 'contingent_cashflow', 'contingent_cashflow_desc']
            },
            {
              id: 'PC.IV.B.3',
              type: 'sub_question',
              label: 'Market Risk Regulatory Capital',
              numbering: '3',
              guidance: 'Confirm trading book assignment. Describe capital requirements and model validation procedures.',
              fieldKeys: ['trading_book_assignment', 'regulatory_capital', 'var_capture', 'model_validation_proc']
            }
          ]
        },

        // ── C. Credit Risk ────────────────────────────────
        {
          id: 'PC.IV.C',
          type: 'topic',
          label: 'Credit Risk',
          numbering: 'C',
          children: [
            {
              id: 'PC.IV.C.1',
              type: 'sub_question',
              label: 'Potential Risks',
              numbering: '1',
              guidance: 'Identify the primary sources of credit risk. Do they require new credit limit types or credit support?',
              fieldKeys: ['credit_risk', 'new_limit_types', 'credit_support_required']
            },
            {
              id: 'PC.IV.C.2',
              type: 'sub_question',
              label: 'Risk Mitigation',
              numbering: '2',
              guidance: 'Describe the risk mitigation measures, collateral frameworks, and how they have been stress-tested.',
              fieldKeys: ['counterparty_default', 'collateral_framework', 'stress_test_results', 'wrong_way_risk', 'netting_agreements', 'isda_master']
            },
            {
              id: 'PC.IV.C.3',
              type: 'sub_question',
              label: 'Limits to Cover Exposure',
              numbering: '3',
              guidance: 'Describe limits to cover exposure and the party responsible for monitoring. Are there appropriate models for verification, monitoring, and measurement?',
              fieldKeys: ['stress_scenarios', 'exposure_limits', 'monitoring_party']
            },
            {
              id: 'PC.IV.C.4',
              type: 'sub_question',
              label: 'Collateral Requirements',
              numbering: '4',
              guidance: 'If the transaction is to be collateralized, describe the collateral management and monitoring process. Is the acceptable collateral risk-rated based on Core Credit Risk Policy?',
              fieldKeys: ['custody_risk', 'collateral_risk_rated', 'csa_in_place']
            },
            {
              id: 'PC.IV.C.5',
              type: 'sub_question',
              label: 'Credit Risk Capital Calculation',
              numbering: '5',
              guidance: 'For portfolios under Standardized Approach, state PFE Standards. For portfolios under Internal Model Approach, describe EAD and regulatory capital.',
              fieldKeys: ['counterparty_rating', 'pfe_standards', 'ead_calculation', 'cva_dva_impact']
            },
            {
              id: 'PC.IV.C.6',
              type: 'sub_question',
              label: 'Regulatory Considerations',
              numbering: '6',
              guidance: 'Describe any regulatory considerations for credit risk including large exposure rules and concentration limits.',
              fieldKeys: ['large_exposure_rules', 'concentration_limits']
            },
            {
              id: 'PC.IV.C.7',
              type: 'sub_question',
              label: 'Counterparty Credit Risk',
              numbering: '7',
              guidance: 'Describe the counterparty credit risk assessment framework.',
              fieldKeys: ['ccr_framework']
            }
          ]
        },

        // ── D. Reputational Risk ──────────────────────────
        {
          id: 'PC.IV.D',
          type: 'topic',
          label: 'Reputational Risk',
          numbering: 'D',
          guidance: 'Evaluate and provide an assessment of the reputational risk exposure. Does the new product involve changes that could negatively impact the Bank\'s reputation? Include ESG assessment.',
          fieldKeys: ['reputational_risk', 'negative_impact', 'esg_assessment', 'esg_classification', 'country_risk']
        }
      ]
    },

    // ═══════════════════════════════════════════════════════
    // V  Data Management
    // ═══════════════════════════════════════════════════════
    {
      id: 'PC.V',
      type: 'section',
      label: 'Data Management',
      numbering: 'V',
      children: [
        {
          id: 'PC.V.1',
          type: 'topic',
          label: 'Design for Data (D4D) and Data Management Requirements',
          numbering: '1',
          guidance: 'Describe D4D requirements including data governance, ownership, stewardship, quality monitoring, and GDPR/privacy compliance.',
          fieldKeys: ['data_governance', 'data_ownership', 'data_stewardship', 'data_quality_monitoring', 'data_privacy', 'data_retention', 'gdpr_compliance', 'data_lineage', 'data_classification']
        },
        {
          id: 'PC.V.2',
          type: 'topic',
          label: 'PURE (Purposeful, Unsurprising, Respectful, Explainable) Principles',
          numbering: '2',
          guidance: 'Provide the PURE assessment ID and describe compliance with each principle.',
          fieldKeys: ['pure_assessment_id', 'pure_purposeful', 'pure_unsurprising', 'pure_respectful', 'pure_explainable']
        },
        {
          id: 'PC.V.3',
          type: 'topic',
          label: 'Risk Data Aggregation and Reporting Requirements',
          numbering: '3',
          guidance: 'Describe risk data aggregation capabilities and automated regulatory reporting.',
          fieldKeys: ['reporting_requirements', 'automated_reporting', 'rda_reporting_frequency']
        }
      ]
    },

    // ═══════════════════════════════════════════════════════
    // VI  Other Risk Identification and Mitigation
    // ═══════════════════════════════════════════════════════
    {
      id: 'PC.VI',
      type: 'section',
      label: 'Other Risk Identification and Mitigation',
      numbering: 'VI',
      guidance: 'Are there other risk identifications and mitigations which have not been described in sections I–V? If so, describe them here.',
      fieldKeys: ['other_risks_exist', 'operational_risk', 'additional_risk_mitigants']
    },

    // ═══════════════════════════════════════════════════════
    // VII  Additional Information for Trading Products
    // ═══════════════════════════════════════════════════════
    {
      id: 'PC.VII',
      type: 'section',
      label: 'Additional Information for Trading Products / Instruments',
      numbering: 'VII',
      guidance: 'If the new product involves a trading product/instrument, please complete the additional risk assessment in Appendix 5.',
      fieldKeys: ['trading_product', 'appendix5_required']
    }
  ]
};


// ────────────────────────────────────────────────────────────
// Appendices
// ────────────────────────────────────────────────────────────

export const NPA_APPENDICES_TEMPLATE: TemplateNode[] = [

  // ═══════════════════════════════════════════════════════
  // Appendix 1: Entity/Location Information
  // ═══════════════════════════════════════════════════════
  {
    id: 'APP.1',
    type: 'appendix',
    label: 'Entity/Location Information',
    numbering: 'Appendix 1',
    children: [
      {
        id: 'APP.1.table',
        type: 'table',
        label: 'Entity/Location Matrix',
        numbering: '',
        tableColumns: ['Function', 'Legal Entity', 'Location'],
        tableFieldMapping: [
          { rowLabel: 'Sales / Origination', fieldKey: 'sales_entity' },
          { rowLabel: 'Booking', fieldKey: 'booking_entity' },
          { rowLabel: 'Risk Taking', fieldKey: 'risk_taking_entity' },
          { rowLabel: 'Processing', fieldKey: 'processing_entity' }
        ]
      },
      {
        id: 'APP.1.additional',
        type: 'topic',
        label: 'Additional Entity Information',
        numbering: '',
        guidance: 'Specify additional entities involved in hedging and clearing.',
        fieldKeys: ['hedge_entity', 'hedge_location', 'clearing_entity']
      }
    ]
  },

  // ═══════════════════════════════════════════════════════
  // Appendix 2: Intellectual Property (IP)
  // ═══════════════════════════════════════════════════════
  {
    id: 'APP.2',
    type: 'appendix',
    label: 'Intellectual Property ("IP")',
    numbering: 'Appendix 2',
    children: [
      {
        id: 'APP.2.A',
        type: 'topic',
        label: 'Part A — MBS IP',
        numbering: 'A',
        guidance: 'Does the new product/service create or incorporate the use of any IP that is owned or to be owned by MBS (whether newly created or existing)?',
        fieldKeys: ['mbs_ip_exists', 'mbs_ip_details']
      },
      {
        id: 'APP.2.B',
        type: 'topic',
        label: 'Part B — Third Party IP',
        numbering: 'B',
        guidance: 'Does the new product/service create or incorporate the use of any IP that is owned or to be owned by a third party (whether newly created or existing)?',
        fieldKeys: ['third_party_ip_exists', 'third_party_ip_details', 'ip_licensing']
      }
    ]
  },

  // ═══════════════════════════════════════════════════════
  // Appendix 3: Financial Crime Risk Areas
  // ═══════════════════════════════════════════════════════
  {
    id: 'APP.3',
    type: 'appendix',
    label: 'Financial Crime Risk Areas',
    numbering: 'Appendix 3',
    guidance: 'Please complete both Parts A and B of this section. Identify relevant financial crime risk areas (money laundering, terrorism financing, sanctions, fraud, bribery & corruption).',
    children: [
      {
        id: 'APP.3.1',
        type: 'topic',
        label: 'Risk Assessment',
        numbering: '1',
        guidance: 'Assess each financial crime risk area applicable to this product.',
        fieldKeys: ['aml_assessment', 'terrorism_financing', 'sanctions_assessment', 'fraud_risk', 'bribery_corruption', 'fc_risk_rating', 'fc_mitigation_measures']
      },
      {
        id: 'APP.3.2',
        type: 'topic',
        label: 'Policies & Controls',
        numbering: '2',
        guidance: 'Describe the policies, procedures, and controls in place to mitigate financial crime risks.',
        fieldKeys: ['fc_policy_framework', 'fc_screening_controls', 'fc_transaction_monitoring', 'fc_suspicious_reporting', 'fc_record_keeping', 'fc_staff_training', 'fc_independent_testing']
      },
      {
        id: 'APP.3.3',
        type: 'topic',
        label: 'Validation & Surveillance',
        numbering: '3',
        guidance: 'Describe the validation, surveillance, and reporting procedures.',
        fieldKeys: ['fc_validation_process', 'fc_surveillance_tools', 'fc_regulatory_reporting']
      },
      {
        id: 'APP.3.4',
        type: 'topic',
        label: 'Data Privacy',
        numbering: '4',
        guidance: 'Describe data privacy considerations relating to financial crime prevention.',
        fieldKeys: ['fc_data_privacy_compliance', 'fc_data_sharing_agreements']
      }
    ]
  },

  // ═══════════════════════════════════════════════════════
  // Appendix 4: Risk Data Aggregation and Reporting
  // ═══════════════════════════════════════════════════════
  {
    id: 'APP.4',
    type: 'appendix',
    label: 'Risk Data Aggregation and Reporting Requirements',
    numbering: 'Appendix 4',
    guidance: 'Describe risk data aggregation compliance with regulatory requirements relating to Risk Data Aggregation and Reporting.',
    fieldKeys: ['rda_compliance', 'rda_data_sources', 'rda_aggregation_method', 'rda_data_quality']
  },

  // ═══════════════════════════════════════════════════════
  // Appendix 5: Additional Info for Trading Products
  // ═══════════════════════════════════════════════════════
  {
    id: 'APP.5',
    type: 'appendix',
    label: 'Additional Information for Trading Products / Instruments',
    numbering: 'Appendix 5',
    children: [
      {
        id: 'APP.5.1',
        type: 'topic',
        label: 'Customers',
        numbering: '1',
        guidance: 'Describe revenue sharing, cost allocation, and capital allocation.',
        fieldKeys: ['app5_revenue_sharing', 'app5_capital_allocation']
      },
      {
        id: 'APP.5.2',
        type: 'topic',
        label: 'Product Information',
        numbering: '2',
        guidance: 'Is the product to be hedge-fund purposes? Clarify what is being hedged and provide a brief description of any underlying transactions.',
        fieldKeys: ['app5_hedge_purpose', 'app5_hedge_description']
      },
      {
        id: 'APP.5.3',
        type: 'topic',
        label: 'Collateral and Pledged Assets',
        numbering: '3',
        guidance: 'Describe collateral types, custody systems, and risk mitigation.',
        fieldKeys: ['collateral_types', 'custody_arrangements']
      },
      {
        id: 'APP.5.4',
        type: 'topic',
        label: 'Valuation and Funding',
        numbering: '4',
        guidance: 'Describe valuation models and funding sources.',
        fieldKeys: ['app5_valuation_model', 'valuation_method', 'funding_source']
      },
      {
        id: 'APP.5.5',
        type: 'topic',
        label: 'Additional Finance Considerations',
        numbering: '5',
        guidance: 'Describe booking schema, lifecycle management, and cross-product integration.',
        fieldKeys: ['booking_schema', 'lifecycle_management', 'cross_product_integration', 'margin_methodology', 'close_out_netting']
      },
      {
        id: 'APP.5.6',
        type: 'topic',
        label: 'Technology Considerations',
        numbering: '6',
        guidance: 'Describe architecture, security, and scalability requirements.',
        fieldKeys: ['app5_tech_architecture', 'app5_security_req', 'app5_scalability']
      },
      {
        id: 'APP.5.7',
        type: 'topic',
        label: 'Regulatory Considerations',
        numbering: '7',
        guidance: 'Describe the compliance framework, regulatory reporting, and monitoring.',
        fieldKeys: ['app5_compliance_framework', 'app5_reg_monitoring', 'trade_reporting', 'clearing_obligation']
      }
    ]
  },

  // ═══════════════════════════════════════════════════════
  // Appendix 6: Third-Party Platforms Risk Assessment
  // ═══════════════════════════════════════════════════════
  {
    id: 'APP.6',
    type: 'appendix',
    label: 'Use of Third-Party Hosted Communication or Media Channels/Platforms — Risk Assessment',
    numbering: 'Appendix 6',
    guidance: 'This appendix is only applicable if the PU intends to use a third-party hosted communication or media channel/platform. Complete the preliminary risk assessment and information security assessment.',
    children: [
      {
        id: 'APP.6.A',
        type: 'topic',
        label: 'Description of Use Case',
        numbering: 'Part A',
        guidance: 'Describe the intended use case for the third-party platform.',
        fieldKeys: ['third_party_platform', 'platform_name', 'tp_use_case_description', 'tp_business_justification']
      },
      {
        id: 'APP.6.B',
        type: 'topic',
        label: 'Preliminary Risk Assessment',
        numbering: 'Part B',
        guidance: 'Conduct a preliminary risk assessment covering operational, regulatory, and reputational risks.',
        fieldKeys: ['platform_risk_assessment', 'tp_risk_rating', 'tp_risk_mitigants']
      },
      {
        id: 'APP.6.C1',
        type: 'topic',
        label: 'Context Questions',
        numbering: 'Part C.1',
        guidance: 'Answer context questions about the platform usage, data flows, and integration.',
        fieldKeys: ['tp_data_classification', 'tp_user_population', 'tp_integration_scope', 'tp_data_flow', 'tp_exit_strategy']
      },
      {
        id: 'APP.6.C2',
        type: 'topic',
        label: 'Information Security Assessment',
        numbering: 'Part C.2',
        guidance: 'Assess information security posture of the third-party platform.',
        fieldKeys: ['info_security_assessment', 'tp_encryption_standards', 'tp_access_controls', 'tp_audit_logging', 'tp_vulnerability_mgmt', 'tp_incident_response', 'tp_certifications']
      },
      {
        id: 'APP.6.C3',
        type: 'topic',
        label: 'Cybersecurity & Communication Archives',
        numbering: 'Part C.3',
        guidance: 'Describe cybersecurity measures and communication archival requirements.',
        fieldKeys: ['tp_cyber_assessment', 'tp_communication_archival', 'tp_retention_policy', 'tp_ediscovery']
      },
      {
        id: 'APP.6.C4',
        type: 'topic',
        label: 'IP, Data Ownership & Privacy',
        numbering: 'Part C.4',
        guidance: 'Address intellectual property, data ownership, and data privacy requirements.',
        fieldKeys: ['data_residency', 'tp_data_ownership', 'tp_ip_rights', 'tp_pdpa_compliance',
          'tp_cross_border_transfer', 'tp_data_deletion', 'tp_consent_management',
          'tp_breach_notification', 'tp_dpo_contact', 'tp_privacy_impact']
      }
    ]
  }
];


// ────────────────────────────────────────────────────────────
// Field Registry — Field-Fill Classification
// ────────────────────────────────────────────────────────────
//
// Every field_key is classified into one of 4 fill strategies:
//
// RULE   — Deterministic: Can be resolved via DB lookup, product config,
//          or simple business rules WITHOUT calling an LLM.
//          Examples: product_name (from NPA record), booking_entity (from
//          org chart), regulatory_reporting (from jurisdiction lookup table).
//          → Filled by Express endpoint: GET /api/npas/:id/prefill
//
// COPY   — Template Copy: Value can be copied from a similar previously-
//          approved NPA and adapted slightly. The LLM reviews and optionally
//          tweaks the copied value but the baseline comes from DB.
//          → Filled by Express endpoint + LLM delta pass
//
// LLM    — Analytical: Requires LLM reasoning over product context,
//          risk documents, and regulatory knowledge. Cannot be derived
//          from simple lookups.
//          → Filled by Dify Chatflow LLM nodes
//
// MANUAL — Human-only: Requires human judgment, sign-off, or input that
//          an AI should not auto-fill (legal attestations, manager names,
//          specific internal reference numbers).
//          → Left empty with guidance; user must fill manually
//

export type FieldFillStrategy = 'RULE' | 'COPY' | 'LLM' | 'MANUAL';

export interface FieldRegistryEntry {
  /** The field_key as stored in npa_form_data */
  key: string;
  /** Human-readable label */
  label: string;
  /** Which field-fill strategy to use */
  strategy: FieldFillStrategy;
  /** For RULE: name of the lookup source (e.g., 'npa_record', 'org_chart', 'jurisdiction_table') */
  ruleSource?: string;
  /** For COPY: which section of a similar NPA to copy from */
  copySection?: string;
  /** For LLM: the prompt category (e.g., 'risk_analysis', 'product_description', 'compliance') */
  llmCategory?: string;
  /** Template node ID where this field appears (e.g., 'PC.I.1.a') */
  nodeId?: string;
  /** UI field type for the Draft Builder renderer */
  fieldType?: import('./npa-interfaces').NpaFieldType;
  /** Dropdown / multiselect / checkbox options */
  options?: string[];
  /** Whether this field is required for submission */
  required?: boolean;
  /** Conditional visibility — depends on another field having a specific value */
  dependsOn?: { field: string; value: string };
  /** Placeholder text for input fields */
  placeholder?: string;
}

/**
 * Master Field Registry — classifies all 339 field_keys by fill strategy.
 *
 * Distribution (verified 2026-02-23):
 *   RULE    63 fields — deterministic from DB/config
 *   COPY    60 fields — baseline from similar NPA
 *   LLM    149 fields — requires AI reasoning
 *   MANUAL  67 fields — human-only
 */
export const NPA_FIELD_REGISTRY: FieldRegistryEntry[] = [
  // CORE / LEGACY FIELDS (Synchronized with DB ref_npa_fields)
  { key: 'approving_authority', label: 'Approving Authority', nodeId: 'PC.I', fieldType: 'text', strategy: 'RULE' },
  { key: 'bia_completed', label: 'BIA Completed', nodeId: 'PC.I', fieldType: 'yesno', strategy: 'RULE' },
  { key: 'business_case_status', label: 'Business Case Status', nodeId: 'PC.I', fieldType: 'text', strategy: 'RULE' },
  { key: 'business_unit', label: 'Business Unit', nodeId: 'PC.I', fieldType: 'dropdown', strategy: 'RULE', options: ['Treasury & Markets', 'Wealth Management', 'Corporate Banking', 'Institutional Banking', 'Consumer Banking', 'Digital Assets'] },
  { key: 'customer_profile', label: 'Customer Profile', nodeId: 'PC.I', fieldType: 'textarea', strategy: 'RULE' },
  { key: 'desk', label: 'Trading Desk', nodeId: 'PC.I', fieldType: 'text', strategy: 'RULE' },
  { key: 'dr_test_frequency', label: 'DR Test Frequency', nodeId: 'PC.I', fieldType: 'text', strategy: 'RULE' },
  { key: 'geographic_scope', label: 'Geographic Scope', nodeId: 'PC.I', fieldType: 'multiselect', strategy: 'RULE' },
  { key: 'group_product_head', label: 'Group Product Head', nodeId: 'PC.I', fieldType: 'text', strategy: 'RULE' },
  { key: 'hedging_purpose', label: 'Hedging Purpose', nodeId: 'PC.I', fieldType: 'textarea', strategy: 'RULE' },
  { key: 'isda_agreement', label: 'ISDA Agreement', nodeId: 'PC.IV', fieldType: 'textarea', strategy: 'RULE' },
  { key: 'kickoff_date', label: 'Kickoff Date', nodeId: 'PC.I', fieldType: 'date', strategy: 'RULE' },
  { key: 'mtj_journey', label: 'MTJ Journey', nodeId: 'PC.I', fieldType: 'text', strategy: 'RULE' },
  { key: 'npa_process_type', label: 'NPA Process Type', nodeId: 'PC.I', fieldType: 'text', strategy: 'RULE' },
  { key: 'pac_approval_date', label: 'PAC Approval Date', nodeId: 'PC.I', fieldType: 'date', strategy: 'RULE' },
  { key: 'product_manager_name', label: 'Product Manager', nodeId: 'PC.I', fieldType: 'text', strategy: 'RULE' },
  { key: 'proposal_preparer', label: 'Proposal Preparer', nodeId: 'PC.I', fieldType: 'text', strategy: 'RULE' },
  { key: 'required_signoffs', label: 'Required Sign-offs', nodeId: 'APP.1', fieldType: 'textarea', strategy: 'RULE' },
  { key: 'rpo_minutes', label: 'RPO (Minutes)', nodeId: 'PC.II', fieldType: 'text', strategy: 'RULE' },
  { key: 'rto_hours', label: 'RTO (Hours)', nodeId: 'PC.II', fieldType: 'text', strategy: 'RULE' },
  { key: 'signoff_order', label: 'Sign-off Order', nodeId: 'APP.1', fieldType: 'dropdown', strategy: 'RULE', options: ['Parallel', 'Sequential'] },
  { key: 'strike_price', label: 'Strike Price', nodeId: 'PC.III', fieldType: 'currency', strategy: 'RULE' },
  { key: 'supporting_documents', label: 'Supporting Documents', nodeId: 'APP.6', fieldType: 'file_upload', strategy: 'RULE' },
  { key: 'term_sheet', label: 'Term Sheet', nodeId: 'APP.6', fieldType: 'file_upload', strategy: 'RULE' },
  { key: 'trade_date', label: 'Expected Trade Date', nodeId: 'PC.I', fieldType: 'date', strategy: 'RULE' },

  // ═══════════════════════════════════════════════════════════════
  // SECTION I: Product Specifications (Basic Information)
  // ═══════════════════════════════════════════════════════════════

  // I.1.a — Purpose / Rationale
  { key: 'business_rationale', label: 'Business Rationale', strategy: 'LLM', llmCategory: 'product_description', nodeId: 'PC.I.1.a', fieldType: 'textarea', required: true },
  { key: 'problem_statement', label: 'Problem Statement', strategy: 'LLM', llmCategory: 'product_description', nodeId: 'PC.I.1.a', fieldType: 'textarea' },
  { key: 'value_proposition', label: 'Value Proposition', strategy: 'LLM', llmCategory: 'product_description', nodeId: 'PC.I.1.a', fieldType: 'textarea' },
  { key: 'customer_benefit', label: 'Benefits to Customers', strategy: 'LLM', llmCategory: 'product_description', nodeId: 'PC.I.1.a', fieldType: 'textarea' },
  { key: 'bu_benefit', label: 'Benefits to BU/SU', strategy: 'LLM', llmCategory: 'product_description', nodeId: 'PC.I.1.a', fieldType: 'textarea' },

  // I.1.b — Scope and Parameters
  { key: 'product_name', label: 'Product Name', strategy: 'RULE', ruleSource: 'npa_record', nodeId: 'PC.I.1.b', fieldType: 'text', required: true },
  { key: 'product_type', label: 'Product Type', strategy: 'RULE', ruleSource: 'npa_record', nodeId: 'PC.I.1.b', fieldType: 'dropdown', options: ['Derivative', 'Structured Product', 'Loan', 'Bond', 'Fund', 'Insurance', 'Digital Asset', 'Other'] },
  { key: 'underlying_asset', label: 'Underlying Asset', strategy: 'RULE', ruleSource: 'npa_record', nodeId: 'PC.I.1.b', fieldType: 'text' },
  { key: 'currency_denomination', label: 'Currency Denomination', strategy: 'RULE', ruleSource: 'npa_record', nodeId: 'PC.I.1.b', fieldType: 'dropdown', options: ['SGD', 'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'HKD', 'AUD', 'INR', 'IDR', 'TWD', 'Multi-currency'] },
  { key: 'tenor', label: 'Tenor', strategy: 'RULE', ruleSource: 'npa_record', nodeId: 'PC.I.1.b', fieldType: 'text' },
  { key: 'funding_type', label: 'Funded vs Unfunded', strategy: 'RULE', ruleSource: 'npa_record', nodeId: 'PC.I.1.b', fieldType: 'dropdown', options: ['Funded', 'Unfunded', 'Partially Funded'] },
  { key: 'repricing_info', label: 'Repricing Information', strategy: 'COPY', copySection: 'product_specs', nodeId: 'PC.I.1.b', fieldType: 'textarea' },
  { key: 'product_role', label: 'Role of Proposing Unit', strategy: 'COPY', copySection: 'product_specs', nodeId: 'PC.I.1.b', fieldType: 'dropdown', options: ['Manufacturer', 'Distributor', 'Principal', 'Agent', 'Arranger'] },
  { key: 'product_maturity', label: 'Product Maturity', strategy: 'COPY', copySection: 'product_specs', nodeId: 'PC.I.1.b', fieldType: 'dropdown', options: ['Established', 'Mature', 'Growing', 'Emerging', 'New'] },
  { key: 'product_lifecycle', label: 'Product Life Cycle', strategy: 'COPY', copySection: 'product_specs', nodeId: 'PC.I.1.b', fieldType: 'textarea' },
  { key: 'product_features', label: 'Product Features Summary', strategy: 'LLM', llmCategory: 'product_description', nodeId: 'PC.I.1.b', fieldType: 'textarea' },

  // I.1.c — Expected Transaction Volume and Revenue
  { key: 'notional_amount', label: 'Transaction Volume (Notional)', strategy: 'RULE', ruleSource: 'npa_record', nodeId: 'PC.I.1.c', fieldType: 'currency', required: true },
  { key: 'revenue_year1', label: 'Revenue Year 1 (Gross)', strategy: 'LLM', llmCategory: 'financial_projection', nodeId: 'PC.I.1.c', fieldType: 'currency' },
  { key: 'revenue_year1_net', label: 'Revenue Year 1 (Net of TP)', strategy: 'LLM', llmCategory: 'financial_projection', nodeId: 'PC.I.1.c', fieldType: 'currency' },
  { key: 'revenue_year2', label: 'Revenue Year 2 (Gross)', strategy: 'LLM', llmCategory: 'financial_projection', nodeId: 'PC.I.1.c', fieldType: 'currency' },
  { key: 'revenue_year2_net', label: 'Revenue Year 2 (Net of TP)', strategy: 'LLM', llmCategory: 'financial_projection', nodeId: 'PC.I.1.c', fieldType: 'currency' },
  { key: 'revenue_year3', label: 'Revenue Year 3 (Gross)', strategy: 'LLM', llmCategory: 'financial_projection', nodeId: 'PC.I.1.c', fieldType: 'currency' },
  { key: 'revenue_year3_net', label: 'Revenue Year 3 (Net of TP)', strategy: 'LLM', llmCategory: 'financial_projection', nodeId: 'PC.I.1.c', fieldType: 'currency' },
  { key: 'expected_volume', label: 'Expected Annual Volume', strategy: 'LLM', llmCategory: 'financial_projection', nodeId: 'PC.I.1.c', fieldType: 'text' },

  // I.1.d — Business Model
  { key: 'target_roi', label: 'Target ROI', strategy: 'LLM', llmCategory: 'financial_projection', nodeId: 'PC.I.1.d', fieldType: 'text' },
  { key: 'revenue_streams', label: 'Revenue Streams', strategy: 'LLM', llmCategory: 'financial_projection', nodeId: 'PC.I.1.d', fieldType: 'bullet_list' },
  { key: 'gross_margin_split', label: 'Gross Margin Split', strategy: 'LLM', llmCategory: 'financial_projection', nodeId: 'PC.I.1.d', fieldType: 'textarea' },
  { key: 'cost_allocation', label: 'Cost Allocation', strategy: 'LLM', llmCategory: 'financial_projection', nodeId: 'PC.I.1.d', fieldType: 'textarea' },

  // I.1.e — SPV
  { key: 'spv_involved', label: 'Is SPV/SPE Involved?', strategy: 'MANUAL', nodeId: 'PC.I.1.e', fieldType: 'yesno' },
  { key: 'spv_details', label: 'SPV Details', strategy: 'MANUAL', nodeId: 'PC.I.1.e', fieldType: 'textarea', dependsOn: { field: 'spv_involved', value: 'Yes' } },
  { key: 'spv_arranger', label: 'SPV Arranger', strategy: 'MANUAL', nodeId: 'PC.I.1.e', fieldType: 'text', dependsOn: { field: 'spv_involved', value: 'Yes' } },
  { key: 'spv_country', label: 'SPV Country of Incorporation', strategy: 'MANUAL', nodeId: 'PC.I.1.e', fieldType: 'text', dependsOn: { field: 'spv_involved', value: 'Yes' } },

  // I.2 — Target Customer
  { key: 'customer_segments', label: 'Target Customer Segments', strategy: 'MANUAL', nodeId: 'PC.I.2', fieldType: 'multiselect', options: ['Institutional', 'Corporate', 'SME', 'Retail - Mass', 'Retail - Affluent', 'Retail - Private Banking', 'Government', 'Financial Institutions'] },
  { key: 'customer_restrictions', label: 'Regulatory Restrictions on Customers', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'PC.I.2', fieldType: 'textarea' },
  { key: 'customer_suitability', label: 'Customer Suitability Criteria', strategy: 'COPY', copySection: 'product_specs', nodeId: 'PC.I.2', fieldType: 'textarea' },
  { key: 'customer_min_turnover', label: 'Minimum Annual Turnover', strategy: 'MANUAL', nodeId: 'PC.I.2', fieldType: 'currency' },
  { key: 'customer_geographic', label: 'Geographic Scope', strategy: 'RULE', ruleSource: 'npa_record', nodeId: 'PC.I.2', fieldType: 'multiselect', options: ['Singapore', 'Hong Kong', 'China', 'India', 'Indonesia', 'Taiwan', 'Rest of APAC', 'Global'] },

  // I.3 — Commercialization Approach
  { key: 'distribution_channels', label: 'Distribution Channels', strategy: 'COPY', copySection: 'product_specs', nodeId: 'PC.I.3.a', fieldType: 'multiselect', options: ['MBS Bank', 'MBSV', 'MBS Treasures', 'MBS Private Bank', 'digibank', 'Third Party Distributors', 'Direct Sales'] },
  { key: 'channel_rationale', label: 'Multi-Entity/Location Rationale', strategy: 'LLM', llmCategory: 'product_description', nodeId: 'PC.I.3.a', fieldType: 'textarea' },
  { key: 'sales_suitability', label: 'Sales Suitability', strategy: 'COPY', copySection: 'product_specs', nodeId: 'PC.I.3.b', fieldType: 'textarea' },
  { key: 'onboarding_process', label: 'Customer Onboarding Process', strategy: 'COPY', copySection: 'product_specs', nodeId: 'PC.I.3.b', fieldType: 'textarea' },
  { key: 'marketing_plan', label: 'Marketing & Communication Plan', strategy: 'LLM', llmCategory: 'product_description', nodeId: 'PC.I.3.c', fieldType: 'textarea' },

  // I.4 — PAC Conditions
  { key: 'pac_reference', label: 'PAC Reference Number', strategy: 'MANUAL', nodeId: 'PC.I.4', fieldType: 'text' },
  { key: 'pac_conditions', label: 'PAC Conditions List', strategy: 'MANUAL', nodeId: 'PC.I.4', fieldType: 'bullet_list' },
  { key: 'pac_date', label: 'PAC Approval Date', strategy: 'MANUAL', nodeId: 'PC.I.4', fieldType: 'date' },

  // I.5 — External Parties
  { key: 'external_parties_involved', label: 'External Parties Involved?', strategy: 'MANUAL', nodeId: 'PC.I.5', fieldType: 'yesno' },
  { key: 'ip_considerations', label: 'IP Considerations', strategy: 'MANUAL', nodeId: 'PC.I.5', fieldType: 'textarea', dependsOn: { field: 'external_parties_involved', value: 'Yes' } },
  { key: 'external_party_names', label: 'External Party Names', strategy: 'MANUAL', nodeId: 'PC.I.5', fieldType: 'bullet_list', dependsOn: { field: 'external_parties_involved', value: 'Yes' } },
  { key: 'rasp_reference', label: 'RASP Baseline Reference', strategy: 'MANUAL', nodeId: 'PC.I.5', fieldType: 'text', dependsOn: { field: 'external_parties_involved', value: 'Yes' } },
  { key: 'esg_data_used', label: 'ESG/Sustainable Data Used?', strategy: 'MANUAL', nodeId: 'PC.I.5', fieldType: 'yesno' },

  // ═══════════════════════════════════════════════════════════════
  // SECTION II: Operational & Technology Information
  // ═══════════════════════════════════════════════════════════════

  // II.1.a — Operating Model
  { key: 'front_office_model', label: 'Front Office Operating Model', strategy: 'COPY', copySection: 'operational', nodeId: 'PC.II.1.a', fieldType: 'textarea' },
  { key: 'middle_office_model', label: 'Middle Office Operating Model', strategy: 'COPY', copySection: 'operational', nodeId: 'PC.II.1.a', fieldType: 'textarea' },
  { key: 'back_office_model', label: 'Back Office Operating Model', strategy: 'COPY', copySection: 'operational', nodeId: 'PC.II.1.a', fieldType: 'textarea' },
  { key: 'third_party_ops', label: 'Third Party Operations', strategy: 'COPY', copySection: 'operational', nodeId: 'PC.II.1.a', fieldType: 'textarea' },
  { key: 'collateral_mgmt_ops', label: 'Collateral Management Requirements', strategy: 'LLM', llmCategory: 'operational', nodeId: 'PC.II.1.a', fieldType: 'textarea' },

  // II.1.b — Booking Process
  { key: 'booking_legal_form', label: 'Booking Legal Form', strategy: 'RULE', ruleSource: 'product_config', nodeId: 'PC.II.1.b', fieldType: 'text' },
  { key: 'booking_family', label: 'Booking Family', strategy: 'RULE', ruleSource: 'product_config', nodeId: 'PC.II.1.b', fieldType: 'text' },
  { key: 'booking_typology', label: 'Booking Typology', strategy: 'RULE', ruleSource: 'product_config', nodeId: 'PC.II.1.b', fieldType: 'text' },
  { key: 'portfolio_allocation', label: 'Portfolio Allocation', strategy: 'RULE', ruleSource: 'product_config', nodeId: 'PC.II.1.b', fieldType: 'text' },
  { key: 'confirmation_process', label: 'Confirmation Process', strategy: 'COPY', copySection: 'operational', nodeId: 'PC.II.1.b', fieldType: 'textarea' },
  { key: 'reconciliation', label: 'Reconciliation', strategy: 'COPY', copySection: 'operational', nodeId: 'PC.II.1.b', fieldType: 'textarea' },
  { key: 'exception_handling', label: 'Exception & Manual Handling', strategy: 'COPY', copySection: 'operational', nodeId: 'PC.II.1.b', fieldType: 'textarea' },
  { key: 'accounting_treatment', label: 'Accounting Treatment', strategy: 'LLM', llmCategory: 'financial_projection', nodeId: 'PC.II.1.b', fieldType: 'textarea' },
  { key: 'settlement_flow', label: 'Settlement Flow Description', strategy: 'COPY', copySection: 'operational', nodeId: 'PC.II.1.b', fieldType: 'textarea' },

  // II.2 — Technical Platform
  { key: 'new_system_changes', label: 'New System Changes Required?', strategy: 'MANUAL', nodeId: 'PC.II.2.a', fieldType: 'yesno' },
  { key: 'booking_system', label: 'Booking System', strategy: 'RULE', ruleSource: 'system_config', nodeId: 'PC.II.2.a', fieldType: 'dropdown', options: ['Murex', 'Calypso', 'Summit', 'Opics', 'Kondor+', 'SAP', 'Other'] },
  { key: 'tech_requirements', label: 'Technology Requirements', strategy: 'LLM', llmCategory: 'operational', nodeId: 'PC.II.2.a', fieldType: 'textarea' },
  { key: 'system_integration', label: 'System Integration Scope', strategy: 'LLM', llmCategory: 'operational', nodeId: 'PC.II.2.a', fieldType: 'textarea', dependsOn: { field: 'new_system_changes', value: 'Yes' } },
  { key: 'valuation_model', label: 'Valuation Model', strategy: 'LLM', llmCategory: 'pricing', nodeId: 'PC.II.2.b', fieldType: 'textarea' },
  { key: 'fo_system_changes', label: 'Front Office System Changes', strategy: 'LLM', llmCategory: 'operational', nodeId: 'PC.II.2.b', fieldType: 'textarea' },
  { key: 'settlement_method', label: 'Settlement Method', strategy: 'RULE', ruleSource: 'product_config', nodeId: 'PC.II.2.c', fieldType: 'dropdown', options: ['SWIFT', 'MEPS+', 'CLS', 'DvP', 'FoP', 'Manual'] },
  { key: 'be_system_changes', label: 'Back End System Changes', strategy: 'LLM', llmCategory: 'operational', nodeId: 'PC.II.2.c', fieldType: 'textarea' },
  { key: 'manual_workarounds', label: 'Manual Work-Arounds', strategy: 'MANUAL', nodeId: 'PC.II.2.c', fieldType: 'textarea' },

  // II.3 — Information Security
  { key: 'system_enhancements', label: 'System Enhancements Involved?', strategy: 'MANUAL', nodeId: 'PC.II.3', fieldType: 'yesno' },
  { key: 'iss_deviations', label: 'ISS Policy Deviations', strategy: 'MANUAL', nodeId: 'PC.II.3', fieldType: 'textarea', dependsOn: { field: 'system_enhancements', value: 'Yes' } },
  { key: 'pentest_status', label: 'Penetration Test Status', strategy: 'MANUAL', nodeId: 'PC.II.3', fieldType: 'dropdown', options: ['Not Required', 'Planned', 'In Progress', 'Completed - Pass', 'Completed - Remediation Required'], dependsOn: { field: 'system_enhancements', value: 'Yes' } },
  { key: 'security_assessment', label: 'Security Assessment Details', strategy: 'MANUAL', nodeId: 'PC.II.3', fieldType: 'textarea', dependsOn: { field: 'system_enhancements', value: 'Yes' } },

  // II.4 — Technology Resiliency
  { key: 'grc_id', label: 'GRC ID (External Party Risk)', strategy: 'MANUAL', nodeId: 'PC.II.4', fieldType: 'text' },
  { key: 'hsm_required', label: 'HSM Required?', strategy: 'MANUAL', nodeId: 'PC.II.4', fieldType: 'yesno' },
  { key: 'rto_target', label: 'Recovery Time Objective (RTO)', strategy: 'RULE', ruleSource: 'system_config', nodeId: 'PC.II.4', fieldType: 'text' },
  { key: 'rpo_target', label: 'Recovery Point Objective (RPO)', strategy: 'RULE', ruleSource: 'system_config', nodeId: 'PC.II.4', fieldType: 'text' },
  { key: 'dr_testing_plan', label: 'DR Testing Plan', strategy: 'COPY', copySection: 'operational', nodeId: 'PC.II.4', fieldType: 'textarea' },

  // II.5 — Business Continuity Management
  { key: 'bia_considerations', label: 'BIA Considerations', strategy: 'COPY', copySection: 'operational', nodeId: 'PC.II.5', fieldType: 'textarea' },
  { key: 'bcp_requirements', label: 'Updated BCP Requirements', strategy: 'COPY', copySection: 'operational', nodeId: 'PC.II.5', fieldType: 'textarea' },
  { key: 'continuity_measures', label: 'Additional Continuity Measures', strategy: 'MANUAL', nodeId: 'PC.II.5', fieldType: 'textarea' },

  // ═══════════════════════════════════════════════════════════════
  // SECTION III: Pricing Model Details
  // ═══════════════════════════════════════════════════════════════

  { key: 'pricing_model_required', label: 'Pricing Model Validation Required?', strategy: 'MANUAL', nodeId: 'PC.III.1', fieldType: 'yesno' },
  { key: 'pricing_methodology', label: 'Pricing Methodology', strategy: 'LLM', llmCategory: 'pricing', nodeId: 'PC.III.1', fieldType: 'textarea', dependsOn: { field: 'pricing_model_required', value: 'Yes' } },
  { key: 'roae_analysis', label: 'ROAE Analysis', strategy: 'LLM', llmCategory: 'pricing', nodeId: 'PC.III.1', fieldType: 'textarea' },
  { key: 'pricing_assumptions', label: 'Pricing Assumptions', strategy: 'LLM', llmCategory: 'pricing', nodeId: 'PC.III.1', fieldType: 'textarea' },
  { key: 'bespoke_adjustments', label: 'Bespoke Adjustments', strategy: 'LLM', llmCategory: 'pricing', nodeId: 'PC.III.1', fieldType: 'textarea' },
  { key: 'pricing_model_name', label: 'Pricing Model Name', strategy: 'RULE', ruleSource: 'product_config', nodeId: 'PC.III.2', fieldType: 'text' },
  { key: 'model_validation_date', label: 'Model Validation Date', strategy: 'RULE', ruleSource: 'product_config', nodeId: 'PC.III.2', fieldType: 'date' },
  { key: 'model_restrictions', label: 'Model Restrictions', strategy: 'LLM', llmCategory: 'pricing', nodeId: 'PC.III.2', fieldType: 'textarea' },
  { key: 'risk_data_assessment_ref', label: 'Risk Data Assessment Tool Reference', strategy: 'MANUAL', nodeId: 'PC.III.2', fieldType: 'text' },
  { key: 'simm_treatment', label: 'SIMM Treatment', strategy: 'LLM', llmCategory: 'pricing', nodeId: 'PC.III.3', fieldType: 'textarea' },
  { key: 'simm_sensitivities', label: 'SIMM Sensitivities', strategy: 'LLM', llmCategory: 'pricing', nodeId: 'PC.III.3', fieldType: 'textarea' },

  // ═══════════════════════════════════════════════════════════════
  // SECTION IV: Risk Analysis
  // ═══════════════════════════════════════════════════════════════

  // IV.A — Operational Risk / Legal & Compliance
  { key: 'legal_opinion', label: 'Legal Opinion', strategy: 'COPY', copySection: 'legal', nodeId: 'PC.IV.A.1', fieldType: 'textarea' },
  { key: 'licensing_requirements', label: 'Licensing Requirements', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'PC.IV.A.1', fieldType: 'textarea' },
  { key: 'primary_regulation', label: 'Primary Regulation', strategy: 'RULE', ruleSource: 'jurisdiction_table', nodeId: 'PC.IV.A.1', fieldType: 'text' },
  { key: 'secondary_regulations', label: 'Secondary Regulations', strategy: 'RULE', ruleSource: 'jurisdiction_table', nodeId: 'PC.IV.A.1', fieldType: 'bullet_list' },
  { key: 'regulatory_reporting', label: 'Regulatory Reporting', strategy: 'RULE', ruleSource: 'jurisdiction_table', nodeId: 'PC.IV.A.1', fieldType: 'textarea' },
  { key: 'cross_border_regulations', label: 'Cross-Border Regulatory Considerations', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'PC.IV.A.1', fieldType: 'textarea' },
  { key: 'legal_docs_required', label: 'Legal Documentation Required', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'PC.IV.A.1', fieldType: 'bullet_list' },
  { key: 'sanctions_check', label: 'Sanctions Check', strategy: 'RULE', ruleSource: 'jurisdiction_table', nodeId: 'PC.IV.A.1', fieldType: 'yesno' },
  { key: 'aml_considerations', label: 'AML Considerations', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'PC.IV.A.1', fieldType: 'textarea' },

  // IV.A.2 — Finance and Tax
  { key: 'tax_impact', label: 'Tax Impact', strategy: 'COPY', copySection: 'legal', nodeId: 'PC.IV.A.2', fieldType: 'textarea' },
  { key: 'accounting_book', label: 'Trading Book vs Banking Book', strategy: 'RULE', ruleSource: 'product_config', nodeId: 'PC.IV.A.2', fieldType: 'dropdown', options: ['Trading Book', 'Banking Book'] },
  { key: 'fair_value_treatment', label: 'Fair Value Treatment', strategy: 'LLM', llmCategory: 'financial_projection', nodeId: 'PC.IV.A.2', fieldType: 'textarea' },
  { key: 'on_off_balance', label: 'On/Off Balance Sheet', strategy: 'RULE', ruleSource: 'product_config', nodeId: 'PC.IV.A.2', fieldType: 'dropdown', options: ['On Balance Sheet', 'Off Balance Sheet', 'Both'] },
  { key: 'tax_jurisdictions', label: 'Tax Jurisdictions Analysis', strategy: 'LLM', llmCategory: 'financial_projection', nodeId: 'PC.IV.A.2', fieldType: 'textarea' },

  // IV.B — Market & Liquidity
  { key: 'market_risk', label: 'Market Risk Assessment', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.B.1', fieldType: 'textarea', required: true },
  { key: 'risk_classification', label: 'Risk Classification', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.B.1', fieldType: 'dropdown', options: ['Level 1', 'Level 2', 'Level 3'] },
  { key: 'pricing_parameters', label: 'Relevant Pricing Parameters', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.B.1', fieldType: 'textarea' },

  // IV.B.1 — Market Risk Factor Matrix (table_grid)
  { key: 'mrf_ir_delta', label: 'MRF: IR Delta', strategy: 'RULE', ruleSource: 'product_config', nodeId: 'PC.IV.B.1', fieldType: 'yesno' },
  { key: 'mrf_ir_vega', label: 'MRF: IR Vega', strategy: 'RULE', ruleSource: 'product_config', nodeId: 'PC.IV.B.1', fieldType: 'yesno' },
  { key: 'mrf_ir_gamma', label: 'MRF: IR Gamma', strategy: 'RULE', ruleSource: 'product_config', nodeId: 'PC.IV.B.1', fieldType: 'yesno' },
  { key: 'mrf_fx_delta', label: 'MRF: FX Delta', strategy: 'RULE', ruleSource: 'product_config', nodeId: 'PC.IV.B.1', fieldType: 'yesno' },
  { key: 'mrf_fx_vega', label: 'MRF: FX Vega', strategy: 'RULE', ruleSource: 'product_config', nodeId: 'PC.IV.B.1', fieldType: 'yesno' },
  { key: 'mrf_eq_delta', label: 'MRF: Equity Delta', strategy: 'RULE', ruleSource: 'product_config', nodeId: 'PC.IV.B.1', fieldType: 'yesno' },
  { key: 'mrf_eq_vega', label: 'MRF: Equity Vega', strategy: 'RULE', ruleSource: 'product_config', nodeId: 'PC.IV.B.1', fieldType: 'yesno' },
  { key: 'mrf_commodity', label: 'MRF: Commodity', strategy: 'RULE', ruleSource: 'product_config', nodeId: 'PC.IV.B.1', fieldType: 'yesno' },
  { key: 'mrf_credit', label: 'MRF: Credit', strategy: 'RULE', ruleSource: 'product_config', nodeId: 'PC.IV.B.1', fieldType: 'yesno' },
  { key: 'mrf_correlation', label: 'MRF: Correlation', strategy: 'RULE', ruleSource: 'product_config', nodeId: 'PC.IV.B.1', fieldType: 'yesno' },

  // IV.B.2 — Funding / Liquidity Risk
  { key: 'liquidity_risk', label: 'Funding/Liquidity Risk', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.B.2', fieldType: 'textarea' },
  { key: 'liquidity_cost', label: 'Corporate Risk Liquidity Cost', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.B.2', fieldType: 'textarea' },
  { key: 'contingent_cashflow', label: 'Contingent Cash Flow Risk', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.B.2', fieldType: 'yesno' },
  { key: 'contingent_cashflow_desc', label: 'Contingent Cash Flow Description', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.B.2', fieldType: 'textarea', dependsOn: { field: 'contingent_cashflow', value: 'Yes' } },

  // IV.B.3 — Regulatory Capital
  { key: 'trading_book_assignment', label: 'Trading Book Assignment Confirmed?', strategy: 'MANUAL', nodeId: 'PC.IV.B.3', fieldType: 'yesno' },
  { key: 'regulatory_capital', label: 'Regulatory Capital Requirements', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.B.3', fieldType: 'textarea' },
  { key: 'var_capture', label: 'VaR Capture', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.B.3', fieldType: 'textarea' },
  { key: 'model_validation_proc', label: 'Model Validation Procedures', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.B.3', fieldType: 'textarea' },

  // IV.C — Credit Risk
  { key: 'credit_risk', label: 'Credit Risk Assessment', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.C.1', fieldType: 'textarea', required: true },
  { key: 'new_limit_types', label: 'New Credit Limit Types Required?', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.C.1', fieldType: 'yesno' },
  { key: 'credit_support_required', label: 'Credit Support Required?', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.C.1', fieldType: 'yesno' },
  { key: 'counterparty_default', label: 'Risk Mitigation Measures', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.C.2', fieldType: 'textarea' },
  { key: 'collateral_framework', label: 'Collateral Framework', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.C.2', fieldType: 'textarea' },
  { key: 'stress_test_results', label: 'Stress Test Results', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.C.2', fieldType: 'textarea' },
  { key: 'stress_scenarios', label: 'Stress Scenarios', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.C.3', fieldType: 'textarea' },
  { key: 'exposure_limits', label: 'Limits to Cover Exposure', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.C.3', fieldType: 'textarea' },
  { key: 'monitoring_party', label: 'Monitoring Party', strategy: 'MANUAL', nodeId: 'PC.IV.C.3', fieldType: 'text' },
  { key: 'custody_risk', label: 'Custody Risk', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.C.4', fieldType: 'textarea' },
  { key: 'collateral_risk_rated', label: 'Collateral Risk-Rated per Core Policy?', strategy: 'MANUAL', nodeId: 'PC.IV.C.4', fieldType: 'yesno' },
  { key: 'counterparty_rating', label: 'Counterparty Rating', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.C.5', fieldType: 'text' },
  { key: 'pfe_standards', label: 'PFE Standards (Standardized Approach)', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.C.5', fieldType: 'textarea' },
  { key: 'ead_calculation', label: 'EAD & Capital (Internal Model)', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.C.5', fieldType: 'textarea' },
  { key: 'large_exposure_rules', label: 'Large Exposure Rules', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'PC.IV.C.6', fieldType: 'textarea' },
  { key: 'concentration_limits', label: 'Concentration Limits', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'PC.IV.C.6', fieldType: 'textarea' },
  { key: 'ccr_framework', label: 'Counterparty Credit Risk Framework', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.C.7', fieldType: 'textarea' },

  // IV.D — Reputational Risk
  { key: 'reputational_risk', label: 'Reputational Risk Assessment', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.D', fieldType: 'textarea' },
  { key: 'negative_impact', label: 'Potential Negative Impact?', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.D', fieldType: 'yesno' },
  { key: 'esg_assessment', label: 'ESG Assessment', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.D', fieldType: 'textarea' },
  { key: 'esg_classification', label: 'ESG Classification', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.D', fieldType: 'dropdown', options: ['Green', 'Social', 'Sustainable', 'Transition', 'Not Applicable'] },

  // ═══════════════════════════════════════════════════════════════
  // SECTION V: Data Management
  // ═══════════════════════════════════════════════════════════════

  { key: 'data_governance', label: 'Data Governance Framework', strategy: 'COPY', copySection: 'data_mgmt', nodeId: 'PC.V.1', fieldType: 'textarea' },
  { key: 'data_ownership', label: 'Data Ownership', strategy: 'COPY', copySection: 'data_mgmt', nodeId: 'PC.V.1', fieldType: 'text' },
  { key: 'data_stewardship', label: 'Data Stewardship', strategy: 'COPY', copySection: 'data_mgmt', nodeId: 'PC.V.1', fieldType: 'text' },
  { key: 'data_quality_monitoring', label: 'Data Quality Monitoring', strategy: 'COPY', copySection: 'data_mgmt', nodeId: 'PC.V.1', fieldType: 'textarea' },
  { key: 'data_privacy', label: 'Data Privacy Assessment', strategy: 'COPY', copySection: 'data_mgmt', nodeId: 'PC.V.1', fieldType: 'textarea' },
  { key: 'data_retention', label: 'Data Retention Policy', strategy: 'COPY', copySection: 'data_mgmt', nodeId: 'PC.V.1', fieldType: 'textarea' },
  { key: 'gdpr_compliance', label: 'GDPR/Privacy Compliance', strategy: 'COPY', copySection: 'data_mgmt', nodeId: 'PC.V.1', fieldType: 'yesno' },
  { key: 'pure_assessment_id', label: 'PURE Assessment ID', strategy: 'MANUAL', nodeId: 'PC.V.2', fieldType: 'text' },
  { key: 'pure_purposeful', label: 'PURE: Purposeful', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'PC.V.2', fieldType: 'textarea' },
  { key: 'pure_unsurprising', label: 'PURE: Unsurprising', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'PC.V.2', fieldType: 'textarea' },
  { key: 'pure_respectful', label: 'PURE: Respectful', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'PC.V.2', fieldType: 'textarea' },
  { key: 'pure_explainable', label: 'PURE: Explainable', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'PC.V.2', fieldType: 'textarea' },
  { key: 'reporting_requirements', label: 'Risk Data Aggregation & Reporting', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'PC.V.3', fieldType: 'textarea' },
  { key: 'automated_reporting', label: 'Automated Regulatory Reporting', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'PC.V.3', fieldType: 'textarea' },

  // ═══════════════════════════════════════════════════════════════
  // SECTION VI: Other Risk Identification and Mitigation
  // ═══════════════════════════════════════════════════════════════

  { key: 'other_risks_exist', label: 'Other Risks Not Described in I-V?', strategy: 'MANUAL', nodeId: 'PC.VI', fieldType: 'yesno' },
  { key: 'operational_risk', label: 'Operational Risk Assessment', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.VI', fieldType: 'textarea', dependsOn: { field: 'other_risks_exist', value: 'Yes' } },
  { key: 'additional_risk_mitigants', label: 'Additional Risk Mitigants', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.VI', fieldType: 'bullet_list', dependsOn: { field: 'other_risks_exist', value: 'Yes' } },

  // ═══════════════════════════════════════════════════════════════
  // SECTION VII: Additional Info for Trading Products
  // ═══════════════════════════════════════════════════════════════

  { key: 'trading_product', label: 'Involves Trading Product?', strategy: 'RULE', ruleSource: 'npa_record', nodeId: 'PC.VII', fieldType: 'yesno' },
  { key: 'appendix5_required', label: 'Appendix 5 Assessment Required?', strategy: 'RULE', ruleSource: 'npa_record', nodeId: 'PC.VII', fieldType: 'yesno', dependsOn: { field: 'trading_product', value: 'Yes' } },

  // ═══════════════════════════════════════════════════════════════
  // APPENDICES
  // ═══════════════════════════════════════════════════════════════

  // APP.1 — Entity/Location Information
  { key: 'booking_entity', label: 'Booking Entity', strategy: 'RULE', ruleSource: 'org_chart', nodeId: 'APP.1', fieldType: 'text', required: true },
  { key: 'sales_entity', label: 'Sales / Origination Entity', strategy: 'RULE', ruleSource: 'org_chart', nodeId: 'APP.1', fieldType: 'text' },
  { key: 'sales_location', label: 'Sales / Origination Location', strategy: 'RULE', ruleSource: 'org_chart', nodeId: 'APP.1', fieldType: 'text' },
  { key: 'booking_location', label: 'Booking Location', strategy: 'RULE', ruleSource: 'org_chart', nodeId: 'APP.1', fieldType: 'text' },
  { key: 'risk_taking_entity', label: 'Risk Taking Entity', strategy: 'RULE', ruleSource: 'org_chart', nodeId: 'APP.1', fieldType: 'text' },
  { key: 'risk_taking_location', label: 'Risk Taking Location', strategy: 'RULE', ruleSource: 'org_chart', nodeId: 'APP.1', fieldType: 'text' },
  { key: 'processing_entity', label: 'Processing Entity', strategy: 'RULE', ruleSource: 'org_chart', nodeId: 'APP.1', fieldType: 'text' },
  { key: 'processing_location', label: 'Processing Location', strategy: 'RULE', ruleSource: 'org_chart', nodeId: 'APP.1', fieldType: 'text' },
  { key: 'counterparty', label: 'Counterparty', strategy: 'RULE', ruleSource: 'org_chart', nodeId: 'APP.1', fieldType: 'text' },

  // APP.2 — Intellectual Property
  { key: 'mbs_ip_exists', label: 'MBS IP Created/Used?', strategy: 'MANUAL', nodeId: 'APP.2', fieldType: 'yesno' },
  { key: 'mbs_ip_details', label: 'MBS IP Details', strategy: 'MANUAL', nodeId: 'APP.2', fieldType: 'textarea', dependsOn: { field: 'mbs_ip_exists', value: 'Yes' } },
  { key: 'third_party_ip_exists', label: 'Third Party IP Used?', strategy: 'MANUAL', nodeId: 'APP.2', fieldType: 'yesno' },
  { key: 'third_party_ip_details', label: 'Third Party IP Details', strategy: 'MANUAL', nodeId: 'APP.2', fieldType: 'textarea', dependsOn: { field: 'third_party_ip_exists', value: 'Yes' } },
  { key: 'ip_licensing', label: 'IP Licensing Arrangements', strategy: 'MANUAL', nodeId: 'APP.2', fieldType: 'textarea' },

  // APP.3 — Financial Crime Risk Areas
  { key: 'aml_assessment', label: 'AML Assessment', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'APP.3', fieldType: 'textarea', required: true },
  { key: 'terrorism_financing', label: 'Terrorism Financing Risk', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'APP.3', fieldType: 'textarea' },
  { key: 'sanctions_assessment', label: 'Sanctions Assessment', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'APP.3', fieldType: 'textarea' },
  { key: 'fraud_risk', label: 'Fraud Risk Assessment', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'APP.3', fieldType: 'textarea' },
  { key: 'bribery_corruption', label: 'Bribery & Corruption Risk', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'APP.3', fieldType: 'textarea' },
  { key: 'fc_risk_rating', label: 'Overall Financial Crime Risk Rating', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'APP.3', fieldType: 'dropdown', options: ['Low', 'Medium', 'High', 'Very High'] },
  { key: 'fc_mitigation_measures', label: 'FC Mitigation Measures', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'APP.3', fieldType: 'bullet_list' },

  // APP.4 — Risk Data Aggregation
  { key: 'rda_compliance', label: 'RDA Regulatory Compliance', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'APP.4', fieldType: 'textarea' },
  { key: 'rda_data_sources', label: 'Risk Data Sources', strategy: 'COPY', copySection: 'data_mgmt', nodeId: 'APP.4', fieldType: 'bullet_list' },
  { key: 'rda_aggregation_method', label: 'Data Aggregation Methodology', strategy: 'COPY', copySection: 'data_mgmt', nodeId: 'APP.4', fieldType: 'textarea' },

  // APP.5 — Additional Info for Trading Products
  { key: 'app5_revenue_sharing', label: 'Revenue Sharing Model', strategy: 'LLM', llmCategory: 'financial_projection', nodeId: 'APP.5', fieldType: 'textarea' },
  { key: 'app5_capital_allocation', label: 'Capital Allocation', strategy: 'LLM', llmCategory: 'financial_projection', nodeId: 'APP.5', fieldType: 'textarea' },
  { key: 'app5_hedge_purpose', label: 'Hedge Purpose?', strategy: 'MANUAL', nodeId: 'APP.5', fieldType: 'yesno' },
  { key: 'app5_hedge_description', label: 'Hedge Description', strategy: 'LLM', llmCategory: 'product_description', nodeId: 'APP.5', fieldType: 'textarea', dependsOn: { field: 'app5_hedge_purpose', value: 'Yes' } },
  { key: 'collateral_types', label: 'Collateral Types', strategy: 'COPY', copySection: 'trading', nodeId: 'APP.5', fieldType: 'multiselect', options: ['Cash', 'Government Bonds', 'Corporate Bonds', 'Equities', 'Real Estate', 'Commodities', 'Other'] },
  { key: 'custody_arrangements', label: 'Custody Arrangements', strategy: 'COPY', copySection: 'trading', nodeId: 'APP.5', fieldType: 'textarea' },
  { key: 'valuation_method', label: 'Valuation Method', strategy: 'COPY', copySection: 'trading', nodeId: 'APP.5', fieldType: 'textarea' },
  { key: 'funding_source', label: 'Funding Source', strategy: 'COPY', copySection: 'trading', nodeId: 'APP.5', fieldType: 'textarea' },
  { key: 'booking_schema', label: 'Booking Schema', strategy: 'RULE', ruleSource: 'product_config', nodeId: 'APP.5', fieldType: 'textarea' },
  { key: 'lifecycle_management', label: 'Lifecycle Management', strategy: 'COPY', copySection: 'trading', nodeId: 'APP.5', fieldType: 'textarea' },
  { key: 'cross_product_integration', label: 'Cross-Product Integration', strategy: 'LLM', llmCategory: 'operational', nodeId: 'APP.5', fieldType: 'textarea' },
  { key: 'app5_tech_architecture', label: 'Technology Architecture', strategy: 'LLM', llmCategory: 'operational', nodeId: 'APP.5', fieldType: 'textarea' },
  { key: 'app5_security_req', label: 'Security Requirements', strategy: 'MANUAL', nodeId: 'APP.5', fieldType: 'textarea' },
  { key: 'app5_scalability', label: 'Scalability Requirements', strategy: 'LLM', llmCategory: 'operational', nodeId: 'APP.5', fieldType: 'textarea' },
  { key: 'app5_compliance_framework', label: 'Compliance Framework', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'APP.5', fieldType: 'textarea' },
  { key: 'app5_reg_monitoring', label: 'Regulatory Monitoring', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'APP.5', fieldType: 'textarea' },

  // APP.6 — Third-Party Platforms
  { key: 'third_party_platform', label: 'Third-Party Platform Used?', strategy: 'MANUAL', nodeId: 'APP.6', fieldType: 'yesno' },
  { key: 'platform_name', label: 'Platform Name', strategy: 'MANUAL', nodeId: 'APP.6', fieldType: 'text', dependsOn: { field: 'third_party_platform', value: 'Yes' } },
  { key: 'platform_risk_assessment', label: 'Platform Risk Assessment', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'APP.6', fieldType: 'textarea', dependsOn: { field: 'third_party_platform', value: 'Yes' } },
  { key: 'info_security_assessment', label: 'Information Security Assessment', strategy: 'MANUAL', nodeId: 'APP.6', fieldType: 'textarea', dependsOn: { field: 'third_party_platform', value: 'Yes' } },
  { key: 'data_residency', label: 'Data Residency Consideration', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'APP.6', fieldType: 'textarea', dependsOn: { field: 'third_party_platform', value: 'Yes' } },

  // ═══════════════════════════════════════════════════════════════
  // ADDITIONAL GRANULAR FIELDS — Sub-detail level
  // ═══════════════════════════════════════════════════════════════

  // Section I — additional detail
  { key: 'product_currency_pair', label: 'Currency Pair (if FX)', strategy: 'RULE', ruleSource: 'npa_record', nodeId: 'PC.I.1.b', fieldType: 'text' },
  { key: 'product_benchmark', label: 'Benchmark / Reference Rate', strategy: 'RULE', ruleSource: 'npa_record', nodeId: 'PC.I.1.b', fieldType: 'text' },
  { key: 'product_notional_ccy', label: 'Notional Currency', strategy: 'RULE', ruleSource: 'npa_record', nodeId: 'PC.I.1.c', fieldType: 'dropdown', options: ['SGD', 'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'HKD', 'AUD', 'Multi-currency'] },
  { key: 'transfer_pricing', label: 'Transfer Pricing Methodology', strategy: 'LLM', llmCategory: 'financial_projection', nodeId: 'PC.I.1.c', fieldType: 'textarea' },
  { key: 'break_even_timeline', label: 'Break-Even Timeline', strategy: 'LLM', llmCategory: 'financial_projection', nodeId: 'PC.I.1.d', fieldType: 'text' },
  { key: 'competitive_landscape', label: 'Competitive Landscape', strategy: 'LLM', llmCategory: 'product_description', nodeId: 'PC.I.1.a', fieldType: 'textarea' },
  { key: 'market_opportunity', label: 'Market Opportunity Assessment', strategy: 'LLM', llmCategory: 'product_description', nodeId: 'PC.I.1.a', fieldType: 'textarea' },
  { key: 'customer_accreditation', label: 'Customer Accreditation Requirements', strategy: 'MANUAL', nodeId: 'PC.I.2.c', fieldType: 'textarea' },
  { key: 'kyc_requirements', label: 'KYC/CDD Requirements', strategy: 'COPY', copySection: 'product_specs', nodeId: 'PC.I.3.b', fieldType: 'textarea' },
  { key: 'complaints_handling', label: 'Complaints Handling Process', strategy: 'COPY', copySection: 'product_specs', nodeId: 'PC.I.3.b', fieldType: 'textarea' },

  // Section II — operational detail
  { key: 'trade_capture_system', label: 'Trade Capture System', strategy: 'RULE', ruleSource: 'system_config', nodeId: 'PC.II.2.a', fieldType: 'text' },
  { key: 'risk_system', label: 'Risk Management System', strategy: 'RULE', ruleSource: 'system_config', nodeId: 'PC.II.2.a', fieldType: 'text' },
  { key: 'reporting_system', label: 'Reporting System', strategy: 'RULE', ruleSource: 'system_config', nodeId: 'PC.II.2.a', fieldType: 'text' },
  { key: 'stp_rate', label: 'Expected STP Rate', strategy: 'LLM', llmCategory: 'operational', nodeId: 'PC.II.1.b', fieldType: 'text' },
  { key: 'nostro_accounts', label: 'Nostro Account Requirements', strategy: 'RULE', ruleSource: 'product_config', nodeId: 'PC.II.1.b', fieldType: 'textarea' },
  { key: 'mktdata_requirements', label: 'Market Data Requirements', strategy: 'LLM', llmCategory: 'operational', nodeId: 'PC.II.2.b', fieldType: 'textarea' },

  // Section III — pricing detail
  { key: 'fva_adjustment', label: 'FVA Adjustment', strategy: 'LLM', llmCategory: 'pricing', nodeId: 'PC.III.1', fieldType: 'textarea' },
  { key: 'xva_treatment', label: 'XVA Treatment', strategy: 'LLM', llmCategory: 'pricing', nodeId: 'PC.III.1', fieldType: 'textarea' },
  { key: 'day_count_convention', label: 'Day Count Convention', strategy: 'RULE', ruleSource: 'product_config', nodeId: 'PC.III.1', fieldType: 'dropdown', options: ['ACT/360', 'ACT/365', '30/360', 'ACT/ACT'] },

  // Section IV — risk detail
  { key: 'wrong_way_risk', label: 'Wrong-Way Risk', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.C.2', fieldType: 'textarea' },
  { key: 'cva_dva_impact', label: 'CVA/DVA Impact', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.C.5', fieldType: 'textarea' },
  { key: 'netting_agreements', label: 'Netting Agreements', strategy: 'COPY', copySection: 'legal', nodeId: 'PC.IV.C.2', fieldType: 'textarea' },
  { key: 'isda_master', label: 'ISDA Master Agreement', strategy: 'MANUAL', nodeId: 'PC.IV.C.2', fieldType: 'yesno' },
  { key: 'csa_in_place', label: 'CSA in Place', strategy: 'MANUAL', nodeId: 'PC.IV.C.4', fieldType: 'yesno' },
  { key: 'country_risk', label: 'Country Risk Assessment', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.D', fieldType: 'textarea' },
  { key: 'model_risk', label: 'Model Risk', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.B.1', fieldType: 'textarea' },

  // Section V — data detail
  { key: 'data_lineage', label: 'Data Lineage Documentation', strategy: 'COPY', copySection: 'data_mgmt', nodeId: 'PC.V.1', fieldType: 'textarea' },
  { key: 'data_classification', label: 'Data Classification Level', strategy: 'RULE', ruleSource: 'system_config', nodeId: 'PC.V.1', fieldType: 'dropdown', options: ['Public', 'Internal', 'Confidential', 'Restricted'] },

  // Appendix 1 — location detail
  { key: 'hedge_entity', label: 'Hedge Entity', strategy: 'RULE', ruleSource: 'org_chart', nodeId: 'APP.1', fieldType: 'text' },
  { key: 'hedge_location', label: 'Hedge Location', strategy: 'RULE', ruleSource: 'org_chart', nodeId: 'APP.1', fieldType: 'text' },
  { key: 'clearing_entity', label: 'Clearing Entity', strategy: 'RULE', ruleSource: 'org_chart', nodeId: 'APP.1', fieldType: 'text' },

  // Appendix 5 — trading detail
  { key: 'margin_methodology', label: 'Margin Methodology', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'APP.5', fieldType: 'textarea' },
  { key: 'close_out_netting', label: 'Close-Out Netting', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'APP.5', fieldType: 'textarea' },
  { key: 'trade_reporting', label: 'Trade Reporting Requirements', strategy: 'RULE', ruleSource: 'jurisdiction_table', nodeId: 'APP.5', fieldType: 'textarea' },
  { key: 'clearing_obligation', label: 'Clearing Obligation', strategy: 'RULE', ruleSource: 'jurisdiction_table', nodeId: 'APP.5', fieldType: 'yesno' },

  // ═══════════════════════════════════════════════════════════════
  // GAP-FILL FIELDS — Added 2026-02-23 per Phase 1 audit
  // ═══════════════════════════════════════════════════════════════

  // ── Section I.2 — Target Customer (missing sub-questions e, g) ──
  { key: 'customer_objectives', label: 'Customer Objectives & Risk Profile', strategy: 'LLM', llmCategory: 'product_description', nodeId: 'PC.I.2.e', fieldType: 'textarea' },
  { key: 'customer_key_risks', label: 'Key Risks Faced by Target Customers', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.I.2.g', fieldType: 'textarea' },

  // ── Section I.3 — Commercialization (missing d, e) ──
  { key: 'sales_surveillance', label: 'Sales Surveillance Process', strategy: 'COPY', copySection: 'product_specs', nodeId: 'PC.I.3.d', fieldType: 'textarea' },
  { key: 'staff_training', label: 'Staff Training Requirements', strategy: 'COPY', copySection: 'product_specs', nodeId: 'PC.I.3.e', fieldType: 'textarea' },

  // ── Section II.1.c — Operational Adequacy ──
  { key: 'ops_adequacy_checklist', label: 'Operational Adequacy Checklist', strategy: 'MANUAL', nodeId: 'PC.II.1.c', fieldType: 'checkbox_group', options: ['Adequate staffing confirmed', 'Process documentation complete', 'Systems ready for go-live', 'Controls tested and effective', 'Monitoring dashboards configured', 'Escalation procedures documented', 'Audit trail requirements met'] },

  // ── Section II.1.d — Operating Account Controls ──
  { key: 'operating_account_controls', label: 'Operating Account Controls', strategy: 'COPY', copySection: 'operational', nodeId: 'PC.II.1.d', fieldType: 'textarea' },

  // ── Section II.1.e — Limit Structure ──
  { key: 'limit_structure', label: 'Limit Structure', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.II.1.e', fieldType: 'textarea' },
  { key: 'limit_monitoring', label: 'Limit Monitoring Process', strategy: 'COPY', copySection: 'operational', nodeId: 'PC.II.1.e', fieldType: 'textarea' },

  // ── Section II.1.f — Manual Fallback ──
  { key: 'manual_fallback', label: 'Manual Process Fallback Required?', strategy: 'MANUAL', nodeId: 'PC.II.1.f', fieldType: 'yesno' },
  { key: 'manual_fallback_details', label: 'Manual Fallback Details', strategy: 'MANUAL', nodeId: 'PC.II.1.f', fieldType: 'textarea', dependsOn: { field: 'manual_fallback', value: 'Yes' } },

  // ── Section II.1.g — Collateral Management ──
  { key: 'collateral_eligibility', label: 'Eligible Collateral Types', strategy: 'COPY', copySection: 'operational', nodeId: 'PC.II.1.g', fieldType: 'textarea' },
  { key: 'collateral_haircuts', label: 'Collateral Haircuts', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.II.1.g', fieldType: 'textarea' },
  { key: 'margin_frequency', label: 'Margining Frequency', strategy: 'RULE', ruleSource: 'product_config', nodeId: 'PC.II.1.g', fieldType: 'dropdown', options: ['Daily', 'Weekly', 'Monthly', 'Ad-hoc', 'N/A'] },
  { key: 'collateral_disputes', label: 'Collateral Dispute Resolution', strategy: 'COPY', copySection: 'operational', nodeId: 'PC.II.1.g', fieldType: 'textarea' },

  // ── Section II.1.h — Custody Account ──
  { key: 'custody_required', label: 'Custody Account Required?', strategy: 'MANUAL', nodeId: 'PC.II.1.h', fieldType: 'yesno' },
  { key: 'custody_details', label: 'Custody Arrangement Details', strategy: 'COPY', copySection: 'operational', nodeId: 'PC.II.1.h', fieldType: 'textarea', dependsOn: { field: 'custody_required', value: 'Yes' } },

  // ── Section II.1.i — Trade Repository ──
  { key: 'trade_repository_reporting', label: 'Trade Repository / ESFR Reporting', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'PC.II.1.i', fieldType: 'textarea' },

  // ── Section II.1.j — SFEMC ──
  { key: 'sfemc_references', label: 'SFEMC / Code of Conduct References', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'PC.II.1.j', fieldType: 'textarea' },

  // ── Section II.5 — BCM expansion (9 additional fields) ──
  { key: 'bcm_critical_processes', label: 'Critical Business Processes', strategy: 'LLM', llmCategory: 'operational', nodeId: 'PC.II.5', fieldType: 'textarea' },
  { key: 'bcm_recovery_strategy', label: 'Recovery Strategy', strategy: 'COPY', copySection: 'operational', nodeId: 'PC.II.5', fieldType: 'textarea' },
  { key: 'bcm_alternate_site', label: 'Alternate Site Arrangements', strategy: 'COPY', copySection: 'operational', nodeId: 'PC.II.5', fieldType: 'textarea' },
  { key: 'bcm_communication_plan', label: 'Crisis Communication Plan', strategy: 'COPY', copySection: 'operational', nodeId: 'PC.II.5', fieldType: 'textarea' },
  { key: 'bcm_testing_frequency', label: 'BCM Testing Frequency', strategy: 'RULE', ruleSource: 'system_config', nodeId: 'PC.II.5', fieldType: 'dropdown', options: ['Quarterly', 'Semi-annually', 'Annually', 'As Required'] },
  { key: 'bcm_vendor_dependencies', label: 'Vendor/Third-Party Dependencies', strategy: 'LLM', llmCategory: 'operational', nodeId: 'PC.II.5', fieldType: 'textarea' },
  { key: 'bcm_staff_awareness', label: 'Staff Awareness & Training', strategy: 'COPY', copySection: 'operational', nodeId: 'PC.II.5', fieldType: 'textarea' },
  { key: 'bcm_regulatory_compliance', label: 'BCM Regulatory Compliance', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'PC.II.5', fieldType: 'textarea' },
  { key: 'bcm_incident_response', label: 'Incident Response Plan', strategy: 'COPY', copySection: 'operational', nodeId: 'PC.II.5', fieldType: 'textarea' },

  // ── Section III.3 — Backtesting (missing) ──
  { key: 'simm_backtesting', label: 'SIMM Backtesting Results', strategy: 'LLM', llmCategory: 'pricing', nodeId: 'PC.III.3', fieldType: 'textarea' },

  // ── Section IV.A.2 — Finance & Tax expansion ──
  { key: 'service_output_fees', label: 'Service Output Fees', strategy: 'LLM', llmCategory: 'financial_projection', nodeId: 'PC.IV.A.2', fieldType: 'textarea' },
  { key: 'service_fee_structure', label: 'Fee Structure Details', strategy: 'LLM', llmCategory: 'financial_projection', nodeId: 'PC.IV.A.2', fieldType: 'textarea' },
  { key: 'service_fee_allocation', label: 'Fee Allocation Methodology', strategy: 'LLM', llmCategory: 'financial_projection', nodeId: 'PC.IV.A.2', fieldType: 'textarea' },
  { key: 'reg_matching_ifrs', label: 'IFRS Regulatory Matching', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'PC.IV.A.2', fieldType: 'textarea' },
  { key: 'reg_matching_mas', label: 'MAS Notice Regulatory Matching', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'PC.IV.A.2', fieldType: 'textarea' },
  { key: 'reg_matching_gst', label: 'GST Treatment', strategy: 'LLM', llmCategory: 'financial_projection', nodeId: 'PC.IV.A.2', fieldType: 'textarea' },
  { key: 'reg_matching_wht', label: 'Withholding Tax Treatment', strategy: 'LLM', llmCategory: 'financial_projection', nodeId: 'PC.IV.A.2', fieldType: 'textarea' },

  // ── Section IV.A.3 — Financial Crimes & Financial Security (NEW) ──
  { key: 'fc_conduct_considerations', label: 'Conduct Considerations', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'PC.IV.A.3', fieldType: 'textarea' },
  { key: 'fc_mar_assessment', label: 'MAR Assessment', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'PC.IV.A.3', fieldType: 'textarea' },
  { key: 'fc_mar_sub_items', label: 'MAR Sub-Items (MAS References)', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'PC.IV.A.3', fieldType: 'bullet_list' },
  { key: 'fc_mra_boundary_test', label: 'MRA Boundary Test Required?', strategy: 'MANUAL', nodeId: 'PC.IV.A.3', fieldType: 'yesno' },
  { key: 'fc_mra_details', label: 'MRA Boundary Test Details', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'PC.IV.A.3', fieldType: 'textarea', dependsOn: { field: 'fc_mra_boundary_test', value: 'Yes' } },

  // ── Section IV.A.D — Funding Liquidity Risk (NEW) ──
  { key: 'flr_lcr_nsfr_metrics', label: 'LCR/NSFR/EAFL Metrics', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.A.D', fieldType: 'textarea' },
  { key: 'flr_hqla_qualification', label: 'HQLA Qualification', strategy: 'MANUAL', nodeId: 'PC.IV.A.D', fieldType: 'yesno' },
  { key: 'flr_cashflow_modeling', label: 'Cashflow Modeling', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.A.D', fieldType: 'textarea' },
  { key: 'flr_liquidity_facility', label: 'Liquidity Facility Required?', strategy: 'MANUAL', nodeId: 'PC.IV.A.D', fieldType: 'yesno' },
  { key: 'flr_limit_implementation', label: 'Limit Implementation Plan', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'PC.IV.A.D', fieldType: 'textarea' },

  // ── Appendix 5 — Duplicate fix: app5_valuation_model ──
  { key: 'app5_valuation_model', label: 'Valuation Model (Trading)', strategy: 'LLM', llmCategory: 'pricing', nodeId: 'APP.5.4', fieldType: 'textarea' },

  // ── Section V.3 — Risk Data Aggregation (missing 1 field) ──
  { key: 'rda_reporting_frequency', label: 'RDAR Reporting Frequency', strategy: 'RULE', ruleSource: 'system_config', nodeId: 'PC.V.3', fieldType: 'dropdown', options: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Ad-hoc'] },

  // ── Appendix 4 — RDAR (missing 1 field) ──
  { key: 'rda_data_quality', label: 'Data Quality Assessment', strategy: 'LLM', llmCategory: 'data_mgmt', nodeId: 'APP.4', fieldType: 'textarea' },

  // ── Appendix 3 — Financial Crime expansion (12 new fields) ──
  { key: 'fc_policy_framework', label: 'Financial Crime Policy Framework', strategy: 'COPY', copySection: 'legal', nodeId: 'APP.3.2', fieldType: 'textarea' },
  { key: 'fc_screening_controls', label: 'Screening Controls', strategy: 'COPY', copySection: 'legal', nodeId: 'APP.3.2', fieldType: 'textarea' },
  { key: 'fc_transaction_monitoring', label: 'Transaction Monitoring', strategy: 'COPY', copySection: 'legal', nodeId: 'APP.3.2', fieldType: 'textarea' },
  { key: 'fc_suspicious_reporting', label: 'Suspicious Transaction Reporting', strategy: 'MANUAL', nodeId: 'APP.3.2', fieldType: 'textarea' },
  { key: 'fc_record_keeping', label: 'Record Keeping Requirements', strategy: 'COPY', copySection: 'legal', nodeId: 'APP.3.2', fieldType: 'textarea' },
  { key: 'fc_staff_training', label: 'Financial Crime Staff Training', strategy: 'COPY', copySection: 'legal', nodeId: 'APP.3.2', fieldType: 'textarea' },
  { key: 'fc_independent_testing', label: 'Independent Testing Program', strategy: 'MANUAL', nodeId: 'APP.3.2', fieldType: 'textarea' },
  { key: 'fc_validation_process', label: 'Validation Process', strategy: 'COPY', copySection: 'legal', nodeId: 'APP.3.3', fieldType: 'textarea' },
  { key: 'fc_surveillance_tools', label: 'Surveillance Tools', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'APP.3.3', fieldType: 'textarea' },
  { key: 'fc_regulatory_reporting', label: 'Regulatory Reporting Obligations', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'APP.3.3', fieldType: 'textarea' },
  { key: 'fc_data_privacy_compliance', label: 'Data Privacy Compliance', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'APP.3.4', fieldType: 'textarea' },
  { key: 'fc_data_sharing_agreements', label: 'Data Sharing Agreements', strategy: 'COPY', copySection: 'legal', nodeId: 'APP.3.4', fieldType: 'textarea' },

  // ── Appendix 6 — Third-Party Platforms expansion (25 new fields) ──
  { key: 'tp_use_case_description', label: 'Use Case Description', strategy: 'LLM', llmCategory: 'operational', nodeId: 'APP.6.A', fieldType: 'textarea' },
  { key: 'tp_business_justification', label: 'Business Justification', strategy: 'LLM', llmCategory: 'product_description', nodeId: 'APP.6.A', fieldType: 'textarea' },
  { key: 'tp_risk_rating', label: 'Risk Rating', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'APP.6.B', fieldType: 'dropdown', options: ['Low', 'Medium', 'High', 'Critical'] },
  { key: 'tp_risk_mitigants', label: 'Risk Mitigants', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'APP.6.B', fieldType: 'textarea' },
  { key: 'tp_data_classification', label: 'Data Classification', strategy: 'MANUAL', nodeId: 'APP.6.C1', fieldType: 'dropdown', options: ['Public', 'Internal', 'Confidential', 'Restricted'] },
  { key: 'tp_user_population', label: 'User Population', strategy: 'MANUAL', nodeId: 'APP.6.C1', fieldType: 'textarea' },
  { key: 'tp_integration_scope', label: 'Integration Scope', strategy: 'LLM', llmCategory: 'operational', nodeId: 'APP.6.C1', fieldType: 'textarea' },
  { key: 'tp_data_flow', label: 'Data Flow Description', strategy: 'LLM', llmCategory: 'operational', nodeId: 'APP.6.C1', fieldType: 'textarea' },
  { key: 'tp_exit_strategy', label: 'Exit Strategy', strategy: 'LLM', llmCategory: 'operational', nodeId: 'APP.6.C1', fieldType: 'textarea' },
  { key: 'tp_encryption_standards', label: 'Encryption Standards', strategy: 'MANUAL', nodeId: 'APP.6.C2', fieldType: 'textarea' },
  { key: 'tp_access_controls', label: 'Access Controls', strategy: 'MANUAL', nodeId: 'APP.6.C2', fieldType: 'textarea' },
  { key: 'tp_audit_logging', label: 'Audit Logging', strategy: 'MANUAL', nodeId: 'APP.6.C2', fieldType: 'yesno' },
  { key: 'tp_vulnerability_mgmt', label: 'Vulnerability Management', strategy: 'MANUAL', nodeId: 'APP.6.C2', fieldType: 'textarea' },
  { key: 'tp_incident_response', label: 'Incident Response Plan', strategy: 'COPY', copySection: 'operational', nodeId: 'APP.6.C2', fieldType: 'textarea' },
  { key: 'tp_certifications', label: 'Security Certifications', strategy: 'MANUAL', nodeId: 'APP.6.C2', fieldType: 'checkbox_group', options: ['SOC 2 Type II', 'ISO 27001', 'PCI DSS', 'CSA STAR', 'Other'] },
  { key: 'tp_cyber_assessment', label: 'Cybersecurity Assessment', strategy: 'LLM', llmCategory: 'risk_analysis', nodeId: 'APP.6.C3', fieldType: 'textarea' },
  { key: 'tp_communication_archival', label: 'Communication Archival', strategy: 'MANUAL', nodeId: 'APP.6.C3', fieldType: 'yesno' },
  { key: 'tp_retention_policy', label: 'Data Retention Policy', strategy: 'MANUAL', nodeId: 'APP.6.C3', fieldType: 'textarea' },
  { key: 'tp_ediscovery', label: 'e-Discovery Capability', strategy: 'MANUAL', nodeId: 'APP.6.C3', fieldType: 'yesno' },
  { key: 'tp_data_ownership', label: 'Data Ownership', strategy: 'MANUAL', nodeId: 'APP.6.C4', fieldType: 'textarea' },
  { key: 'tp_ip_rights', label: 'IP Rights', strategy: 'MANUAL', nodeId: 'APP.6.C4', fieldType: 'textarea' },
  { key: 'tp_pdpa_compliance', label: 'PDPA Compliance', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'APP.6.C4', fieldType: 'textarea' },
  { key: 'tp_cross_border_transfer', label: 'Cross-Border Data Transfer', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'APP.6.C4', fieldType: 'textarea' },
  { key: 'tp_data_deletion', label: 'Data Deletion Process', strategy: 'MANUAL', nodeId: 'APP.6.C4', fieldType: 'textarea' },
  { key: 'tp_consent_management', label: 'Consent Management', strategy: 'MANUAL', nodeId: 'APP.6.C4', fieldType: 'textarea' },
  { key: 'tp_breach_notification', label: 'Breach Notification Process', strategy: 'COPY', copySection: 'legal', nodeId: 'APP.6.C4', fieldType: 'textarea' },
  { key: 'tp_dpo_contact', label: 'Data Protection Officer Contact', strategy: 'MANUAL', nodeId: 'APP.6.C4', fieldType: 'text' },
  { key: 'tp_privacy_impact', label: 'Privacy Impact Assessment', strategy: 'LLM', llmCategory: 'compliance', nodeId: 'APP.6.C4', fieldType: 'textarea' },
];

/**
 * Lookup helpers for the Field Registry
 */
export const FIELD_REGISTRY_MAP = new Map<string, FieldRegistryEntry>(
  NPA_FIELD_REGISTRY.map(entry => [entry.key, entry])
);

/** Get all fields for a given strategy */
export function getFieldsByStrategy(strategy: FieldFillStrategy): FieldRegistryEntry[] {
  return NPA_FIELD_REGISTRY.filter(f => f.strategy === strategy);
}

/** Get field keys grouped by strategy — used by Express prefill endpoint */
export function getFieldKeysByStrategy(): Record<FieldFillStrategy, string[]> {
  return {
    RULE: NPA_FIELD_REGISTRY.filter(f => f.strategy === 'RULE').map(f => f.key),
    COPY: NPA_FIELD_REGISTRY.filter(f => f.strategy === 'COPY').map(f => f.key),
    LLM: NPA_FIELD_REGISTRY.filter(f => f.strategy === 'LLM').map(f => f.key),
    MANUAL: NPA_FIELD_REGISTRY.filter(f => f.strategy === 'MANUAL').map(f => f.key),
  };
}

/** Get LLM fields grouped by prompt category — used to build LLM prompts */
export function getLlmFieldsByCategory(): Record<string, FieldRegistryEntry[]> {
  const categories: Record<string, FieldRegistryEntry[]> = {};
  for (const entry of NPA_FIELD_REGISTRY) {
    if (entry.strategy === 'LLM' && entry.llmCategory) {
      if (!categories[entry.llmCategory]) {
        categories[entry.llmCategory] = [];
      }
      categories[entry.llmCategory].push(entry);
    }
  }
  return categories;
}

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

/** Recursively collect all fieldKeys from a node and its descendants */
export function collectFieldKeys(node: TemplateNode): string[] {
  let keys = [...(node.fieldKeys || [])];
  for (const child of (node.children || [])) {
    keys = keys.concat(collectFieldKeys(child));
  }
  // Deduplicate
  return [...new Set(keys)];
}

/** Flatten the template tree into a list of section-level nodes for sidebar navigation */
export function getNavSections(): { id: string; label: string; numbering: string }[] {
  const sections: { id: string; label: string; numbering: string }[] = [];

  // Part C sections
  for (const child of (NPA_PART_C_TEMPLATE.children || [])) {
    if (child.type === 'section') {
      sections.push({ id: child.id, label: child.label, numbering: child.numbering });
    }
  }

  // Appendices — use short numbering (A1, A2) for sidebar nav
  for (let i = 0; i < NPA_APPENDICES_TEMPLATE.length; i++) {
    const app = NPA_APPENDICES_TEMPLATE[i];
    sections.push({ id: app.id, label: app.label, numbering: `A${i + 1}` });
  }

  return sections;
}
