// Options page — lets user configure CrossTrade API settings.
// Config (secret key + account name) stored in chrome.storage.sync.

import type { CrossTradeConfig } from './types';
import { getConfig, saveConfig, testConnection } from './crosstrade';

// ==================== DOM refs ====================

const secretKeyInput = document.getElementById('secretKey') as HTMLInputElement;
const accountNameInput = document.getElementById('accountName') as HTMLInputElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const saveBtn = document.getElementById('save-btn') as HTMLButtonElement;
const testBtn = document.getElementById('test-btn') as HTMLButtonElement;

// ==================== Collect form data ====================

function collectForm(): CrossTradeConfig {
  return {
    secretKey: secretKeyInput.value.trim(),
    accountName: accountNameInput.value.trim(),
  };
}

function fillForm(config: CrossTradeConfig): void {
  secretKeyInput.value = config.secretKey;
  accountNameInput.value = config.accountName;
}

// ==================== Status display ====================

function showStatus(type: 'success' | 'error' | 'loading', message: string): void {
  statusEl.className = `status ${type}`;
  statusEl.textContent = message;
}

function hideStatus(): void {
  statusEl.className = 'status';
  statusEl.textContent = '';
}

// ==================== Load saved config ====================

async function loadSaved(): Promise<void> {
  const config = await getConfig();
  if (config) fillForm(config);
}

// ==================== Save ====================

saveBtn.addEventListener('click', async () => {
  const config = collectForm();
  if (!config.secretKey) {
    showStatus('error', 'Secret Key is required');
    return;
  }
  if (!config.accountName) {
    showStatus('error', 'Account Name is required');
    return;
  }
  await saveConfig(config);
  showStatus('success', 'Saved!');
  setTimeout(hideStatus, 2000);
});

// ==================== Test Connection ====================

testBtn.addEventListener('click', async () => {
  const config = collectForm();
  if (!config.secretKey || !config.accountName) {
    showStatus('error', 'Please fill in both Secret Key and Account Name');
    return;
  }

  showStatus('loading', 'Connecting...');
  testBtn.disabled = true;

  const result = await testConnection(config);

  testBtn.disabled = false;

  if (result.ok) {
    showStatus('success', 'Connection successful!');
  } else {
    showStatus('error', `Connection failed: ${result.error}`);
  }
});

// ==================== Init ====================

loadSaved();
