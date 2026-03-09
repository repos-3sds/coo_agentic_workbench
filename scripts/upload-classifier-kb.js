#!/usr/bin/env node

/**
 * Upload Classification KB Documents to Existing Dify Dataset
 * ============================================================
 * Pushes the 3 classification KB files to the existing dataset.
 *
 * Usage:
 *   DIFY_DATASET_API_KEY=dataset-xxxxx node scripts/upload-classifier-kb.js
 *
 * The dataset ID is hardcoded to: TClwFmGuFWMomuxwZpUY1sh4
 * (provided by user — existing dataset in Dify Cloud)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ─── Configuration ──────────────────────────────────────────────────────────

const DIFY_BASE_URL = process.env.DIFY_BASE_URL || 'https://api.dify.ai/v1';
const DIFY_DATASET_API_KEY = process.env.DIFY_DATASET_API_KEY || '';
const TARGET_DATASET_ID = '9fc843f2-8ec6-42dd-a347-f81a33e6a914';

const PROJECT_ROOT = path.resolve(__dirname, '..');

// The 3 classification KB files to upload
const KB_FILES = [
  {
    name: 'KB_Classification_Criteria',
    file: 'Context/Dify_KB_Docs/KB_Classification_Criteria.md',
    description: '28 classification criteria with scoring logic, thresholds, and examples',
  },
  {
    name: 'KB_Prohibited_Items',
    file: 'Context/Dify_KB_Docs/KB_Prohibited_Items.md',
    description: '4-layer prohibited items list — INTERNAL_POLICY, REGULATORY, SANCTIONS, DYNAMIC',
  },
  {
    name: 'KB_Product_Taxonomy',
    file: 'Context/Dify_KB_Docs/KB_Product_Taxonomy.md',
    description: 'Product taxonomy with classification hints, risk matrices, cross-border rules',
  },
];

// ─── HTTP Helper ────────────────────────────────────────────────────────────

function difyRequest(method, endpoint, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, DIFY_BASE_URL);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method,
      headers: {
        'Authorization': `Bearer ${DIFY_DATASET_API_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
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

// ─── Upload Function ────────────────────────────────────────────────────────

async function uploadDocument(datasetId, docName, text) {
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

async function listDocuments(datasetId) {
  const res = await difyRequest('GET', `/v1/datasets/${datasetId}/documents?page=1&limit=100`);
  return res.data.data || [];
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  if (!DIFY_DATASET_API_KEY) {
    console.error('ERROR: DIFY_DATASET_API_KEY environment variable is required.');
    console.error('Get it from: Dify Cloud > Knowledge > API Access (left sidebar)');
    console.error('');
    console.error('Usage:');
    console.error('  DIFY_DATASET_API_KEY=dataset-xxxxx node scripts/upload-classifier-kb.js');
    process.exit(1);
  }

  console.log('==============================================');
  console.log('Upload Classification KB Docs to Dify Dataset');
  console.log('==============================================');
  console.log(`Dataset ID: ${TARGET_DATASET_ID}`);
  console.log(`Files to upload: ${KB_FILES.length}`);
  console.log('');

  // First check existing docs in the dataset
  console.log('Checking existing documents in dataset...');
  try {
    const existingDocs = await listDocuments(TARGET_DATASET_ID);
    console.log(`  Found ${existingDocs.length} existing document(s)`);
    existingDocs.forEach(doc => {
      console.log(`    - ${doc.name} (${doc.id}) [${doc.indexing_status}]`);
    });
    console.log('');
  } catch (err) {
    console.error('Failed to list existing documents:', err.error || err.message || err);
    console.error('Check that the dataset ID and API key are correct.');
    process.exit(1);
  }

  // Upload each KB file
  const results = [];
  for (const kb of KB_FILES) {
    const filePath = path.join(PROJECT_ROOT, kb.file);

    if (!fs.existsSync(filePath)) {
      console.error(`  SKIP ${kb.name} — file not found: ${kb.file}`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const sizeKB = (content.length / 1024).toFixed(1);
    console.log(`Uploading: ${kb.name}`);
    console.log(`  Source: ${kb.file} (${sizeKB} KB)`);

    try {
      const res = await uploadDocument(TARGET_DATASET_ID, kb.name, content);
      const docInfo = res.document || res;
      console.log(`  OK — Document created. Batch: ${res.batch || 'n/a'}`);
      if (docInfo.id) {
        console.log(`  Document ID: ${docInfo.id}`);
      }
      results.push({ name: kb.name, status: 'uploaded', batch: res.batch });
    } catch (err) {
      console.error(`  FAILED — ${JSON.stringify(err.error || err.message || err)}`);
      results.push({ name: kb.name, status: 'failed', error: err.error || err.message });
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 1000));
    console.log('');
  }

  // Summary
  console.log('══════════════════════════════════════════════');
  console.log('Summary:');
  results.forEach(r => {
    const icon = r.status === 'uploaded' ? '+' : 'X';
    console.log(`  [${icon}] ${r.name} — ${r.status}`);
  });
  console.log('');
  console.log('Next steps:');
  console.log('  1. Wait for indexing to complete in Dify Cloud');
  console.log('  2. Attach this dataset to the CLASSIFIER workflow Knowledge Retrieval node');
  console.log(`  3. Dataset ID to use: ${TARGET_DATASET_ID}`);
  console.log('══════════════════════════════════════════════');
}

main();
