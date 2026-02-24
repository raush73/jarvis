import { Module, OnModuleInit, MiddlewareConsumer, NestModule } from '@nestjs/common';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { PayrollBurdenModule } from './payroll-burden/payroll-burden.module';
import { PayrollModule } from './payroll/payroll.module';
import { PrismaService } from './prisma/prisma.service';

import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { RolesModule } from './roles/roles.module';
import { UsersModule } from './users/users.module';

import { CustomersModule } from './customers/customers.module';
import { CustomerContactsModule } from './customer-contacts/customer-contacts.module';
import { CompaniesModule } from './companies/companies.module';
import { CompanySignalsModule } from './company-signals/company-signals.module';

import { OrdersModule } from './orders/orders.module';
import { CallTargetsModule } from './call-targets/call-targets.module';
import { CallLogsModule } from './call-logs/call-logs.module';

import { SettingsModule } from './settings/settings.module';
import { FinanceModule } from './finance/finance.module';
import { InvoicePaymentsModule } from './invoice-payments/invoice-payments.module';
import { CommissionsModule } from './commissions/commissions.module';

import { HoursModule } from './hours/hours.module';
import { CustomerPortalModule } from './customer-portal/customer-portal.module';

// ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â¹ Phase 12.3 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Assignments
import { AssignmentsModule } from './assignments/assignments.module';

// ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â¹ Phase 20 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Candidates (foundation)
import { CandidatesModule } from './candidates/candidates.module';

// ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â¹ Phase 21.1 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Integrations (vendor-agnostic stubs)
import { IntegrationsModule } from './integrations/integrations.module';

// ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â¹ Phase 13 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Invoicing Snapshot + Locking
import { InvoicesModule } from './invoices/invoices.module';
import { OutreachModule } from './outreach/outreach.module';
import { MagicLinksModule } from './magic-links/magic-links.module';
import { DirectDepositOptInModule } from './direct-deposit-opt-in/direct-deposit-opt-in.module';
import { TradesModule } from './trades/trades.module';
import { CertificationTypesModule } from './certification-types/certification-types.module';
import { ToolTypesModule } from './tool-types/tool-types.module';
import { PpeTypesModule } from './ppe-types/ppe-types.module';


// ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â¹ Phase 26A ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Intake (Applications, Consents, Eligibility)
import { IntakeModule } from './intake/intake.module';
import { CommissionsReportModule } from './commissions-report/commissions-report.module';
import { PayrollRunModule } from './payroll-run/payroll-run.module';
import { InvoiceAdjustmentsModule } from './invoice-adjustments/invoice-adjustments.module';

import { MagicModule } from "./magic/magic.module";
import { EmployeeHoursModule } from "./employee-hours/employee-hours.module";
import { QuotesModule } from "./quotes/quotes.module";
import { Ui7Module } from "./ui/internal/routes/ui7.module";
import { Ui8Module } from "./ui/internal/routes/ui8.module";
import { Ui9Module } from "./ui/internal/routes/ui9.module";

import { Ui10Module } from "./ui/internal/routes/ui10.module";

import { Ui13Module } from "./ui/internal/routes/ui13.module";
import { Ui14Module } from "./ui/internal/routes/ui14.module";
import { Ui16Module } from "./ui/internal/routes/ui16.module";
import { CustomerInvoiceModule } from "./ui/customer/routes/customer-invoice.module";
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { AppLogger } from './common/logger/app-logger.service';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

// Health check endpoints (Smoke Test)
import { HealthModule } from './health/health.module';

// DEV-ONLY: Demo endpoints (disabled in production)
import { DemoModule } from './demo/demo.module';


@Module({
  imports: [
    HealthModule,
    DemoModule,
    PayrollBurdenModule,
    PayrollModule,
    PrismaModule,
    TradesModule,
    CertificationTypesModule,
    ToolTypesModule,
    PpeTypesModule,
    MagicModule,
    EmployeeHoursModule,
    Ui7Module,
    Ui8Module,
    Ui9Module,
    Ui10Module,
    Ui13Module,
    Ui14Module,
    Ui16Module,
    CustomerInvoiceModule,
    // Core auth/admin
    AuthModule,
    AdminModule,
    RolesModule,
    UsersModule,

    // CRM / Entities
    CustomersModule,
    CustomerContactsModule,
    CompaniesModule,
    CompanySignalsModule,

    // Sales / Ops
    OrdersModule,
    CallTargetsModule,
    CallLogsModule,

    // Settings / Finance
    SettingsModule,
    InvoicePaymentsModule,
    CommissionsModule,
FinanceModule,

    // Hours (Phase 9)
    HoursModule,

    // Customer Portal (Phase 11.B)
    CustomerPortalModule,

    // Assignments (Phase 12.3)
    AssignmentsModule,

    // Candidates (Phase 20)
    CandidatesModule,

    // Integrations (Phase 21.1)
    IntegrationsModule,

    // Invoices (Phase 13)
    InvoicesModule,
    InvoiceAdjustmentsModule,

    OutreachModule,

    DirectDepositOptInModule,
    // Intake (Phase 26A)
    IntakeModule,

    CommissionsReportModule,

    PayrollRunModule,

    // Quotes (Phase: Quote/Order Economics)
    QuotesModule,
    // Salespeople Registry
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppLogger,
    AllExceptionsFilter,
  ],
})
export class AppModule implements OnModuleInit, NestModule {
  constructor(private readonly prisma: PrismaService) {}

  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }

  async onModuleInit() {
    // DEV bootstrap only: seed minimal admin + permissions for local testing after DB resets.
    if (process.env.NODE_ENV === 'production') return;

    try {
      const email = 'phase2test1@mw4h.com';

      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) return;

      // 1) Ensure required permissions exist
      const requiredPermissions = [
        'roles.read',
      
        'companies.read',
        'companies.write',
      
        'companySignals.read',
        'companySignals.write',
      
        // Phase 20/21: candidates
        'candidates.read',
        'candidates.write',
      ];
      
      

      for (const key of requiredPermissions) {
        await this.prisma.permission.upsert({
          where: { key },
          create: { key, description: `DEV seeded permission: ${key}` },
          update: {},
        });
      }

      // 2) Ensure admin role exists
      const adminRole = await this.prisma.role.upsert({
        where: { name: 'admin' },
        create: { name: 'admin', description: 'DEV seeded admin role' },
        update: {},
      });

      // 3) Attach required permissions to admin role
      const perms = await this.prisma.permission.findMany({
        where: { key: { in: requiredPermissions } },
        select: { id: true },
      });

      for (const p of perms) {
        await this.prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: adminRole.id,
              permissionId: p.id,
            },
          },
          create: { roleId: adminRole.id, permissionId: p.id },
          update: {},
        });
      }

      // 4) Assign admin role to the dev user
      await this.prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: adminRole.id,
          },
        },
        create: { userId: user.id, roleId: adminRole.id },
        update: {},
      });
    } catch (err) {
      console.warn(`[AppModule] DEV bootstrap skipped â€” DB unavailable: ${String((err as any)?.message ?? err)}`);
      return;
    }
  }
}







