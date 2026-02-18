# Data Mapper Bot (v1)

File-only bot that reads a CSV and generates deterministic mapping artifacts for later DB import.

## Usage

```bash
npm run bot:data-map -- --csv "path/to/file.csv"
```

### CLI Flags

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--csv` | Yes | — | Path to the input CSV file |
| `--company-col` | No | `Company` | Header name for the company column |
| `--owner-col` | No | `Sales Person - Ownership` | Header name for the owner/salesperson column |
| `--out-dir` | No | `reports/data-mapper` | Base directory for output |

## Output

Each run creates a timestamped folder under `--out-dir`:

```
reports/data-mapper/<timestamp>/
  column-inventory.json   # Per-column stats
  mapping.json            # Company→owner deterministic mapping
  companies.unique.csv    # Deduplicated company list
  contacts.cleaned.csv    # Full data with _norm columns appended
  README.md               # Run metadata
```

## Normalization Rules

- Trim leading/trailing whitespace
- Collapse internal whitespace to single space
- `_norm` columns are lowercased versions of the normalized value
- Suffixes like LLC, Inc, etc. are **preserved** (not stripped)
- Fully empty rows are dropped; partial rows are kept

## Verdicts

| Exit Code | Verdict | Condition |
|-----------|---------|-----------|
| 0 | GO | CSV parsed successfully, company column found |
| 1 | NO_GO | CSV missing/unreadable, or company column not in headers |
