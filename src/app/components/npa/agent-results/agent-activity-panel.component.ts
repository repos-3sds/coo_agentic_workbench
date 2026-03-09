import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { AgentActivityUpdate, AGENT_REGISTRY, AgentDefinition, AgentStatus } from '../../../lib/agent-interfaces';

@Component({
    selector: 'app-agent-activity-panel',
    standalone: true,
    imports: [CommonModule, SharedIconsModule],
    template: `
        <div class="space-y-4">
            <h3 class="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <lucide-icon name="activity" [size]="16"></lucide-icon>
                Agent Activity
            </h3>

            <!-- Tier groups -->
            <div *ngFor="let tier of tiers" class="space-y-2">
                <p class="text-xs font-medium text-slate-400 uppercase tracking-wider">{{ tierLabel(tier) }}</p>
                <div class="flex flex-wrap gap-3">
                    <div
                        *ngFor="let agent of getAgentsByTier(tier)"
                        class="flex flex-col items-center gap-1.5 w-16"
                    >
                        <!-- Agent circle -->
                        <div
                            class="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300"
                            [ngClass]="getCircleClass(getAgentStatus(agent.id))"
                        >
                            <lucide-icon
                                [name]="agent.icon"
                                [size]="18"
                                [ngClass]="getIconClass(getAgentStatus(agent.id))"
                            ></lucide-icon>
                        </div>
                        <!-- Agent name -->
                        <span class="text-[10px] text-center text-slate-500 leading-tight line-clamp-2">
                            {{ agent.name }}
                        </span>
                        <!-- Status indicator -->
                        <div class="flex items-center gap-1" *ngIf="getAgentStatus(agent.id) !== 'idle'">
                            <lucide-icon
                                *ngIf="getAgentStatus(agent.id) === 'done'"
                                name="check"
                                [size]="10"
                                class="text-green-500"
                            ></lucide-icon>
                            <lucide-icon
                                *ngIf="getAgentStatus(agent.id) === 'error'"
                                name="x-circle"
                                [size]="10"
                                class="text-red-500"
                            ></lucide-icon>
                            <span
                                class="text-[9px] font-medium"
                                [ngClass]="{
                                    'text-blue-500': getAgentStatus(agent.id) === 'running',
                                    'text-green-500': getAgentStatus(agent.id) === 'done',
                                    'text-red-500': getAgentStatus(agent.id) === 'error'
                                }"
                            >
                                {{ getAgentStatus(agent.id) }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class AgentActivityPanelComponent {
    @Input() activities: AgentActivityUpdate[] = [];

    readonly tiers: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];
    private readonly agents: AgentDefinition[] = AGENT_REGISTRY;

    tierLabel(tier: number): string {
        switch (tier) {
            case 1: return 'Tier 1 -- Strategic Command';
            case 2: return 'Tier 2 -- Domain Orchestration';
            case 3: return 'Tier 3 -- Specialist Workers';
            case 4: return 'Tier 4 -- Shared Utilities';
            default: return '';
        }
    }

    getAgentsByTier(tier: number): AgentDefinition[] {
        return this.agents.filter(a => a.tier === tier);
    }

    getAgentStatus(agentId: string): AgentStatus {
        if (!this.activities || this.activities.length === 0) return 'idle';
        const activity = this.activities.find(a => a.agentId === agentId);
        return activity ? activity.status : 'idle';
    }

    getCircleClass(status: AgentStatus): Record<string, boolean> {
        return {
            'border-slate-200 bg-slate-50': status === 'idle',
            'border-blue-400 bg-blue-50 animate-pulse': status === 'running',
            'border-green-400 bg-green-50': status === 'done',
            'border-red-400 bg-red-50': status === 'error'
        };
    }

    getIconClass(status: AgentStatus): Record<string, boolean> {
        return {
            'text-slate-400': status === 'idle',
            'text-blue-500': status === 'running',
            'text-green-600': status === 'done',
            'text-red-500': status === 'error'
        };
    }
}
