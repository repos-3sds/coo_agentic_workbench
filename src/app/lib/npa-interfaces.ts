export type FieldLineage = 'AUTO' | 'ADAPTED' | 'MANUAL';

/** All supported field types in the NPA Draft Builder */
export type NpaFieldType =
   | 'text'              // Single-line text input
   | 'textarea'          // Multi-line text area (auto-resize)
   | 'dropdown'          // Single-select dropdown
   | 'multiselect'       // Multi-select tag input
   | 'yesno'             // Yes/No radio buttons (optionally triggers conditional)
   | 'checkbox_group'    // Multiple checkboxes (operational adequacy)
   | 'bullet_list'       // Dynamic add/remove list (PAC conditions)
   | 'file_upload'       // Drag-and-drop file attachment
   | 'table_grid'        // Editable table (market risk matrix, entity table)
   | 'flowchart'         // Mermaid diagram or attached flowchart
   | 'date'              // Date picker
   | 'repeatable'        // Repeatable section block (external parties)
   | 'conditional'       // Shows/hides based on parent field value
   | 'reference_link'    // Read-only link to external resource
   | 'currency'          // Currency-formatted number input
   | 'header';           // Section header (non-editable display label)

export interface Citation {
   sourceId: string;       // e.g., 'kb_gfm_sop_v2'
   sourceName: string;     // e.g., 'GFM NPA SOP v2.3'
   sectionAnchor?: string; // e.g., '#cross-border-mandate'
   snippet?: string;       // The exact text from the source
   url?: string;           // Optional external link if applicable
}

export interface LineageMetadata {
   sourceDocId?: string;       // e.g., 'TSG1917'
   sourceSnippet?: string;     // The exact text from the source
   adaptationLogic?: string;   // Reasoning for adaptation
   confidenceScore?: number;   // 0-100
   agentTip?: string;          // Helpful prompt for Manual fields
   citations?: Citation[];     // Array of KB citations supporting AI rationale
}

export interface NpaField {
   key: string;
   label: string;
   value: string;
   lineage: FieldLineage;
   lineageMetadata?: LineageMetadata;
   type?: NpaFieldType;
   options?: string[];          // For dropdown / multiselect types
   tooltip?: string;            // Explanation for adaptation or source
   placeholder?: string;
   required?: boolean;
   dependsOn?: { field: string; value: string }; // For conditional fields
   attachable?: boolean;        // If true, field supports file attachment
   bulletItems?: string[];      // For bullet_list type
   repeatableFields?: NpaField[]; // For repeatable type
}

export interface NpaSection {
   id: string;
   title: string;
   description?: string;
   fields: NpaField[];
   comments?: string;
   documents?: string[];
}

// --- WORKFLOW & GOVERNANCE INTERFACES ---

export type NpaStage =
   | 'DRAFT'
   | 'PENDING_CHECKER'
   | 'RETURNED_TO_MAKER'
   | 'PENDING_SIGN_OFFS'
   | 'PENDING_FINAL_APPROVAL'
   | 'APPROVED'
   | 'REJECTED';

export type NpaClassification =
   | 'New-to-Group'
   | 'Variation'
   | 'Existing'
   | 'NPA Lite';

export type SignOffParty =
   | 'RMG-Credit'
   | 'RMG-Market'
   | 'Group Finance'
   | 'Group Tax'
   | 'Legal & Compliance'
   | 'Secretariat'
   | 'T&O-Ops'
   | 'T&O-Tech';

export type SignOffDecision = 'PENDING' | 'APPROVED' | 'APPROVED_CONDITIONAL' | 'REJECTED' | 'REWORK' | 'REWORK_REQUIRED';

export interface SignOffStatus {
   party: SignOffParty;
   status: SignOffDecision;
   approverName?: string;
   approvedDate?: Date;
   comments?: string;     // Context for decision or rework instruction
   conditions?: string[]; // Pre-launch conditions required for approval
   loopBackCount: number; // For tracking rework iterations
}

export type SignOffMatrix = {
   [key in SignOffParty]?: SignOffStatus;
};

export interface PostLaunchCondition {
   condition: string;
   owner: SignOffParty | 'MAKER';
   dueDate?: Date;
   status: 'PENDING' | 'MET';
}

export interface IntakeAssessment {
   domain: 'STRATEGIC' | 'RISK' | 'LEGAL' | 'OPS' | 'TECH' | 'DATA' | 'FINANCE';
   status: 'PASS' | 'WARN' | 'FAIL';
   score: number;
   findings?: string; // JSON string or plain text
   assessedAt?: Date;
}

export interface NpaProject {
   id: string;
   displayId?: string;
   title: string;
   description: string;
   submittedBy: string;
   submittedDate: Date;

   // Classification
   type: 'NPA' | 'DCE' | 'Limit Breach';
   npaType?: NpaClassification; // Specific Type for NPAs

   riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
   isCrossBorder: boolean;
   jurisdictions?: string[]; // e.g. ['Singapore', 'China', 'Hong Kong']
   notional: number; // In USD

   // Workflow State
   stage: NpaStage;
   assignedRole?: string; // e.g. 'CHECKER', 'APPROVER_RISK' (derived)
   requiredSignOffs: SignOffParty[];
   signOffMatrix: SignOffMatrix;

   // Final Approval
   finalApprover?: string;
   finalApprovalDate?: Date;
   postLaunchConditions?: PostLaunchCondition[];

   // New: Intake Assessments from Golden Source
   intakeAssessments?: IntakeAssessment[];

   // New: Form Data (Key-Value pairs)
   formData?: NpaField[];
}
