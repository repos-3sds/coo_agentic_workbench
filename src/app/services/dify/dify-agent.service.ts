import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, delay, catchError } from 'rxjs';
import { DifyService } from './dify.service';
import { AGENT_REGISTRY, AgentDefinition, AgentActivityUpdate } from '../../lib/agent-interfaces';

export interface AgentCapability {
    id: string;
    name: string;
    description: string;
    icon: string;
    stats: { label: string; value: string };
    actionLabel: string;
    color: 'blue' | 'purple' | 'amber' | 'green' | 'red' | 'indigo' | 'slate' | 'cyan' | 'teal' | 'emerald' | 'fuchsia' | 'pink' | 'violet' | 'orange';
    status: 'active' | 'beta' | 'unconfigured';
    tier: 1 | 2 | 3 | 4;
    difyType: 'chat' | 'workflow';
}

export interface AgentWorkItem {
    id: string;
    agentName: string;
    operation: string;
    status: 'running' | 'completed' | 'waiting';
    duration: string;
    color: 'blue' | 'purple' | 'amber' | 'green' | 'red' | 'fuchsia' | 'slate' | 'cyan' | 'teal';
}

export interface HealthMetrics {
    status: 'healthy' | 'degraded' | 'down';
    latency: number;
    uptime: number;
    activeAgents: number;
    totalAgents: number;
    totalDecisions: number;
    confidenceScore?: number;
    toolsUsed?: number;
    kbsConnected?: number;
    kbRecords?: number;
}

export interface AgentStatusInfo {
    id: string;
    name: string;
    tier: number;
    type: string;
    icon: string;
    color: string;
    status: 'ready' | 'unconfigured' | 'running' | 'error';
}

// Map agent IDs to display-friendly color names
const COLOR_MAP: Record<string, string> = {
    'MASTER_COO': 'violet',
    'NPA_ORCHESTRATOR': 'orange',
    'IDEATION': 'indigo',
    'CLASSIFIER': 'purple',
    'ML_PREDICT': 'amber',
    'RISK': 'red',
    'GOVERNANCE': 'slate',
    'DILIGENCE': 'cyan',
    'DOC_LIFECYCLE': 'teal',
    'MONITORING': 'emerald',
    'KB_SEARCH': 'fuchsia',
    'NOTIFICATION': 'pink'
};

// Mock stats per agent
const AGENT_STATS: Record<string, { label: string; value: string; actionLabel: string }> = {
    'MASTER_COO': { label: 'Sessions', value: '2,456', actionLabel: 'Chat' },
    'NPA_ORCHESTRATOR': { label: 'Orchestrations', value: '1,892', actionLabel: 'Status' },
    'IDEATION': { label: 'Creates', value: '1,248', actionLabel: 'Start' },
    'CLASSIFIER': { label: 'Confidence', value: '88%', actionLabel: 'Classify' },
    'ML_PREDICT': { label: 'Accuracy', value: '92%', actionLabel: 'Predict' },
    'RISK': { label: 'Catch Rate', value: '96%', actionLabel: 'Scan' },
    'GOVERNANCE': { label: 'SLA Met', value: '94%', actionLabel: 'Route' },
    'DILIGENCE': { label: 'Docs', value: '200+', actionLabel: 'Ask' },
    'DOC_LIFECYCLE': { label: 'Validated', value: '3,412', actionLabel: 'Check' },
    'MONITORING': { label: 'Products', value: '156', actionLabel: 'Monitor' },
    'KB_SEARCH': { label: 'Hit Rate', value: '94%', actionLabel: 'Search' },
    'NOTIFICATION': { label: 'Sent', value: '8,923', actionLabel: 'View' }
};

@Injectable({
    providedIn: 'root'
})
export class DifyAgentService {
    private difyBase = inject(DifyService);
    private http = inject(HttpClient);

    /**
     * Get all 13 agent capabilities from the registry
     */
    getCapabilities(): Observable<AgentCapability[]> {
        return of(
            AGENT_REGISTRY.map(agent => {
                const stats = AGENT_STATS[agent.id] || { label: 'Tasks', value: '0', actionLabel: 'Run' };
                return {
                    id: agent.id,
                    name: agent.name,
                    description: agent.description,
                    icon: agent.icon,
                    stats: { label: stats.label, value: stats.value },
                    actionLabel: stats.actionLabel,
                    color: (COLOR_MAP[agent.id] || 'blue') as any,
                    status: 'active' as const,
                    tier: agent.tier,
                    difyType: agent.difyType
                };
            })
        ).pipe(delay(300));
    }

