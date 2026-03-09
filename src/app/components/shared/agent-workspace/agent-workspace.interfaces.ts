/**
 * Unified Agent Workspace Interfaces
 *
 * Shared types for the AgentWorkspaceComponent — a single component
 * that renders as both Command Center (/) and NPA Agent Chat (/agents/npa).
 */

export interface WorkspaceTemplate {
    id: string;
    title: string;
    description: string;
    category: string;           // Category ID (STRATEGY, RISK, LEGAL, OPS, MARKETING, KB, DESK)
    icon: string;
    iconBg: string;
    prompt: string;             // Direct prompt text for agent
    inputs?: TemplateInput[];   // Optional form fields (for form-based mode)
    successRate?: number;
    avgTime?: string;
}

export interface TemplateInput {
    label: string;
    placeholder: string;
    key: string;
    type?: string;              // 'text' | 'textarea' | 'select' | 'number'
    required?: boolean;
    value?: string;             // Current value (for form binding)
}

export interface TemplateCategory {
    id: string;
    name: string;
}

export interface WorkspaceConfig {
    context: 'COMMAND_CENTER' | 'NPA_AGENT';
    showLanding: boolean;
    showSidebar: boolean;
    showTemplateForm: boolean;
    templateFilter?: string[] | null;   // null = show all categories
    title: string;
    subtitle: string;
}
