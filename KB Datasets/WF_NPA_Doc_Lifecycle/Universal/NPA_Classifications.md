# NPA Classifications - Complete Guide to NPA Product Classifications

**Version**: 1.0
**Effective Date**: February 2026
**Purpose**: Define comprehensive classification framework for all New Product Approval submissions

---

## EXECUTIVE SUMMARY

This document provides the definitive classification framework for all NPA submissions at MBS Bank. It includes detailed criteria, decision trees, examples, and edge cases to ensure consistent and accurate classification of all products and services.

---

## 1. CLASSIFICATION FRAMEWORK OVERVIEW

### 1.1 Primary Classification Categories

#### Three-Tier Classification System:

```
NEW-TO-GROUP (NTG)
├── Completely new products/services to MBS Group
├── Novel market approaches or customer segments
├── Fundamentally new risk profiles
└── Requires PAC approval

VARIATION
├── Modifications to existing products/services
├── Material changes → Full NPA
├── Minor changes → NPA Lite eligible
└── Same underlying product framework

EXISTING
├── Products already approved for similar use
├── Different implementation or market
├── Minimal risk profile changes
└── Bundling/Evergreen eligible
```

### 1.2 Classification Impact Matrix

| Classification | Process Type | Timeline | PAC Required | PIR Required | CEO Approval |
|----------------|--------------|----------|--------------|--------------|--------------|
| **New-to-Group** | Full NPA | 12-16 weeks | ✅ Yes | ✅ Yes | Conditional |
| **Variation (Material)** | Full NPA | 8-12 weeks | ❌ No | ❌ No | ❌ No |
| **Variation (Minor)** | NPA Lite | 4-6 weeks | ❌ No | ❌ No | ❌ No |
| **Existing** | NPA Lite/Bundle | 2-6 weeks | ❌ No | ❌ No | ❌ No |

### 1.3 Classification Decision Authority

| Decision Level | Authority | Override Capability | Final Appeal |
|---------------|-----------|-------------------|--------------|
| **Initial Classification** | Product Manager | Business Head | Group COO |
| **Classification Review** | Business Head | Group Product Head | Group COO |
| **Classification Override** | Group Product Head | Group COO | CEO |
| **Final Determination** | Group COO | CEO | Board |

---

## 2. NEW-TO-GROUP (NTG) CLASSIFICATION

### 2.1 Definition and Scope
**New-to-Group products or services are those that introduce fundamentally new capabilities, risk profiles, or market approaches that have never been offered by MBS Group in any jurisdiction or format.**

### 2.2 NTG Classification Criteria (20 Indicators)

#### Product Innovation Criteria (5 indicators):
- [ ] **Novel Product Structure**: Fundamentally new product architecture or features
- [ ] **New Asset Class**: Introduction of previously untradeable asset classes
- [ ] **Innovative Technology**: Uses technology not previously deployed by MBS
- [ ] **New Revenue Model**: Introduces previously unexploited revenue streams
- [ ] **Unique Market Position**: Creates new market-making or intermediation roles

#### Market and Customer Criteria (4 indicators):
- [ ] **New Customer Segment**: Targets previously unserved customer categories
- [ ] **New Geographic Market**: Entry into markets where MBS has no presence
- [ ] **New Distribution Channel**: Uses distribution methods not previously employed
- [ ] **New Partnership Model**: Requires new types of external partnerships

#### Risk and Regulatory Criteria (6 indicators):
- [ ] **New Risk Categories**: Introduces risk types not previously managed
- [ ] **New Regulatory Framework**: Subject to regulations not previously applicable
- [ ] **New Capital Treatment**: Requires new capital allocation methodologies
- [ ] **New Compliance Monitoring**: Needs new compliance monitoring frameworks
- [ ] **New Legal Agreements**: Requires master agreements not previously used
- [ ] **New Operational Processes**: Demands new operational infrastructure

#### Financial and Operational Criteria (5 indicators):
- [ ] **New Settlement Mechanism**: Uses settlement methods not previously employed
- [ ] **New Currency Exposure**: Involves currencies not previously traded
- [ ] **New Counterparty Types**: Engages counterparty categories not previously dealt with
- [ ] **New Pricing Model**: Implements pricing strategies not previously used
- [ ] **New Data Requirements**: Needs data management approaches not previously implemented

