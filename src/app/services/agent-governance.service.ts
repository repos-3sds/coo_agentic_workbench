import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NpaClassification } from '../lib/npa-interfaces';

export interface ReadinessDomain {
    name: string;
    id?: string;
    status: 'PASS' | 'FAIL' | 'MISSING' | 'PENDING' | 'WARNING';
    observation: string;
    score?: number;
    weight?: number;
    icon?: string;
    questions?: any[];
}

export interface ReadinessResult {
    isReady: boolean;
    score: number; // 0-100
    domains: ReadinessDomain[];
    overallAssessment: string;
    findings?: string[];
}

export interface ClassificationResult {
    tier: NpaClassification;
    reason: string;
    requiredApprovers: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    score?: number;
    breakdown?: any;
}

@Injectable({
    providedIn: 'root'
})
export class AgentGovernanceService {
    private http = inject(HttpClient);
    private apiUrl = '/api/governance';

    constructor() { }

    /**
     * CREATE Project (Initiation Phase)
     */
    createProject(title: string, description: string): Observable<{ id: string, status: string }> {
        return this.http.post<{ id: string, status: string }>(`${this.apiUrl}/projects`, {
            title,
            description
        });
    }

    /**
     * ANALYZE Readiness — calls backend which uses DB prerequisite tables
     */
    analyzeReadiness(description: string, projectId?: string): Observable<ReadinessResult> {
        if (projectId) {
            return this.http.get<any>(`${this.apiUrl}/readiness/${projectId}`).pipe(
                map(res => this.mapDbReadinessToResult(res))
            );
        }

        // For new projects without an ID yet, POST to backend for analysis
        return this.http.post<any>(`${this.apiUrl}/readiness`, {
            description,
            domain: 'ALL'
        }).pipe(
            map(res => this.mapDbReadinessToResult(res))
        );
    }

    /**
     * SAVE Readiness Result to Database (Persistence)
     */
    saveReadinessAssessment(projectId: string, result: ReadinessResult): Observable<any> {
        return this.http.post(`${this.apiUrl}/readiness`, {
            projectId,
            domain: 'ALL',
            status: result.isReady ? 'PASS' : 'FAIL',
            score: result.score,
            findings: result.domains.map(d => ({ domain: d.name, status: d.status, observation: d.observation }))
        });
    }

    /**
     * ANALYZE Classification — calls backend which uses DB classification tables
     */
    analyzeClassification(description: string, jurisdiction: string = 'SG', projectId?: string): Observable<ClassificationResult> {
        if (projectId) {
            return this.http.get<any>(`${this.apiUrl}/classification/${projectId}`).pipe(
                map(res => this.mapDbClassificationToResult(res))
            );
        }

        return this.http.post<any>(`${this.apiUrl}/classification`, {
            description,
            jurisdiction
        }).pipe(
            map(res => this.mapDbClassificationToResult(res))
        );
    }

    /**
     * SAVE Classification Result to Database
     */
    saveClassification(projectId: string, result: ClassificationResult): Observable<any> {
        return this.http.post(`${this.apiUrl}/classification`, {
            projectId,
            totalScore: result.score || 0,
            calculatedTier: result.tier,
            breakdown: result.breakdown || {},
            overrideReason: null
        });
    }

    /**
     * GET All Projects (Dashboard)
     */
    getProjects(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/projects`);
    }

    /**
     * GET Project Details (Full View)
     */
    getProjectDetails(id: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/projects/${id}`);
    }

    /**
     * GET Document Rules (conditional document requirements)
     */
    getDocRules(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/doc-rules`);
    }

    // --- MAPPING HELPERS ---

    private mapDbReadinessToResult(res: any): ReadinessResult {
        if (res.domains) return res;

        const domains: ReadinessDomain[] = (res.assessments || res.findings || []).map((a: any) => ({
            name: a.domain || a.category_name || a.name,
            id: a.category_code || a.id,
            status: a.status || 'PENDING',
            observation: a.observation || a.evidence || '',
            score: a.score || 0,
            weight: a.weight || 0,
        }));

        const score = res.score || res.readiness_score || 0;

        return {
            isReady: score >= 85,
            score,
            domains,
            overallAssessment: score >= 85
                ? 'Project appears ready for initiation.'
                : 'Critical gaps detected. Please address before proceeding.'
        };
    }

    private mapDbClassificationToResult(res: any): ClassificationResult {
        if (res.tier) return res;

        const tier = res.calculated_tier || res.calculatedTier || 'Existing';
        const score = res.total_score || res.totalScore || 0;

        let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
        if (tier === 'New-to-Group') riskLevel = 'HIGH';
        else if (tier === 'Variation') riskLevel = 'MEDIUM';

        return {
            tier: tier as NpaClassification,
            reason: res.override_reason || 'Classification from DB scorecard.',
            requiredApprovers: res.required_approvers || [],
            riskLevel,
            score,
            breakdown: res.breakdown || {}
        };
    }
}
