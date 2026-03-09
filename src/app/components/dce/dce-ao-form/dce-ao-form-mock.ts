/**
 * Digital Account Opening Form — Mock Data Factory
 *
 * Populates AO form fields from SA agent outputs at the N-3 (KYC) scenario.
 * SA-1/2/3 completed → FILLED, SA-4 partial → FILLED, SA-5/6/7 → PENDING
 */

import { AoFormData, AoFormFieldValue, AoFillStatus, AoSourceAgent } from './dce-ao-form.interfaces';
import { AO_FORM_SECTIONS } from './dce-ao-form.config';
import {
    DceClassification, DceKycBrief, DceSignatureVerification,
    DceCreditResponse, DceConfigResponse,
} from '../../../services/dce.service';

function filled(value: any, agent: AoSourceAgent, confidence = 95, at = '2026-03-02T11:45:00+08:00'): AoFormFieldValue {
    return { value, fillStatus: 'FILLED', confidence, filledBy: agent, filledAt: at };
}

function pending(): AoFormFieldValue {
    return { value: null, fillStatus: 'PENDING' };
}

/**
 * Build AO form data from whatever SA outputs are available.
 * Fields whose source agent hasn't produced output yet remain PENDING.
 */
export function buildAoFormData(
    classification: DceClassification | null,
    kycBrief: DceKycBrief | null,
    signatureData: DceSignatureVerification | null,
    creditResponse: DceCreditResponse | null,
    configResponse: DceConfigResponse | null,
): AoFormData {
    const fields: Record<string, AoFormFieldValue> = {};

    // Initialize all fields as PENDING
    for (const section of AO_FORM_SECTIONS) {
        for (const field of section.fields) {
            fields[field.key] = pending();
        }
    }

    // ── SA-1 fields (from classification) ────────────────────────────────
    if (classification) {
        const at = classification.classified_at;
        fields['sec1_entity_name'] = filled(classification.client_name, 'SA-1', 94, at);
        fields['sec1_registration_number'] = filled('201812345A', 'SA-1', 90, at);
        fields['sec1_country_of_incorporation'] = filled(classification.jurisdiction, 'SA-1', 94, at);
        fields['sec1_entity_type'] = filled(classification.client_entity_type, 'SA-1', 94, at);
        fields['sec1_principal_activity'] = filled('Proprietary trading in commodity futures and options', 'SA-1', 85, at);
        fields['sec1_contact_email'] = filled('john.tan@abctrading.com', 'SA-1', 90, at);
        fields['sec1_contact_person'] = filled('John Tan Wei Ming', 'SA-1', 90, at);
        fields['sec1_contact_phone'] = filled('+65 6789 0123', 'SA-1', 85, at);

        // Products
        const products = (classification.products_requested || []).join(', ');
        fields['sec3_products_requested'] = filled(products, 'SA-1', 94, at);

        // RM
        fields['sec2_relationship_manager'] = filled('John Tan Wei Ming (RM-0042)', 'SA-1', 95, at);
        fields['sec2_rm_branch'] = filled('Singapore HQ — Institutional Derivatives', 'SA-1', 95, at);

        // E-statement email (from classification)
        fields['s10_email_address'] = filled('john.tan@abctrading.com', 'SA-1', 90, at);
    }

    // ── SA-3 fields (from signature verification) ────────────────────────
    if (signatureData && signatureData.verification_status !== null) {
        const at = signatureData.reviewed_at || '2026-03-02T11:22:00+08:00';
        const signatories = signatureData.signatories || [];

        // Authorized persons
        const tradingAuth = signatories.map(s => `${s.signatory_name} — ${s.role_in_mandate}`).join('\n');
        fields['sec5_trading_authorized'] = filled(tradingAuth, 'SA-3', 90, at);
        fields['sec5_settlement_authorized'] = filled(tradingAuth, 'SA-3', 85, at);
        fields['sec5_document_authorized'] = filled(tradingAuth, 'SA-3', 85, at);

        // Authorized representatives in Sec 2
        fields['sec2_authorized_representatives'] = filled(tradingAuth, 'SA-3', 90, at);

        // Declaration signatories
        fields['sec4_authorized_signatory_1'] = filled(signatories[0]?.signatory_name || '', 'SA-3', 91, at);
        if (signatories.length > 1) {
            fields['sec4_authorized_signatory_2'] = filled(signatories[1]?.signatory_name || '', 'SA-3', 78, at);
        }
        fields['sec4_company_stamp'] = filled(true, 'SA-3', 88, at);
        fields['sec4_declaration_date'] = filled('2026-03-02', 'SA-3', 90, at);

        // Declaration clauses (extracted from signed form)
        fields['sec4_declaration_clause_a'] = filled(true, 'SA-3', 92, at);
        fields['sec4_declaration_clause_b'] = filled(true, 'SA-3', 92, at);
        fields['sec4_declaration_clause_c'] = filled(true, 'SA-3', 92, at);
        fields['sec4_declaration_clause_d'] = filled(true, 'SA-3', 92, at);
        fields['sec4_declaration_clause_e'] = filled(true, 'SA-3', 92, at);
        fields['sec4_declaration_clause_f'] = filled(true, 'SA-3', 92, at);
        fields['sec4_declaration_clause_g'] = filled(true, 'SA-3', 92, at);
        fields['sec4_declaration_clause_h'] = filled(true, 'SA-3', 92, at);
        fields['sec4_declaration_accepted'] = filled(true, 'SA-3', 92, at);

        // Schedule risk acknowledgements
        fields['s1_risk_acknowledged'] = filled(true, 'SA-3', 90, at);
        fields['s1_signatory'] = filled(signatories[0]?.signatory_name || '', 'SA-3', 91, at);
        fields['s1_date'] = filled('2026-03-02', 'SA-3', 90, at);
        fields['s2_risk_acknowledged'] = filled(true, 'SA-3', 90, at);
        fields['s2_signatory'] = filled(signatories[0]?.signatory_name || '', 'SA-3', 91, at);
        fields['s2_date'] = filled('2026-03-02', 'SA-3', 90, at);
        fields['s3_execution_only_accepted'] = filled(true, 'SA-3', 90, at);
        fields['s3_signatory'] = filled(signatories[0]?.signatory_name || '', 'SA-3', 91, at);
        fields['s3_date'] = filled('2026-03-02', 'SA-3', 90, at);
        fields['s4_consent_granted'] = filled(true, 'SA-3', 90, at);
        fields['s4_signatory'] = filled(signatories[0]?.signatory_name || '', 'SA-3', 91, at);
        fields['s4_date'] = filled('2026-03-02', 'SA-3', 90, at);
        fields['s5_signatory'] = filled(signatories[0]?.signatory_name || '', 'SA-3', 91, at);
        fields['s5_date'] = filled('2026-03-02', 'SA-3', 90, at);
    }

    // ── SA-4 fields (from KYC brief) ─────────────────────────────────────
    if (kycBrief) {
        const at = '2026-03-02T11:45:00+08:00';
        fields['sec2_beneficial_owners'] = filled(kycBrief.beneficial_owners, 'SA-4', 88, at);
        fields['sec2_directors'] = filled(kycBrief.directors, 'SA-4', 90, at);
        fields['sec2_ownership_chain'] = filled(kycBrief.ownership_chain, 'SA-4', 85, at);
        fields['sec2_source_of_wealth'] = filled(kycBrief.source_of_wealth, 'SA-4', 82, at);
        fields['sec2_source_of_funds'] = filled(
            'Operating cash flow from proprietary futures trading', 'SA-4', 78, at
        );
        fields['sec1_tax_residency'] = filled('Singapore — CRS: Reporting FI / FATCA: Non-US', 'SA-4', 80, at);
    }

    // ── SA-5 fields (from credit response) ───────────────────────────────
    if (creditResponse?.credit_brief) {
        const brief = creditResponse.credit_brief;
        const at = '2026-03-02T14:00:00+08:00';
        fields['sec3_credit_facility_required'] = filled(true, 'SA-5', 90, at);
        fields['sec3_margin_type'] = filled('CASH', 'SA-5', 85, at);
        fields['sec3_initial_margin_source'] = filled(
            `Estimated SGD ${brief.estimated_initial_limit_sgd.toLocaleString()}`, 'SA-5', 80, at
        );
    }

    // ── SA-6 fields (from config response) ───────────────────────────────
    if (configResponse?.config_spec) {
        const spec = configResponse.config_spec;
        const at = '2026-03-02T16:00:00+08:00';

        // Products
        fields['sec3_exchange_memberships'] = filled(
            (spec.ubix_config.product_permissions || []).join(', '), 'SA-6', 90, at
        );
        fields['sec3_settlement_currency'] = filled('SGD', 'SA-6', 95, at);
        fields['sec3_account_base_currency'] = filled(spec.ubix_config.jurisdiction === 'SGP' ? 'SGD' : 'USD', 'SA-6', 90, at);
        fields['sec3_clearing_arrangements'] = filled(spec.sic_config.account_mapping, 'SA-6', 88, at);

        // S7A Registration & Clearing
        fields['s7a_exchange_list'] = filled(
            (spec.ubix_config.product_permissions || []).join(', '), 'SA-6', 88, at
        );
        fields['s7a_clearing_member'] = filled('MBS DCE Clearing', 'SA-6', 92, at);
        fields['s7a_clearing_account'] = filled(spec.sic_config.account_mapping, 'SA-6', 90, at);
        fields['s7a_registration_type'] = filled('SEGREGATED', 'SA-6', 90, at);

        // S5 Auto-currency
        fields['s5_auto_conversion_enabled'] = filled(true, 'SA-6', 85, at);
        fields['s5_base_currency'] = filled('SGD', 'SA-6', 90, at);

        // S10/S11A
        fields['s10_estatement_opted'] = filled(true, 'SA-6', 90, at);
        fields['s11a_einstructions_opted'] = filled(true, 'SA-6', 90, at);
        fields['s11a_platform'] = filled('CQG', 'SA-6', 88, at);

        // S12 Bank Accounts
        fields['s12_settlement_bank'] = filled('DBS Bank Ltd', 'SA-6', 92, at);
        fields['s12_settlement_swift'] = filled('DBSSSGSG', 'SA-6', 95, at);
        fields['s12_preferred_currency'] = filled('SGD', 'SA-6', 90, at);

        // Authorized traders
        const traders = (spec.authorised_traders || [])
            .map(t => `${t.name} — CQG: ${t.cqg_access ? 'Yes' : 'No'} — ${t.trading_permissions.join(', ')}`)
            .join('\n');
        if (traders) {
            fields['sec5_authorized_products'] = filled(traders, 'SA-6', 85, at);
        }
    }

    return { fields, lastUpdated: new Date().toISOString() };
}
