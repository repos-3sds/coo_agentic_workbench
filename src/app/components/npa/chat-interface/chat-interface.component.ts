import { Component, EventEmitter, Output } from '@angular/core';
import { AgentWorkspaceComponent } from '../../shared/agent-workspace/agent-workspace.component';
import { WorkspaceConfig } from '../../shared/agent-workspace/agent-workspace.interfaces';

@Component({
    selector: 'app-chat-interface',
    standalone: true,
    imports: [AgentWorkspaceComponent],
    template: `
        <app-agent-workspace
            [config]="workspaceConfig"
            (onBack)="goBack()"
            (onComplete)="handleAgentComplete($event)">
        </app-agent-workspace>
    `,
    styles: [`:host { display: block; height: 100%; }`]
})
export class ChatInterfaceComponent {
    @Output() onBack = new EventEmitter<void>();
    @Output() onComplete = new EventEmitter<any>();

    workspaceConfig: WorkspaceConfig = {
        context: 'NPA_AGENT',
        showLanding: false,
        showSidebar: true,
        showTemplateForm: true,
        templateFilter: ['STRATEGY', 'RISK', 'LEGAL', 'OPS', 'MARKETING'],
        title: 'NPA Agent',
        subtitle: 'Product Approval Assistant'
    };

    goBack() {
        this.onBack.emit();
    }

    handleAgentComplete(payload: any) {
        this.onComplete.emit(payload);
    }
}