    /**
     * Get agent statuses — tries real API first, falls back to registry
     */
    getAgentStatuses(): Observable<AgentStatusInfo[]> {
        return this.http.get<{ agents: AgentStatusInfo[] }>('/api/dify/agents/status').pipe(
            map(res => res.agents),
            catchError(() => {
                // Fallback: return from local registry
                return of(AGENT_REGISTRY.map(a => ({
                    id: a.id,
                    name: a.name,
                    tier: a.tier,
                    type: a.difyType,
                    icon: a.icon,
                    color: a.color,
                    status: 'ready' as const
                })));
            })
        );
    }

    /**
     * Get active work items
     */
    getActiveWorkItems(): Observable<AgentWorkItem[]> {
        return of([
            { id: 'JOB-991', agentName: 'Classification', operation: 'Classifying TSG2025-041', status: 'completed' as const, duration: '450ms', color: 'purple' as const },
            { id: 'JOB-990', agentName: 'Governance', operation: 'Creating sign-off requests', status: 'waiting' as const, duration: '12m', color: 'slate' as const },
            { id: 'JOB-989', agentName: 'KB Search', operation: 'Searching "MAS_Guidelines.pdf"', status: 'completed' as const, duration: '890ms', color: 'fuchsia' as const },
            { id: 'JOB-988', agentName: 'Risk Agent', operation: '4-layer risk cascade', status: 'running' as const, duration: '2.1s', color: 'red' as const }
        ]).pipe(delay(300));
    }

    /**
     * Get aggregate agent health metrics
     */
    getAgentHealth(): Observable<HealthMetrics> {
        return this.http.get<any>('/api/dify/agents/health').pipe(
            map(data => {
                const s = data.summary || {};
                const m = data.metrics || {};

                // Determine overall status
                let status: 'healthy' | 'degraded' | 'down' = 'healthy';
                if (s.unhealthy > 0) status = 'down';
                else if (s.degraded > 0) status = 'degraded';

                // Calculate average latency from agents
                const agents = data.agents || [];
                const activeAgents = agents.filter((a: any) => a.status === 'HEALTHY' || a.status === 'DEGRADED');
                const totalLatency = activeAgents.reduce((sum: number, a: any) => sum + (a.latency_ms || 0), 0);
                const avgLatency = activeAgents.length > 0 ? Math.round(totalLatency / activeAgents.length) : 0;

                return {
                    status,
                    latency: avgLatency,
                    uptime: 99.9, // This could be calculated from agents if needed
                    activeAgents: s.healthy || 0,
                    totalAgents: s.total || 13,
                    totalDecisions: m.totalDecisions || 0,
                    confidenceScore: m.confidenceScore || 87,
                    toolsUsed: m.toolsUsed || 54,
                    kbsConnected: m.kbsConnected || 0,
                    kbRecords: m.kbRecords || 0
                };
            }),
            catchError(() => {
                // Fallback if API fails
                return of({
                    status: 'down' as const,
                    latency: 0,
                    uptime: 0,
                    activeAgents: 0,
                    totalAgents: 13,
                    totalDecisions: 0,
                    confidenceScore: 0,
                    toolsUsed: 0,
                    kbsConnected: 0,
                    kbRecords: 0
                });
            })
        );
    }

    /**
     * Get connected knowledge bases from Dify
     */
    getConnectedKnowledgeBases(): Observable<any[]> {
        return this.http.get<any>('/api/dify/datasets').pipe(
            map(response => response.data || []),
            catchError(() => of([]))
        );
    }

    /**
     * Get real-time agent activity stream
     */
    getAgentActivityStream(): Observable<AgentActivityUpdate> {
        return this.difyBase.getAgentActivity();
    }

    /**
     * Get agents grouped by tier
     */
    getAgentsByTier(): { tier: number; label: string; agents: AgentDefinition[] }[] {
        return [
            { tier: 1, label: 'Strategic Command', agents: AGENT_REGISTRY.filter(a => a.tier === 1) },
            { tier: 2, label: 'Domain Orchestration', agents: AGENT_REGISTRY.filter(a => a.tier === 2) },
            { tier: 3, label: 'Specialist Workers', agents: AGENT_REGISTRY.filter(a => a.tier === 3) },
            { tier: 4, label: 'Shared Utilities', agents: AGENT_REGISTRY.filter(a => a.tier === 4) },
        ];
    }
}
