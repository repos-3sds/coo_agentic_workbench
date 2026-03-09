import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedIconsModule } from '../../../shared/icons/shared-icons.module';
import { DiligenceResponse } from '../../../lib/agent-interfaces';

@Component({
    selector: 'app-diligence-panel',
    standalone: true,
    imports: [CommonModule, FormsModule, SharedIconsModule],
    template: `
        <div class="space-y-4">
            <h3 class="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <lucide-icon name="message-square" [size]="16"></lucide-icon>
                Conversational Diligence
            </h3>

            <!-- Question Input -->
            <div class="flex items-center gap-2">
                <div class="relative flex-1">
                    <input
                        type="text"
                        [(ngModel)]="questionText"
                        (keydown.enter)="submitQuestion()"
                        placeholder="Ask a diligence question..."
                        class="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
                    />
                    <lucide-icon
                        name="help-circle"
                        [size]="16"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300"
                    ></lucide-icon>
                </div>
                <button
                    (click)="submitQuestion()"
                    [disabled]="!questionText.trim()"
                    class="rounded-lg bg-mbs-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-mbs-primary-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                >
                    <lucide-icon name="send" [size]="14"></lucide-icon>
                    Ask
                </button>
            </div>

            <!-- Response Section -->
            <div *ngIf="response" class="space-y-4">
                <!-- Answer -->
                <div class="rounded-lg border border-slate-200 bg-white p-4">
                    <p class="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{{ response.answer }}</p>
                </div>

                <!-- Citations -->
                <div *ngIf="response.citations && response.citations.length > 0" class="space-y-2">
                    <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <lucide-icon name="book-open" [size]="13"></lucide-icon>
                        Citations
                    </h4>
                    <div class="space-y-1.5">
                        <div
                            *ngFor="let citation of response.citations; let i = index"
                            class="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50/50 px-3 py-2.5"
                        >
                            <span class="text-xs font-bold text-slate-400 mt-0.5">[{{ i + 1 }}]</span>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between gap-2">
                                    <span class="text-xs font-medium text-slate-700 truncate">{{ citation.source }}</span>
                                    <span
                                        class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
                                        [ngClass]="{
                                            'bg-green-100 text-green-700': citation.relevance >= 0.9,
                                            'bg-amber-100 text-amber-700': citation.relevance >= 0.7 && citation.relevance < 0.9,
                                            'bg-slate-100 text-slate-600': citation.relevance < 0.7
                                        }"
                                    >
                                        {{ (citation.relevance * 100).toFixed(0) }}%
                                    </span>
                                </div>
                                <p class="text-xs text-slate-500 mt-0.5 line-clamp-2">{{ citation.snippet }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Related Questions -->
                <div *ngIf="response.relatedQuestions && response.relatedQuestions.length > 0" class="space-y-2">
                    <h4 class="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <lucide-icon name="lightbulb" [size]="13"></lucide-icon>
                        Related Questions
                    </h4>
                    <div class="flex flex-wrap gap-2">
                        <button
                            *ngFor="let q of response.relatedQuestions"
                            (click)="onRelatedQuestionClick(q)"
                            class="text-xs px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors cursor-pointer"
                        >
                            {{ q }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Empty state -->
            <div *ngIf="!response" class="text-center py-6 text-slate-400">
                <lucide-icon name="message-square" [size]="28" class="mx-auto mb-2 opacity-40"></lucide-icon>
                <p class="text-xs">Ask a question to get AI-powered diligence answers with citations</p>
            </div>
        </div>
    `
})
export class DiligencePanelComponent {
    @Input() response: DiligenceResponse | null = null;
    @Output() askQuestion = new EventEmitter<string>();

    questionText = '';

    submitQuestion(): void {
        const trimmed = this.questionText.trim();
        if (trimmed) {
            this.askQuestion.emit(trimmed);
            this.questionText = '';
        }
    }

    onRelatedQuestionClick(question: string): void {
        this.askQuestion.emit(question);
    }
}
