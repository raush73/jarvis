export type TimesheetApprovalAction = "APPROVE" | "REJECT";

export type TimesheetApprovalItemAction = "REJECT";

export interface TimesheetApprovalExceptionItem {
  hoursEntryId: string; // the worker-week HoursEntry being rejected
  action: TimesheetApprovalItemAction; // currently only REJECT (approve is implicit)
  reason?: string; // optional per-item reason
}

export interface TimesheetApprovalSubmitDto {
  action: TimesheetApprovalAction; // APPROVE = approve all except exceptions; REJECT = reject all
  comment?: string; // overall comment (visible to MW4H)
  exceptions?: TimesheetApprovalExceptionItem[]; // optional line-item rejects
}