### 2.3 NTG Classification Decision Tree

```
START: Is this product completely new to MBS Group?
│
├── Check Product Innovation (5 criteria)
│   ├── ≥3 criteria met → Continue to Market Check
│   └── <3 criteria met → Likely VARIATION
│
├── Check Market and Customer (4 criteria)
│   ├── ≥2 criteria met → Continue to Risk Check
│   └── <2 criteria met → Likely VARIATION
│
├── Check Risk and Regulatory (6 criteria)
│   ├── ≥3 criteria met → Continue to Financial Check
│   └── <3 criteria met → Likely VARIATION
│
└── Check Financial and Operational (5 criteria)
    ├── ≥2 criteria met → NEW-TO-GROUP
    └── <2 criteria met → Likely VARIATION
```

#### Scoring Methodology:
- **Total Score**: Sum of all met criteria (0-20)
- **NTG Threshold**: ≥10 criteria with balanced distribution
- **Minimum Requirements**: At least 1 criterion from each category
- **Override Conditions**: Single high-impact criterion may trigger NTG

### 2.4 NTG Classification Examples

#### Clear NTG Examples:
- **Digital Currency Trading**: First cryptocurrency offerings
- **Robo-Advisory Services**: Automated investment management
- **Supply Chain Financing**: Blockchain-based trade finance
- **Carbon Credit Trading**: Environmental commodity trading
- **Quantum Computing Services**: Advanced technology offerings

#### Borderline NTG Cases:
- **New Geographic Entry**: Existing product in new country (depends on local requirements)
- **Technology Enhancement**: Existing product with new technology (depends on degree of change)
- **New Customer Segment**: Existing product for new customers (depends on segment requirements)

### 2.5 NTG Mandatory Requirements

#### Governance Requirements:
- **PAC Presentation**: Formal Product Approval Committee review
- **Executive Sponsorship**: Group Executive Committee member sponsor
- **Board Awareness**: Notification to Board Risk Committee
- **PIR Commitment**: Post-Implementation Review at 6 months

#### Enhanced Documentation:
- **Strategic Business Case**: Detailed strategic justification
- **Comprehensive Risk Assessment**: All risk categories evaluated
- **Market Analysis**: Thorough competitive and market analysis
- **Implementation Plan**: Detailed rollout and success measurement

---

## 3. VARIATION CLASSIFICATION

### 3.1 Definition and Scope
**Variation products are modifications, enhancements, or adaptations of existing MBS products or services that maintain the same fundamental structure but introduce changes that may affect risk profile, operational processes, or regulatory treatment.**

### 3.2 Variation Sub-Classifications

#### 3.2.1 Material Variations
**Significant changes that materially alter the product's risk profile, regulatory treatment, or operational requirements.**

##### Material Variation Criteria (8 indicators):
- [ ] **Risk Profile Change**: Introduces new risk factors or significantly alters existing ones
- [ ] **Regulatory Impact**: Changes regulatory treatment or compliance requirements
- [ ] **Capital Impact**: Materially affects capital allocation or treatment
- [ ] **Operational Change**: Requires significant new operational processes
- [ ] **Technology Enhancement**: Needs major system changes or new technology
- [ ] **Legal Documentation**: Requires new or modified legal agreements
- [ ] **Customer Impact**: Significantly changes customer experience or obligations
- [ ] **Revenue Impact**: Materially changes revenue model or pricing structure

##### Material Variation Decision Logic:
```
Is this a Material Variation?
├── ≥3 criteria met → MATERIAL VARIATION → Full NPA Required
├── 2 criteria met + high impact → MATERIAL VARIATION → Full NPA Required
└── <2 criteria met → MINOR VARIATION → NPA Lite Eligible
```

#### 3.2.2 Minor Variations
**Small changes that do not materially alter the product's fundamental characteristics, risk profile, or regulatory treatment.**

