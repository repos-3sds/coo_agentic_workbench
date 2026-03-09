import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedIconsModule } from '../../shared/icons/shared-icons.module';

export interface DagNode {
    id: string;
    label: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'HITL_PENDING' | 'FAILED';
    isHitl?: boolean;
    hitlPersona?: string;
}

@Component({
    selector: 'app-dce-dag-visualizer',
    standalone: true,
    imports: [CommonModule, SharedIconsModule],
    template: `
        <!-- Compact DAG (Overview tab embed) -->
        <div class="w-full" [class.py-2]="compact" [class.py-4]="!compact">
            <!-- Node row -->
            <div class="flex items-center justify-between gap-1">
                <ng-container *ngFor="let node of nodes; let i = index; let last = last">
                    <!-- Node circle -->
                    <div class="flex flex-col items-center" [class.min-w-[80px]]="!compact" [class.min-w-[56px]]="compact">
                        <div class="relative">
                            <div [ngClass]="getNodeClasses(node)" class="flex items-center justify-center rounded-full transition-all duration-300"
                                 [class.w-10]="!compact" [class.h-10]="!compact"
                                 [class.w-8]="compact" [class.h-8]="compact"
                                 [class.ring-4]="node.status === 'IN_PROGRESS'"
                                 [class.ring-blue-200]="node.status === 'IN_PROGRESS'"
                                 [class.animate-pulse]="node.status === 'IN_PROGRESS'">
                                <lucide-icon *ngIf="node.status === 'COMPLETED'" name="check" [size]="compact ? 14 : 16" class="text-white"></lucide-icon>
                                <lucide-icon *ngIf="node.status === 'IN_PROGRESS'" name="loader-2" [size]="compact ? 14 : 16" class="text-white animate-spin"></lucide-icon>
                                <lucide-icon *ngIf="node.status === 'HITL_PENDING'" name="clock" [size]="compact ? 14 : 16" class="text-white"></lucide-icon>
                                <lucide-icon *ngIf="node.status === 'FAILED'" name="x" [size]="compact ? 14 : 16" class="text-white"></lucide-icon>
                                <lucide-icon *ngIf="node.status === 'PENDING'" name="circle" [size]="compact ? 14 : 16" class="text-gray-400"></lucide-icon>
                            </div>
                            <!-- HITL badge -->
                            <span *ngIf="node.isHitl"
                                  class="absolute -top-1 -right-1 text-[8px] font-bold px-1 rounded bg-amber-500 text-white leading-tight">
                                HITL
                            </span>
                        </div>
                        <!-- Node label -->
                        <span class="mt-1 text-center leading-tight"
                              [class.text-[10px]]="compact" [class.text-xs]="!compact"
                              [ngClass]="node.status === 'PENDING' ? 'text-gray-400' : 'text-gray-700 font-medium'">
                            {{ compact ? node.id : node.label }}
                        </span>
                        <span *ngIf="!compact" class="text-[10px] text-gray-400">{{ node.id }}</span>
                    </div>
                    <!-- Connector line -->
                    <div *ngIf="!last" class="flex-1 h-0.5 mx-1 rounded-full transition-all duration-500"
                         [ngClass]="getConnectorClass(i)">
                    </div>
                </ng-container>
            </div>
        </div>

        <!-- Full mode: checkpoint swimlane (shown below nodes) -->
        <div *ngIf="!compact && showSwimLane" class="mt-4 space-y-2">
            <div *ngFor="let node of nodes" class="flex items-start gap-3 py-2 px-3 rounded-lg"
                 [ngClass]="node.status !== 'PENDING' ? 'bg-gray-50' : ''">
                <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                     [ngClass]="getNodeClasses(node)">
                    {{ getNodeNumber(node.id) }}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-medium text-gray-800">{{ node.label }}</span>
                        <span class="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                              [ngClass]="getStatusBadgeClass(node.status)">
                            {{ node.status.replace('_', ' ') }}
                        </span>
                        <span *ngIf="node.hitlPersona" class="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">
                            {{ node.hitlPersona }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class DceDagVisualizerComponent {
    @Input() nodes: DagNode[] = [];
    @Input() compact = false;
    @Input() showSwimLane = true;

    getNodeClasses(node: DagNode): string {
        switch (node.status) {
            case 'COMPLETED': return 'bg-emerald-500 text-white';
            case 'IN_PROGRESS': return 'bg-blue-500 text-white';
            case 'HITL_PENDING': return 'bg-amber-500 text-white';
            case 'FAILED': return 'bg-red-500 text-white';
            default: return 'bg-gray-200 text-gray-400 border border-gray-300';
        }
    }

    getConnectorClass(index: number): string {
        const current = this.nodes[index];
        const next = this.nodes[index + 1];
        if (current?.status === 'COMPLETED' && next && next.status !== 'PENDING') {
            return 'bg-emerald-400';
        }
        if (current?.status === 'COMPLETED') {
            return 'bg-emerald-300';
        }
        return 'bg-gray-200';
    }

    getStatusBadgeClass(status: string): string {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-100 text-emerald-700';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700';
            case 'HITL_PENDING': return 'bg-amber-100 text-amber-700';
            case 'FAILED': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-500';
        }
    }

    getNodeNumber(nodeId: string): string {
        return nodeId.replace('N-', '');
    }
}
