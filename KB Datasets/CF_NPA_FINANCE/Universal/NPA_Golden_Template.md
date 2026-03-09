# NPA Golden Template - Universal New Product Approval Template

**Version**: 1.0
**Effective Date**: February 2026
**Applicable To**: All New Product Approval submissions regardless of classification (New-to-Group, Variation, Existing)

## Document Purpose

This document serves as the definitive, universal template for all New Product Approval (NPA) submissions at MBS Bank. It consolidates requirements from the comprehensive NPA framework and real-world template analysis to provide a single source of truth for NPA creation.

---

## PART A: BASIC PRODUCT INFORMATION

### A.1 Product Identification

| Field | Description | Required | Auto-Fill Capability |
|-------|-------------|----------|-------------------|
| **Product/Service Name** | Full descriptive name of the product or service | ✓ | Manual |
| **NPA Reference ID** | System-generated unique identifier (Format: TSGxxxx) | ✓ | Auto |
| **Product Category** | Primary categorization (Trading, Banking, Investment, etc.) | ✓ | AI-Suggested |
| **Sub-Category** | Detailed product classification | ✓ | AI-Suggested |

### A.2 Business Unit Information

| Field | Description | Required | Auto-Fill Capability |
|-------|-------------|----------|-------------------|
| **Proposing Unit (PU)** | Primary business unit proposing the product | ✓ | User Profile |
| **Locations Covered** | All geographical locations where product will be offered | ✓ | Manual |
| **Legal Entities Involved** | All MBS entities participating in product delivery | ✓ | Manual |
| **Product Manager Name & Team** | Primary product owner and team structure | ✓ | User Profile |
| **Group Product Head** | Senior executive sponsor | ✓ | Org Chart |
| **Proposal Preparer/Lead** | Document author and primary contact | ✓ | User Profile |

### A.3 Process Information

| Field | Description | Required | Auto-Fill Capability |
|-------|-------------|----------|-------------------|
| **NPA Process Type** | Full NPA / NPA Lite / Bundling / Evergreen | ✓ | AI-Classification |
| **Classification** | New-to-Group / Variation / Existing | ✓ | AI-Classification |
| **Business Case Approved** | Yes/No with attachment reference | ✓ | Manual |
| **PAC Approval Date** | Product Approval Committee approval (if applicable) | Conditional | Manual |
| **NPA Kick-off Meeting Date** | Initial stakeholder meeting date | ✓ | Calendar |
| **Target Go-Live Date** | Planned product launch date | ✓ | Manual |

### A.4 Journey and Authority

| Field | Description | Required | Auto-Fill Capability |
|-------|-------------|----------|-------------------|
| **MtJ Journey(s) Impacted** | Moment of Joy customer journeys affected | Conditional | Journey Map |
| **Approving Authority** | Group COO of the Proposing Unit | ✓ | Org Chart |
| **Cross-Border Indicator** | Yes/No for multi-jurisdiction products | ✓ | AI-Detection |

---

## PART B: SIGN-OFF PARTIES MATRIX

### B.1 Core Sign-Off Requirements

| Sign-Off Group | Required For | Designation Authority | Auto-Fill |
|----------------|-------------|----------------------|-----------|
| **Risk Management Group** |  |  |  |
| - Market & Liquidity | All trading products | PU Group COO | Auto |
| - Credit Risk | Products with credit exposure | PU Group COO | Auto |
| **Technology & Operations** | All products | PU Group COO | Auto |
| **Legal, Compliance & Secretariat** | All products | PU Group COO | Auto |
| **Finance** | All products | PU Group COO | Auto |

### B.2 Special Approvers

| Approver Type | Trigger Conditions | Required When |
|---------------|-------------------|---------------|
| **PAC (Product Approval Committee)** | New-to-Group products | Classification = NTG |
| **CEO** | High-impact NTG products | PAC escalation |
| **Bundling Team** | Product combinations | Process = Bundling |
| **Local Regulators** | Cross-border products | Multi-jurisdiction |

---

## PART C: PRODUCT SPECIFICATIONS

### C.1 Product Description

#### C.1.1 Purpose and Rationale
**Auto-Fill Score: 0%**
```
Template Questions:
- What customer problem does this product solve?
- What are the specific benefits to customers or business units?
- How does this product align with MBS strategic objectives?
- What market opportunity does this address?
```

