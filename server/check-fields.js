/**
 * check-fields.js — Check which field_keys from seed are missing in ref_npa_fields
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mysql = require('mysql2/promise');

// All field_keys used in seed-npa-001-digital-asset-custody.sql
const usedKeys = [
    'product_name', 'problem_statement', 'value_proposition', 'customer_benefit', 'bu_benefit',
    'product_type', 'underlying_asset', 'currency_denomination', 'notional_amount', 'tenor',
    'funding_type', 'product_role', 'product_maturity', 'product_lifecycle', 'product_features',
    'revenue_year1', 'revenue_year1_net', 'revenue_year2', 'revenue_year2_net', 'revenue_year3',
    'revenue_year3_net', 'expected_volume', 'target_roi', 'revenue_streams', 'gross_margin_split',
    'cost_allocation', 'spv_involved', 'customer_segments', 'customer_restrictions', 'customer_suitability',
    'customer_geographic', 'distribution_channels', 'sales_suitability', 'onboarding_process',
    'marketing_plan', 'pac_reference', 'pac_date', 'external_parties_involved', 'external_party_names',
    'esg_data_used', 'competitive_landscape', 'market_opportunity', 'break_even_timeline',
    'kyc_requirements', 'customer_accreditation', 'staff_training', 'customer_objectives', 'customer_key_risks',
    'front_office_model', 'middle_office_model', 'back_office_model', 'third_party_ops', 'booking_system',
    'booking_legal_form', 'booking_family', 'booking_typology', 'portfolio_allocation', 'settlement_method',
    'settlement_flow', 'confirmation_process', 'reconciliation', 'exception_handling', 'accounting_treatment',
    'new_system_changes', 'tech_requirements', 'system_integration', 'valuation_model', 'trade_capture_system',
    'risk_system', 'reporting_system', 'stp_rate', 'mktdata_requirements', 'hsm_required', 'security_assessment',
    'pentest_status', 'iss_deviations', 'grc_id', 'rto_target', 'rpo_target', 'dr_testing_plan',
    'bcp_requirements', 'bia_considerations', 'continuity_measures', 'limit_structure', 'limit_monitoring',
    'custody_required', 'custody_details', 'pricing_model_required', 'pricing_methodology', 'roae_analysis',
    'pricing_assumptions', 'bespoke_adjustments', 'pricing_model_name', 'model_validation_date',
    'model_restrictions', 'simm_treatment', 'transfer_pricing', 'risk_classification', 'market_risk',
    'mrf_fx_delta', 'mrf_ir_delta', 'mrf_commodity', 'mrf_credit', 'liquidity_risk', 'liquidity_cost',
    'credit_risk', 'counterparty_rating', 'credit_support_required', 'collateral_framework', 'custody_risk',
    'regulatory_capital', 'stress_scenarios', 'stress_test_results', 'reputational_risk', 'negative_impact',
    'esg_assessment', 'esg_classification', 'exposure_limits', 'monitoring_party', 'legal_opinion',
    'licensing_requirements', 'primary_regulation', 'secondary_regulations', 'regulatory_reporting',
    'cross_border_regulations', 'legal_docs_required', 'sanctions_check', 'aml_considerations', 'tax_impact',
    'accounting_book', 'fair_value_treatment', 'on_off_balance', 'tax_jurisdictions', 'model_risk', 'country_risk',
    'data_governance', 'data_ownership', 'data_stewardship', 'data_quality_monitoring', 'data_privacy',
    'data_retention', 'gdpr_compliance', 'pure_assessment_id', 'pure_purposeful', 'pure_unsurprising',
    'pure_respectful', 'pure_explainable', 'reporting_requirements', 'data_lineage', 'data_classification',
    'automated_reporting', 'other_risks_exist', 'operational_risk', 'additional_risk_mitigants',
    'trading_product', 'appendix5_required', 'booking_entity', 'sales_entity', 'booking_location',
    'sales_location', 'risk_taking_entity', 'risk_taking_location', 'processing_entity', 'processing_location',
    'counterparty', 'hedge_entity', 'mbs_ip_exists', 'mbs_ip_details', 'third_party_ip_exists',
    'third_party_ip_details', 'ip_licensing', 'aml_assessment', 'terrorism_financing', 'sanctions_assessment',
    'fraud_risk', 'bribery_corruption', 'fc_risk_rating', 'fc_mitigation_measures', 'fc_policy_framework',
    'fc_screening_controls', 'fc_transaction_monitoring', 'fc_suspicious_reporting', 'fc_record_keeping',
    'fc_staff_training', 'fc_independent_testing', 'fc_surveillance_tools', 'fc_regulatory_reporting',
    'fc_data_privacy_compliance', 'rda_compliance', 'rda_data_sources', 'rda_aggregation_method', 'rda_data_quality',
    'third_party_platform', 'platform_name', 'tp_use_case_description', 'tp_business_justification',
    'tp_risk_rating', 'tp_risk_mitigants', 'tp_data_classification', 'tp_integration_scope',
    'tp_encryption_standards', 'tp_access_controls', 'tp_audit_logging', 'tp_certifications',
    'tp_cyber_assessment', 'tp_pdpa_compliance', 'info_security_assessment', 'platform_risk_assessment',
    'data_residency'
];

(async () => {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST, port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
    });
    try {
        const placeholders = usedKeys.map(() => '?').join(',');
        const [rows] = await conn.query(
            `SELECT field_key FROM ref_npa_fields WHERE field_key IN (${placeholders})`, usedKeys
        );
        const found = new Set(rows.map(r => r.field_key));
        const missing = usedKeys.filter(k => !found.has(k));
        console.log(`Total keys in seed: ${usedKeys.length}`);
        console.log(`Found in ref_npa_fields: ${found.size}`);
        console.log(`MISSING (${missing.length}):`, JSON.stringify(missing, null, 2));
    } finally {
        await conn.end();
    }
})();
