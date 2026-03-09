# Prohibited Products & Activities List
# Upload to Dify Knowledge Base: "NPA Classification" dataset

## Overview
This document lists all products and activities that are PROHIBITED and trigger an automatic HARD STOP in the NPA process. Any product matching an item on this list cannot proceed through the NPA pipeline without explicit exemption from the Product Approval Committee (PAC).

---

## Layer 1: INTERNAL_POLICY (Bank Policy Prohibitions)

### POLICY_001: Cryptocurrency / Digital Asset Products
- **Severity**: CRITICAL
- **Description**: Direct cryptocurrency trading, custody, or derivative products referencing crypto assets as underlying
- **Includes**: Bitcoin, Ethereum, altcoins, stablecoins, NFTs, DeFi tokens
- **Exceptions**: Regulated crypto ETFs listed on approved exchanges (requires PAC pre-approval)
- **Jurisdictions**: ALL

### POLICY_002: Binary Options for Retail Clients
- **Severity**: CRITICAL
- **Description**: Binary/digital options offered to retail or HNW clients
- **Includes**: All-or-nothing options, cash-or-nothing options, touch/no-touch options marketed to non-institutional clients
- **Exceptions**: Binary payoffs embedded in structured notes for institutional clients only
- **Jurisdictions**: ALL

### POLICY_003: Products with No Clear Economic Purpose
- **Severity**: HIGH
- **Description**: Products designed primarily for speculation with no hedging, investment, or treasury management utility
- **Includes**: Exotic lottery-style payoffs for retail, leveraged products >20x for non-professional clients
- **Exceptions**: None
- **Jurisdictions**: ALL

### POLICY_004: Weapons and Conflict Minerals Financing
- **Severity**: CRITICAL
- **Description**: Any product that directly or indirectly finances weapons manufacturing, trading, or conflict mineral extraction
- **Includes**: Cluster munitions, anti-personnel mines, nuclear weapons (non-state), biological/chemical weapons
- **Exceptions**: Sovereign defense bonds of approved countries (with ESG committee clearance)
- **Jurisdictions**: ALL

### POLICY_005: Tobacco and Controversial Sectors
- **Severity**: HIGH
- **Description**: Direct lending, underwriting, or structured products linked to tobacco manufacturing
- **Includes**: Tobacco-linked structured notes, tobacco company equity financing
- **Exceptions**: Diversified consumer goods companies where tobacco revenue < 10%
- **Jurisdictions**: ALL

---

## Layer 2: REGULATORY (Regulatory Prohibitions)

### REG_001: Sanctioned Countries
- **Severity**: CRITICAL
- **Description**: Products involving entities or counterparties in comprehensively sanctioned jurisdictions
- **Includes**: North Korea (DPRK), Iran, Syria, Cuba, Crimea/Sevastopol, Donetsk/Luhansk regions
- **Source**: OFAC SDN List, UN Security Council Consolidated List, EU Sanctions List, MAS Sanctions List
- **Exceptions**: Licensed humanitarian transactions (requires Legal + Compliance pre-approval)
- **Jurisdictions**: ALL

### REG_002: Sanctioned Entities (SDN List)
- **Severity**: CRITICAL
- **Description**: Products where any counterparty appears on OFAC Specially Designated Nationals list or equivalent
- **Includes**: Named individuals, companies, vessels, aircraft on sanctions lists
- **Exceptions**: Delisted entities (with compliance verification)
- **Jurisdictions**: ALL

### REG_003: Products Banned by MAS
- **Severity**: CRITICAL
- **Description**: Products explicitly prohibited by the Monetary Authority of Singapore
- **Includes**: Products banned under SFA section 272B, unauthorized collective investment schemes, unlicensed OTC derivatives for retail
- **Exceptions**: None without MAS written approval
- **Jurisdictions**: Singapore (primary), ALL (where Singapore booking entity involved)

### REG_004: Products Banned in Target Jurisdiction
- **Severity**: HIGH
- **Description**: Products that are legal in Singapore but prohibited in the target client's jurisdiction
- **Includes**: Varies by jurisdiction — e.g., CFDs banned in US, certain derivatives restricted in India
- **Exceptions**: If client is professional/institutional and explicitly elects non-home jurisdiction treatment
- **Jurisdictions**: Per target market

---

## Layer 3: SANCTIONS (Real-time Sanctions Screening)

### SANC_001: PEP Exposure
- **Severity**: HIGH
- **Description**: Products where the counterparty or beneficial owner is a Politically Exposed Person
- **Includes**: Current/former heads of state, senior government officials, military leaders, judiciary, state enterprise executives
- **Exceptions**: PEP-approved clients with enhanced due diligence on file (requires MLRO sign-off)
- **Jurisdictions**: ALL

### SANC_002: Adverse Media Flags
- **Severity**: MEDIUM
- **Description**: Counterparty has active adverse media hits related to financial crime, fraud, corruption, or money laundering
- **Includes**: Active investigations, recent convictions, ongoing litigation
- **Exceptions**: Historical adverse media (>5 years, resolved) with MLRO clearance
- **Jurisdictions**: ALL

---

## Layer 4: DYNAMIC (Market/Event-Driven Prohibitions)

### DYN_001: Suspended Asset Classes
- **Severity**: HIGH
- **Description**: Asset classes temporarily suspended from new business due to market conditions
- **Includes**: Varies — e.g., Russian sovereign debt post-2022, certain high-yield products during stress events
- **Exceptions**: Wind-down of existing positions only (no new business)
- **Jurisdictions**: ALL

### DYN_002: Elevated Market Stress
- **Severity**: MEDIUM
- **Description**: Products in asset classes experiencing extreme volatility (VIX > 40 or equivalent)
- **Includes**: New structured products during market stress that could amplify losses
- **Exceptions**: Hedging products for existing exposures, with Head of Desk approval
- **Jurisdictions**: ALL

### DYN_003: Regulatory Change Freeze
- **Severity**: MEDIUM
- **Description**: Temporary freeze on new products in areas where major regulatory changes are pending
- **Includes**: Products affected by upcoming regulation (e.g., pre-Basel IV implementation freeze)
- **Exceptions**: Products with confirmed regulatory treatment post-change
- **Jurisdictions**: Per regulatory jurisdiction

---

## How to Use This List in Classification

1. **Before ANY scoring**, run the product through ALL 4 layers
2. If ANY CRITICAL severity item matches: **HARD STOP — PROHIBITED**
3. If ANY HIGH severity item matches: **FLAG for manual review** (may still proceed with PAC approval)
4. If MEDIUM severity items match: **WARNING in classification output** (proceed with caution)
5. Record all screening results in the classification output's `prohibited_check` field