#### C.1.2 Scope and Parameters
**Auto-Fill Score: 25%**

| Parameter | Description | Examples | Required |
|-----------|-------------|----------|----------|
| **Role of PU** | Business function | Manufacturer, Distributor, Principal, Agent | ✓ |
| **Currency Denomination** | Supported currencies | SGD, USD, CNH, Multi-currency | ✓ |
| **Funding Type** | Capital requirement | Funded, Unfunded, Hybrid | ✓ |
| **Product Maturity/Tenor** | Time horizon | Spot, 1D-30Y, Perpetual | ✓ |
| **Repricing Information** | Interest rate structure | Fixed, Floating, Hybrid | Conditional |
| **Base Rate Type** | Reference rates | SORA, SOFR, 7D Repo, etc. | Conditional |
| **Reset Frequency** | Rate adjustment intervals | Daily, Monthly, Quarterly | Conditional |
| **Capital Protection** | Principal guarantee | Yes/No/Partial | Conditional |

#### C.1.3 Business Model
**Auto-Fill Score: 15%**
```
Required Elements:
- Revenue drivers and fee structure
- Cost components and operational expenses
- Expected transaction volume (annual)
- Market size and penetration strategy
- Competitive positioning
```

### C.2 Target Customer Profile

#### C.2.1 Customer Segmentation
**Auto-Fill Score: 40%**

| Segment Type | Regulatory Classification | Geographic Scope |
|--------------|-------------------------|-------------------|
| **Institutional Investors** | Accredited/Qualified | Singapore, Regional, Global |
| **Corporate Customers** | SME, Large Corporate | Domestic, Cross-border |
| **Retail Customers** | Mass/Affluent/Private | Singapore residents |
| **Financial Institutions** | Banks, Insurance, Fund Managers | Licensed entities |

#### C.2.2 Customer Risk Profile
```
Assessment Framework:
- Investment objectives (Growth, Income, Capital Preservation)
- Risk tolerance (Conservative, Moderate, Aggressive)
- Investment horizon (Short-term, Medium-term, Long-term)
- Regulatory restrictions and qualifications
- Key risks faced by target customers
```

### C.3 Commercialization Approach

#### C.3.1 Distribution Channels
**Auto-Fill Score: 60%**

| Channel Type | Availability | Requirements |
|--------------|-------------|--------------|
| **Digital Channels** | MBS omni, digibank, institutional portals | Tech integration |
| **Relationship Managers** | IBG, PWM, SME Banking | Sales training |
| **Trading Desks** | Direct market access | Trading infrastructure |
| **Third-Party Partners** | External distributors | Partnership agreements |

#### C.3.2 Sales Framework
```
Required Documentation:
- Customer screening and suitability processes
- Sales surveillance and compliance monitoring
- Marketing and communication strategy
- Staff training and competency requirements
- Conflict of interest mitigation measures
```

---

## PART D: OPERATIONAL & TECHNOLOGY INFORMATION

### D.1 Operating Model

#### D.1.1 End-to-End Process Flow
**Auto-Fill Score: 30%**
```
Required Deliverables:
- Operating model diagram with all parties
- Functional responsibilities (Front/Middle/Back Office)
- Third-party involvement and dependencies
- Exception handling procedures
- Manual process documentation
```

#### D.1.2 Booking and Settlement
**Auto-Fill Score: 70%**

| System Component | Details | Auto-Fill Source |
|------------------|---------|------------------|
| **Legal Form** | ISDA, GMRA, NAFMII, etc. | Product type mapping |
| **Family** | IRD, FXD, EQD, CRD | Product classification |
| **Group** | IRS, FXF, BOND, etc. | Sub-classification |
| **Type** | Specific product code | System catalog |
| **Typology** | Contract structure | Murex templates |
| **Portfolio** | Risk and P&L allocation | Business unit mapping |
| **Counterparty Convention** | Labeling standards | Entity type rules |

### D.2 System Infrastructure

#### D.2.1 Technology Platform Requirements
**Auto-Fill Score: 50%**

