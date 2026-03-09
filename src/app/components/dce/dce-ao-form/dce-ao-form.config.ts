/**
 * Digital Account Opening Form — Declarative Section & Field Configuration
 *
 * Maps the 31-page DCE Corporate Account Opening Form to a declarative config.
 * 5 main sections + 11 schedules (S6 removed per form).
 * Conditional visibility for product-specific schedules.
 */

import { AoFormSectionDef, AoSectionCondition } from './dce-ao-form.interfaces';

// ─── Helper ──────────────────────────────────────────────────────────────────

function f(key: string, label: string, sourceAgent: any, opts: any = {}) {
    return {
        key,
        label,
        type: opts.type || 'text',
        sourceAgent,
        required: opts.required !== false,
        options: opts.options,
        helpText: opts.helpText,
        gridSpan: opts.gridSpan || 1,
    };
}

// ─── Main Sections ───────────────────────────────────────────────────────────

const SEC1_CORPORATE_INFO: AoFormSectionDef = {
    id: 'sec1_corporate_info',
    title: 'Section 1 — Corporate Information',
    subtitle: 'Basic entity details and contact information',
    icon: 'building-2',
    sourceAgents: ['SA-1'],
    fields: [
        f('sec1_entity_name', 'Registered Entity Name', 'SA-1', { gridSpan: 2 }),
        f('sec1_trading_name', 'Trading Name (if different)', 'SA-1'),
        f('sec1_registration_number', 'Registration / UEN Number', 'SA-1'),
        f('sec1_date_of_incorporation', 'Date of Incorporation', 'SA-1', { type: 'date' }),
        f('sec1_country_of_incorporation', 'Country of Incorporation', 'SA-1'),
        f('sec1_registered_address', 'Registered Address', 'SA-1', { gridSpan: 2 }),
        f('sec1_business_address', 'Business / Correspondence Address', 'SA-1', { gridSpan: 2 }),
        f('sec1_principal_activity', 'Principal Business Activity', 'SA-1', { gridSpan: 2 }),
        f('sec1_entity_type', 'Entity Type', 'SA-1', { type: 'select', options: ['CORP', 'FUND', 'FI', 'SPV', 'INDIVIDUAL'] }),
        f('sec1_lei_number', 'LEI Number', 'SA-1', { required: false }),
        f('sec1_contact_person', 'Contact Person', 'SA-1'),
        f('sec1_contact_email', 'Contact Email', 'SA-1'),
        f('sec1_contact_phone', 'Contact Phone', 'SA-1'),
        f('sec1_website', 'Website', 'SA-1', { required: false }),
        f('sec1_tax_residency', 'Tax Residency', 'SA-4', { helpText: 'CRS/FATCA classification' }),
    ],
};

const SEC2_ACCOUNT_RELATIONSHIPS: AoFormSectionDef = {
    id: 'sec2_account_relationships',
    title: 'Section 2 — Account Relationships',
    subtitle: 'Ownership structure, directors, UBOs',
    icon: 'users',
    sourceAgents: ['SA-4', 'SA-1'],
    fields: [
        f('sec2_relationship_manager', 'Relationship Manager', 'SA-1'),
        f('sec2_rm_branch', 'RM Branch / Desk', 'SA-1'),
        f('sec2_beneficial_owners', 'Ultimate Beneficial Owners (UBOs)', 'SA-4', { type: 'textarea', gridSpan: 2 }),
        f('sec2_directors', 'Directors', 'SA-4', { type: 'textarea', gridSpan: 2 }),
        f('sec2_ownership_chain', 'Ownership Chain', 'SA-4', { type: 'textarea', gridSpan: 2 }),
        f('sec2_company_secretary', 'Company Secretary', 'SA-4', { required: false }),
        f('sec2_auditor', 'External Auditor', 'SA-4', { required: false }),
        f('sec2_authorized_representatives', 'Authorized Representatives', 'SA-3', { type: 'textarea', gridSpan: 2 }),
        f('sec2_source_of_wealth', 'Source of Wealth', 'SA-4', { type: 'textarea', gridSpan: 2 }),
        f('sec2_source_of_funds', 'Source of Funds for Margin', 'SA-4', { type: 'textarea', gridSpan: 2 }),
    ],
};

