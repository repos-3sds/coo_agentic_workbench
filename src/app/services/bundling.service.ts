import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BundlingCondition {
    condition: string;
    passed: boolean;
    detail: string;
}

export interface BundlingAssessment {
    child_id: string;
    parent_id: string;
    parent_title: string;
    conditions: BundlingCondition[];
    passed_count: number;
    total_conditions: number;
    recommended_track: 'BUNDLING' | 'NPA_LITE' | 'FULL_NPA';
    recommendation_reason: string;
}

@Injectable({ providedIn: 'root' })
export class BundlingService {
    private http = inject(HttpClient);
    private apiUrl = '/api/bundling';

    assess(childId: string, parentId: string): Observable<BundlingAssessment> {
        return this.http.get<BundlingAssessment>(`${this.apiUrl}/${childId}/assess?parent_id=${parentId}`);
    }

    apply(childId: string, parentId: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/${childId}/apply`, { parent_id: parentId });
    }
}
