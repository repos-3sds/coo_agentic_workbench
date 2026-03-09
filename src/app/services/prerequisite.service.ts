import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PrerequisiteCategory {
    id: number;
    category_code: string;
    category_name: string;
    weight: number;
    description: string;
    order_index: number;
}

export interface PrerequisiteCheck {
    id: number;
    category_id: number;
    check_code: string;
    check_name: string;
    description: string;
    mandatory_for: 'ALL' | 'FULL_NPA' | 'NPA_LITE' | 'BUNDLING' | 'EVERGREEN';
    is_critical: boolean;
    order_index: number;
}

export interface PrerequisiteResult {
    id: number;
    project_id: string;
    check_id: number;
    check_code: string;
    check_name: string;
    category_code: string;
    category_name: string;
    status: 'PENDING' | 'PASS' | 'FAIL' | 'WAIVED' | 'N/A';
    evidence: string | null;
    validated_by: string | null;
    validated_at: string | null;
}

export interface PrerequisiteSummary {
    total_checks: number;
    passed: number;
    failed: number;
    pending: number;
    waived: number;
    readiness_score: number;
    categories: {
        category_code: string;
        category_name: string;
        weight: number;
        total: number;
        passed: number;
        score: number;
    }[];
}

@Injectable({
    providedIn: 'root'
})
export class PrerequisiteService {
    private http = inject(HttpClient);
    private apiUrl = '/api/prerequisites';

    /**
     * GET all prerequisite categories (with weights)
     */
    getCategories(): Observable<PrerequisiteCategory[]> {
        return this.http.get<PrerequisiteCategory[]>(`${this.apiUrl}/categories`);
    }

    /**
     * GET all prerequisite checks (questions/items)
     */
    getChecks(): Observable<PrerequisiteCheck[]> {
        return this.http.get<PrerequisiteCheck[]>(`${this.apiUrl}/checks`);
    }

    /**
     * GET prerequisite results for a specific NPA
     */
    getNpaResults(npaId: string): Observable<PrerequisiteResult[]> {
        return this.http.get<PrerequisiteResult[]>(`${this.apiUrl}/npas/${npaId}`);
    }

    /**
     * GET prerequisite summary for a specific NPA
     */
    getNpaSummary(npaId: string): Observable<PrerequisiteSummary> {
        return this.http.get<PrerequisiteSummary>(`${this.apiUrl}/npas/${npaId}/summary`);
    }
}
