import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NpaDocument {
    id: number;
    project_id: string;
    document_name: string;
    document_type: string;
    file_size: string;
    file_extension: string;
    category: string | null;
    validation_status: 'PENDING' | 'VALID' | 'INVALID' | 'WARNING';
    validation_stage: string | null;
    validation_notes: string | null;
    uploaded_by: string;
    uploaded_at: string;
    required_by_stage: string | null;
    doc_requirement_id: number | null;
}

export interface DocumentRequirement {
    id: number;
    requirement_name: string;
    required_by_stage: string;
    order_index: number;
    is_mandatory: boolean;
    description: string | null;
}

export interface DocumentRequirementsMatrix {
    requirements: DocumentRequirement[];
    documents: NpaDocument[];
}

@Injectable({ providedIn: 'root' })
export class DocumentService {
    private http = inject(HttpClient);
    private apiUrl = '/api/documents';

    getByNpa(npaId: string): Observable<NpaDocument[]> {
        return this.http.get<NpaDocument[]>(`${this.apiUrl}/npas/${npaId}`);
    }

    getRequirementsMatrix(npaId: string): Observable<DocumentRequirementsMatrix> {
        return this.http.get<DocumentRequirementsMatrix>(`${this.apiUrl}/npas/${npaId}/requirements`);
    }

    upload(npaId: string, file: File, metadata: { document_type?: string; category?: string; uploaded_by?: string }): Observable<any> {
        const formData = new FormData();
        formData.append('file', file);
        if (metadata.document_type) formData.append('document_type', metadata.document_type);
        if (metadata.category) formData.append('category', metadata.category);
        if (metadata.uploaded_by) formData.append('uploaded_by', metadata.uploaded_by);
        return this.http.post(`${this.apiUrl}/npas/${npaId}/upload`, formData);
    }

    validate(docId: number, payload: { validation_status: string; validation_stage?: string }): Observable<any> {
        return this.http.put(`${this.apiUrl}/${docId}/validate`, payload);
    }

    delete(docId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/${docId}`);
    }
}