const SEC3_PRODUCTS_SERVICES: AoFormSectionDef = {
    id: 'sec3_products_services',
    title: 'Section 3 — Products & Services',
    subtitle: 'Requested product suite, exchange access, credit facility',
    icon: 'package',
    sourceAgents: ['SA-1', 'SA-5', 'SA-6'],
    fields: [
        f('sec3_products_requested', 'Products Requested', 'SA-1', { type: 'multi-select', options: ['FUTURES', 'OPTIONS', 'OTC_DERIVATIVES', 'COMMODITIES_PHYSICAL', 'MULTI_PRODUCT'], gridSpan: 2 }),
        f('sec3_exchange_memberships', 'Exchange Access Requested', 'SA-6', { type: 'textarea', required: false }),
        f('sec3_clearing_arrangements', 'Clearing Arrangements', 'SA-6', { required: false }),
        f('sec3_margin_type', 'Margin Type', 'SA-5', { type: 'select', options: ['CASH', 'LETTER_OF_CREDIT', 'BANK_GUARANTEE', 'OTHER'], required: false }),
        f('sec3_settlement_currency', 'Settlement Currency', 'SA-6', { type: 'select', options: ['SGD', 'USD', 'EUR', 'GBP', 'JPY', 'HKD', 'CNH'] }),
        f('sec3_account_base_currency', 'Account Base Currency', 'SA-6', { type: 'select', options: ['SGD', 'USD', 'EUR', 'GBP', 'JPY', 'HKD', 'CNH'] }),
        f('sec3_credit_facility_required', 'Credit Facility Required?', 'SA-5', { type: 'checkbox' }),
        f('sec3_initial_margin_source', 'Initial Margin Source', 'SA-5', { required: false }),
    ],
};

const SEC4_CUSTOMER_DECLARATION: AoFormSectionDef = {
    id: 'sec4_customer_declaration',
    title: 'Section 4 — Customer Declaration',
    subtitle: 'Regulatory acknowledgements and declarations (Clauses a–p)',
    icon: 'file-pen',
    sourceAgents: ['SA-3'],
    fields: [
        f('sec4_declaration_clause_a', 'Clause (a): Information accuracy', 'SA-3', { type: 'checkbox' }),
        f('sec4_declaration_clause_b', 'Clause (b): Material changes notification', 'SA-3', { type: 'checkbox' }),
        f('sec4_declaration_clause_c', 'Clause (c): Anti-money laundering compliance', 'SA-3', { type: 'checkbox' }),
        f('sec4_declaration_clause_d', 'Clause (d): Tax obligations acknowledgement', 'SA-3', { type: 'checkbox' }),
        f('sec4_declaration_clause_e', 'Clause (e): Terms & conditions acceptance', 'SA-3', { type: 'checkbox' }),
        f('sec4_declaration_clause_f', 'Clause (f): Risk disclosure acknowledgement', 'SA-3', { type: 'checkbox' }),
        f('sec4_declaration_clause_g', 'Clause (g): Data protection consent', 'SA-3', { type: 'checkbox' }),
        f('sec4_declaration_clause_h', 'Clause (h): Electronic communications consent', 'SA-3', { type: 'checkbox' }),
        f('sec4_declaration_accepted', 'All Declarations Accepted', 'SA-3', { type: 'checkbox' }),
        f('sec4_declaration_date', 'Declaration Date', 'SA-3', { type: 'date' }),
        f('sec4_authorized_signatory_1', 'Authorized Signatory 1', 'SA-3'),
        f('sec4_authorized_signatory_2', 'Authorized Signatory 2', 'SA-3', { required: false }),
        f('sec4_company_stamp', 'Company Stamp Applied', 'SA-3', { type: 'checkbox' }),
    ],
};

