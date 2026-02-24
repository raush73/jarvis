export interface AdminSettingsData {
  defaultRate: number;
  bankLagDays: number;
  postingGraceDays: number;
  payoutTiersJson: string;
  invoiceFooterText: string;
}

export function renderAdminSettingsView(data: AdminSettingsData): string {
  const escapedData = {
    defaultRate: data.defaultRate,
    bankLagDays: data.bankLagDays,
    postingGraceDays: data.postingGraceDays,
    payoutTiersJson: escapeHtml(data.payoutTiersJson),
    invoiceFooterText: escapeHtml(data.invoiceFooterText),
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>System Settings - Admin</title>
  <style>
    :root {
      --color-primary: #1e40af;
      --color-primary-light: #dbeafe;
      --color-primary-dark: #1e3a8a;
      --color-text: #1f2937;
      --color-text-muted: #6b7280;
      --color-border: #e5e7eb;
      --color-bg: #f3f4f6;
      --color-white: #ffffff;
      --color-success-bg: #d1fae5;
      --color-success-border: #10b981;
      --color-success-text: #065f46;
      --color-danger-bg: #fee2e2;
      --color-danger-border: #ef4444;
      --color-danger-text: #991b1b;
      --font-mono: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', Consolas, monospace;
      --radius-sm: 4px;
      --radius-md: 8px;
      --radius-lg: 12px;
      --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
      --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: var(--color-bg);
      min-height: 100vh;
      color: var(--color-text);
      line-height: 1.6;
      padding: 1rem;
    }

    @media (min-width: 640px) {
      body { padding: 2rem; }
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    .page-header {
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      color: var(--color-white);
      padding: 1.5rem 2rem;
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .page-header svg {
      width: 1.5rem;
      height: 1.5rem;
      opacity: 0.9;
    }

    .page-header h1 {
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: -0.01em;
    }

    .content-card {
      background: var(--color-white);
      border-radius: 0 0 var(--radius-lg) var(--radius-lg);
      box-shadow: var(--shadow-md);
      padding: 2rem;
    }

    .section {
      margin-bottom: 2rem;
    }

    .section:last-child {
      margin-bottom: 0;
    }

    .section-title {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--color-text-muted);
      font-weight: 600;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--color-primary-light);
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-text);
      margin-bottom: 0.375rem;
    }

    .form-hint {
      font-size: 0.75rem;
      color: var(--color-text-muted);
      margin-bottom: 0.375rem;
    }

    .form-input {
      width: 100%;
      padding: 0.625rem 0.875rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-sm);
      font-family: inherit;
      font-size: 0.9375rem;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-primary-light);
    }

    .form-input.error {
      border-color: var(--color-danger-border);
    }

    .form-input[type="number"] {
      font-family: var(--font-mono);
    }

    .form-textarea {
      min-height: 80px;
      resize: vertical;
    }

    .form-textarea.json-editor {
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      min-height: 160px;
      line-height: 1.5;
    }

    .field-error {
      color: var(--color-danger-text);
      font-size: 0.8125rem;
      margin-top: 0.375rem;
      display: none;
    }

    .field-error.show {
      display: block;
    }

    .btn-row {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--color-border);
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: var(--radius-sm);
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
      color: var(--color-white);
    }

    .btn-primary:hover:not(:disabled) {
      background: linear-gradient(135deg, var(--color-primary-dark) 0%, #172554 100%);
    }

    .btn svg {
      width: 1rem;
      height: 1rem;
    }

    .result-banner {
      padding: 1rem 1.25rem;
      border-radius: var(--radius-md);
      margin-bottom: 1.5rem;
      display: none;
      font-size: 0.9375rem;
      font-weight: 500;
    }

    .result-banner.success {
      background-color: var(--color-success-bg);
      border: 1px solid var(--color-success-border);
      color: var(--color-success-text);
    }

    .result-banner.error {
      background-color: var(--color-danger-bg);
      border: 1px solid var(--color-danger-border);
      color: var(--color-danger-text);
    }

    .result-banner.show {
      display: block;
    }

    .access-denied {
      text-align: center;
      padding: 3rem 2rem;
    }

    .access-denied-icon {
      width: 3rem;
      height: 3rem;
      margin: 0 auto 1rem;
      color: var(--color-danger-border);
    }

    .access-denied-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-danger-text);
      margin-bottom: 0.5rem;
    }

    .access-denied-hint {
      color: var(--color-text-muted);
      font-size: 0.9375rem;
    }

    .spinner {
      display: none;
      width: 1rem;
      height: 1rem;
      border: 2px solid transparent;
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .spinner.show {
      display: inline-block;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="page-header">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
      <h1>System Settings</h1>
    </header>

    <div class="content-card">
      <div class="result-banner" id="resultBanner"></div>

      <form id="settingsForm" autocomplete="off">
        <!-- Commission Settings Section -->
        <div class="section">
          <div class="section-title">Commission Settings</div>

          <div class="form-group">
            <label class="form-label" for="defaultRate">Default Commission Rate</label>
            <div class="form-hint">finance.commission.defaultRate — Value between 0 and 1 (e.g., 0.10 = 10%)</div>
            <input
              type="number"
              id="defaultRate"
              name="defaultRate"
              class="form-input"
              step="0.01"
              min="0"
              max="1"
              value="${escapedData.defaultRate}"
            />
            <div class="field-error" id="defaultRateError"></div>
          </div>

          <div class="form-group">
            <label class="form-label" for="bankLagDays">Bank Lag Days</label>
            <div class="form-hint">finance.commission.bankLagDays — Non-negative integer</div>
            <input
              type="number"
              id="bankLagDays"
              name="bankLagDays"
              class="form-input"
              step="1"
              min="0"
              value="${escapedData.bankLagDays}"
            />
            <div class="field-error" id="bankLagDaysError"></div>
          </div>

          <div class="form-group">
            <label class="form-label" for="postingGraceDays">Posting Grace Days</label>
            <div class="form-hint">finance.commission.postingGraceDays — Non-negative integer</div>
            <input
              type="number"
              id="postingGraceDays"
              name="postingGraceDays"
              class="form-input"
              step="1"
              min="0"
              value="${escapedData.postingGraceDays}"
            />
            <div class="field-error" id="postingGraceDaysError"></div>
          </div>

          <div class="form-group">
            <label class="form-label" for="payoutTiersJson">Payout Tiers (JSON)</label>
            <div class="form-hint">finance.commission.payoutTiersJson — Array of { minDays: number, maxDays: number|null, multiplier: number 0–1 }</div>
            <textarea
              id="payoutTiersJson"
              name="payoutTiersJson"
              class="form-input form-textarea json-editor"
            >${escapedData.payoutTiersJson}</textarea>
            <div class="field-error" id="payoutTiersJsonError"></div>
          </div>
        </div>

        <!-- Invoice Settings Section -->
        <div class="section">
          <div class="section-title">Invoice Settings</div>

          <div class="form-group">
            <label class="form-label" for="invoiceFooterText">Invoice Footer Text</label>
            <div class="form-hint">invoice.footerText — Displayed on customer invoices (remittance & terms)</div>
            <textarea
              id="invoiceFooterText"
              name="invoiceFooterText"
              class="form-input form-textarea"
            >${escapedData.invoiceFooterText}</textarea>
            <div class="field-error" id="invoiceFooterTextError"></div>
          </div>
        </div>

        <div class="btn-row">
          <button type="submit" class="btn btn-primary" id="saveBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span id="saveBtnText">Save Settings</span>
            <span class="spinner" id="saveSpinner"></span>
          </button>
        </div>
      </form>
    </div>
  </div>

  <script>
    (function() {
      const form = document.getElementById('settingsForm');
      const saveBtn = document.getElementById('saveBtn');
      const saveBtnText = document.getElementById('saveBtnText');
      const saveSpinner = document.getElementById('saveSpinner');
      const resultBanner = document.getElementById('resultBanner');

      // Clear all field errors
      function clearErrors() {
        document.querySelectorAll('.field-error').forEach(el => {
          el.textContent = '';
          el.classList.remove('show');
        });
        document.querySelectorAll('.form-input').forEach(el => {
          el.classList.remove('error');
        });
      }

      // Show field error
      function showFieldError(field, message) {
        const input = document.getElementById(field);
        const errorEl = document.getElementById(field + 'Error');
        if (input) input.classList.add('error');
        if (errorEl) {
          errorEl.textContent = message;
          errorEl.classList.add('show');
        }
      }

      // Show result banner
      function showBanner(type, message) {
        resultBanner.className = 'result-banner ' + type + ' show';
        resultBanner.textContent = message;
      }

      // Hide result banner
      function hideBanner() {
        resultBanner.className = 'result-banner';
      }

      form.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearErrors();
        hideBanner();

        // Disable button and show spinner
        saveBtn.disabled = true;
        saveBtnText.textContent = 'Saving...';
        saveSpinner.classList.add('show');

        const payload = {
          defaultRate: parseFloat(document.getElementById('defaultRate').value),
          bankLagDays: parseInt(document.getElementById('bankLagDays').value, 10),
          postingGraceDays: parseInt(document.getElementById('postingGraceDays').value, 10),
          payoutTiersJson: document.getElementById('payoutTiersJson').value,
          invoiceFooterText: document.getElementById('invoiceFooterText').value,
        };

        try {
          const response = await fetch('/admin/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

          const result = await response.json();

          if (result.ok) {
            showBanner('success', result.message || 'Settings saved successfully');
          } else {
            showBanner('error', result.message || 'Failed to save settings');
            if (result.errors && Array.isArray(result.errors)) {
              result.errors.forEach(err => {
                showFieldError(err.field, err.message);
              });
            }
          }
        } catch (err) {
          showBanner('error', 'Network error. Please try again.');
        } finally {
          saveBtn.disabled = false;
          saveBtnText.textContent = 'Save Settings';
          saveSpinner.classList.remove('show');
        }
      });
    })();
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

