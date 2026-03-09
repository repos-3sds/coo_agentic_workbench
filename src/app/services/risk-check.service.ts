import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RiskCheck {
    id: number;
    project_id: string;
    check_layer: string;
    result: 'PASS' | 'FAIL' | 'WARNING';
    matched_items: any;
    checked_by: string;
    checked_at: string;
}

export interface ProhibitedItem {
    id: number;
    layer: 'INTERNAL_POLICY' | 'REGULATORY' | 'SANCTIONS' | 'DYNAMIC';
    item_code: string;
    item_name: string;
    description: string;
    jurisdictions: string;
    severity: 'HARD_STOP' | 'CONDITIONAL' | 'WARNING';
    effective_from: string;
    effective_to: string | null;
}

@Injectable({
    providedIn: 'root'
})
export class RiskCheckService {
    private http = inject(HttpClient);
    private apiUrl = '/api/risk-checks';

    /**
     * GET all risk checks for a specific NPA
     */
    getNpaChecks(npaId: string): Observable<RiskCheck[]> {
        return this.http.get<RiskCheck[]>(`${this.apiUrl}/npas/${npaId}`);
    }

    /**
     * GET only hard-stop results for a specific NPA
     */
    getHardStops(npaId: string): Observable<RiskCheck[]> {
        return this.http.get<RiskCheck[]>(`${this.apiUrl}/npas/${npaId}/hard-stops`);
    }

    /**
     * GET all prohibited items reference data
     */
    getProhibitedItems(): Observable<ProhibitedItem[]> {
        return this.http.get<ProhibitedItem[]>(`${this.apiUrl}/prohibited-items`);
    }
}
