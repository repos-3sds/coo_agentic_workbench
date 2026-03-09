import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-ao-form-progress',
    standalone: true,
    imports: [CommonModule],
    template: `
        <svg [attr.width]="size" [attr.height]="size" [attr.viewBox]="'0 0 ' + size + ' ' + size">
            <!-- Background circle -->
            <circle
                [attr.cx]="center" [attr.cy]="center" [attr.r]="radius"
                fill="none" [attr.stroke]="trackColor" [attr.stroke-width]="strokeWidth"
            />
            <!-- Progress arc -->
            <circle
                [attr.cx]="center" [attr.cy]="center" [attr.r]="radius"
                fill="none" [attr.stroke]="progressColor" [attr.stroke-width]="strokeWidth"
                stroke-linecap="round"
                [attr.stroke-dasharray]="circumference"
                [attr.stroke-dashoffset]="dashOffset"
                [style.transform]="'rotate(-90deg)'"
                [style.transform-origin]="center + 'px ' + center + 'px'"
                class="transition-all duration-500 ease-out"
            />
            <!-- Center text -->
            <text *ngIf="showLabel"
                [attr.x]="center" [attr.y]="center"
                text-anchor="middle" dominant-baseline="central"
                [attr.font-size]="fontSize" font-weight="600"
                [attr.fill]="labelColor">
                {{ label || (percent + '%') }}
            </text>
        </svg>
    `,
})
export class AoFormProgressComponent {
    @Input() percent: number = 0;
    @Input() size: number = 40;
    @Input() label?: string;
    @Input() showLabel: boolean = true;

    readonly strokeWidth = 3;

    get center(): number { return this.size / 2; }
    get radius(): number { return (this.size - this.strokeWidth * 2) / 2; }
    get circumference(): number { return 2 * Math.PI * this.radius; }
    get dashOffset(): number {
        const clamped = Math.max(0, Math.min(100, this.percent));
        return this.circumference * (1 - clamped / 100);
    }

    get progressColor(): string {
        if (this.percent >= 80) return '#10b981'; // emerald-500
        if (this.percent >= 40) return '#f59e0b'; // amber-500
        return '#94a3b8'; // slate-400
    }

    get trackColor(): string { return '#e2e8f0'; } // slate-200
    get labelColor(): string { return '#334155'; } // slate-700
    get fontSize(): number { return Math.max(9, this.size * 0.25); }
}
