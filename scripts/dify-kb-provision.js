#!/usr/bin/env node

/**
 * Dify Knowledge Base Provisioning Script
 * ========================================
 * Enterprise-grade automation for creating and updating Dify Knowledge Bases.
 *
 * Usage:
 *   node scripts/dify-kb-provision.js --action=provision [--app=CF_NPA_Orchestrator]
 *   node scripts/dify-kb-provision.js --action=status
 *   node scripts/dify-kb-provision.js --action=update --kb=KB_Master_COO_Orchestrator
 *   node scripts/dify-kb-provision.js --action=list
 *   node scripts/dify-kb-provision.js --action=provision-all
 *
 * Environment:
 *   DIFY_DATASET_API_KEY  - Dify Knowledge Base API key (from Dify Cloud > Knowledge > API Access)
 *   DIFY_BASE_URL         - Dify API base URL (default: https://api.dify.ai/v1)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ─── Configuration ──────────────────────────────────────────────────────────

const DIFY_BASE_URL = process.env.DIFY_BASE_URL || 'https://api.dify.ai/v1';
const DIFY_DATASET_API_KEY = process.env.DIFY_DATASET_API_KEY || '';

const PROJECT_ROOT = path.resolve(__dirname, '..');

// ─── KB Registry: Single Source of Truth ────────────────────────────────────
// 18 Knowledge Bases, each mapped to exactly 1 source file

const KB_REGISTRY = {
  // ── Core Policy KBs (5) ──
  KB_NPA_Policies: {
    name: 'KB_NPA_Policies',
    description: 'NPA policies, prohibited products, approval thresholds',
    sourceFile: 'docs/knowledge-base/KB_NPA_Policies.md',
    category: 'core',
  },
  KB_NPA_Approval_Matrix: {
    name: 'KB_NPA_Approval_Matrix',
    description: 'Sign-off routing rules by track (FULL/LITE/BUNDLING/EVERGREEN)',
    sourceFile: 'docs/knowledge-base/KB_NPA_Approval_Matrix.md',
    category: 'core',
  },
  KB_NPA_Classification_Rules: {
    name: 'KB_NPA_Classification_Rules',
    description: '28 classification criteria, scoring methodology, tier thresholds',
    sourceFile: 'docs/knowledge-base/KB_NPA_Classification_Rules.md',
    category: 'core',
  },
  KB_NPA_State_Machine: {
    name: 'KB_NPA_State_Machine',
    description: 'Workflow stages, transitions, gate conditions',
    sourceFile: 'docs/knowledge-base/KB_NPA_State_Machine.md',
    category: 'core',
  },
  KB_NPA_Templates: {
    name: 'KB_NPA_Templates',
    description: '47-field template structure, section definitions',
    sourceFile: 'docs/knowledge-base/KB_NPA_Templates.md',
    category: 'core',
  },

  // ── Agent KB Files (13) ──
  KB_Master_COO_Orchestrator: {
    name: 'KB_Master_COO_Orchestrator',
    description: 'Master COO + NPA Orchestrator operating guide — routing logic, intent classification, envelope contract',
    sourceFile: 'Context/Dify_Agent_KBs/KB_Master_COO_Orchestrator.md',
    category: 'agent',
  },
  KB_Domain_Orchestrator_NPA: {
    name: 'KB_Domain_Orchestrator_NPA',
    description: 'NPA domain orchestration — lifecycle, classification logic, approval workflows, risk cascade',
    sourceFile: 'Context/Dify_Agent_KBs/KB_Domain_Orchestrator_NPA.md',
    category: 'agent',
  },
  KB_Ideation_Agent: {
    name: 'KB_Ideation_Agent',
    description: 'Ideation discovery patterns — product concept Q&A, NPA creation flow',
    sourceFile: 'Context/Dify_Agent_KBs/KB_Ideation_Agent.md',
    category: 'agent',
  },
  KB_Classification_Agent: {
    name: 'KB_Classification_Agent',
    description: 'Classification criteria interpretation — 20 NTG indicators, scoring, track assignment',
    sourceFile: 'Context/Dify_Agent_KBs/KB_Classification_Agent.md',
    category: 'agent',
  },

  // ── Classifier Workflow KBs (3) — uploaded to dataset TClwFmGuFWMomuxwZpUY1sh4 ──
  KB_Classification_Criteria: {
    name: 'KB_Classification_Criteria',
    description: '28 classification criteria with scoring logic, thresholds, and trigger examples',
    sourceFile: 'Context/Dify_KB_Docs/KB_Classification_Criteria.md',
    category: 'classifier',
  },
  KB_Prohibited_Items: {
    name: 'KB_Prohibited_Items',
    description: '4-layer prohibited items list — INTERNAL_POLICY, REGULATORY, SANCTIONS, DYNAMIC',
    sourceFile: 'Context/Dify_KB_Docs/KB_Prohibited_Items.md',
    category: 'classifier',
  },
  KB_Product_Taxonomy: {
    name: 'KB_Product_Taxonomy',
    description: 'Product taxonomy with classification hints, risk matrices, cross-border rules',
    sourceFile: 'Context/Dify_KB_Docs/KB_Product_Taxonomy.md',
    category: 'classifier',
  },
  KB_Template_Autofill_Agent: {
    name: 'KB_Template_Autofill_Agent',
    description: 'Template autofill lineage rules — AUTO/ADAPTED/MANUAL field tracking',
    sourceFile: 'Context/Dify_Agent_KBs/KB_Template_Autofill_Agent.md',
    category: 'agent',
  },
  KB_ML_Prediction: {
    name: 'KB_ML_Prediction',
    description: 'ML prediction feature engineering — approval likelihood, timeline, bottleneck',
    sourceFile: 'Context/Dify_Agent_KBs/KB_ML_Prediction.md',
    category: 'agent',
  },
  KB_Risk_Agent: {
    name: 'KB_Risk_Agent',
    description: '4-layer risk cascade logic — internal policy, regulatory, sanctions, dynamic risk',
    sourceFile: 'Context/Dify_Agent_KBs/KB_Risk_Agent.md',
    category: 'agent',
  },
  KB_Governance_Agent: {
    name: 'KB_Governance_Agent',
    description: 'Governance sign-off routing decisions — SLA tracking, loop-back circuit breaker',
    sourceFile: 'Context/Dify_Agent_KBs/KB_Governance_Agent.md',
    category: 'agent',
  },
  KB_Conversational_Diligence: {
    name: 'KB_Conversational_Diligence',
    description: 'Conversational diligence Q&A with citations — read-only data queries',
    sourceFile: 'Context/Dify_Agent_KBs/KB_Conversational_Diligence.md',
    category: 'agent',
  },
  KB_Doc_Lifecycle: {
    name: 'KB_Doc_Lifecycle',
    description: 'Document validation rules — completeness checks, expiry tracking',
    sourceFile: 'Context/Dify_Agent_KBs/KB_Doc_Lifecycle.md',
    category: 'agent',
  },
  KB_Monitoring_Agent: {
    name: 'KB_Monitoring_Agent',
    description: 'Post-launch monitoring logic — breach detection, PIR scheduling, conditions tracking',
    sourceFile: 'Context/Dify_Agent_KBs/KB_Monitoring_Agent.md',
    category: 'agent',
  },
  KB_Search_Agent: {
    name: 'KB_Search_Agent',
    description: 'KB search strategies — policy/regulatory document retrieval',
    sourceFile: 'Context/Dify_Agent_KBs/KB_Search_Agent.md',
    category: 'agent',
  },
  KB_Notification_Agent: {
    name: 'KB_Notification_Agent',
    description: 'Notification routing — stakeholder alerts, SLA reminders',
    sourceFile: 'Context/Dify_Agent_KBs/KB_Notification_Agent.md',
    category: 'agent',
  },
};

// ─── Per-App KB Attachment Map ──────────────────────────────────────────────
// Defines which KBs each Dify app needs attached

const APP_KB_MAP = {
  CF_NPA_Orchestrator: [
    'KB_Master_COO_Orchestrator',
    'KB_Domain_Orchestrator_NPA',
    'KB_NPA_Policies',
    'KB_NPA_Classification_Rules',
  ],
  CF_NPA_Ideation: [
    'KB_Ideation_Agent',
    'KB_NPA_Policies',
    'KB_NPA_Templates',
  ],
  CF_NPA_Query_Assistant: Object.keys(KB_REGISTRY), // ALL 18 KBs
  WF_NPA_Classify_Predict: [
    'KB_Classification_Criteria',
    'KB_Prohibited_Items',
    'KB_Product_Taxonomy',
  ],
  WF_NPA_Risk: [],
  WF_NPA_Autofill: [],
  WF_NPA_Governance_Ops: [],
};

// ─── State File (tracks created KB IDs) ─────────────────────────────────────

const STATE_FILE = path.join(__dirname, '.dify-kb-state.json');

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  } catch {
    return { datasets: {}, lastUpdated: null };
  }
}

function saveState(state) {
  state.lastUpdated = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ─── HTTP Helper (native Node.js — no dependencies) ────────────────────────

function difyRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, DIFY_BASE_URL);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Authorization': `Bearer ${DIFY_DATASET_API_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 204) {
          return resolve({ status: 204, data: null });
        }
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject({ status: res.statusCode, error: parsed });
          } else {
            resolve({ status: res.statusCode, data: parsed });
          }
        } catch (e) {
          reject({ status: res.statusCode, error: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ─── Core Operations ────────────────────────────────────────────────────────

async function listExistingDatasets() {
  const results = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const res = await difyRequest('GET', `/v1/datasets?page=${page}&limit=100`);
    results.push(...res.data.data);
    hasMore = res.data.has_more;
    page++;
  }

  return results;
}

async function createDataset(name, description) {
  const res = await difyRequest('POST', '/v1/datasets', {
    name,
    description,
    indexing_technique: 'high_quality',
    permission: 'only_me',
  });
  return res.data;
}

async function listDocuments(datasetId) {
  const res = await difyRequest('GET', `/v1/datasets/${datasetId}/documents?page=1&limit=100`);
  return res.data.data || [];
}

async function createDocumentByText(datasetId, docName, text) {
  const res = await difyRequest('POST', `/v1/datasets/${datasetId}/document/create-by-text`, {
    name: docName,
    text,
    indexing_technique: 'high_quality',
    doc_form: 'text_model',
    doc_language: 'English',
    process_rule: {
      mode: 'custom',
      rules: {
        pre_processing_rules: [
          { id: 'remove_extra_spaces', enabled: true },
          { id: 'remove_urls_emails', enabled: false },
        ],
        segmentation: {
          separator: '---',
          max_tokens: 1000,
        },
      },
    },
  });
  return res.data;
}

async function updateDocumentByText(datasetId, documentId, docName, text) {
  const res = await difyRequest('POST', `/v1/datasets/${datasetId}/documents/${documentId}/update-by-text`, {
    name: docName,
    text,
    process_rule: {
      mode: 'custom',
      rules: {
        pre_processing_rules: [
          { id: 'remove_extra_spaces', enabled: true },
          { id: 'remove_urls_emails', enabled: false },
        ],
        segmentation: {
          separator: '---',
          max_tokens: 1000,
        },
      },
    },
  });
  return res.data;
}

async function checkIndexingStatus(datasetId, batch) {
  const res = await difyRequest('GET', `/v1/datasets/${datasetId}/documents/${batch}/indexing-status`);
  return res.data;
}

// ─── Actions ────────────────────────────────────────────────────────────────

async function actionProvision(appName) {
  const kbKeys = APP_KB_MAP[appName];
  if (!kbKeys) {
    console.error(`Unknown app: ${appName}. Available: ${Object.keys(APP_KB_MAP).join(', ')}`);
    process.exit(1);
  }

  if (kbKeys.length === 0) {
    console.log(`${appName} needs no Knowledge Bases (workflow — uses tools only).`);
    return;
  }

  console.log(`\nProvisioning KBs for ${appName}...`);
  console.log(`KBs needed: ${kbKeys.join(', ')}\n`);

  const state = loadState();
  const existing = await listExistingDatasets();
  const existingMap = {};
  existing.forEach(ds => { existingMap[ds.name] = ds; });

  const results = [];

  for (const kbKey of kbKeys) {
    const kbDef = KB_REGISTRY[kbKey];
    if (!kbDef) {
      console.error(`  KB definition not found: ${kbKey}`);
      continue;
    }

    const filePath = path.join(PROJECT_ROOT, kbDef.sourceFile);
    if (!fs.existsSync(filePath)) {
      console.error(`  Source file not found: ${kbDef.sourceFile}`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    console.log(`  [${kbKey}]`);
    console.log(`    Source: ${kbDef.sourceFile} (${(content.length / 1024).toFixed(1)} KB)`);

    // Check if dataset already exists
    if (existingMap[kbDef.name]) {
      const dataset = existingMap[kbDef.name];
      console.log(`    Dataset exists: ${dataset.id} (${dataset.document_count} docs, ${dataset.word_count} words)`);

      // Check if document needs updating
      const docs = await listDocuments(dataset.id);
      if (docs.length > 0) {
        const doc = docs[0];
        console.log(`    Document exists: ${doc.id} — updating content...`);
        const updateRes = await updateDocumentByText(dataset.id, doc.id, kbDef.name, content);
        console.log(`    Updated. Batch: ${updateRes.batch} — re-indexing...`);
      } else {
        console.log(`    No documents found — creating...`);
        const createRes = await createDocumentByText(dataset.id, kbDef.name, content);
        console.log(`    Created. Batch: ${createRes.batch} — indexing...`);
      }

      state.datasets[kbKey] = {
        datasetId: dataset.id,
        name: kbDef.name,
        sourceFile: kbDef.sourceFile,
        updatedAt: new Date().toISOString(),
      };
      results.push({ kb: kbKey, datasetId: dataset.id, status: 'updated' });
    } else {
      // Create new dataset
      console.log(`    Creating new dataset...`);
      const dataset = await createDataset(kbDef.name, kbDef.description);
      console.log(`    Dataset created: ${dataset.id}`);

      // Upload content
      console.log(`    Uploading content...`);
      const docRes = await createDocumentByText(dataset.id, kbDef.name, content);
      console.log(`    Document created. Batch: ${docRes.batch} — indexing...`);

      state.datasets[kbKey] = {
        datasetId: dataset.id,
        name: kbDef.name,
        sourceFile: kbDef.sourceFile,
        createdAt: new Date().toISOString(),
      };
      results.push({ kb: kbKey, datasetId: dataset.id, status: 'created' });
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  saveState(state);

  console.log('\n── Summary ──────────────────────────────────');
  console.log(`App: ${appName}`);
  results.forEach(r => {
    console.log(`  ${r.status === 'created' ? '+' : '~'} ${r.kb} → ${r.datasetId}`);
  });
  console.log(`\nNow attach these ${results.length} KBs to the "${appName}" Chatflow in Dify Cloud.`);
  console.log('Dataset IDs saved to: .dify-kb-state.json');
}

async function actionProvisionAll() {
  const state = loadState();
  const existing = await listExistingDatasets();
  const existingMap = {};
  existing.forEach(ds => { existingMap[ds.name] = ds; });

  console.log('\nProvisioning ALL 18 Knowledge Bases...\n');

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const [kbKey, kbDef] of Object.entries(KB_REGISTRY)) {
    const filePath = path.join(PROJECT_ROOT, kbDef.sourceFile);
    if (!fs.existsSync(filePath)) {
      console.log(`  SKIP ${kbKey} — file not found: ${kbDef.sourceFile}`);
      skipped++;
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    if (existingMap[kbDef.name]) {
      const dataset = existingMap[kbDef.name];
      const docs = await listDocuments(dataset.id);
      if (docs.length > 0) {
        await updateDocumentByText(dataset.id, docs[0].id, kbDef.name, content);
        console.log(`  ~ ${kbKey} → updated (${dataset.id})`);
      } else {
        await createDocumentByText(dataset.id, kbDef.name, content);
        console.log(`  + ${kbKey} → doc created in existing dataset (${dataset.id})`);
      }
      state.datasets[kbKey] = { datasetId: dataset.id, name: kbDef.name, sourceFile: kbDef.sourceFile, updatedAt: new Date().toISOString() };
      updated++;
    } else {
      const dataset = await createDataset(kbDef.name, kbDef.description);
      await createDocumentByText(dataset.id, kbDef.name, content);
      console.log(`  + ${kbKey} → created (${dataset.id})`);
      state.datasets[kbKey] = { datasetId: dataset.id, name: kbDef.name, sourceFile: kbDef.sourceFile, createdAt: new Date().toISOString() };
      created++;
    }

    await new Promise(r => setTimeout(r, 500));
  }

  saveState(state);

  console.log(`\n── Summary ──────────────────────────────────`);
  console.log(`Created: ${created} | Updated: ${updated} | Skipped: ${skipped}`);
  console.log(`Total: ${Object.keys(state.datasets).length} KBs tracked`);
  console.log('\nState saved to: .dify-kb-state.json');
}

async function actionUpdate(kbKey) {
  const state = loadState();
  const kbDef = KB_REGISTRY[kbKey];

  if (!kbDef) {
    console.error(`Unknown KB: ${kbKey}. Available: ${Object.keys(KB_REGISTRY).join(', ')}`);
    process.exit(1);
  }

  const stateEntry = state.datasets[kbKey];
  if (!stateEntry) {
    console.error(`KB ${kbKey} has not been provisioned yet. Run --action=provision first.`);
    process.exit(1);
  }

  const filePath = path.join(PROJECT_ROOT, kbDef.sourceFile);
  const content = fs.readFileSync(filePath, 'utf-8');

  console.log(`Updating ${kbKey}...`);
  console.log(`  Source: ${kbDef.sourceFile} (${(content.length / 1024).toFixed(1)} KB)`);
  console.log(`  Dataset: ${stateEntry.datasetId}`);

  const docs = await listDocuments(stateEntry.datasetId);
  if (docs.length > 0) {
    const res = await updateDocumentByText(stateEntry.datasetId, docs[0].id, kbDef.name, content);
    console.log(`  Updated. Batch: ${res.batch} — re-indexing...`);
  } else {
    const res = await createDocumentByText(stateEntry.datasetId, kbDef.name, content);
    console.log(`  Created. Batch: ${res.batch} — indexing...`);
  }

  stateEntry.updatedAt = new Date().toISOString();
  saveState(state);
  console.log('Done.');
}

async function actionStatus() {
  console.log('\n── Dify KB Status ──────────────────────────────\n');

  const existing = await listExistingDatasets();
  const state = loadState();

  console.log(`Datasets in Dify Cloud: ${existing.length}`);
  console.log(`Datasets in local state: ${Object.keys(state.datasets).length}\n`);

  // Show per-app attachment map
  for (const [app, kbs] of Object.entries(APP_KB_MAP)) {
    const kbStatuses = kbs.map(kbKey => {
      const stateEntry = state.datasets[kbKey];
      const difyMatch = existing.find(ds => ds.name === kbKey);
      if (difyMatch) {
        return `    [OK] ${kbKey} (${difyMatch.id}) — ${difyMatch.document_count} docs, ${difyMatch.word_count} words`;
      } else if (stateEntry) {
        return `    [??] ${kbKey} (${stateEntry.datasetId}) — in state but not found in Dify`;
      } else {
        return `    [--] ${kbKey} — not provisioned`;
      }
    });

    console.log(`${app} (${kbs.length} KBs):`);
    if (kbs.length === 0) {
      console.log('    (no KBs needed — workflow)');
    } else {
      kbStatuses.forEach(s => console.log(s));
    }
    console.log();
  }
}

async function actionList() {
  const existing = await listExistingDatasets();
  console.log(`\nDify Cloud Datasets (${existing.length}):\n`);
  existing.forEach(ds => {
    console.log(`  ${ds.name}`);
    console.log(`    ID: ${ds.id}`);
    console.log(`    Docs: ${ds.document_count} | Words: ${ds.word_count} | Apps: ${ds.app_count}`);
    console.log(`    Indexing: ${ds.indexing_technique} | Embedding: ${ds.embedding_model || 'default'}`);
    console.log();
  });
}

// ─── CLI Entry Point ────────────────────────────────────────────────────────

async function main() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    const [key, val] = arg.replace(/^--/, '').split('=');
    args[key] = val || true;
  });

  if (!DIFY_DATASET_API_KEY) {
    console.error('ERROR: DIFY_DATASET_API_KEY environment variable is required.');
    console.error('Get it from: Dify Cloud > Knowledge > API Access (left sidebar)');
    process.exit(1);
  }

  const action = args.action;

  try {
    switch (action) {
      case 'provision':
        const appName = args.app;
        if (!appName) {
          console.error('Usage: --action=provision --app=CF_NPA_Orchestrator');
          console.error(`Available apps: ${Object.keys(APP_KB_MAP).join(', ')}`);
          process.exit(1);
        }
        await actionProvision(appName);
        break;

      case 'provision-all':
        await actionProvisionAll();
        break;

      case 'update':
        const kbName = args.kb;
        if (!kbName) {
          console.error('Usage: --action=update --kb=KB_Master_COO_Orchestrator');
          console.error(`Available KBs: ${Object.keys(KB_REGISTRY).join(', ')}`);
          process.exit(1);
        }
        await actionUpdate(kbName);
        break;

      case 'status':
        await actionStatus();
        break;

      case 'list':
        await actionList();
        break;

      default:
        console.log(`
Dify KB Provisioning Tool
=========================

Usage:
  node scripts/dify-kb-provision.js --action=<action> [options]

Actions:
  provision --app=<APP_NAME>   Create/update KBs needed for a specific Dify app
  provision-all                Create/update ALL 18 KBs
  update --kb=<KB_NAME>        Update a single KB with latest file content
  status                       Show provisioning status per app
  list                         List all datasets in Dify Cloud

Apps: ${Object.keys(APP_KB_MAP).join(', ')}
KBs:  ${Object.keys(KB_REGISTRY).join(', ')}

Environment:
  DIFY_DATASET_API_KEY=<key>   Required. Get from Dify Cloud > Knowledge > API Access
  DIFY_BASE_URL=<url>          Optional. Default: https://api.dify.ai/v1
        `);
    }
  } catch (err) {
    console.error('\nAPI Error:', err.error || err.message || err);
    process.exit(1);
  }
}

main();
