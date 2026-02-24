-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "CustomerContactRole" AS ENUM ('PROJECT_MANAGER', 'EXECUTIVE', 'AP', 'SAFETY', 'SITE_SUPERVISOR', 'OTHER');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'NEEDS_TO_BE_FILLED', 'FILLED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('DISPATCHED', 'ON_ASSIGNMENT', 'COMPLETED');

-- CreateEnum
CREATE TYPE "HoursEntryType" AS ENUM ('OFFICIAL', 'REFERENCE');

-- CreateEnum
CREATE TYPE "HoursEnteredBy" AS ENUM ('CUSTOMER', 'MW4H', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "HoursApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OutreachResponseStatus" AS ENUM ('PENDING', 'INTERESTED', 'NOT_INTERESTED', 'EXPIRED', 'INVALIDATED');

-- CreateEnum
CREATE TYPE "InvoiceLineItemType" AS ENUM ('TRADE_SALES', 'TRADE_LABOR', 'BONUS', 'TRAVEL', 'PER_DIEM', 'REIMBURSEMENT', 'FEE', 'OTHER', 'MOB_DEMOB', 'CREDIT', 'DISCOUNT', 'BACK_CHARGE');

-- CreateEnum
CREATE TYPE "CommissionPlanType" AS ENUM ('PERCENT_OF_TRADE_MARGIN');

-- CreateEnum
CREATE TYPE "CommissionReportSection" AS ENUM ('PRIOR_WEEK_EARNED', 'CATCH_UP_LATE_POSTED');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'VOIDED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('ELECTRONIC_COMMUNICATIONS', 'DATA_STORAGE', 'LOCATION_ARRIVAL_VERIFICATION', 'SAFETY_VIDEO_TRACKING');

-- CreateEnum
CREATE TYPE "CommissionReportRunStatus" AS ENUM ('DRAFT', 'FINALIZED');

-- CreateEnum
CREATE TYPE "MarkerSource" AS ENUM ('SELF', 'RECRUITER', 'IMPORT');

-- CreateEnum
CREATE TYPE "CandidateMarkerStatus" AS ENUM ('HAS', 'DOES_NOT_HAVE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CandidateCertVerification" AS ENUM ('SELF_ATTESTED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TradeProficiency" AS ENUM ('UNKNOWN', 'BASIC', 'JOURNEYMAN', 'MASTER');

-- CreateEnum
CREATE TYPE "PayrollEarningCode" AS ENUM ('REG', 'OT', 'DT', 'H', 'PD', 'TRV', 'BONUS', 'REM');

-- CreateEnum
CREATE TYPE "PayrollDeductionCode" AS ENUM ('ETV', 'ADV');

-- CreateEnum
CREATE TYPE "HoursEntryUnit" AS ENUM ('HOURS', 'DAYS', 'DOLLARS');

-- CreateEnum
CREATE TYPE "RequirementPriority" AS ENUM ('REQUIRED', 'PREFERRED');

-- CreateEnum
CREATE TYPE "RequirementEnforcement" AS ENUM ('FLAG', 'FILTER');

-- CreateEnum
CREATE TYPE "BurdenLevel" AS ENUM ('WORKER', 'SITE', 'STATE', 'GLOBAL');

-- CreateEnum
CREATE TYPE "BurdenCategory" AS ENUM ('WC', 'GL', 'FICA', 'SUTA', 'FUTA', 'PEO', 'OVERHEAD', 'INT_W', 'INT_PD');

-- CreateEnum
CREATE TYPE "MedicalScreenType" AS ENUM ('DRUG_5_PANEL', 'DRUG_10_PANEL', 'DRUG_HAIR', 'DOT_PHYSICAL', 'OTHER');

-- CreateEnum
CREATE TYPE "MedicalScreenStatus" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PayrollPacketStatus" AS ENUM ('DRAFT', 'EXPORTED');

-- CreateEnum
CREATE TYPE "OrderCandidateStatus" AS ENUM ('IDENTIFIED', 'WITHDRAWN_PLACED_ELSEWHERE', 'WITHDRAWN_REJECTED', 'WITHDRAWN_WITHDRAWN');

-- CreateEnum
CREATE TYPE "OrderVettingStatus" AS ENUM ('VETTING', 'VETTING_HOLD', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InvoiceAdjustmentType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "InvoiceAdjustmentStatus" AS ENUM ('DRAFT', 'ISSUED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT,
    "hashedPassword" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "userId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("userId","roleId")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "requiresInvoiceApproval" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "defaultSalespersonUserId" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerInvoiceRecipient" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "isCc" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerInvoiceRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationInvoiceRecipient" (
    "id" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "isCc" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationInvoiceRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerContact" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "officePhone" TEXT,
    "cellPhone" TEXT,
    "jobTitle" TEXT,
    "rolesJson" TEXT NOT NULL DEFAULT '[]',
    "salespersonOfRecordUserId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expectedTradeMarginAmount" DOUBLE PRECISION,
    "expectedTradeMarginPercent" DOUBLE PRECISION,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "approvedByUserId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvalNote" TEXT,
    "employeeDailyPerDiemRate" DECIMAL(65,30),
    "customerDailyPerDiemRate" DECIMAL(65,30),
    "jobLocationCode" TEXT,
    "primaryCustomerContactId" TEXT,
    "locationId" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "AssignmentStatus",
    "statusChangedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phone" TEXT,
    "address1" TEXT,
    "address2" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zip" TEXT,
    "ssn" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HoursEntry" (
    "id" TEXT NOT NULL,
    "type" "HoursEntryType" NOT NULL,
    "enteredBy" "HoursEnteredBy" NOT NULL,
    "orderId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalHours" DOUBLE PRECISION NOT NULL,
    "approvalStatus" "HoursApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "assignmentId" TEXT,
    "userId" TEXT,
    "entryDate" TIMESTAMP(3),
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HoursEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "website" TEXT,
    "domain" TEXT,
    "industryMarkers" TEXT NOT NULL DEFAULT '[]',
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "lastSignalAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "calledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disposition" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanySignal" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "sourceType" TEXT NOT NULL,
    "rawCompanyName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "domain" TEXT,
    "rawContext" TEXT,
    "confidenceScore" INTEGER NOT NULL DEFAULT 0,
    "meta" TEXT NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanySignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BurdenRateSet" (
    "id" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "tradeCode" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "wcRate" DOUBLE PRECISION,
    "glRate" DOUBLE PRECISION,
    "sutaRate" DOUBLE PRECISION,
    "futaRate" DOUBLE PRECISION,
    "ficaRate" DOUBLE PRECISION,
    "otherJson" TEXT NOT NULL DEFAULT '{}',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BurdenRateSet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceSequence" (
    "key" TEXT NOT NULL,
    "nextNumber" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceSequence_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT,
    "customerId" TEXT NOT NULL,
    "orderId" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issuedAt" TIMESTAMP(3),
    "subtotalAmountCents" INTEGER NOT NULL DEFAULT 0,
    "totalAmountCents" INTEGER NOT NULL DEFAULT 0,
    "issuedByUserId" TEXT,
    "issuedSnapshotJson" JSONB,
    "voidedAt" TIMESTAMP(3),
    "voidedByUserId" TEXT,
    "voidReason" TEXT,
    "requiresCustomerApproval" BOOLEAN NOT NULL DEFAULT true,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "approvedByUserId" TEXT,
    "approvalNote" TEXT,
    "routedToAdminAt" TIMESTAMP(3),
    "routedByUserId" TEXT,
    "routingReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLineItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "type" "InvoiceLineItemType" NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION,
    "tradeCode" TEXT,
    "state" TEXT,
    "isCommissionable" BOOLEAN NOT NULL DEFAULT true,
    "unitRateCents" INTEGER,
    "lineTotalCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoicePayment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentReceivedAt" TIMESTAMP(3) NOT NULL,
    "bankDepositAt" TIMESTAMP(3),
    "paymentPostedAt" TIMESTAMP(3) NOT NULL,
    "postedByUserId" TEXT NOT NULL,
    "backdateReason" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoicePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceTradeMarginSnapshot" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "tradeRevenuePaid" DOUBLE PRECISION NOT NULL,
    "tradeLaborCost" DOUBLE PRECISION NOT NULL,
    "tradeBurdenCost" DOUBLE PRECISION NOT NULL,
    "tradeMargin" DOUBLE PRECISION NOT NULL,
    "burdenBreakdownJson" TEXT NOT NULL DEFAULT '{}',
    "exclusionTotalsJson" TEXT NOT NULL DEFAULT '{}',
    "commissionRateSnapshot" DOUBLE PRECISION NOT NULL,
    "payoutTierSnapshotJson" TEXT NOT NULL DEFAULT '[]',
    "bankLagDaysSnapshot" INTEGER NOT NULL DEFAULT 1,
    "postingGraceDaysSnapshot" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceTradeMarginSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CommissionPlanType" NOT NULL,
    "defaultRate" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionPayoutTier" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "minDays" INTEGER NOT NULL,
    "maxDays" INTEGER,
    "multiplier" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionPayoutTier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionAssignment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT,
    "orderId" TEXT,
    "splitPercent" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionEvent" (
    "id" TEXT NOT NULL,
    "invoicePaymentId" TEXT NOT NULL,
    "commissionAssignmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "earnedAt" TIMESTAMP(3) NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL,
    "daysToPaid" INTEGER NOT NULL,
    "commissionRateSnapshot" DOUBLE PRECISION NOT NULL,
    "payoutMultiplierSnapshot" DOUBLE PRECISION NOT NULL,
    "rawCommissionAmount" DOUBLE PRECISION NOT NULL,
    "payableCommissionAmount" DOUBLE PRECISION NOT NULL,
    "isLatePosted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionAdjustment" (
    "id" TEXT NOT NULL,
    "commissionEventId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionReportRun" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Chicago',
    "status" "CommissionReportRunStatus" NOT NULL DEFAULT 'DRAFT',
    "finalizedAt" TIMESTAMP(3),
    "finalizedByUserId" TEXT,
    "bankLagDaysSnapshot" INTEGER NOT NULL DEFAULT 1,
    "postingGraceDaysSnapshot" INTEGER NOT NULL DEFAULT 1,
    "commissionRateDefaultSnapshot" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "tierSnapshotJson" TEXT NOT NULL DEFAULT '[]',
    "summarySnapshotJson" TEXT NOT NULL DEFAULT '{}',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionReportRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionReportRunItem" (
    "id" TEXT NOT NULL,
    "reportRunId" TEXT NOT NULL,
    "commissionEventId" TEXT NOT NULL,
    "section" "CommissionReportSection" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommissionReportRunItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "valueJson" TEXT NOT NULL,
    "updatedByUserId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettingAudit" (
    "id" TEXT NOT NULL,
    "settingId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "oldValueJson" TEXT,
    "newValueJson" TEXT NOT NULL,
    "changedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemSettingAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "status" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "tools" JSONB,
    "ppe" JSONB,
    "safetyRecords" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicLink" (
    "id" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "orderId" TEXT,
    "candidateId" TEXT,
    "userId" TEXT,
    "outreachRecipientId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachBatch" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "channels" JSONB NOT NULL,
    "templateKey" TEXT,
    "messageSnapshot" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachRecipient" (
    "id" TEXT NOT NULL,
    "outreachBatchId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "sendStatusSms" TEXT NOT NULL,
    "sendStatusEmail" TEXT NOT NULL,
    "sentAtSms" TIMESTAMP(3),
    "sentAtEmail" TIMESTAMP(3),
    "responseStatus" "OutreachResponseStatus" NOT NULL DEFAULT 'PENDING',
    "responseNote" TEXT,
    "respondedAt" TIMESTAMP(3),
    "responseMagicLinkId" TEXT,
    "responseIp" TEXT,
    "responseUserAgent" TEXT,
    "magicLinkId" TEXT,

    CONSTRAINT "OutreachRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachResponse" (
    "id" TEXT NOT NULL,
    "outreachId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "status" "OutreachResponseStatus" NOT NULL,
    "respondedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentVersion" (
    "id" TEXT NOT NULL,
    "type" "ConsentType" NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonConsent" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "consentVersionId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedFromIp" TEXT,
    "acceptedFromUserAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PersonConsent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificationType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "isMW4HTrainableDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CertificationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ToolType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PpeType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PpeType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateTrade" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "proficiency" "TradeProficiency" NOT NULL DEFAULT 'UNKNOWN',
    "notes" TEXT,
    "source" "MarkerSource" NOT NULL DEFAULT 'SELF',
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateTrade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateCertification" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "certTypeId" TEXT NOT NULL,
    "status" "CandidateMarkerStatus" NOT NULL DEFAULT 'UNKNOWN',
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "verification" "CandidateCertVerification" NOT NULL DEFAULT 'SELF_ATTESTED',
    "notes" TEXT,
    "source" "MarkerSource" NOT NULL DEFAULT 'SELF',
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateCertification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateTool" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "toolTypeId" TEXT NOT NULL,
    "status" "CandidateMarkerStatus" NOT NULL DEFAULT 'UNKNOWN',
    "notes" TEXT,
    "source" "MarkerSource" NOT NULL DEFAULT 'SELF',
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateTool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HoursEntryLine" (
    "id" TEXT NOT NULL,
    "hoursEntryId" TEXT NOT NULL,
    "earningCode" "PayrollEarningCode" NOT NULL,
    "unit" "HoursEntryUnit" NOT NULL,
    "quantity" DECIMAL(65,30) NOT NULL,
    "rate" DECIMAL(65,30),
    "amount" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HoursEntryLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidatePpe" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "ppeTypeId" TEXT NOT NULL,
    "status" "CandidateMarkerStatus" NOT NULL DEFAULT 'UNKNOWN',
    "notes" TEXT,
    "source" "MarkerSource" NOT NULL DEFAULT 'SELF',
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidatePpe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderTradeRequirement" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "priority" "RequirementPriority" NOT NULL DEFAULT 'REQUIRED',
    "enforcement" "RequirementEnforcement" NOT NULL DEFAULT 'FLAG',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderTradeRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderCertificationRequirement" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "certTypeId" TEXT NOT NULL,
    "priority" "RequirementPriority" NOT NULL DEFAULT 'REQUIRED',
    "enforcement" "RequirementEnforcement" NOT NULL DEFAULT 'FLAG',
    "isTrainable" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderCertificationRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderToolRequirement" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "toolTypeId" TEXT NOT NULL,
    "priority" "RequirementPriority" NOT NULL DEFAULT 'REQUIRED',
    "enforcement" "RequirementEnforcement" NOT NULL DEFAULT 'FLAG',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderToolRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderPpeRequirement" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "ppeTypeId" TEXT NOT NULL,
    "priority" "RequirementPriority" NOT NULL DEFAULT 'REQUIRED',
    "enforcement" "RequirementEnforcement" NOT NULL DEFAULT 'FLAG',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderPpeRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollBurdenRate" (
    "id" TEXT NOT NULL,
    "level" "BurdenLevel" NOT NULL,
    "category" "BurdenCategory" NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ratePercent" DOUBLE PRECISION NOT NULL,
    "workerId" TEXT,
    "locationId" TEXT,
    "stateCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "updatedByUserId" TEXT NOT NULL,

    CONSTRAINT "PayrollBurdenRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollBurdenRateAudit" (
    "id" TEXT NOT NULL,
    "burdenRateId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT NOT NULL,

    CONSTRAINT "PayrollBurdenRateAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollDeductionElection" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "amountCents" INTEGER,
    "percentBasis" DOUBLE PRECISION,
    "effectiveWeek" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollDeductionElection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollRun" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL,
    "snapshotJson" JSONB NOT NULL,
    "includeDeductions" BOOLEAN NOT NULL DEFAULT false,
    "includeReference" BOOLEAN NOT NULL DEFAULT false,
    "finalizedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DirectDepositOptInSubmission" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "magicLinkId" TEXT,
    "wantsDirectDeposit" BOOLEAN NOT NULL DEFAULT false,
    "wantsEtvDonation" BOOLEAN NOT NULL DEFAULT false,
    "etvAmountCents" INTEGER,
    "majorEdVideoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DirectDepositOptInSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalScreen" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "type" "MedicalScreenType" NOT NULL,
    "status" "MedicalScreenStatus" NOT NULL DEFAULT 'PENDING',
    "administeredAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "notes" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalScreen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeHoursSelfReport" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "workDate" TIMESTAMP(3) NOT NULL,
    "totalMinutes" INTEGER,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeHoursSelfReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollPacket" (
    "id" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Chicago',
    "status" "PayrollPacketStatus" NOT NULL DEFAULT 'DRAFT',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exportedAt" TIMESTAMP(3),
    "generatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PayrollPacket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollPacketLine" (
    "id" TEXT NOT NULL,
    "packetId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "ssn" TEXT NOT NULL,
    "loc" TEXT NOT NULL,
    "regRate" DECIMAL(65,30) NOT NULL,
    "regHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "otHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "dtHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "holidayHours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "bonusAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "reimbAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "mileageAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "perDiemAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "advanceDeductionAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "etvDeductionAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollPacketLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderCandidate" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "status" "OrderCandidateStatus" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderVetting" (
    "id" TEXT NOT NULL,
    "orderCandidateId" TEXT NOT NULL,
    "status" "OrderVettingStatus" NOT NULL,
    "holdReason" TEXT,
    "reviewedByEmployeeId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderVetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderVettingAudit" (
    "id" TEXT NOT NULL,
    "orderVettingId" TEXT NOT NULL,
    "orderCandidateId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previousStatus" TEXT NOT NULL,
    "newStatus" TEXT NOT NULL,
    "reason" TEXT,
    "performedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderVettingAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceAdjustment" (
    "id" TEXT NOT NULL,
    "adjustmentNumber" TEXT,
    "invoiceId" TEXT NOT NULL,
    "type" "InvoiceAdjustmentType" NOT NULL,
    "status" "InvoiceAdjustmentStatus" NOT NULL DEFAULT 'DRAFT',
    "amountCents" INTEGER NOT NULL,
    "reason" TEXT,
    "issuedAt" TIMESTAMP(3),
    "issuedByUserId" TEXT,
    "issuedSnapshotJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_customerId_idx" ON "User"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "Customer_defaultSalespersonUserId_idx" ON "Customer"("defaultSalespersonUserId");

-- CreateIndex
CREATE INDEX "Location_customerId_idx" ON "Location"("customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_customerId_name_key" ON "Location"("customerId", "name");

-- CreateIndex
CREATE INDEX "CustomerInvoiceRecipient_customerId_idx" ON "CustomerInvoiceRecipient"("customerId");

-- CreateIndex
CREATE INDEX "CustomerInvoiceRecipient_email_idx" ON "CustomerInvoiceRecipient"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerInvoiceRecipient_customerId_email_key" ON "CustomerInvoiceRecipient"("customerId", "email");

-- CreateIndex
CREATE INDEX "LocationInvoiceRecipient_locationId_idx" ON "LocationInvoiceRecipient"("locationId");

-- CreateIndex
CREATE INDEX "LocationInvoiceRecipient_email_idx" ON "LocationInvoiceRecipient"("email");

-- CreateIndex
CREATE UNIQUE INDEX "LocationInvoiceRecipient_locationId_email_key" ON "LocationInvoiceRecipient"("locationId", "email");

-- CreateIndex
CREATE INDEX "CustomerContact_customerId_idx" ON "CustomerContact"("customerId");

-- CreateIndex
CREATE INDEX "CustomerContact_salespersonOfRecordUserId_idx" ON "CustomerContact"("salespersonOfRecordUserId");

-- CreateIndex
CREATE INDEX "CustomerContact_isActive_idx" ON "CustomerContact"("isActive");

-- CreateIndex
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");

-- CreateIndex
CREATE INDEX "Order_approvalStatus_idx" ON "Order"("approvalStatus");

-- CreateIndex
CREATE INDEX "Order_locationId_idx" ON "Order"("locationId");

-- CreateIndex
CREATE INDEX "Order_primaryCustomerContactId_idx" ON "Order"("primaryCustomerContactId");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeProfile_userId_key" ON "EmployeeProfile"("userId");

-- CreateIndex
CREATE INDEX "HoursEntry_orderId_idx" ON "HoursEntry"("orderId");

-- CreateIndex
CREATE INDEX "HoursEntry_assignmentId_idx" ON "HoursEntry"("assignmentId");

-- CreateIndex
CREATE INDEX "HoursEntry_userId_idx" ON "HoursEntry"("userId");

-- CreateIndex
CREATE INDEX "HoursEntry_workerId_idx" ON "HoursEntry"("workerId");

-- CreateIndex
CREATE INDEX "HoursEntry_type_idx" ON "HoursEntry"("type");

-- CreateIndex
CREATE INDEX "HoursEntry_enteredBy_idx" ON "HoursEntry"("enteredBy");

-- CreateIndex
CREATE UNIQUE INDEX "Company_normalizedName_key" ON "Company"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "Company_domain_key" ON "Company"("domain");

-- CreateIndex
CREATE INDEX "Company_domain_idx" ON "Company"("domain");

-- CreateIndex
CREATE INDEX "CallLog_companyId_idx" ON "CallLog"("companyId");

-- CreateIndex
CREATE INDEX "CallLog_userId_idx" ON "CallLog"("userId");

-- CreateIndex
CREATE INDEX "CallLog_calledAt_idx" ON "CallLog"("calledAt");

-- CreateIndex
CREATE INDEX "CompanySignal_companyId_idx" ON "CompanySignal"("companyId");

-- CreateIndex
CREATE INDEX "CompanySignal_sourceType_idx" ON "CompanySignal"("sourceType");

-- CreateIndex
CREATE INDEX "CompanySignal_rawCompanyName_idx" ON "CompanySignal"("rawCompanyName");

-- CreateIndex
CREATE INDEX "CompanySignal_normalizedName_idx" ON "CompanySignal"("normalizedName");

-- CreateIndex
CREATE INDEX "CompanySignal_createdAt_idx" ON "CompanySignal"("createdAt");

-- CreateIndex
CREATE INDEX "CompanySignal_domain_idx" ON "CompanySignal"("domain");

-- CreateIndex
CREATE INDEX "BurdenRateSet_state_idx" ON "BurdenRateSet"("state");

-- CreateIndex
CREATE INDEX "BurdenRateSet_tradeCode_idx" ON "BurdenRateSet"("tradeCode");

-- CreateIndex
CREATE INDEX "BurdenRateSet_effectiveFrom_idx" ON "BurdenRateSet"("effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "BurdenRateSet_state_tradeCode_effectiveFrom_key" ON "BurdenRateSet"("state", "tradeCode", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE INDEX "Invoice_orderId_idx" ON "Invoice"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_orderId_key" ON "Invoice"("orderId");

-- CreateIndex
CREATE INDEX "InvoiceLineItem_invoiceId_idx" ON "InvoiceLineItem"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceLineItem_type_idx" ON "InvoiceLineItem"("type");

-- CreateIndex
CREATE INDEX "InvoiceLineItem_tradeCode_idx" ON "InvoiceLineItem"("tradeCode");

-- CreateIndex
CREATE INDEX "InvoiceLineItem_state_idx" ON "InvoiceLineItem"("state");

-- CreateIndex
CREATE INDEX "InvoicePayment_invoiceId_idx" ON "InvoicePayment"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoicePayment_paymentReceivedAt_idx" ON "InvoicePayment"("paymentReceivedAt");

-- CreateIndex
CREATE INDEX "InvoicePayment_paymentPostedAt_idx" ON "InvoicePayment"("paymentPostedAt");

-- CreateIndex
CREATE INDEX "InvoicePayment_postedByUserId_idx" ON "InvoicePayment"("postedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceTradeMarginSnapshot_invoiceId_key" ON "InvoiceTradeMarginSnapshot"("invoiceId");

-- CreateIndex
CREATE INDEX "CommissionPayoutTier_planId_idx" ON "CommissionPayoutTier"("planId");

-- CreateIndex
CREATE INDEX "CommissionPayoutTier_minDays_idx" ON "CommissionPayoutTier"("minDays");

-- CreateIndex
CREATE INDEX "CommissionAssignment_userId_idx" ON "CommissionAssignment"("userId");

-- CreateIndex
CREATE INDEX "CommissionAssignment_customerId_idx" ON "CommissionAssignment"("customerId");

-- CreateIndex
CREATE INDEX "CommissionAssignment_orderId_idx" ON "CommissionAssignment"("orderId");

-- CreateIndex
CREATE INDEX "CommissionAssignment_effectiveFrom_idx" ON "CommissionAssignment"("effectiveFrom");

-- CreateIndex
CREATE INDEX "CommissionEvent_earnedAt_idx" ON "CommissionEvent"("earnedAt");

-- CreateIndex
CREATE INDEX "CommissionEvent_postedAt_idx" ON "CommissionEvent"("postedAt");

-- CreateIndex
CREATE INDEX "CommissionEvent_userId_idx" ON "CommissionEvent"("userId");

-- CreateIndex
CREATE INDEX "CommissionEvent_isLatePosted_idx" ON "CommissionEvent"("isLatePosted");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionEvent_invoicePaymentId_commissionAssignmentId_key" ON "CommissionEvent"("invoicePaymentId", "commissionAssignmentId");

-- CreateIndex
CREATE INDEX "CommissionAdjustment_commissionEventId_idx" ON "CommissionAdjustment"("commissionEventId");

-- CreateIndex
CREATE INDEX "CommissionAdjustment_createdByUserId_idx" ON "CommissionAdjustment"("createdByUserId");

-- CreateIndex
CREATE INDEX "CommissionReportRun_weekStart_idx" ON "CommissionReportRun"("weekStart");

-- CreateIndex
CREATE INDEX "CommissionReportRun_weekEnd_idx" ON "CommissionReportRun"("weekEnd");

-- CreateIndex
CREATE INDEX "CommissionReportRun_status_idx" ON "CommissionReportRun"("status");

-- CreateIndex
CREATE INDEX "CommissionReportRun_finalizedAt_idx" ON "CommissionReportRun"("finalizedAt");

-- CreateIndex
CREATE INDEX "CommissionReportRunItem_section_idx" ON "CommissionReportRunItem"("section");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionReportRunItem_reportRunId_commissionEventId_key" ON "CommissionReportRunItem"("reportRunId", "commissionEventId");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- CreateIndex
CREATE INDEX "SystemSettingAudit_settingId_idx" ON "SystemSettingAudit"("settingId");

-- CreateIndex
CREATE INDEX "SystemSettingAudit_changedByUserId_idx" ON "SystemSettingAudit"("changedByUserId");

-- CreateIndex
CREATE INDEX "SystemSettingAudit_createdAt_idx" ON "SystemSettingAudit"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MagicLink_tokenHash_key" ON "MagicLink"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachResponse_outreachId_candidateId_key" ON "OutreachResponse"("outreachId", "candidateId");

-- CreateIndex
CREATE INDEX "Application_candidateId_idx" ON "Application"("candidateId");

-- CreateIndex
CREATE INDEX "Application_status_idx" ON "Application"("status");

-- CreateIndex
CREATE INDEX "Application_submittedAt_idx" ON "Application"("submittedAt");

-- CreateIndex
CREATE INDEX "ConsentVersion_type_isActive_idx" ON "ConsentVersion"("type", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentVersion_type_version_key" ON "ConsentVersion"("type", "version");

-- CreateIndex
CREATE INDEX "PersonConsent_candidateId_idx" ON "PersonConsent"("candidateId");

-- CreateIndex
CREATE INDEX "PersonConsent_consentVersionId_idx" ON "PersonConsent"("consentVersionId");

-- CreateIndex
CREATE INDEX "PersonConsent_acceptedAt_idx" ON "PersonConsent"("acceptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PersonConsent_candidateId_consentVersionId_key" ON "PersonConsent"("candidateId", "consentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "Trade_name_key" ON "Trade"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CertificationType_code_key" ON "CertificationType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ToolType_name_key" ON "ToolType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PpeType_name_key" ON "PpeType"("name");

-- CreateIndex
CREATE INDEX "CandidateTrade_candidateId_idx" ON "CandidateTrade"("candidateId");

-- CreateIndex
CREATE INDEX "CandidateTrade_tradeId_idx" ON "CandidateTrade"("tradeId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateTrade_candidateId_tradeId_key" ON "CandidateTrade"("candidateId", "tradeId");

-- CreateIndex
CREATE INDEX "CandidateCertification_candidateId_idx" ON "CandidateCertification"("candidateId");

-- CreateIndex
CREATE INDEX "CandidateCertification_certTypeId_idx" ON "CandidateCertification"("certTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateCertification_candidateId_certTypeId_key" ON "CandidateCertification"("candidateId", "certTypeId");

-- CreateIndex
CREATE INDEX "CandidateTool_candidateId_idx" ON "CandidateTool"("candidateId");

-- CreateIndex
CREATE INDEX "CandidateTool_toolTypeId_idx" ON "CandidateTool"("toolTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateTool_candidateId_toolTypeId_key" ON "CandidateTool"("candidateId", "toolTypeId");

-- CreateIndex
CREATE INDEX "HoursEntryLine_hoursEntryId_idx" ON "HoursEntryLine"("hoursEntryId");

-- CreateIndex
CREATE INDEX "CandidatePpe_candidateId_idx" ON "CandidatePpe"("candidateId");

-- CreateIndex
CREATE INDEX "CandidatePpe_ppeTypeId_idx" ON "CandidatePpe"("ppeTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidatePpe_candidateId_ppeTypeId_key" ON "CandidatePpe"("candidateId", "ppeTypeId");

-- CreateIndex
CREATE INDEX "OrderTradeRequirement_orderId_idx" ON "OrderTradeRequirement"("orderId");

-- CreateIndex
CREATE INDEX "OrderTradeRequirement_tradeId_idx" ON "OrderTradeRequirement"("tradeId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderTradeRequirement_orderId_tradeId_key" ON "OrderTradeRequirement"("orderId", "tradeId");

-- CreateIndex
CREATE INDEX "OrderCertificationRequirement_orderId_idx" ON "OrderCertificationRequirement"("orderId");

-- CreateIndex
CREATE INDEX "OrderCertificationRequirement_certTypeId_idx" ON "OrderCertificationRequirement"("certTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderCertificationRequirement_orderId_certTypeId_key" ON "OrderCertificationRequirement"("orderId", "certTypeId");

-- CreateIndex
CREATE INDEX "OrderToolRequirement_orderId_idx" ON "OrderToolRequirement"("orderId");

-- CreateIndex
CREATE INDEX "OrderToolRequirement_toolTypeId_idx" ON "OrderToolRequirement"("toolTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderToolRequirement_orderId_toolTypeId_key" ON "OrderToolRequirement"("orderId", "toolTypeId");

-- CreateIndex
CREATE INDEX "OrderPpeRequirement_orderId_idx" ON "OrderPpeRequirement"("orderId");

-- CreateIndex
CREATE INDEX "OrderPpeRequirement_ppeTypeId_idx" ON "OrderPpeRequirement"("ppeTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "OrderPpeRequirement_orderId_ppeTypeId_key" ON "OrderPpeRequirement"("orderId", "ppeTypeId");

-- CreateIndex
CREATE INDEX "PayrollBurdenRate_level_category_idx" ON "PayrollBurdenRate"("level", "category");

-- CreateIndex
CREATE INDEX "PayrollBurdenRate_effectiveDate_idx" ON "PayrollBurdenRate"("effectiveDate");

-- CreateIndex
CREATE INDEX "PayrollBurdenRate_workerId_idx" ON "PayrollBurdenRate"("workerId");

-- CreateIndex
CREATE INDEX "PayrollBurdenRate_locationId_idx" ON "PayrollBurdenRate"("locationId");

-- CreateIndex
CREATE INDEX "PayrollBurdenRate_stateCode_idx" ON "PayrollBurdenRate"("stateCode");

-- CreateIndex
CREATE INDEX "PayrollBurdenRateAudit_burdenRateId_idx" ON "PayrollBurdenRateAudit"("burdenRateId");

-- CreateIndex
CREATE INDEX "PayrollBurdenRateAudit_createdAt_idx" ON "PayrollBurdenRateAudit"("createdAt");

-- CreateIndex
CREATE INDEX "PayrollDeductionElection_employeeId_idx" ON "PayrollDeductionElection"("employeeId");

-- CreateIndex
CREATE INDEX "PayrollDeductionElection_code_idx" ON "PayrollDeductionElection"("code");

-- CreateIndex
CREATE INDEX "PayrollRun_weekStart_weekEnd_idx" ON "PayrollRun"("weekStart", "weekEnd");

-- CreateIndex
CREATE INDEX "PayrollRun_finalizedAt_idx" ON "PayrollRun"("finalizedAt");

-- CreateIndex
CREATE INDEX "DirectDepositOptInSubmission_employeeId_idx" ON "DirectDepositOptInSubmission"("employeeId");

-- CreateIndex
CREATE INDEX "DirectDepositOptInSubmission_magicLinkId_idx" ON "DirectDepositOptInSubmission"("magicLinkId");

-- CreateIndex
CREATE INDEX "DirectDepositOptInSubmission_status_idx" ON "DirectDepositOptInSubmission"("status");

-- CreateIndex
CREATE INDEX "MedicalScreen_employeeId_idx" ON "MedicalScreen"("employeeId");

-- CreateIndex
CREATE INDEX "MedicalScreen_type_idx" ON "MedicalScreen"("type");

-- CreateIndex
CREATE INDEX "MedicalScreen_status_idx" ON "MedicalScreen"("status");

-- CreateIndex
CREATE INDEX "EmployeeHoursSelfReport_employeeId_idx" ON "EmployeeHoursSelfReport"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeHoursSelfReport_orderId_idx" ON "EmployeeHoursSelfReport"("orderId");

-- CreateIndex
CREATE INDEX "EmployeeHoursSelfReport_workDate_idx" ON "EmployeeHoursSelfReport"("workDate");

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeHoursSelfReport_employeeId_orderId_workDate_key" ON "EmployeeHoursSelfReport"("employeeId", "orderId", "workDate");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollPacket_weekStart_key" ON "PayrollPacket"("weekStart");

-- CreateIndex
CREATE INDEX "PayrollPacket_weekStart_idx" ON "PayrollPacket"("weekStart");

-- CreateIndex
CREATE INDEX "PayrollPacket_status_idx" ON "PayrollPacket"("status");

-- CreateIndex
CREATE INDEX "PayrollPacketLine_packetId_idx" ON "PayrollPacketLine"("packetId");

-- CreateIndex
CREATE INDEX "PayrollPacketLine_employeeId_idx" ON "PayrollPacketLine"("employeeId");

-- CreateIndex
CREATE INDEX "PayrollPacketLine_loc_idx" ON "PayrollPacketLine"("loc");

-- CreateIndex
CREATE UNIQUE INDEX "OrderCandidate_orderId_employeeId_key" ON "OrderCandidate"("orderId", "employeeId");

-- CreateIndex
CREATE INDEX "OrderVettingAudit_orderVettingId_idx" ON "OrderVettingAudit"("orderVettingId");

-- CreateIndex
CREATE INDEX "OrderVettingAudit_orderCandidateId_idx" ON "OrderVettingAudit"("orderCandidateId");

-- CreateIndex
CREATE INDEX "OrderVettingAudit_performedByUserId_idx" ON "OrderVettingAudit"("performedByUserId");

-- CreateIndex
CREATE INDEX "OrderVettingAudit_createdAt_idx" ON "OrderVettingAudit"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceAdjustment_adjustmentNumber_key" ON "InvoiceAdjustment"("adjustmentNumber");

-- CreateIndex
CREATE INDEX "InvoiceAdjustment_invoiceId_idx" ON "InvoiceAdjustment"("invoiceId");

-- CreateIndex
CREATE INDEX "InvoiceAdjustment_status_idx" ON "InvoiceAdjustment"("status");

-- CreateIndex
CREATE INDEX "InvoiceAdjustment_type_idx" ON "InvoiceAdjustment"("type");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_defaultSalespersonUserId_fkey" FOREIGN KEY ("defaultSalespersonUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerInvoiceRecipient" ADD CONSTRAINT "CustomerInvoiceRecipient_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationInvoiceRecipient" ADD CONSTRAINT "LocationInvoiceRecipient_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerContact" ADD CONSTRAINT "CustomerContact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerContact" ADD CONSTRAINT "CustomerContact_salespersonOfRecordUserId_fkey" FOREIGN KEY ("salespersonOfRecordUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_primaryCustomerContactId_fkey" FOREIGN KEY ("primaryCustomerContactId") REFERENCES "CustomerContact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeProfile" ADD CONSTRAINT "EmployeeProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoursEntry" ADD CONSTRAINT "HoursEntry_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoursEntry" ADD CONSTRAINT "HoursEntry_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoursEntry" ADD CONSTRAINT "HoursEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallLog" ADD CONSTRAINT "CallLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanySignal" ADD CONSTRAINT "CompanySignal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BurdenRateSet" ADD CONSTRAINT "BurdenRateSet_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_routedByUserId_fkey" FOREIGN KEY ("routedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_issuedByUserId_fkey" FOREIGN KEY ("issuedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_voidedByUserId_fkey" FOREIGN KEY ("voidedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_postedByUserId_fkey" FOREIGN KEY ("postedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceTradeMarginSnapshot" ADD CONSTRAINT "InvoiceTradeMarginSnapshot_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionPayoutTier" ADD CONSTRAINT "CommissionPayoutTier_planId_fkey" FOREIGN KEY ("planId") REFERENCES "CommissionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionAssignment" ADD CONSTRAINT "CommissionAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionAssignment" ADD CONSTRAINT "CommissionAssignment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionAssignment" ADD CONSTRAINT "CommissionAssignment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionEvent" ADD CONSTRAINT "CommissionEvent_invoicePaymentId_fkey" FOREIGN KEY ("invoicePaymentId") REFERENCES "InvoicePayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionEvent" ADD CONSTRAINT "CommissionEvent_commissionAssignmentId_fkey" FOREIGN KEY ("commissionAssignmentId") REFERENCES "CommissionAssignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionEvent" ADD CONSTRAINT "CommissionEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionAdjustment" ADD CONSTRAINT "CommissionAdjustment_commissionEventId_fkey" FOREIGN KEY ("commissionEventId") REFERENCES "CommissionEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionAdjustment" ADD CONSTRAINT "CommissionAdjustment_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionReportRun" ADD CONSTRAINT "CommissionReportRun_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionReportRunItem" ADD CONSTRAINT "CommissionReportRunItem_reportRunId_fkey" FOREIGN KEY ("reportRunId") REFERENCES "CommissionReportRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionReportRunItem" ADD CONSTRAINT "CommissionReportRunItem_commissionEventId_fkey" FOREIGN KEY ("commissionEventId") REFERENCES "CommissionEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemSetting" ADD CONSTRAINT "SystemSetting_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemSettingAudit" ADD CONSTRAINT "SystemSettingAudit_settingId_fkey" FOREIGN KEY ("settingId") REFERENCES "SystemSetting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemSettingAudit" ADD CONSTRAINT "SystemSettingAudit_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachRecipient" ADD CONSTRAINT "OutreachRecipient_outreachBatchId_fkey" FOREIGN KEY ("outreachBatchId") REFERENCES "OutreachBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonConsent" ADD CONSTRAINT "PersonConsent_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonConsent" ADD CONSTRAINT "PersonConsent_consentVersionId_fkey" FOREIGN KEY ("consentVersionId") REFERENCES "ConsentVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateTrade" ADD CONSTRAINT "CandidateTrade_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateTrade" ADD CONSTRAINT "CandidateTrade_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateCertification" ADD CONSTRAINT "CandidateCertification_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateCertification" ADD CONSTRAINT "CandidateCertification_certTypeId_fkey" FOREIGN KEY ("certTypeId") REFERENCES "CertificationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateTool" ADD CONSTRAINT "CandidateTool_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateTool" ADD CONSTRAINT "CandidateTool_toolTypeId_fkey" FOREIGN KEY ("toolTypeId") REFERENCES "ToolType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HoursEntryLine" ADD CONSTRAINT "HoursEntryLine_hoursEntryId_fkey" FOREIGN KEY ("hoursEntryId") REFERENCES "HoursEntry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidatePpe" ADD CONSTRAINT "CandidatePpe_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidatePpe" ADD CONSTRAINT "CandidatePpe_ppeTypeId_fkey" FOREIGN KEY ("ppeTypeId") REFERENCES "PpeType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderTradeRequirement" ADD CONSTRAINT "OrderTradeRequirement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderTradeRequirement" ADD CONSTRAINT "OrderTradeRequirement_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCertificationRequirement" ADD CONSTRAINT "OrderCertificationRequirement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCertificationRequirement" ADD CONSTRAINT "OrderCertificationRequirement_certTypeId_fkey" FOREIGN KEY ("certTypeId") REFERENCES "CertificationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderToolRequirement" ADD CONSTRAINT "OrderToolRequirement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderToolRequirement" ADD CONSTRAINT "OrderToolRequirement_toolTypeId_fkey" FOREIGN KEY ("toolTypeId") REFERENCES "ToolType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPpeRequirement" ADD CONSTRAINT "OrderPpeRequirement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderPpeRequirement" ADD CONSTRAINT "OrderPpeRequirement_ppeTypeId_fkey" FOREIGN KEY ("ppeTypeId") REFERENCES "PpeType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollBurdenRate" ADD CONSTRAINT "PayrollBurdenRate_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollBurdenRate" ADD CONSTRAINT "PayrollBurdenRate_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollBurdenRate" ADD CONSTRAINT "PayrollBurdenRate_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollBurdenRate" ADD CONSTRAINT "PayrollBurdenRate_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollBurdenRateAudit" ADD CONSTRAINT "PayrollBurdenRateAudit_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollBurdenRateAudit" ADD CONSTRAINT "PayrollBurdenRateAudit_burdenRateId_fkey" FOREIGN KEY ("burdenRateId") REFERENCES "PayrollBurdenRate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollPacketLine" ADD CONSTRAINT "PayrollPacketLine_packetId_fkey" FOREIGN KEY ("packetId") REFERENCES "PayrollPacket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCandidate" ADD CONSTRAINT "OrderCandidate_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderCandidate" ADD CONSTRAINT "OrderCandidate_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderVetting" ADD CONSTRAINT "OrderVetting_orderCandidateId_fkey" FOREIGN KEY ("orderCandidateId") REFERENCES "OrderCandidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderVettingAudit" ADD CONSTRAINT "OrderVettingAudit_orderVettingId_fkey" FOREIGN KEY ("orderVettingId") REFERENCES "OrderVetting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceAdjustment" ADD CONSTRAINT "InvoiceAdjustment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceAdjustment" ADD CONSTRAINT "InvoiceAdjustment_issuedByUserId_fkey" FOREIGN KEY ("issuedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

