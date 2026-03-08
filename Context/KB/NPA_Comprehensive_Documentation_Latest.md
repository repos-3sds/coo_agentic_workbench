# New Product Approval (NPA) Comprehensive Documentation

## Overview

This documentation provides a comprehensive guide to the New Product Approval (NPA) process based on the latest template (RMG OR Version Jun 2025) and analysis of real NPA implementations including TSG1917, TSG2042, TSG2055, TSG2339, and TSG2543.

## Table of Contents

1. [NPA Process Overview](#npa-process-overview)
2. [Document Structure](#document-structure)
3. [Key Sections Breakdown](#key-sections-breakdown)
4. [Real-World Examples Analysis](#real-world-examples-analysis)
5. [Best Practices](#best-practices)
6. [Common Patterns](#common-patterns)
7. [Risk Assessment Framework](#risk-assessment-framework)
8. [Appendix Templates](#appendix-templates)

## NPA Process Overview

The New Product Approval (NPA) process is a comprehensive risk assessment framework used by MBS Bank to evaluate and approve new products and services. The process ensures that all risks are identified, assessed, and mitigated before product launch.

### NPA Types

1. **New-to-Group**: Completely new products/services not previously offered by MBS
2. **Variation**: Modifications to existing products with different risk profiles
3. **Existing**: Extensions or reactivations of previously approved products
4. **NPA Lite**: Streamlined process for variations or existing products with minimal incremental risk

### Key Principles

- **Risk-Based Approach**: Comprehensive assessment of operational, market, credit, and reputational risks
- **Cross-Functional Review**: Sign-off required from multiple stakeholders
- **Documentation Standards**: Thorough documentation of all risk assessments and controls
- **Continuous Monitoring**: Post-implementation monitoring and controls

## Document Structure

The NPA document follows a standardized structure:

### Part A: Basic Product Information
- Product/Service Name
- Business Units Covered
- Product Manager and Group Head Details
- Business Case Approval Status
- NPA/NPA Lite Classification
- Kick-off Meeting Date

### Part B: Sign-off Parties
Required sign-offs from:
- Risk Management Group (Market & Liquidity, Credit)
- Technology & Operations
- Legal, Compliance & Secretariat
- Finance
- Other relevant parties as determined by Group COO

### Part C: Detailed Product Information
Seven main sections with comprehensive appendices

## Key Sections Breakdown

### I. Product Specifications (Basic Information)

#### 1. Description
- **Purpose and Rationale**: Clear value proposition and problem statement
- **Scope and Parameters**: Role of proposing unit, product features, lifecycle
- **Expected Volume and Revenue**: Market size, transaction volumes, revenue projections
- **Business Model**: Cost and revenue drivers, typical expenses
- **Special Purpose Vehicles**: Details of any SPVs involved

**Example from TSG2042 (NAFMII Repo)**:
```
Purpose: Enable Bond Repo trading in China Interbank Bond Market (CIBM)
through CIBM Direct and RQFII to manage onshore RMB liquidity and enhance
returns. Daily trade volume: RMB 4 trillion market, expected MBS volume:
RMB 4 billion daily.
```

#### 2. Target Customer
- Customer segments and regulatory restrictions
- Geographic domicile and target markets
- Customer profile and risk appetite
- Key risks faced by target customers

#### 3. Commercialization Approach
- Channel availability (online/manned)
- Sales suitability and customer screening
- Marketing and communication strategy
- Sales surveillance and staff training

### II. Operational & Technology Information

#### 1. Operational Information
**Critical Elements**:
- **Operating Model**: End-to-end flow charts and party responsibilities
- **Booking Process**: System handling, cross-border considerations
- **Operational Procedures**: Capability to handle new products/currencies
- **Limit Structure**: Risk limits at Group, Location, and Operational levels
- **Manual Processes**: Documentation of any manual interventions

**Example from TSG2339 (Swap Connect)**:
```
Booking: IRD|IRS|Vanilla typology with CNH 7DREPO 3M SWAPCON generator
Portfolio: MBSSG AMM BCB1 mapped for margin requirements
Legal Form: ISDA with novation to HKEx OTC Clear
```

#### 2. Business Continuity Management
- Business Impact Analysis (BIA) requirements
- Business Continuity Plan (BCP) updates
- Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO)

### III. Pricing Model Details
- Model validation requirements
- Model names and validation dates
- Standardized Initial Margin Model (SIMM) treatment

### IV. Risk Analysis

#### A. Operational Risk

**1. Legal & Compliance Considerations**
- **Regulatory Compliance**: Licensing, approvals, cross-border regulations
- **Legal Documentation**: Required agreements, external counsel needs
- **Financial Crime**: Money laundering, sanctions, fraud risk assessment

**Example Documentation Requirements**:
```
TSG2042: NAFMII Repo Agreement, capacity & authority waivers for Bond
Connect Market Makers, PRC enforceability opinions
TSG2339: ISDA Master Agreements, Bloomberg trading platform agreements
```

**2. Finance and Tax**
- Trading vs Banking book classification
- Accounting treatment (FVPL, FVOCI, Amortised Cost)
- Balance sheet treatment and SPV considerations
- Tax implications and regulatory reporting

#### B. Market & Liquidity Risk

**Market Risk Factors Assessment**:
- IR Delta/Vega, FX Delta/Vega, EQ Delta/Vega
- Credit spread (CS01), commodity exposures
- VaR and stress testing capture
- Risk Not Captured (RNC) identification

**Liquidity Risk Considerations**:
- LCR, NSFR, ILAT capture
- High-Quality Liquid Assets (HQLA) eligibility
- Contractual and contingent cashflows
- Liquidity facility provisions

#### C. Credit Risk
- Primary obligor identification
- Counterparty, country, and concentration risks
- Collateral requirements and Basel eligibility
- Pre-settlement Credit Exposure (PCE) treatment
- Standardized Approach Counterparty Credit Risk (SACCR)

#### D. Reputational Risk
- ESG risk assessment for lending/capital markets
- Step-in risk evaluation
- Regulatory and compliance risk exposure

### V. Data Management
- Design for Data (D4D) requirements
- PURE principles assessment
- Risk Data Aggregation and Reporting compliance

### VI. Other Risk Identification
Additional risks not covered in standard sections

### VII. Trading Products Specific Information
Enhanced requirements for trading instruments including:
- Collateral and pledged assets
- Valuation models and funding considerations
- Booking schemas and portfolio mappings

## Real-World Examples Analysis

### TSG1917: Exchange Listed IR Options
**Type**: NPA Lite (No NPA Required)
**Product**: US Exchange-listed Interest Rate Futures and Options
**Key Features**:
- Grandfathered product with existing T&M HK precedent
- Model validation completed (Eurodollar and Treasury Bond Options)
- No new systems required, leveraged existing Murex infrastructure

### TSG2042: NAFMII Repo Agreement
**Type**: Full NPA
**Product**: Pledged Bond Repo in China Interbank Bond Market
**Key Innovations**:
- New legal framework (NAFMII vs traditional GMRA)
- Cross-border settlement via MBS China and ABOC
- Specific risk management for restricted currency (CN1)
- Tax considerations for Chinese withholding and VAT

### TSG2055: ETF Subscription
**Type**: Deal-Specific Approval
**Product**: Nikko AM-ICBC SG China Bond ETF subscription
**Characteristics**:
- Time-sensitive approval (48-hour turnaround)
- Multi-currency classes (RMB and SGD)
- Complex booking flow with dummy/actual counters
- MBS as both Primary Dealer and Trustee

### TSG2339: Swap Connect
**Type**: NPA Lite
**Product**: CNY Interest Rate Swaps via HK-China connectivity
**Key Elements**:
- Cross-border clearing arrangement (HKEx OTC Clear to SHCH)
- Risk management purpose restrictions with monitoring controls
- New margin type (Participating Margin) beyond standard IM/VM
- Regulatory compliance for cross-border derivative trading

**Supplementary Technical Framework** ([`Swap_Connecty folder`](NPAs/Swap_Connecty/)):
- **Regulatory Structure**: PBOC-SFC joint initiative with CFETS, SHCH, and OTC Clear
- **Eligible Products**: CNY IRS with FR007, SHIBOR3M, SHIBOR O/N benchmarks
- **Trading Platforms**: CFETS (onshore), TradeWeb/Bloomberg (offshore)
- **Clearing Flow**: Triple novation structure creating three independent contracts
- **Risk Management**: Inter-CCP margin with lockbox arrangement (50/50 OTCC/SHCH)
- **Settlement**: Cross-border RMB payment system with NRA account backup
- **Quota Management**: RMB 20bn daily net trading limit, RMB 4bn clearing limit
- **Participating Margin**: New margin type at 0.55x multiplier for Inter-CCP exposure

### TSG2543: Sino-Singapore Bond Channel
**Type**: NPA Lite
**Product**: Bond trading and FX liquidity provision under SSC framework
**Scope**:
- MBS as sole FX liquidity provider appointed by PBOC
- China OTC Bond (COB) model for direct customer trading
- Multi-flow structure (bond trading, FX conversion, settlement)
- CFETS direct access and reporting requirements

## Best Practices

### 1. Documentation Quality
- **Be Specific**: Provide exact details rather than generic statements
- **Reference Precedents**: Link to previous NPAs where applicable
- **Include Flowcharts**: Visual representations of operational flows
- **Cross-Reference**: Ensure consistency across sections

### 2. Risk Assessment
- **Be Comprehensive**: Address all risk categories systematically
- **Quantify Where Possible**: Provide specific limits, volumes, exposures
- **Document Controls**: Clearly state mitigation measures and monitoring
- **Consider Interconnections**: Assess how different risks interact

### 3. Stakeholder Management
- **Early Engagement**: Involve sign-off parties in kick-off meetings
- **Clear Timelines**: Set realistic approval timelines
- **Follow-up Actions**: Document and track all conditions imposed
- **Regular Updates**: Keep stakeholders informed of progress

### 4. Operational Readiness
- **System Capability**: Confirm system support before launch
- **Staff Training**: Ensure adequate training programs
- **Control Testing**: Validate all controls before go-live
- **Contingency Planning**: Document manual fallback procedures

## Common Patterns

### Product Types and Typical Considerations

#### Fixed Income Products
- **Model Validation**: Interest rate models, credit spread models
- **Market Risk**: IR Delta, credit spread (CS01) exposures
- **Settlement**: DVP vs FOP, cross-border considerations
- **Legal**: GMRA, NAFMII, or other repo agreements

#### Derivatives
- **Clearing**: OTC cleared vs bilateral
- **Margin**: Initial Margin (IM), Variation Margin (VM), additional types
- **Legal**: ISDA Master Agreements, CSA requirements
- **Capital**: SACCR treatment, default risk charges

#### Cross-Border Products
- **Regulatory**: Multiple jurisdiction compliance
- **Tax**: Withholding tax, transfer pricing implications
- **Settlement**: Correspondent banking arrangements
- **Documentation**: Local law agreements and enforceability

#### Technology Integration
- **Connectivity**: APIs, market data feeds, STP requirements
- **Security**: Information security assessments, penetration testing
- **Resilience**: RTO/RPO requirements, disaster recovery
- **Enhancement**: BAU configuration vs system development

## Risk Assessment Framework

### Operational Risk Matrix

| Risk Category | Key Questions | Typical Mitigants |
|---------------|---------------|-------------------|
| **Process Risk** | Manual interventions, exception handling | Automation, four-eyes controls, reconciliation |
| **System Risk** | New systems, integration points, data quality | Testing, monitoring, fallback procedures |
| **Legal Risk** | Documentation, enforceability, jurisdictional issues | Legal opinions, standard agreements, local counsel |
| **Regulatory Risk** | Compliance requirements, reporting obligations | Regulatory mapping, monitoring, training |

### Market Risk Assessment

| Risk Factor | Measurement | Limits | Monitoring |
|-------------|-------------|--------|------------|
| **Interest Rate** | IR Delta, PV01 | IRPV01 limits | Daily VaR, stress testing |
| **Credit Spread** | CS01, DV01 | Portfolio limits | Mark-to-market, spread monitoring |
| **Foreign Exchange** | FX Delta, Vega | Notional limits | Real-time exposure tracking |
| **Liquidity** | LCR, NSFR impact | Regulatory ratios | Daily liquidity reporting |

### Credit Risk Framework

| Assessment Area | Key Metrics | Requirements |
|----------------|-------------|--------------|
| **Counterparty Risk** | PCE, SACCR exposure | Credit limits, ratings |
| **Settlement Risk** | DVP/FOP analysis | Settlement monitoring |
| **Collateral Risk** | Haircuts, concentration | Collateral agreements |
| **Wrong Way Risk** | Correlation analysis | Portfolio diversification |

## Appendix Templates

### Appendix 1: Entity/Location Information
Standard matrix covering Sales/Origination, Booking, Risk Taking, and Processing across legal entities and locations.

### Appendix 2: Intellectual Property Assessment
Two-part assessment covering MBS IP and Third Party IP with licensing considerations.

### Appendix 3: Financial Crime Risk Areas
Comprehensive questionnaire covering:
- Money laundering
- Proliferation financing
- Terrorism financing
- Sanctions
- Fraud
- Bribery & corruption

### Appendix 4: Risk Data Aggregation and Reporting
Requirements for data completeness, aggregation capability, and stress reporting.

### Appendix 5: Additional Trading Products Information
Enhanced requirements including:
- Customer arrangements (revenue/cost/capital sharing)
- Collateral and pledged assets details
- Valuation and funding considerations
- Booking schemas and portfolio mappings
- Securitization and structured entity details

### Appendix 6: Third-Party Communication Channels Risk Assessment
**Critical Visual Tool**: The risk assessment matrix ([`image-2024-4-15_10-13-1-1.png`](NPAs/image-2024-4-15_10-13-1-1.png)) provides a standardized framework for evaluating third-party communication channels.

**Risk Classification Matrix**:
- **🔴 HIGH IMPACT**: PROHIBITED - Communications involving confidential information/transactional activities
- **🟡 MODERATE IMPACT**: Detailed risk assessment required - Two-way communications without confidential information
- **🟢 LOW IMPACT**: Assessment not required - One-way communications only

**Assessment Dimensions**:
- **Data/Activity Type**: Whether communications involve confidential information or transactional activities
- **Communication Type**: One-way (broadcast) vs two-way (interactive) communication channels

**Usage in NPA Workflow**:
This matrix is essential when products involve third-party hosted communication platforms (social media, messaging platforms, external websites) to determine:
1. Whether the communication channel is permitted
2. Level of risk assessment required
3. Controls and monitoring needed

**Risk Areas Covered**:
- Fraud risk assessment
- Information security considerations
- Data privacy and protection requirements

## Supporting Documentation Framework

### Importance of Supplementary Materials
Complex NPAs, particularly those involving cross-border arrangements or new market infrastructure, often require extensive supporting documentation beyond the core NPA document. The Swap Connect example demonstrates this with:

**Technical Documentation**:
- Market infrastructure specifications
- Clearing and settlement procedures
- Risk management frameworks
- Operational workflows and timelines

**Regulatory Documentation**:
- Cross-jurisdictional compliance requirements
- Regulatory Q&As and interpretations
- Market conduct rules and guidelines
- Reporting obligations

**Legal Documentation**:
- Master agreement templates
- Legal opinions on enforceability
- Cross-border legal framework analysis
- Contract novation mechanisms

### Best Practice for Documentation Management
1. **Centralized Repository**: Maintain all related materials in accessible folders
2. **Version Control**: Track regulatory updates and rule changes
3. **Cross-Referencing**: Link NPA sections to detailed technical specifications
4. **Stakeholder Access**: Ensure relevant parties can access supporting materials
5. **Regular Updates**: Monitor for regulatory changes affecting approved products

## Additional NPA Implementations Discovered

### 7. TSG21XX - Bond Borrowing and Lending with MBS China

**Purpose**: Enable bond borrowing and lending activities in China's interbank bond market
**Key Features**:
- Currency: CNY/CNH with tenor up to 1 year (mostly <1 month)
- Target clients: MBS China initially, expanding to major market participants
- Fee structure: ~70bps per annum average
- Booking: IRD Lending Borrowing (IRD|LB) with Bond Repos (IRD|REPO) in packages

**Critical Risk Considerations**:
- Cross-border regulatory compliance (PBOC, CFETS)
- Collateral management with pledge arrangements
- System limitations for coupon settlement during borrowing period
- Manual processes for trade confirmation and settlement

### 8. TSG26XX - RMB Clearing Bank Services

**Purpose**: Leverage PBOC approval as Singapore's first RMB clearing bank
**Business Model**: Principal basis trading in FX, FX Swap, and IRS products
**Target Markets**: Cross-border RMB transactions and clearing services

**Regulatory Framework**:
- PBOC approval as designated RMB clearing bank
- Enhanced cross-border transaction capabilities
- Compliance with Chinese monetary policy requirements

### 9. TSG2122 - Reactivation of Exchange Listed IR Options

**Purpose**: Reactivate previously approved interest rate option trading capabilities
**Instruments**: Eurodollar futures options, US Treasury futures options, Fed Fund futures
**Operational Model**: Trading via CBOT and CME through existing and external brokers

**Key Controls**:
- Position accountability reporting to exchanges
- Broker limit monitoring and margin management
- MiFID II transaction reporting requirements

### 10. TSG2319 - ETF Deal-Specific Subscription Approval

**Purpose**: Seed investment in CSOP iEdge ASEAN Plus Tech Index ETF
**Investment Details**:
- Fund size: SGD 100 million
- MBS subscription: Up to SGD 10 million (≤10% threshold)
- Holding period: 12 months minimum per seeding agreement

**Strategic Rationale**: Secure long-term partnership with CSOP including custodian and trustee appointments

## Sino-Singapore Bond Channel Framework

### Advanced Cross-Border Bond Trading Initiative

**Regulatory Foundation**:
- PBOC approval for China Interbank Bond Market (CIBM) access facilitation
- Singapore's strategic position as regional financial hub
- Bilateral cooperation framework between China and Singapore

**Operating Models**:

**Model 1: OTC Bond & FX Trading** (Primary focus)
- MBS Singapore acts as principal counterparty for overseas institutional investors
- Direct CFETS connectivity for bond trading and FX activity
- Comprehensive FX hedging services (CNY spots, forwards, swaps)

**Model 2: Direct Custody & FX Conversion** (Excluded from current proposal)
- Direct investor-to-onshore counterparty bond trading
- MBS custody services via GTS-SFS
- Optional FX hedging arrangements

### Target Client Framework

**Eligible Participants**:
- Regional banks (treasury functions)
- Asset managers and hedge funds
- Central banks and pension funds
- Regional treasury centers (RTCs)*
- Private banks*

*Subject to PBOC whitelisting approval

### Compliance and Risk Management

**Singapore Regulatory Requirements**:
- Cross-border transaction procedures compliance
- Trade reporting under Securities and Futures Act Section 125
- Customer due diligence and suitability assessment (CSFA)
- MAS Notice 757 compliance for SGD lending to NRFIs

**China Regulatory Obligations**:
- RMB purchase/sale business regulations (PBOC Notice Yin Fa [2018] No. 159)
- CFETS trading rules and conduct guidelines
- Real-name trader registration and communication monitoring
- Prompt material matter reporting requirements

## Product Due Diligence Framework

### Financial Advisers Regulations 2021 - Regulation 18B Compliance

**Assessment Scope**:
- Target client profile evaluation (accredited/expert/institutional investors)
- Investment objectives and risk profiling
- Cost structure comparison with similar products
- Marketing channel and sales suitability processes

**Exempted Products**:
- Spot FX contracts (non-leveraged)
- Exchange-traded futures contracts
- Exchange-quoted specified products

### Enhanced Risk Assessment Matrix

**Additional Risk Categories Identified**:

**Cross-Border Operational Risk**:
- Multi-jurisdictional regulatory compliance
- Currency conversion and repatriation restrictions
- Time zone coordination challenges
- Documentation and language barriers

**Technology Integration Risk**:
- CFETS platform connectivity requirements
- Real-time position monitoring across jurisdictions
- System integration between Singapore and China operations
- Backup communication channel management

**Concentration Risk**:
- Single market dependency (China Interbank Bond Market)
- Counterparty concentration in onshore trading partners
- Currency concentration in CNY/CNH instruments

## Process Innovation and Automation

### Digital Transformation Elements

**Automated Risk Monitoring**:
- Real-time position tracking across multiple portfolios
- Automated limit monitoring and exception reporting
- Integration with existing risk management systems (Murex, MLC)

**Enhanced Documentation**:
- Digital workflow management for cross-functional approvals
- Automated compliance checking and regulatory reporting
- Version control and audit trail management

**Customer Onboarding**:
- Digital KYC and suitability assessment processes
- Automated eligibility verification against PBOC lists
- Streamlined documentation and agreement execution

## Regulatory Evolution and Future Considerations

### Emerging Regulatory Themes

**ESG Integration**:
- Environmental, Social, and Governance risk assessment requirements
- Sustainability-related product labeling and marketing standards
- Enhanced due diligence for ESG-labeled products

**Technology Risk Management**:
- AI/ML feature assessment in new systems
- Cybersecurity and data protection enhanced requirements
- Technology resiliency and disaster recovery planning

**Cross-Border Cooperation**:
- Bilateral regulatory framework development
- Standardized documentation and processes
- Enhanced information sharing mechanisms

## Conclusion

This comprehensive analysis of MBS Bank's New Product Approval framework reveals a sophisticated, multi-layered approach to risk management and regulatory compliance. The framework successfully balances innovation enablement with prudent risk management across diverse product categories from simple instrument reactivations to complex cross-border initiatives.

### Key Success Factors Validated

1. **Regulatory Proactivity**: Early engagement with regulators (PBOC, MAS, CFETS) ensures smoother approval processes
2. **Cross-Functional Integration**: Seamless coordination between GFM, Risk Management, Operations, Legal & Compliance, and Finance
3. **Technology Leverage**: Strategic use of existing systems (Murex, MLC) while building new connectivity (CFETS)
4. **Documentation Excellence**: Comprehensive, structured documentation supporting complex multi-jurisdictional assessments
5. **Operational Scalability**: Framework accommodates both simple reactivations and complex new market initiatives

### Framework Maturity Indicators

The analysis demonstrates a mature, evolving framework that:
- Adapts to regulatory changes and market innovations
- Integrates emerging risk categories (ESG, technology, cross-border)
- Maintains consistency across diverse product types and complexity levels
- Supports strategic business objectives while ensuring robust risk management
- Enables efficient processing through standardized templates and processes

## Key Takeaways for Product Teams

1. **Start Early**: Begin NPA process well in advance of intended launch
2. **Be Thorough**: Address all sections comprehensively, even if not applicable
3. **Leverage Precedents**: Reference similar products and previous approvals
4. **Focus on Controls**: Clearly document risk mitigation measures
5. **Plan for Operations**: Ensure operational readiness before launch
6. **Monitor Continuously**: Establish ongoing monitoring and reporting
7. **Embrace Cross-Border Complexity**: Prepare for multi-jurisdictional regulatory requirements
8. **Document Supporting Materials**: Maintain comprehensive technical and regulatory documentation

---

*This documentation is based on comprehensive analysis of:*
- *NPA Template (RMG OR Version Jun 2025)*
- *Ten real implementations: TSG1917, TSG2042, TSG2055, TSG2339, TSG2543, TSG21XX, TSG26XX, TSG2122, TSG2319*
- *Supporting regulatory and technical documentation (Swap Connect, Sino-Singapore materials)*
- *Risk assessment frameworks and visual tools*
- *Product Due Diligence frameworks and compliance assessments*
- *Cross-border regulatory requirements and approval processes*

*This documentation serves as both a comprehensive reference guide and practical implementation tool for organizations seeking to implement or enhance their new product approval processes in complex, multi-jurisdictional financial services environments.*

*For the most current requirements, please refer to the latest template and consult with relevant stakeholders. Complex cross-border products require extensive supporting documentation beyond the core NPA.*