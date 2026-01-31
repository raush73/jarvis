export default function AccountingPage() {
  return (
    <div className="stub-container">
      <div className="stub-content">
        <h1>Accounting</h1>
        <p className="stub-description">UI shell placeholder (no logic yet)</p>

        <div className="future-tabs">
          <span className="future-tabs-label">Planned sub-tabs:</span>
          <ul className="future-tabs-list">
            <li>Invoices</li>
            <li>Payroll Processing</li>
            <li>Accounts Receivable</li>
            <li>Accounts Payable</li>
            <li>Financial Reports</li>
          </ul>
        </div>

        <p className="stub-note">
          Note: This page is intentionally a simple server component stub to keep build health green.
        </p>
      </div>
    </div>
  );
}