##### Minor Variation Characteristics:
- **Parameter Adjustments**: Changes to rates, fees, or terms within pre-approved ranges
- **Geographic Extension**: Offering in new locations with same regulatory framework
- **Customer Segment Extension**: Offering to similar customer types with same risk profile
- **Process Optimization**: Operational improvements without risk impact
- **Technology Updates**: System upgrades without functional changes

### 3.3 Variation Classification Examples

#### Material Variation Examples:
- **Currency Addition**: Adding new currency to existing FX product
- **Maturity Extension**: Significantly extending product tenor beyond current range
- **Counterparty Type Change**: Offering to new counterparty categories
- **Settlement Enhancement**: Adding new settlement mechanisms
- **Risk Feature Addition**: Adding new risk management features

#### Minor Variation Examples:
- **Rate Adjustment**: Changing pricing within pre-approved bands
- **Term Modification**: Minor adjustments to standard terms and conditions
- **Geographic Rollout**: Same product in similar regulatory environment
- **Customer Sub-Segment**: Offering to similar customer sub-categories
- **Process Improvement**: Operational efficiency enhancements

### 3.4 Variation Assessment Framework

#### Assessment Questions:
1. **Does the variation introduce new risks not previously assessed?**
2. **Are new regulatory approvals or notifications required?**
3. **Do new operational processes need to be established?**
4. **Are material system changes required?**
5. **Will customer documentation need significant modification?**
6. **Does the variation affect capital or accounting treatment?**
7. **Are new legal agreements or modifications required?**
8. **Will the change affect the product's competitive positioning?**

#### Scoring Matrix:
| Number of "Yes" Responses | Classification | Process Required |
|-------------------------|----------------|------------------|
| **6-8** | Material Variation | Full NPA |
| **3-5** | Material Variation (Conditional) | Full NPA or Enhanced NPA Lite |
| **1-2** | Minor Variation | NPA Lite |
| **0** | Minor Variation | NPA Lite or Bundling |

---

## 4. EXISTING CLASSIFICATION

### 4.1 Definition and Scope
**Existing products are those that have been previously approved and implemented by MBS, and are being offered in the same or substantially similar format with minimal modifications.**

### 4.2 Existing Product Criteria

#### Qualifying Criteria for Existing Classification:
- [ ] **Previous Approval**: Product has been approved through NPA process within last 5 years
- [ ] **Same Risk Profile**: No material changes to risk characteristics
- [ ] **Same Regulatory Treatment**: No new regulatory requirements
- [ ] **Similar Implementation**: Same or similar operational processes
- [ ] **Same Technology Platform**: Uses existing technology infrastructure
- [ ] **Same Legal Framework**: Uses existing legal documentation
- [ ] **Same Customer Base**: Targets same or similar customer segments
- [ ] **Same Geographic Scope**: Within previously approved jurisdictions

### 4.3 Existing Product Sub-Categories

#### 4.3.1 Identical Implementation
**Exact replication of previously approved product with no modifications.**

##### Characteristics:
- Same product specifications
- Same target customers
- Same geographic scope
- Same operational processes
- Same technology platform
- Same legal documentation

##### Process: **Evergreen Eligible**

#### 4.3.2 Adapted Implementation
**Previously approved product with minor adaptations for different context.**

##### Adaptation Types:
- **Geographic Adaptation**: Different location with similar regulatory environment
- **Customer Adaptation**: Different customer segment with same risk profile
- **Operational Adaptation**: Minor process changes for efficiency
- **Technology Adaptation**: Platform changes without functional impact

##### Process: **NPA Lite or Bundling**

### 4.4 Existing Product Decision Matrix

| Similarity Level | Modifications | Recommended Process | Timeline |
|------------------|---------------|-------------------|----------|
| **Identical (100%)** | None | Evergreen | 1-2 weeks |
| **High (90-99%)** | Cosmetic only | Evergreen | 2-3 weeks |
| **Substantial (80-89%)** | Minor operational | NPA Lite | 3-4 weeks |
| **Moderate (70-79%)** | Some functional | NPA Lite | 4-6 weeks |
| **Low (<70%)** | Material changes | Reconsider as Variation | 6+ weeks |

---

## 5. SPECIAL CLASSIFICATION CATEGORIES

