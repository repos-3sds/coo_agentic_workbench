// ── Draft Builder — Shared Models ────────────────────────────────
// Reusable interfaces for the NPA Draft Builder component tree.
// Used by: draft-builder, draft-field-card, draft-section-nav, draft-agent-panel

export type FieldType = 'text' | 'textarea' | 'yesno' | 'dropdown' | 'date' | 'currency' | 'bullet_list' | 'multiselect';

/** How the field value was populated */
export type FieldLineage = 'MANUAL' | 'AUTO' | 'ADAPTED';

/** Which fill strategy the agent uses */
export type FieldStrategy = 'RULE' | 'COPY' | 'LLM' | 'MANUAL';

export type AutoSaveStatus = 'saved' | 'saving' | 'unsaved';

export type DraftAgentTab = 'chat' | 'knowledge' | 'issues';

export interface DraftField {
  key: string;
  label: string;
  type: FieldType;
  value: string;
  required: boolean;
  strategy: FieldStrategy;
  lineage: FieldLineage;
  confidence?: number;
  placeholder?: string;
  tooltip?: string;
  guidance?: string;
  options?: string[];
  bulletItems?: string[];
  yesNoValue?: boolean;
  dependsOn?: { field: string; value: string };
  commentCount?: number;
  nodeId?: string;
  maxLength?: number;
}

export interface DraftSubSection {
  id: string;
  numbering: string;
  label: string;
  guidance?: string;
  fields: DraftField[];
}

export interface DraftSection {
  id: string;
  label: string;
  numbering: string;
  owner: 'BIZ' | 'TECH_OPS' | 'FINANCE' | 'RMG' | 'LCS';
  icon: string;
  fields: DraftField[];
  subSections?: DraftSubSection[];
}

export interface DraftComment {
  id: string;
  fieldKey: string;
  author: string;
  text: string;
  timestamp: string;
  resolved: boolean;
}

export interface ReferenceNPA {
  id: string;
  displayId?: string;
  title: string;
  approvedDate: string;
  fieldsCopied: number;
  similarity: number;
}

export interface DraftAgentMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: string;
  agentTeam?: string;
  citations?: string[];
}

export interface SectionProgress {
  filled: number;
  total: number;
  missingRequired: number;
}

export interface DraftProgress {
  filled: number;
  total: number;
  required: number;
  requiredFilled: number;
}
