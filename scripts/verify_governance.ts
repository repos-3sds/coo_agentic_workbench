
// Mock Interfaces to match AgentGovernanceService
interface ReadinessDomain {
    name: string;
    status: 'PASS' | 'FAIL' | 'MISSING';
    observation: string;
}

interface ReadinessResult {
    isReady: boolean;
    score: number; // 0-100
    domains: ReadinessDomain[];
    overallAssessment: string;
}

interface ClassificationResult {
    tier: string;
    reason: string;
    requiredApprovers: string[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

// Replicating Logic from AgentGovernanceService
class GovernanceLogicVerifier {

    assessReadiness(description: string): ReadinessResult {
        const domains: ReadinessDomain[] = [
            { name: 'Strategic Alignment', status: 'PASS', observation: ' aligned with regional growth targets.' },
            { name: 'Financial Viability', status: 'MISSING', observation: 'No projected revenue or cost data found.' },
            { name: 'Risk Management', status: 'PASS', observation: 'Standard risk frameworks apply.' },
            { name: 'Legal & Compliance', status: 'PASS', observation: 'No specific regulatory hurdles detected.' },
            { name: 'Operations', status: 'PASS', observation: 'Standard settlement processes available.' },
            { name: 'Technology', status: 'PASS', observation: 'Uses existing trading platforms.' },
            { name: 'Conduct & Culture', status: 'PASS', observation: 'No conduct risks identified.' }
        ];

        // Logic Replication
        if (description.toLowerCase().includes('crypto') || description.toLowerCase().includes('digital asset')) {
            domains[2].status = 'FAIL'; // Risk
            domains[2].observation = 'Digital Assets require special Risk Board approval.';
            domains[5].status = 'MISSING'; // Tech
            domains[5].observation = 'Custody solution for digital assets not defined.';
        }

        if (description.toLowerCase().includes('cross-border')) {
            domains[3].status = 'MISSING'; // Legal
            domains[3].observation = 'Cross-border legal opinion required for target jurisdictions.';
        }

        const passCount = domains.filter(d => d.status === 'PASS').length;
        const score = Math.round((passCount / 7) * 100);

        return {
            isReady: score >= 85,
            score,
            domains,
            overallAssessment: score >= 85
                ? 'Project appears ready for initiation.'
                : 'Critical gaps detected in Financials or Risk. Please address before proceeding.'
        };
    }

    assessClassification(description: string, jurisdiction: string = 'SG'): ClassificationResult {
        const text = description.toLowerCase();

        // 1. New-to-Group (Class 1) - Highest Risk
        if (text.includes('crypto') || text.includes('blockchain') || text.includes('ai driven')) {
            return {
                tier: 'New-to-Group',
                riskLevel: 'HIGH',
                reason: 'Complex or Novel Product Structure detected.',
                requiredApprovers: ['Group CRO', 'Group CFO', 'Board Risk Committee']
            };
        }

        // 2. Variation (Class 3) - Medium Risk
        if (text.includes('cross-border') || jurisdiction !== 'SG') {
            return {
                tier: 'Variation',
                riskLevel: 'MEDIUM',
                reason: 'Existing product extended to new jurisdiction.',
                requiredApprovers: ['Regional Head', 'Legal', 'Compliance']
            };
        }

        // 3. NPA Lite (Class 4) - Low Risk
        if (text.includes('vanilla') || text.includes('enhancement') || text.includes('update')) {
            return {
                tier: 'NPA Lite',
                riskLevel: 'LOW',
                reason: 'Minor enhancement to existing approved product.',
                requiredApprovers: ['Desk Head', 'Ops Head']
            };
        }

        // Default
        return {
            tier: 'Existing',
            riskLevel: 'LOW',
            reason: 'Standard product classification.',
            requiredApprovers: ['Business Head']
        };
    }
}

// Running Verification Tests
const verifier = new GovernanceLogicVerifier();

const scenarios = [
    { name: 'Crypto Launch', desc: 'New AI driven crypto exchange', expectedTier: 'New-to-Group', expectedReady: false },
    { name: 'Cross-Border Deal', desc: 'Cross-border FX Option for Hong Kong client', expectedTier: 'Variation', expectedReady: false },
    { name: 'Simple Update', desc: 'Vanilla FX Spot update for SG desk', expectedTier: 'NPA Lite', expectedReady: false } // Financials missing by default
];

console.log('--- STARTING GOVERNANCE LOGIC VERIFICATION ---\n');

scenarios.forEach(scenario => {
    console.log(`Test Case: ${scenario.name}`);
    console.log(`Input: "${scenario.desc}"`);

    const classification = verifier.assessClassification(scenario.desc);
    const readiness = verifier.assessReadiness(scenario.desc);

    console.log(`Classification: ${classification.tier} (Expected: ${scenario.expectedTier})`);
    console.log(`Risk Level: ${classification.riskLevel}`);
    console.log(`Readiness Score: ${readiness.score}/100`);
    console.log(`Passes Readiness: ${readiness.isReady}`);

    if (classification.tier === scenario.expectedTier) {
        console.log('✅ Classification Match');
    } else {
        console.log('❌ Classification Mismatch');
    }

    console.log('---');
});

console.log('\n--- VERIFICATION COMPLETE ---');