### 5.1 Evergreen Products
**Pre-approved standard products that can be implemented with minimal review process.**

#### Evergreen Eligibility Criteria:
- **Standard Parameters**: Product fits within pre-approved parameter ranges
- **No Deviations**: No deviations from standard terms and conditions
- **Approved Jurisdictions**: Implementation within pre-approved geographic scope
- **Standard Customers**: Targeting pre-approved customer segments
- **Established Operations**: Uses existing operational infrastructure

#### Evergreen Product Categories:
- **Standard Deposits**: Basic savings, current, and term deposits
- **Standard Loans**: Personal loans, mortgages within standard criteria
- **Standard FX**: Spot and forward FX within standard parameters
- **Standard Trade Finance**: Letters of credit, guarantees within standard terms
- **Standard Investment Products**: Mutual funds, structured deposits within parameters

#### Evergreen Override Conditions:
- **Parameter Deviation**: Any deviation from pre-approved parameters
- **New Risk Introduction**: Introduction of any new risk factors
- **Regulatory Change**: Changes in regulatory treatment
- **System Modification**: Requirements for system changes
- **Legal Documentation**: Need for new or modified legal agreements

### 5.2 Bundling Classification
**Combinations of existing products offered as integrated solutions.**

#### Bundling Criteria:
- **Existing Components**: All components are existing approved products
- **No New Risks**: Combination does not introduce new risk interactions
- **Integrated Delivery**: Products delivered as coordinated solution
- **Enhanced Value**: Combination provides additional customer value

#### Bundling Types:
- **Product Bundling**: Multiple products offered together
- **Service Bundling**: Product with additional services
- **Channel Bundling**: Same product through multiple channels
- **Geographic Bundling**: Same product across multiple locations

#### Bundling Assessment Framework:
- **Individual Product Risk**: Each component evaluated separately
- **Interaction Risk**: Risk of combination evaluated
- **Operational Complexity**: Delivery complexity assessed
- **Legal Structure**: Integrated legal framework evaluated

---

## 6. CROSS-BORDER CLASSIFICATION CONSIDERATIONS

### 6.1 Multi-Jurisdictional Products
**Products that span multiple jurisdictions require special classification consideration.**

#### Additional Classification Criteria:
- **Regulatory Harmonization**: Level of regulatory alignment across jurisdictions
- **Legal Entity Structure**: Complexity of multi-entity delivery
- **Cross-Border Risks**: Currency, regulatory, and operational risks
- **Local Adaptation**: Degree of local customization required

#### Multi-Jurisdictional Decision Matrix:

| Jurisdiction Similarity | Regulatory Alignment | Base Classification | Final Classification |
|------------------------|---------------------|-------------------|---------------------|
| **High** | **High** | Any | Maintain Base |
| **High** | **Medium** | NTG/Variation | Upgrade One Level |
| **Medium** | **High** | Any | Add Cross-Border Flag |
| **Medium** | **Medium** | Any | Upgrade One Level |
| **Low** | **Any** | Any | Upgrade to NTG |

### 6.2 Local vs. Global Products

#### Local Product Characteristics:
- Single jurisdiction implementation
- Local regulatory compliance only
- Single legal entity involvement
- Local customer base
- Local currency denomination

#### Global Product Characteristics:
- Multi-jurisdiction implementation
- Multiple regulatory frameworks
- Multiple legal entities involved
- International customer base
- Multi-currency capabilities

---

## 7. EDGE CASES AND SPECIAL SITUATIONS

### 7.1 Classification Edge Cases

#### Scenario 1: Technology Platform Migration
**Existing product moved to new technology platform**

Classification Logic:
- **Same Functionality** → Existing (NPA Lite)
- **Enhanced Functionality** → Variation (Full NPA or NPA Lite)
- **New Functionality** → New-to-Group (Full NPA)

#### Scenario 2: Regulatory Environment Change
**Existing product affected by new regulations**

Classification Logic:
- **Compliance Updates Only** → Existing (NPA Lite)
- **Operational Changes Required** → Variation (Full NPA or NPA Lite)
- **Fundamental Changes Required** → New-to-Group (Full NPA)

#### Scenario 3: Customer Segment Migration
**Existing product offered to new customer segments**

