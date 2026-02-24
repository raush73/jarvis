import {
  Controller,
  Get,
  Post,
  Body,
  Header,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { AdminOnly } from '../auth/admin-only.decorator';
import { SettingsService } from '../settings/settings.service';
import { CommissionPayoutTier } from '../settings/settings.constants';
import { renderAdminSettingsView } from './views/admin-settings.view';

interface AdminSettingsPayload {
  defaultRate?: number;
  bankLagDays?: number;
  postingGraceDays?: number;
  payoutTiersJson?: string;
  invoiceFooterText?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  @AdminOnly()
  async renderSettingsPage(): Promise<string> {
    const [defaultRate, bankLagDays, postingGraceDays, payoutTiers, footerText] =
      await Promise.all([
        this.settingsService.getDefaultCommissionRate(),
        this.settingsService.getBankLagDays(),
        this.settingsService.getPostingGraceDays(),
        this.settingsService.getCommissionPayoutTiers(),
        this.settingsService.getInvoiceFooterText(),
      ]);

    return renderAdminSettingsView({
      defaultRate,
      bankLagDays,
      postingGraceDays,
      payoutTiersJson: JSON.stringify(payoutTiers, null, 2),
      invoiceFooterText: footerText,
    });
  }

  @Post()
  @Header('Content-Type', 'application/json')
  @AdminOnly()
  async saveSettings(
    @Req() req: any,
    @Body() body: AdminSettingsPayload,
  ): Promise<{ ok: boolean; message?: string; errors?: ValidationError[] }> {
    const userId: string = (req?.user?.sub ?? req?.user?.userId ?? req?.user?.id ?? req?.user?.user?.id ?? req?.user?.payload?.sub ?? req?.user?.payload?.userId ?? req?.userId) as string;
    if (!userId) {
      throw new HttpException(
        { ok: false, message: 'User ID not found in request' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const errors: ValidationError[] = [];

    // Validate defaultRate (number 0â€“1)
    if (body.defaultRate !== undefined) {
      const rate = Number(body.defaultRate);
      if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
        errors.push({
          field: 'defaultRate',
          message: 'Must be a number between 0 and 1',
        });
      }
    }

    // Validate bankLagDays (integer >= 0)
    if (body.bankLagDays !== undefined) {
      const days = Number(body.bankLagDays);
      if (!Number.isInteger(days) || days < 0) {
        errors.push({
          field: 'bankLagDays',
          message: 'Must be a non-negative integer',
        });
      }
    }

    // Validate postingGraceDays (integer >= 0)
    if (body.postingGraceDays !== undefined) {
      const days = Number(body.postingGraceDays);
      if (!Number.isInteger(days) || days < 0) {
        errors.push({
          field: 'postingGraceDays',
          message: 'Must be a non-negative integer',
        });
      }
    }

    // Validate payoutTiersJson
    let parsedTiers: CommissionPayoutTier[] | null = null;
    if (body.payoutTiersJson !== undefined) {
      try {
        const parsed = JSON.parse(body.payoutTiersJson);
        if (!Array.isArray(parsed)) {
          errors.push({
            field: 'payoutTiersJson',
            message: 'Must be a JSON array',
          });
        } else {
          // Validate each tier
          for (let i = 0; i < parsed.length; i++) {
            const tier = parsed[i];
            const tierErrors: string[] = [];

            if (
              typeof tier.minDays !== 'number' ||
              !Number.isInteger(tier.minDays) ||
              tier.minDays < 0
            ) {
              tierErrors.push('minDays must be a non-negative integer');
            }

            if (
              tier.maxDays !== null &&
              (typeof tier.maxDays !== 'number' ||
                !Number.isInteger(tier.maxDays) ||
                tier.maxDays < 0)
            ) {
              tierErrors.push(
                'maxDays must be null or a non-negative integer',
              );
            }

            if (
              typeof tier.multiplier !== 'number' ||
              tier.multiplier < 0 ||
              tier.multiplier > 1
            ) {
              tierErrors.push('multiplier must be a number between 0 and 1');
            }

            if (tierErrors.length > 0) {
              errors.push({
                field: 'payoutTiersJson',
                message: `Tier ${i}: ${tierErrors.join('; ')}`,
              });
            }
          }

          if (
            errors.filter((e) => e.field === 'payoutTiersJson').length === 0
          ) {
            parsedTiers = parsed as CommissionPayoutTier[];
          }
        }
      } catch {
        errors.push({
          field: 'payoutTiersJson',
          message: 'Invalid JSON syntax',
        });
      }
    }

    // If validation errors, return without saving
    if (errors.length > 0) {
      throw new HttpException(
        { ok: false, message: 'Validation failed', errors },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Save all settings
    const savePromises: Promise<void>[] = [];

    if (body.defaultRate !== undefined) {
      savePromises.push(
        this.settingsService.setDefaultCommissionRate(
          Number(body.defaultRate),
          userId,
        ),
      );
    }

    if (body.bankLagDays !== undefined) {
      savePromises.push(
        this.settingsService.setBankLagDays(Number(body.bankLagDays), userId),
      );
    }

    if (body.postingGraceDays !== undefined) {
      savePromises.push(
        this.settingsService.setPostingGraceDays(
          Number(body.postingGraceDays),
          userId,
        ),
      );
    }

    if (parsedTiers !== null) {
      savePromises.push(
        this.settingsService.setCommissionPayoutTiers(parsedTiers, userId),
      );
    }

    if (body.invoiceFooterText !== undefined) {
      savePromises.push(
        this.settingsService.setInvoiceFooterText(body.invoiceFooterText, userId),
      );
    }

    await Promise.all(savePromises);

    return { ok: true, message: 'Settings saved successfully' };
  }
}

