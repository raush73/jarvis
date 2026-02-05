import CustomerTimesheetsHubPage from "@/app/customer/orders/[id]/timesheets/page";
import WipVisibilityPanel from "@/components/WipVisibilityPanel";

export default function InternalTimesheetsHubPage() {
  return (
    <>
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 40px 0' }}>
        <WipVisibilityPanel />
      </div>
      <CustomerTimesheetsHubPage __internal />
    </>
  );
}
