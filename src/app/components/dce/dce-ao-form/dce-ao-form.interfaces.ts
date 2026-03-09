/**
 * Digital Account Opening Form — Interfaces
 *
 * Declarative type system for the AO form. Each field definition maps to a
 * source SA agent so the UI can show which agent populated it.
 */

export type AoFieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'date' | 'currency' | 'multi-select' | 'readonly';
export type AoFillStatus = 'FILLED' | 'PENDING' | 'REQUIRES_ACTION' | 'NOT_APPLICABLE';
export type AoSourceAgent = 'SA-1' | 'SA-2' | 'SA-3' | 'SA-4' | 'SA-5' | 'SA-6' | 'SA-7' | 'MANUAL' | null;

/** Static definition of a single form field */
export interface AoFormFieldDef {
    key: string;
    label: string;
    type: AoFieldType;
    sourceAgent: AoSourceAgent;
    required: boolean;
    options?: string[];
    helpText?: string;
    gridSpan?: 1 | 2;
}

/** Runtime value of a single form field */
export interface AoFormFieldValue {
    value: any;
    fillStatus: AoFillStatus;
    confidence?: number;
    filledBy?: AoSourceAgent;
    filledAt?: string;
    notes?: string;
}

/** Condition for section visibility based on case classification */
export interface AoSectionCondition {
    field: 'entity_type' | 'products_requested';
    operator: 'includes' | 'equals' | 'not_equals';
    value: string | string[];
}

/** Static definition of a form section (main section or schedule) */
export interface AoFormSectionDef {
    id: string;
    title: string;
    subtitle?: string;
    icon: string;
    fields: AoFormFieldDef[];
    conditions?: AoSectionCondition[];
    sourceAgents: AoSourceAgent[];
}

/** Runtime form data — map of field key → value */
export interface AoFormData {
    fields: Record<string, AoFormFieldValue>;
    lastUpdated: string;
}

/** Progress for a section or overall */
export interface AoFormProgress {
    filled: number;
    total: number;
    percent: number;
}