| System Layer | Components | Impact Assessment |
|--------------|------------|-------------------|
| **Front Office** | Murex, Bloomberg, Trading platforms | Enhancement/Configuration |
| **Middle Office** | Risk systems, Valuation engines | New calculations |
| **Back Office** | Settlement, Accounting, Reporting | Process automation |
| **Infrastructure** | Networks, Databases, Security | Capacity planning |

#### D.2.2 Information Security
```
Security Assessment Checklist:
- New authentication or authorization mechanisms
- Cryptography and HSM requirements
- New interface types or entities
- Customer-facing service components
- Data leakage and cyber risk evaluation
```

### D.3 Business Continuity
**Auto-Fill Score: 80%**
```
BCP Requirements:
- Business Impact Analysis (BIA) updates
- Recovery Time Objectives (RTO) compliance
- Desired Tolerable Downtime (DTDT) assessment
- Alternative delivery pathways
- BCP exercise planning (within 3 months of launch)
```

---

## PART E: RISK ANALYSIS

### E.1 Operational Risk

#### E.1.1 Legal & Compliance Framework

##### Regulatory Compliance
**Auto-Fill Score: 20%**
```
Assessment Areas:
- Licensing requirements (MBS and staff)
- Regulatory approvals and notifications
- Cross-border regulatory considerations
- Banking Act compliance (S27, S29, S30, S35)
- Local jurisdiction requirements
```

##### Documentation Requirements
**Auto-Fill Score: 40%**
```
Legal Documentation Matrix:
- Master agreements (ISDA, GMRA, GMSLA, NAFMII)
- Customer agreements and term sheets
- Risk disclosures and marketing materials
- Regulatory filing templates
- External counsel requirements
```

#### E.1.2 Financial Crime Risk Assessment
**Auto-Fill Score: 60%**

| Risk Category | Assessment Questions | Controls Required |
|---------------|---------------------|-------------------|
| **Money Laundering** | Enhanced due diligence needs | Transaction monitoring |
| **Sanctions** | Cross-border exposure | Screening requirements |
| **Fraud** | New attack vectors | Detection systems |
| **Bribery & Corruption** | Third-party relationships | Due diligence processes |

### E.2 Market & Liquidity Risk

#### E.2.1 Market Risk Factors
**Auto-Fill Score: 70%**

| Risk Factor | Applicable | Sensitivity Reports | VaR Capture | Stress Capture |
|-------------|------------|-------------------|-------------|----------------|
| **IR Delta** | Yes/No | Yes/No | Yes/No | Yes/No |
| **IR Vega** | Yes/No | Yes/No | Yes/No | Yes/No |
| **FX Delta** | Yes/No | Yes/No | Yes/No | Yes/No |
| **FX Vega** | Yes/No | Yes/No | Yes/No | Yes/No |
| **EQ Delta** | Yes/No | Yes/No | Yes/No | Yes/No |
| **Credit Spread (CS01)** | Yes/No | Yes/No | Yes/No | Yes/No |
| **Commodity** | Yes/No | Yes/No | Yes/No | Yes/No |

#### E.2.2 Liquidity Risk Assessment
**Auto-Fill Score: 65%**
```
Liquidity Risk Metrics:
- LCR (Liquidity Coverage Ratio) impact
- NSFR (Net Stable Funding Ratio) treatment
- ILAT (Internal Liquidity Adequacy Test) inclusion
- High-Quality Liquid Assets (HQLA) qualification
- Contingent cash flow identification
```

### E.3 Credit Risk

#### E.3.1 Credit Risk Assessment Matrix
**Auto-Fill Score: 55%**

| Risk Type | Assessment Required | Mitigation Strategy |
|-----------|-------------------|-------------------|
| **Counterparty Pre-Settlement** | Yes/No | Limits and monitoring |
| **Settlement Risk** | Yes/No | DVP/RVP mechanisms |
| **Country Risk** | Yes/No | Geographic limits |
| **Concentration Risk** | Yes/No | Portfolio caps |
| **Wrong Way Risk** | Yes/No | Correlation analysis |
| **Collateral Risk** | Yes/No | Haircut methodology |

#### E.3.2 Credit Capital Requirements
```
Capital Calculation Framework:
- IRBA vs. Standardized Approach selection
- Rating model requirements
- PCE (Pre-settlement Credit Exposure) methodology
- SACCR (Standardized Approach CCR) treatment
- Basel III compliance assessment
```

