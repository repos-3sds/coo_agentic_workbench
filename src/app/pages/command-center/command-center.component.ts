import { Component } from '@angular/core';
import { AgentWorkspaceComponent } from '../../components/shared/agent-workspace/agent-workspace.component';
import { WorkspaceConfig } from '../../components/shared/agent-workspace/agent-workspace.interfaces';

@Component({
    selector: 'app-command-center',
    standalone: true,
    imports: [AgentWorkspaceComponent],
    template: `
        <app-agent-workspace [config]="workspaceConfig"></app-agent-workspace>
    `,
    styles: [`:host { display: block; height: 100%; }`]
})
export class CommandCenterComponent {
    workspaceConfig: WorkspaceConfig = {
        context: 'COMMAND_CENTER',
        showLanding: true,
        showSidebar: true,
        showTemplateForm: false,
        templateFilter: null,
        title: 'COO Multi-Agent Workbench',
        subtitle: 'Master Orchestrator'
    };
}