Classification Logic:
- **Similar Risk Profile** → Existing (NPA Lite)
- **Different Risk Profile** → Variation (Full NPA or NPA Lite)
- **Entirely New Segment** → New-to-Group (Full NPA)

#### Scenario 4: Geographic Expansion
**Existing product launched in new geography**

Classification Logic:
- **Same Regulatory Framework** → Existing (NPA Lite)
- **Similar Regulatory Framework** → Variation (NPA Lite)
- **Different Regulatory Framework** → Variation (Full NPA)
- **New Market Entry** → New-to-Group (Full NPA)

### 7.2 Classification Override Procedures

#### Override Triggers:
- **Risk Committee Recommendation**: Material risk concerns identified
- **Regulatory Guidance**: Regulator recommends higher classification
- **Senior Management Decision**: Strategic importance requires enhanced review
- **External Events**: Market conditions or events warrant additional scrutiny

#### Override Process:
1. **Initial Classification**: Standard classification performed
2. **Override Request**: Justification and documentation prepared
3. **Review Committee**: Senior stakeholder review and decision
4. **Final Determination**: Group COO or CEO approval
5. **Process Adjustment**: Modified review process implemented

---

## 8. CLASSIFICATION VALIDATION AND QUALITY ASSURANCE

### 8.1 Classification Validation Framework

#### Validation Stages:
1. **Initial Self-Assessment**: Product manager preliminary classification
2. **Business Unit Review**: Business head validation and approval
3. **Cross-Functional Review**: Risk, compliance, and legal input
4. **Final Classification**: Group product head confirmation
5. **Quality Assurance**: Independent validation by classification team

#### Validation Criteria:
- **Criteria Completeness**: All relevant criteria assessed
- **Documentation Adequacy**: Sufficient evidence provided
- **Logic Consistency**: Classification logic is sound
- **Precedent Alignment**: Consistent with similar products
- **Stakeholder Consensus**: Agreement across key stakeholders

### 8.2 Classification Quality Metrics

#### Performance Indicators:
- **Classification Accuracy**: % of classifications that remain unchanged through approval
- **Classification Consistency**: % of similar products classified consistently
- **Classification Timeliness**: Average time to complete classification
- **Stakeholder Satisfaction**: Feedback on classification process quality

#### Quality Targets:
- **Accuracy Rate**: >95%
- **Consistency Rate**: >90%
- **Classification Time**: <5 business days
- **Satisfaction Score**: >4.5/5.0

### 8.3 Classification Appeals Process

#### Appeals Criteria:
- **New Information**: Material information not considered in original classification
- **Classification Error**: Demonstrable error in classification logic
- **Changed Circumstances**: Material changes in product or environment
- **Precedent Inconsistency**: Inconsistency with similar product classifications

#### Appeals Process:
1. **Appeal Submission**: Formal appeal with supporting documentation
2. **Independent Review**: Review by independent classification committee
3. **Stakeholder Input**: Input from all relevant stakeholders
4. **Final Decision**: Group COO determination
5. **Process Update**: Updates to classification framework if needed

---

## 9. CLASSIFICATION AUTOMATION AND AI SUPPORT

### 9.1 AI-Assisted Classification

#### Machine Learning Models:
- **Classification Prediction**: AI model predicts classification based on product characteristics
- **Criteria Scoring**: Automated scoring of classification criteria
- **Similar Product Identification**: AI identifies similar previously classified products
- **Risk Flag Detection**: AI identifies potential classification edge cases

#### Model Performance:
- **Prediction Accuracy**: >85% accuracy in classification prediction
- **Criteria Scoring**: >90% accuracy in criteria assessment
- **Similar Product Matching**: >80% accuracy in identifying similar products
- **Risk Detection**: >95% sensitivity in edge case identification

### 9.2 Automated Classification Workflow

#### Workflow Stages:
1. **Data Input**: Product characteristics entered into system
2. **AI Assessment**: Machine learning models provide classification recommendation
3. **Criteria Validation**: Automated validation of classification criteria
4. **Similar Product Analysis**: System identifies similar classified products
5. **Human Validation**: Product manager reviews and confirms classification
6. **Stakeholder Review**: Key stakeholders validate final classification