### E.4 Reputational Risk
**Auto-Fill Score: 30%**
```
Reputational Risk Evaluation:
- ESG (Environmental, Social, Governance) impact
- Regulatory scrutiny potential
- Market perception and competitive response
- Customer protection considerations
- Step-in risk assessment (for SPVs/funds)
```

---

## PART F: DATA MANAGEMENT

### F.1 Design for Data (D4D)
**Auto-Fill Score: 40%**
```
D4D Assessment Framework:
- Data ownership identification
- Critical data attributes mapping
- Data quality monitoring plans
- GDPR/Privacy compliance (PURE principles)
- Cross-border data flow requirements
```

### F.2 Risk Data Aggregation
**Auto-Fill Score: 75%**
```
Data Aggregation Requirements:
- Internal reporting capabilities
- External regulatory reporting
- Stress testing data availability
- Ad hoc request responsiveness
- Data lineage and auditability
```

---

## PART G: APPENDICES

### Appendix 1: Entity/Location Information Matrix
**Auto-Fill Score: 90%**

| Function | Legal Entity | Location | Regulatory Requirements |
|----------|-------------|----------|------------------------|
| **Sales/Origination** | MBS Bank Ltd | Singapore | MAS supervision |
| **Booking** | MBS Bank Ltd | Singapore | Accounting standards |
| **Risk Taking** | MBS Bank Ltd | Singapore | Capital allocation |
| **Processing** | MBS operations | Multiple | Local compliance |

### Appendix 2: Financial Crime Risk Detailed Assessment
**Auto-Fill Score: 50%**

Comprehensive risk assessment covering:
- Process risks (ID&V, screening, settlement)
- People risks (new counterparties, engagement models)
- System risks (IT enhancements, monitoring impacts)
- Mitigation controls and monitoring procedures

### Appendix 3: Trading Products Additional Information
**Auto-Fill Score: 60%**

Required for all trading instruments:
- Revenue/cost/capital sharing arrangements
- Hedging strategy and underlying exposures
- Collateral and margin requirements
- Valuation model validation status
- Booking schema and lifecycle management

---

## PART H: VALIDATION AND SIGN-OFF

### H.1 Completeness Checklist
```
Pre-Submission Validation:
□ All mandatory fields completed
□ Risk assessments comprehensive
□ Supporting documentation attached
□ Sign-off party notifications sent
□ Regulatory compliance confirmed
□ System readiness verified
□ Training materials prepared
□ Go-live plan documented
```

### H.2 Approval Workflow
**Auto-Fill Score: 95%**
```
Automated Workflow Stages:
1. Document completeness check (System)
2. Risk classification validation (AI Agent)
3. Sign-off party routing (Workflow Engine)
4. Parallel review coordination (System)
5. Exception handling and escalation (Rules Engine)
6. Final approval consolidation (System)
7. Implementation tracking (Project Management)
```

---

## PART I: TEMPLATE USAGE GUIDELINES

### I.1 Auto-Fill Capabilities Summary

| Section | Auto-Fill Percentage | Manual Input Required |
|---------|---------------------|----------------------|
| **Basic Product Information** | 85% | Strategic decisions |
| **Product Specifications** | 35% | Business-specific details |
| **Operational Information** | 60% | Process customization |
| **Risk Analysis** | 55% | Risk assessment judgment |
| **Appendices** | 75% | Detailed documentation |
| **Overall Template** | 62% | Critical thinking elements |

### I.2 Quality Assurance Framework

```
QA Validation Points:
- Regulatory compliance verification
- Cross-reference consistency checking
- Completeness scoring (minimum 90%)
- Risk assessment adequacy review
- Supporting documentation validation
- Sign-off party confirmation
- Timeline feasibility assessment
```

### I.3 Template Maintenance

```
Version Control:
- Quarterly template review cycle
- Regulatory update incorporation
- User feedback integration
- Auto-fill algorithm enhancement
- Workflow optimization
- Performance metrics tracking
```

---

**Template End**

*This template represents the consolidation of MBS NPA requirements, real-world template analysis, and best practices from actual NPA submissions. It serves as the definitive reference for all New Product Approval documentation.*