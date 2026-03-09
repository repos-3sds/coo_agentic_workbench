import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ClassificationCriterion {
    id: number;
    category: string;
    criterion_code: string;
    criterion_name: string;
    description: string;
    indicator_type: 'NTG' | 'VARIATION' | 'EXISTING';
    weight: number;
    threshold_value: number;
    is_active: boolean;
}

export interface ClassificationAssessment {
    id: number;
    project_id: string;
    criteria_id: number;
    criterion_code: string;
    criterion_name: string;
    category: string;
    score: number;
    evidence: string;
    assessed_by: string;
    confidence: number;
    assessed_at: string;
}

export interface ClassificationSummary {
    project_id: string;
    total_score: number;
    calculated_tier: string;
    breakdown: any;
    override_reason: string | null;
    assessments: ClassificationAssessment[];
}

@Injectable({
    providedIn: 'root'
})
export class ClassificationService {
    private http = inject(HttpClient);
    private apiUrl = '/api/classification';

    /**
     * GET all classification criteria (reference data)
     */
    getCriteria(): Observable<ClassificationCriterion[]> {
        return this.http.get<ClassificationCriterion[]>(this.apiUrl);
    }

    /**
     * GET classification assessments for a specific NPA
     */
    getNpaAssessments(npaId: string): Observable<ClassificationAssessment[]> {
        return this.http.get<ClassificationAssessment[]>(`${this.apiUrl}/npas/${npaId}`);
    }

    /**
     * GET classification summary with scorecard for a specific NPA
     */
    getNpaSummary(npaId: string): Observable<ClassificationSummary> {
        return this.http.get<ClassificationSummary>(`${this.apiUrl}/npas/${npaId}/summary`);
    }
}
