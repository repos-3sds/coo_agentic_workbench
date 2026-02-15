export type FieldLineage = 'AUTO' | 'ADAPTED' | 'MANUAL';

export interface LineageMetadata {
   sourceDocId?: string;       // e.g., 'TSG1917'
   sourceSnippet?: string;     // The exact text from the source
   adaptationLogic?: string;   // Reasoning for adaptation
   confidenceScore?: number;   // 0-100
   agentTip?: string;          // Helpful prompt for Manual fields
}

export interface NpaField {
   key: string;
   label: string;
   value: string;
   lineage: FieldLineage;
   lineageMetadata?: LineageMetadata;
   type?: 'text' | 'textarea' | 'date' | 'select' | 'currency' | 'file' | 'header';
   options?: string[]; // For select types
   tooltip?: string;   // Explanation for adaptation or source
   placeholder?: string;
   required?: boolean;
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

export type SignOffDecision = 'PENDING' | 'APPROVED' | 'APPROVED_CONDITIONAL' | 'REJECTED' | 'REWORK';

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