#### Automation Benefits:
- **Speed**: Reduced classification time by 60%
- **Consistency**: Improved classification consistency by 40%
- **Accuracy**: Enhanced classification accuracy by 25%
- **Documentation**: Automated documentation and audit trail

---

## 10. CONTINUOUS IMPROVEMENT AND FRAMEWORK EVOLUTION

### 10.1 Framework Maintenance

#### Regular Review Cycle:
- **Monthly**: Classification statistics and trend analysis
- **Quarterly**: Framework effectiveness assessment
- **Semi-Annually**: Stakeholder feedback incorporation
- **Annually**: Comprehensive framework review and update

#### Update Triggers:
- **Regulatory Changes**: New regulations affecting classification
- **Business Evolution**: Changes in MBS business model or strategy
- **Market Development**: New market conditions or product types
- **Technology Advancement**: New technology capabilities affecting products

### 10.2 Learning and Development

#### Training Program:
- **New Staff Orientation**: Classification framework introduction
- **Regular Updates**: Training on framework changes and updates
- **Best Practices**: Sharing of classification best practices and lessons learned
- **Case Study Analysis**: Review of complex classification scenarios

#### Knowledge Management:
- **Classification Database**: Repository of all classification decisions and rationale
- **Best Practices Library**: Collection of successful classification approaches
- **Lessons Learned**: Documentation of classification challenges and solutions
- **Expert Network**: Community of classification experts and practitioners

---

## APPENDIX: CLASSIFICATION QUICK REFERENCE

### A.1 Classification Decision Tree (Simplified)

```
START: New Product/Service to Classify
│
├── Never offered by MBS before?
│   ├── YES → Check NTG Criteria (20 indicators)
│   │   ├── Score ≥10 → NEW-TO-GROUP
│   │   └── Score <10 → VARIATION
│   │
│   └── NO → Previously offered by MBS?
│       ├── YES → Check Material Changes
│       │   ├── Material → VARIATION (Full NPA)
│       │   ├── Minor → VARIATION (NPA Lite)
│       │   └── None → EXISTING
│       │
│       └── UNCLEAR → Detailed Analysis Required
```

### A.2 Classification Summary Table

| Classification | Key Characteristics | Process | Timeline | PAC | PIR |
|----------------|-------------------|---------|----------|-----|-----|
| **NTG** | New to MBS Group, >10 criteria | Full NPA | 12-16 weeks | ✅ | ✅ |
| **Variation (Material)** | Material changes, 3+ criteria | Full NPA | 8-12 weeks | ❌ | ❌ |
| **Variation (Minor)** | Minor changes, <3 criteria | NPA Lite | 4-6 weeks | ❌ | ❌ |
| **Existing** | Minimal changes, existing framework | NPA Lite/Bundle | 2-6 weeks | ❌ | ❌ |
| **Evergreen** | Standard parameters, no deviations | Evergreen | 1-3 weeks | ❌ | ❌ |

### A.3 Classification Checklist

#### Pre-Classification Preparation:
```
□ Product specifications documented
□ Market analysis completed
□ Risk assessment initiated
□ Regulatory landscape assessed
□ Similar products identified
□ Stakeholders engaged
□ Timeline requirements understood
```

#### Classification Assessment:
```
□ All 20 NTG criteria evaluated
□ Material variation criteria assessed
□ Cross-border implications considered
□ Technology requirements understood
□ Legal implications assessed
□ Operational impact evaluated
□ Financial implications analyzed
```

#### Post-Classification Actions:
```
□ Classification documented and justified
□ Process type determined
□ Timeline communicated
□ Resources allocated
□ Stakeholders notified
□ Next steps planned
□ Quality assurance completed
```

---

**Document Control:**
- **Version**: 1.0
- **Effective Date**: February 2026
- **Review Frequency**: Quarterly
- **Next Review**: May 2026
- **Document Owner**: NPA Program Office
- **Approval**: Group COO

---

*This comprehensive classification framework provides clear, consistent, and accurate classification guidance for all MBS product and service offerings while supporting strategic business objectives and regulatory compliance.*