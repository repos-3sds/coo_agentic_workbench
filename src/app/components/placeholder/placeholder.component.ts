import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-placeholder',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
       <h2 class="text-2xl font-bold tracking-tight text-foreground">Coming Soon</h2>
       <p class="text-muted-foreground max-w-md">
           This page is part of the extensive 40+ route system and is currently a placeholder for the Angular port.
       </p>
    </div>
  `,
    styles: []
})
export class PlaceholderComponent { }
