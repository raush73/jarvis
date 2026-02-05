"use client";

import { useState } from "react";

const STATES = ["KY", "TX", "LA", "IN", "OH"];
const TRADES = ["Millwright", "Pipefitter", "Welder", "Electrician"];

export default function LaborCostCalculator() {
  const [state, setState] = useState("");
  const [trade, setTrade] = useState("");
  const [basePay, setBasePay] = useState<number | "">("");
  const [customMultiplier, setCustomMultiplier] = useState<number | "">(1.45);
  const [flatAdd, setFlatAdd] = useState<number | "">(7.5);

  const basePayNum = typeof basePay === "number" ? basePay : 0;

  // Internal Labor Cost calculations (REG/OT/DT)
  const internalREG = basePayNum;
  const internalOT = basePayNum * 1.5;
  const internalDT = basePayNum * 2.0;

  // Quick Markup Scenarios
  const markup150 = {
    REG: internalREG * 1.5,
    OT: internalOT * 1.5,
    DT: internalDT * 1.5,
  };
  const markup155 = {
    REG: internalREG * 1.55,
    OT: internalOT * 1.55,
    DT: internalDT * 1.55,
  };

  // Custom Scenarios
  const customMult = typeof customMultiplier === "number" ? customMultiplier : 0;
  const customMultScenario = {
    REG: internalREG * customMult,
    OT: internalOT * customMult,
    DT: internalDT * customMult,
  };

  const flatAddNum = typeof flatAdd === "number" ? flatAdd : 0;
  const flatAddREG = internalREG + flatAddNum;
  const flatAddScenario = {
    REG: flatAddREG,
    OT: flatAddREG * 1.5,
    DT: flatAddREG * 2.0,
  };

  const formatCurrency = (val: number) => `$${val.toFixed(2)}`;

  return (
    <div className="calculator-container">
      {/* Guardrail */}
      <div className="guardrail">
        Internal conversation support only. Not a quote. Final pricing requires a Quote.
      </div>

      {/* Inputs Section */}
      <div className="input-section">
        <h2 className="section-title">Inputs</h2>
        <div className="input-grid">
          <div className="input-group">
            <label className="input-label">State</label>
            <select
              className="input-select"
              value={state}
              onChange={(e) => setState(e.target.value)}
            >
              <option value="">Select State</option>
              {STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Trade</label>
            <select
              className="input-select"
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
            >
              <option value="">Select Trade</option>
              {TRADES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Base Pay $/hr</label>
            <input
              type="number"
              className="input-number"
              placeholder="0.00"
              min={0}
              step={0.01}
              value={basePay}
              onChange={(e) => setBasePay(e.target.value ? parseFloat(e.target.value) : "")}
            />
          </div>
        </div>
      </div>

      {/* Section 1: Base Internal Cost */}
      <div className="output-section">
        <h2 className="section-title">1. Base Internal Cost (per hour)</h2>
        <p className="assumptions">Assumptions: OT = 1.5× base, DT = 2.0× base</p>
        <div className="rate-row">
          <div className="rate-card">
            <span className="rate-label">REG</span>
            <span className="rate-value">{formatCurrency(internalREG)}</span>
          </div>
          <div className="rate-card">
            <span className="rate-label">OT</span>
            <span className="rate-value">{formatCurrency(internalOT)}</span>
          </div>
          <div className="rate-card">
            <span className="rate-label">DT</span>
            <span className="rate-value">{formatCurrency(internalDT)}</span>
          </div>
        </div>
      </div>

      {/* Section 2: Quick Markup Scenarios */}
      <div className="output-section">
        <h2 className="section-title">2. Quick Markup Scenarios</h2>
        
        <div className="scenario-block">
          <h3 className="scenario-label">1.50× Markup</h3>
          <div className="rate-row">
            <div className="rate-card">
              <span className="rate-label">REG</span>
              <span className="rate-value">{formatCurrency(markup150.REG)}</span>
            </div>
            <div className="rate-card">
              <span className="rate-label">OT</span>
              <span className="rate-value">{formatCurrency(markup150.OT)}</span>
            </div>
            <div className="rate-card">
              <span className="rate-label">DT</span>
              <span className="rate-value">{formatCurrency(markup150.DT)}</span>
            </div>
          </div>
        </div>

        <div className="scenario-block">
          <h3 className="scenario-label">1.55× Markup</h3>
          <div className="rate-row">
            <div className="rate-card">
              <span className="rate-label">REG</span>
              <span className="rate-value">{formatCurrency(markup155.REG)}</span>
            </div>
            <div className="rate-card">
              <span className="rate-label">OT</span>
              <span className="rate-value">{formatCurrency(markup155.OT)}</span>
            </div>
            <div className="rate-card">
              <span className="rate-label">DT</span>
              <span className="rate-value">{formatCurrency(markup155.DT)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Custom Scenarios */}
      <div className="output-section">
        <h2 className="section-title">3. Custom Scenarios</h2>

        {/* Custom Multiplier */}
        <div className="scenario-block">
          <div className="custom-input-row">
            <label className="custom-label">Custom Multiplier:</label>
            <input
              type="number"
              className="custom-input"
              min={0}
              step={0.01}
              value={customMultiplier}
              onChange={(e) => setCustomMultiplier(e.target.value ? parseFloat(e.target.value) : "")}
            />
            <span className="custom-suffix">×</span>
          </div>
          <div className="rate-row">
            <div className="rate-card">
              <span className="rate-label">REG</span>
              <span className="rate-value">{formatCurrency(customMultScenario.REG)}</span>
            </div>
            <div className="rate-card">
              <span className="rate-label">OT</span>
              <span className="rate-value">{formatCurrency(customMultScenario.OT)}</span>
            </div>
            <div className="rate-card">
              <span className="rate-label">DT</span>
              <span className="rate-value">{formatCurrency(customMultScenario.DT)}</span>
            </div>
          </div>
        </div>

        {/* Flat Add */}
        <div className="scenario-block">
          <div className="custom-input-row">
            <label className="custom-label">Flat Add to REG:</label>
            <span className="custom-prefix">$</span>
            <input
              type="number"
              className="custom-input"
              min={0}
              step={0.01}
              value={flatAdd}
              onChange={(e) => setFlatAdd(e.target.value ? parseFloat(e.target.value) : "")}
            />
            <span className="custom-suffix">/hr</span>
          </div>
          <p className="flat-add-note">OT/DT derived from adjusted REG × 1.5/2.0</p>
          <div className="rate-row">
            <div className="rate-card">
              <span className="rate-label">REG</span>
              <span className="rate-value">{formatCurrency(flatAddScenario.REG)}</span>
            </div>
            <div className="rate-card">
              <span className="rate-label">OT</span>
              <span className="rate-value">{formatCurrency(flatAddScenario.OT)}</span>
            </div>
            <div className="rate-card">
              <span className="rate-label">DT</span>
              <span className="rate-value">{formatCurrency(flatAddScenario.DT)}</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .calculator-container {
          max-width: 720px;
          margin: 0 auto;
        }

        .guardrail {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 13px;
          color: #f59e0b;
          text-align: center;
          margin-bottom: 24px;
        }

        .input-section,
        .output-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          margin: 0 0 16px;
          letter-spacing: -0.2px;
        }

        .assumptions {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.5);
          margin: -8px 0 16px;
        }

        .input-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          font-weight: 500;
        }

        .input-select,
        .input-number {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 10px 12px;
          font-size: 14px;
          color: #fff;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .input-select:focus,
        .input-number:focus {
          border-color: rgba(59, 130, 246, 0.5);
        }

        .input-select option {
          background: #1a1d24;
          color: #fff;
        }

        .rate-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .rate-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .rate-label {
          font-size: 11px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .rate-value {
          font-size: 20px;
          font-weight: 600;
          color: #fff;
          font-variant-numeric: tabular-nums;
        }

        .scenario-block {
          margin-bottom: 20px;
        }

        .scenario-block:last-child {
          margin-bottom: 0;
        }

        .scenario-label {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.7);
          margin: 0 0 12px;
        }

        .custom-input-row {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .custom-label {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
        }

        .custom-input {
          width: 80px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 8px 10px;
          font-size: 14px;
          color: #fff;
          outline: none;
          transition: border-color 0.15s ease;
        }

        .custom-input:focus {
          border-color: rgba(59, 130, 246, 0.5);
        }

        .custom-prefix,
        .custom-suffix {
          font-size: 13px;
          color: rgba(255, 255, 255, 0.5);
        }

        .flat-add-note {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.4);
          margin: -4px 0 12px;
        }

        @media (max-width: 640px) {
          .input-grid {
            grid-template-columns: 1fr;
          }
          .rate-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