const SEC5_AUTHORIZED_PERSONS: AoFormSectionDef = {
    id: 'sec5_authorized_persons',
    title: 'Section 5 — Authorized Persons',
    subtitle: 'Trading, settlement, and documentation authorized personnel',
    icon: 'users',
    sourceAgents: ['SA-3', 'SA-6'],
    fields: [
        f('sec5_trading_authorized', 'Trading Authorized Persons', 'SA-3', { type: 'textarea', gridSpan: 2 }),
        f('sec5_settlement_authorized', 'Settlement Authorized Persons', 'SA-3', { type: 'textarea', gridSpan: 2 }),
        f('sec5_document_authorized', 'Documentation Authorized Persons', 'SA-3', { type: 'textarea', gridSpan: 2 }),
        f('sec5_max_order_size', 'Max Order Size Limit', 'SA-6', { type: 'currency', required: false }),
        f('sec5_trading_limits', 'Trading Limits / Restrictions', 'SA-6', { type: 'textarea', required: false, gridSpan: 2 }),
        f('sec5_authorized_products', 'Authorized Products per Person', 'SA-6', { type: 'textarea', required: false, gridSpan: 2 }),
    ],
};

// ─── Schedules ───────────────────────────────────────────────────────────────

const SCHED_S1_RISK_SFA: AoFormSectionDef = {
    id: 'sched_s1_risk_sfa',
    title: 'Schedule S1 — Risk Disclosure Statement (SFA)',
    subtitle: 'Securities and Futures Act risk acknowledgement',
    icon: 'alert-triangle',
    sourceAgents: ['SA-3'],
    fields: [
        f('s1_risk_acknowledged', 'SFA Risk Acknowledged', 'SA-3', { type: 'checkbox' }),
        f('s1_signatory', 'Signatory Name', 'SA-3'),
        f('s1_date', 'Date Signed', 'SA-3', { type: 'date' }),
    ],
};

const SCHED_S2_RISK_CTA: AoFormSectionDef = {
    id: 'sched_s2_risk_cta',
    title: 'Schedule S2 — Risk Disclosure Statement (CTA)',
    subtitle: 'Commodity Trading Act risk acknowledgement',
    icon: 'alert-triangle',
    sourceAgents: ['SA-3'],
    fields: [
        f('s2_risk_acknowledged', 'CTA Risk Acknowledged', 'SA-3', { type: 'checkbox' }),
        f('s2_signatory', 'Signatory Name', 'SA-3'),
        f('s2_date', 'Date Signed', 'SA-3', { type: 'date' }),
    ],
};

const SCHED_S3_EXECUTION_ONLY: AoFormSectionDef = {
    id: 'sched_s3_execution_only',
    title: 'Schedule S3 — Execution-Only Acknowledgement',
    subtitle: 'Client confirms execution-only basis',
    icon: 'zap',
    sourceAgents: ['SA-3'],
    fields: [
        f('s3_execution_only_accepted', 'Execution-Only Basis Accepted', 'SA-3', { type: 'checkbox' }),
        f('s3_signatory', 'Signatory Name', 'SA-3'),
        f('s3_date', 'Date Signed', 'SA-3', { type: 'date' }),
    ],
};

const SCHED_S4_CONSENT_OTHER_SIDE: AoFormSectionDef = {
    id: 'sched_s4_consent_other_side',
    title: 'Schedule S4 — Consent to Act on Other Side',
    subtitle: 'Consent for broker to act as counterparty',
    icon: 'refresh-cw',
    sourceAgents: ['SA-3'],
    fields: [
        f('s4_consent_granted', 'Consent Granted', 'SA-3', { type: 'checkbox' }),
        f('s4_signatory', 'Signatory Name', 'SA-3'),
        f('s4_date', 'Date Signed', 'SA-3', { type: 'date' }),
    ],
};

const SCHED_S5_AUTO_CURRENCY: AoFormSectionDef = {
    id: 'sched_s5_auto_currency',
    title: 'Schedule S5 — Auto Currency Conversion',
    subtitle: 'Standing instruction for automatic FX conversion',
    icon: 'percent',
    sourceAgents: ['SA-6'],
    fields: [
        f('s5_auto_conversion_enabled', 'Auto Currency Conversion Enabled', 'SA-6', { type: 'checkbox' }),
        f('s5_base_currency', 'Base Currency', 'SA-6', { type: 'select', options: ['SGD', 'USD', 'EUR', 'GBP'] }),
        f('s5_signatory', 'Signatory Name', 'SA-3'),
        f('s5_date', 'Date Signed', 'SA-3', { type: 'date' }),
    ],
};

