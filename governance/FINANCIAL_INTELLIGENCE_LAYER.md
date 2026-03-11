# JARVIS PRIME — FINANCIAL INTELLIGENCE LAYER

Status: Future Architecture  
Owner: Michael  
Purpose: Defines the reporting and financial intelligence layer that sits above the Jarvis economic engine.

Jarvis Prime 1.0 focuses on building the economic truth engine:
orders, dispatch, burden, timesheets, invoicing, and labor cost.

This document defines the future reporting layer that will analyze those
financial records to provide owner-level intelligence.

These systems are intentionally deferred until after the economic engine
and snapshot system are complete.


--------------------------------------------------
ARCHITECTURAL RULE — IMMUTABLE FINANCIAL SNAPSHOTS
--------------------------------------------------

All financial reporting must read from immutable snapshot records.

Reports must NEVER recompute historical economics using live configuration data.

Reason:

Burden rates, WC rates, SUTA rates, and billing structures change over time.

If reports recompute history using new rates, historical financial data becomes incorrect.

Instead, the system must snapshot economic data at key lifecycle events:

Timesheet Snapshot  
Invoice Snapshot  
Quote Snapshot

Snapshots store the full economic context at that moment.

Example snapshot fields:

jobId  
employeeId  
trade  
regularHours  
overtimeHours  
billRate  
payRate  
burdenRate  
wcRate  
sutaRate  
expectedGrossMargin  
actualLaborCost  
timestamp

Reports must read snapshots only.



--------------------------------------------------
REPORT 1 — MARGIN LEAK REPORT
--------------------------------------------------

Purpose:

Identify where expected gross margin differs from actual gross margin.

Example output:

Customer | Expected GM | Actual GM | Variance

This report identifies financial leakage caused by:

Overtime premium  
Pay rate drift  
Workers compensation mix  
Billing discounts  
SUTA changes  
Burden increases

This allows ownership to quickly identify where profit erosion occurred.



--------------------------------------------------
REPORT 2 — CUSTOMER PROFIT STABILITY REPORT
--------------------------------------------------

Purpose:

Measure how stable or volatile a customer’s profitability is.

Example metrics:

Customer  
Revenue  
Average Gross Margin  
Margin Volatility  
Risk Score

This identifies customers whose projects swing wildly in profitability.

Example insight:

Customer A  
Average GM = 24%  
Volatility = 18%

Customer B  
Average GM = 22%  
Volatility = 3%

Customer B is the more stable and predictable revenue source.



--------------------------------------------------
REPORT 3 — TRADE PROFITABILITY REPORT
--------------------------------------------------

Purpose:

Measure margin performance by trade.

Example output:

Trade | Revenue | Gross Margin

Millwright  
Rigger  
Welder  
Electrician

This identifies which trades produce the strongest margins.



--------------------------------------------------
REPORT 4 — JOB ALERT ENGINE
--------------------------------------------------

Purpose:

Automatically flag jobs where profitability deviates from quote expectations.

Example:

Job | Customer | Expected GM | Actual GM | Alert

Tesla Shutdown | Tesla | 30% | 18% | ALERT

This allows management to investigate problems early.



--------------------------------------------------
REPORT 5 — DISPATCH PRESSURE GAUGE
--------------------------------------------------

Purpose:

Predict whether current manpower levels can support booked work.

Metrics:

Total booked labor hours  
Available workforce hours  
Dispatch gap

Example:

Booked Labor Demand = 14,200 hrs  
Available Labor Supply = 11,800 hrs

Dispatch Gap = -2,400 hrs

This warns management that additional recruiting or subcontracting is required.



--------------------------------------------------
REPORT 6 — PROJECT TYPE PROFITABILITY
--------------------------------------------------

Purpose:

Analyze margin by project type.

Example categories:

Shutdown Work  
Maintenance Work  
Emergency Repairs  
Turnaround Projects

Example output:

Project Type | Avg GM

Shutdown | 28%  
Maintenance | 21%  
Emergency | 16%

This helps leadership focus sales strategy on the most profitable project categories.



--------------------------------------------------
SYSTEM POSITION
--------------------------------------------------

This financial intelligence layer will be implemented after:

Timesheet snapshot system  
Invoice snapshot system  
Economic engine completion

These reports will be part of the future module:

Packet 8 — Financial Intelligence


END OF DOCUMENT
