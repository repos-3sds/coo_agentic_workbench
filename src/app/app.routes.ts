import { Routes } from '@angular/router';
import { MainLayoutComponent } from './components/layout/main-layout/main-layout';
import { CommandCenterComponent } from './pages/command-center/command-center.component';
import { PlaceholderComponent } from './components/placeholder/placeholder.component';
import { authGuard } from './lib/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [authGuard],
        children: [
            { path: '', component: CommandCenterComponent },


            {
                path: 'agents/npa',
                loadComponent: () => import('./pages/npa-agent/npa-agent.component').then(m => m.NPAAgentComponent)
            },
            {
                path: 'agents/npa/readiness',
                loadComponent: () => import('./pages/npa-agent/npa-readiness-assessment/npa-readiness-assessment.component').then(m => m.NpaReadinessAssessmentComponent)
            },
            {
                path: 'agents/npa/classification',
                loadComponent: () => import('./pages/npa-agent/classification-scorecard/classification-scorecard.component').then(m => m.ClassificationScorecardComponent)
            },



            // Workbench / Workspace
            { path: 'workbench/my-work', redirectTo: 'workspace/inbox', pathMatch: 'full' },
            {
                path: 'workspace/inbox',
                loadComponent: () => import('./pages/approval-dashboard/approval-dashboard.component').then(m => m.ApprovalDashboardComponent),
                data: { view: 'INBOX' }
            },
            {
                path: 'workspace/drafts',
                loadComponent: () => import('./pages/approval-dashboard/approval-dashboard.component').then(m => m.ApprovalDashboardComponent),
                data: { view: 'DRAFTS' }
            },
            {
                path: 'workspace/watchlist',
                loadComponent: () => import('./pages/approval-dashboard/approval-dashboard.component').then(m => m.ApprovalDashboardComponent),
                data: { view: 'WATCHLIST' }
            },
            {
                path: 'approvals',
                redirectTo: 'workspace/inbox',
                pathMatch: 'full'
            },

            // Work Items
            { path: 'work-items', component: PlaceholderComponent },

            // Sprint 4+5: New functional pages
            {
                path: 'functions/escalations',
                loadComponent: () => import('./pages/escalation-queue/escalation-queue.component').then(m => m.EscalationQueueComponent)
            },
            {
                path: 'functions/pir',
                loadComponent: () => import('./pages/pir-management/pir-management.component').then(m => m.PirManagementComponent)
            },
            {
                path: 'functions/evergreen',
                loadComponent: () => import('./pages/evergreen-dashboard/evergreen-dashboard.component').then(m => m.EvergreenDashboardComponent)
            },
            {
                path: 'functions/bundling',
                loadComponent: () => import('./pages/bundling-assessment/bundling-assessment.component').then(m => m.BundlingAssessmentComponent)
            },
            {
                path: 'functions/documents',
                loadComponent: () => import('./pages/document-manager/document-manager.component').then(m => m.DocumentManagerComponent)
            },

            // COO Functions
            { path: 'functions/desk-support', component: PlaceholderComponent },
            {
                path: 'functions/npa',
                loadComponent: () => import('./pages/coo-npa/coo-npa-dashboard.component').then(m => m.CooNpaDashboardComponent)
            },
            { path: 'functions/dce', component: PlaceholderComponent },
            { path: 'functions/orm', component: PlaceholderComponent },
            { path: 'functions/strategic-pm', component: PlaceholderComponent },
            { path: 'functions/business-lead', component: PlaceholderComponent },
            { path: 'functions/business-analysis', component: PlaceholderComponent },

            // Agents
            { path: 'agents/functional/:agentType', component: PlaceholderComponent },
            { path: 'agents/:agentId', component: PlaceholderComponent },

            // Knowledge
            {
                path: 'knowledge/base',
                loadComponent: () => import('./pages/knowledge-base/knowledge-base').then(m => m.KnowledgeBaseComponent)
            },
            {
                path: 'knowledge/studio',
                loadComponent: () => import('./pages/knowledge-studio/knowledge-studio').then(m => m.KnowledgeStudioComponent)
            },
            {
                path: 'knowledge/studio/:id',
                loadComponent: () => import('./pages/knowledge-studio/knowledge-studio-doc.component').then(m => m.KnowledgeStudioDocComponent)
            },
            {
                path: 'knowledge/base/:id',
                loadComponent: () => import('./pages/knowledge-doc/knowledge-doc.component').then(m => m.KnowledgeDocComponent)
            },
            {
                path: 'knowledge/evidence',
                loadComponent: () => import('./pages/evidence-library/evidence-library').then(m => m.EvidenceLibraryComponent)
            },

            // Reporting
            { path: 'reporting/dashboards', component: PlaceholderComponent },

            // Admin
            { path: 'admin/workflows', component: PlaceholderComponent },

            // Help
            { path: 'help/agents', component: PlaceholderComponent },

            // Fallback
            { path: '**', component: PlaceholderComponent },
        ]
    }
];