const SCHED_S7A_REGISTRATION_CLEARING: AoFormSectionDef = {
    id: 'sched_s7a_registration_clearing',
    title: 'Schedule S7A — Registration & Clearing',
    subtitle: 'Exchange-traded futures & options clearing setup',
    icon: 'landmark',
    sourceAgents: ['SA-6'],
    conditions: [
        { field: 'products_requested', operator: 'includes', value: ['FUTURES', 'OPTIONS'] },
    ],
    fields: [
        f('s7a_exchange_list', 'Exchanges Applied For', 'SA-6', { type: 'textarea', gridSpan: 2 }),
        f('s7a_clearing_member', 'Clearing Member', 'SA-6'),
        f('s7a_clearing_account', 'Clearing Account Number', 'SA-6'),
        f('s7a_registration_type', 'Registration Type', 'SA-6', { type: 'select', options: ['OMNIBUS', 'SEGREGATED', 'HOUSE'] }),
        f('s7a_give_up', 'Give-Up Arrangements', 'SA-6', { type: 'textarea', required: false, gridSpan: 2 }),
        f('s7a_bunched_orders', 'Bunched Order Arrangements', 'SA-6', { type: 'textarea', required: false, gridSpan: 2 }),
        f('s7a_position_limits', 'Position Limits', 'SA-6', { type: 'textarea', required: false, gridSpan: 2 }),
    ],
};

const SCHED_S8A_LME: AoFormSectionDef = {
    id: 'sched_s8a_lme',
    title: 'Schedule S8A — LME Trading',
    subtitle: 'London Metal Exchange trading arrangements',
    icon: 'gem',
    sourceAgents: ['SA-6'],
    conditions: [
        { field: 'products_requested', operator: 'includes', value: ['COMMODITIES_PHYSICAL'] },
    ],
    fields: [
        f('s8a_lme_products', 'LME Products Requested', 'SA-6', { type: 'textarea', gridSpan: 2 }),
        f('s8a_lme_clearing', 'LME Clearing Arrangements', 'SA-6'),
        f('s8a_lme_warehouse', 'Preferred Warehouse Location', 'SA-6', { required: false }),
        f('s8a_lme_signatory', 'Signatory Name', 'SA-3'),
        f('s8a_lme_date', 'Date Signed', 'SA-3', { type: 'date' }),
    ],
};

const SCHED_S9_DELIVERABLE: AoFormSectionDef = {
    id: 'sched_s9_deliverable',
    title: 'Schedule S9 — Deliverable Contracts',
    subtitle: 'Physical delivery arrangements for commodity contracts',
    icon: 'package',
    sourceAgents: ['SA-6'],
    conditions: [
        { field: 'products_requested', operator: 'includes', value: ['COMMODITIES_PHYSICAL'] },
    ],
    fields: [
        f('s9_delivery_capable', 'Delivery Capability Confirmed', 'SA-6', { type: 'checkbox' }),
        f('s9_delivery_locations', 'Delivery Locations', 'SA-6', { type: 'textarea', gridSpan: 2 }),
        f('s9_storage_arrangements', 'Storage Arrangements', 'SA-6', { type: 'textarea', required: false, gridSpan: 2 }),
        f('s9_signatory', 'Signatory Name', 'SA-3'),
        f('s9_date', 'Date Signed', 'SA-3', { type: 'date' }),
    ],
};

const SCHED_S10_ESTATEMENTS: AoFormSectionDef = {
    id: 'sched_s10_estatements',
    title: 'Schedule S10 — Electronic Statements',
    subtitle: 'Opt-in for electronic delivery of statements',
    icon: 'mail',
    sourceAgents: ['SA-6', 'SA-3'],
    fields: [
        f('s10_estatement_opted', 'E-Statement Opted In', 'SA-6', { type: 'checkbox' }),
        f('s10_email_address', 'E-Statement Email Address', 'SA-1'),
        f('s10_date', 'Date Signed', 'SA-3', { type: 'date' }),
    ],
};

