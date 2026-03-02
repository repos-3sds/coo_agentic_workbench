import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface ContractValidationResult {
    request_id: string;
    agent_id: string;
    passed: boolean;
    errors: string[];
    timestamp: string;
}

export interface ContextContract {
    contract_id: string;
    version: string;
    archetype: 'orchestrator' | 'worker' | 'reviewer';
    description: string;
    required_context: string[];
    optional_context: string[];
    excluded_context: string[];
    budget_profile: string;
    recent_validations: ContractValidationResult[];
}

@Component({
    selector: 'app-context-contracts-tab',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './context-contracts-tab.component.html',
    styleUrls: ['./context-contracts-tab.component.scss']
})
export class ContextContractsTabComponent implements OnInit {
    contracts: ContextContract[] = [];
    loading = true;
    error: string | null = null;

    constructor(private http: HttpClient) { }

    ngOnInit(): void {
        this.http.get<unknown>('/api/context/contracts').pipe(
            catchError(err => {
                this.error = 'Failed to load context contracts: ' + err.message;
                return of([]);
            })
        ).subscribe(data => {
            this.contracts = this.normalizeContracts(data);
            this.loading = false;
        });
    }

    private normalizeContracts(raw: unknown): ContextContract[] {
        if (Array.isArray(raw)) {
            return raw;
        }
        if (raw && typeof raw === 'object') {
            const obj = raw as Record<string, unknown>;
            const contractsObj = (obj.contracts ?? obj) as Record<string, unknown>;
            if (typeof contractsObj === 'object' && !Array.isArray(contractsObj)) {
                return Object.entries(contractsObj)
                    .filter(([key]) => key !== 'contract_count')
                    .map(([archetype, value]) => {
                        const contract = (value ?? {}) as Record<string, unknown>;
                        return {
                            contract_id: String(contract.contract_id ?? archetype),
                            version: String(contract.version ?? '1.0'),
                            archetype: archetype as ContextContract['archetype'],
                            description: String(contract.description ?? ''),
                            required_context: Array.isArray(contract.required_context) ? contract.required_context.map(String) : [],
                            optional_context: Array.isArray(contract.optional_context) ? contract.optional_context.map(String) : [],
                            excluded_context: Array.isArray(contract.excluded_context) ? contract.excluded_context.map(String) : [],
                            budget_profile: String(contract.budget_profile ?? ''),
                            recent_validations: Array.isArray(contract.recent_validations) ? contract.recent_validations : []
                        } as ContextContract;
                    });
            }
        }
        return [];
    }

    getArchetypeIcon(archetype: string): string {
        switch (archetype) {
            case 'orchestrator': return 'bi-diagram-3-fill text-primary';
            case 'worker': return 'bi-person-gear text-success';
            case 'reviewer': return 'bi-eye-fill text-warning text-dark';
            default: return 'bi-file-earmark-code text-secondary';
        }
    }

    getValidationBadge(passed: boolean): string {
        return passed ? 'bg-success' : 'bg-danger';
    }
}