const SCHED_S11A_EINSTRUCTIONS: AoFormSectionDef = {
    id: 'sched_s11a_einstructions',
    title: 'Schedule S11A — Electronic Instructions',
    subtitle: 'Authorization for electronic trading instructions',
    icon: 'monitor',
    sourceAgents: ['SA-6', 'SA-3'],
    fields: [
        f('s11a_einstructions_opted', 'E-Instructions Authorization', 'SA-6', { type: 'checkbox' }),
        f('s11a_platform', 'Trading Platform', 'SA-6', { type: 'select', options: ['CQG', 'IDB_PORTAL', 'BOTH'] }),
        f('s11a_signatory', 'Signatory Name', 'SA-3'),
        f('s11a_date', 'Date Signed', 'SA-3', { type: 'date' }),
    ],
};

const SCHED_S12_BANK_ACCOUNTS: AoFormSectionDef = {
    id: 'sched_s12_bank_accounts',
    title: 'Schedule S12 — Bank Account Details',
    subtitle: 'Settlement and margin bank account information',
    icon: 'landmark',
    sourceAgents: ['SA-6'],
    fields: [
        f('s12_settlement_bank', 'Settlement Bank Name', 'SA-6'),
        f('s12_settlement_bank_address', 'Settlement Bank Address', 'SA-6', { gridSpan: 2 }),
        f('s12_settlement_account', 'Settlement Account Number', 'SA-6'),
        f('s12_settlement_swift', 'Settlement SWIFT Code', 'SA-6'),
        f('s12_margin_bank', 'Margin Bank Name', 'SA-6'),
        f('s12_margin_account', 'Margin Account Number', 'SA-6'),
        f('s12_margin_swift', 'Margin SWIFT Code', 'SA-6'),
        f('s12_preferred_currency', 'Preferred Settlement Currency', 'SA-6', { type: 'select', options: ['SGD', 'USD', 'EUR', 'GBP', 'JPY', 'HKD', 'CNH'] }),
    ],
};

// ─── Exported Section Array ──────────────────────────────────────────────────

export const AO_FORM_SECTIONS: AoFormSectionDef[] = [
    SEC1_CORPORATE_INFO,
    SEC2_ACCOUNT_RELATIONSHIPS,
    SEC3_PRODUCTS_SERVICES,
    SEC4_CUSTOMER_DECLARATION,
    SEC5_AUTHORIZED_PERSONS,
    SCHED_S1_RISK_SFA,
    SCHED_S2_RISK_CTA,
    SCHED_S3_EXECUTION_ONLY,
    SCHED_S4_CONSENT_OTHER_SIDE,
    SCHED_S5_AUTO_CURRENCY,
    SCHED_S7A_REGISTRATION_CLEARING,
    SCHED_S8A_LME,
    SCHED_S9_DELIVERABLE,
    SCHED_S10_ESTATEMENTS,
    SCHED_S11A_EINSTRUCTIONS,
    SCHED_S12_BANK_ACCOUNTS,
];

/**
 * Filter sections based on entity type and products.
 * Sections with no conditions are always visible.
 */
export function getVisibleSections(
    entityType: string | null,
    productsRequested: string[] | null
): AoFormSectionDef[] {
    return AO_FORM_SECTIONS.filter(section => {
        if (!section.conditions || section.conditions.length === 0) return true;

        return section.conditions.some(cond => {
            if (cond.field === 'products_requested') {
                if (!productsRequested) return false;
                const targets = Array.isArray(cond.value) ? cond.value : [cond.value];
                if (cond.operator === 'includes') {
                    return targets.some(t => productsRequested.includes(t));
                }
            }
            if (cond.field === 'entity_type') {
                if (!entityType) return false;
                if (cond.operator === 'equals') return entityType === cond.value;
                if (cond.operator === 'not_equals') return entityType !== cond.value;
            }
            return true;
        });
    });
}
