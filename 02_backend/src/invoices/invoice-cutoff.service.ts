import { Injectable } from '@nestjs/common';

type ChicagoParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

interface GetCutoffForInvoicePeriodInput {
  periodEnd: Date;
  holidayWeek?: boolean;
}

@Injectable()
export class InvoiceCutoffService {
  /**
   * Get invoice approval cutoff datetime in America/Chicago time.
   * Default: Wednesday 8:00 AM CT (same week as periodEnd)
   * Holiday override: Tuesday 8:00 AM CT (same week as periodEnd)
   * "Same week" = the Sunday–Saturday week that contains periodEnd
   *
   * @param input Object with periodEnd (Date) and optional holidayWeek (boolean)
   * @returns JavaScript Date (UTC instant)
   */
  getCutoffForInvoicePeriod({
    periodEnd,
    holidayWeek = false,
  }: GetCutoffForInvoicePeriodInput): Date {
    // Get the Sunday–Saturday week that contains periodEnd (in Chicago time)
    const periodEndChicago = this.getChicagoDateParts(periodEnd);
    const dayOfWeek = this.getDayOfWeekInChicago(periodEnd);

    // Calculate days to subtract to get to Sunday (0 = Sunday, 6 = Saturday)
    const daysToSunday = dayOfWeek;

    // Calculate Sunday date in Chicago time (handle month/year boundaries)
    let sundayDay = periodEndChicago.day - daysToSunday;
    let sundayMonth = periodEndChicago.month;
    let sundayYear = periodEndChicago.year;

    // Handle day underflow (goes to previous month)
    while (sundayDay < 1) {
      sundayMonth--;
      if (sundayMonth < 1) {
        sundayMonth = 12;
        sundayYear--;
      }
      // Get days in the previous month
      const daysInPrevMonth = new Date(sundayYear, sundayMonth, 0).getDate();
      sundayDay += daysInPrevMonth;
    }

    // Determine target day: Tuesday (2) if holidayWeek, Wednesday (3) otherwise
    const targetDayOfWeek = holidayWeek ? 2 : 3;

    // Calculate the target date (Sunday + targetDayOfWeek days)
    let targetDay = sundayDay + targetDayOfWeek;
    let targetMonth = sundayMonth;
    let targetYear = sundayYear;

    // Handle day overflow (goes to next month)
    const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
    if (targetDay > daysInTargetMonth) {
      targetDay -= daysInTargetMonth;
      targetMonth++;
      if (targetMonth > 12) {
        targetMonth = 1;
        targetYear++;
      }
    }

    // Construct cutoff datetime in Chicago time
    const cutoffChicago: ChicagoParts = {
      year: targetYear,
      month: targetMonth,
      day: targetDay,
      hour: 8,
      minute: 0,
      second: 0,
    };

    // Convert to UTC Date
    return this.chicagoPartsToUtcDate(cutoffChicago);
  }

  /**
   * Get Chicago time parts for a given UTC Date
   */
  private getChicagoDateParts(date: Date): ChicagoParts {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const partsMap = new Map(parts.map((p) => [p.type, p.value]));

    return {
      year: parseInt(partsMap.get('year') || '0', 10),
      month: parseInt(partsMap.get('month') || '0', 10),
      day: parseInt(partsMap.get('day') || '0', 10),
      hour: parseInt(partsMap.get('hour') || '0', 10),
      minute: parseInt(partsMap.get('minute') || '0', 10),
      second: parseInt(partsMap.get('second') || '0', 10),
    };
  }

  /**
   * Get day of week in Chicago time (0 = Sunday, 6 = Saturday)
   */
  private getDayOfWeekInChicago(date: Date): number {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      weekday: 'short',
    });

    const weekday = formatter.format(date);
    const dayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    return dayMap[weekday] ?? 0;
  }

  /**
   * Convert ChicagoParts to UTC Date
   * Creates an initial UTC guess, then adjusts for Chicago offset
   */
  private chicagoPartsToUtcDate(parts: ChicagoParts): Date {
    // Create initial UTC guess (treating the Chicago time as if it were UTC)
    const utcGuess = new Date(
      Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second,
      ),
    );

    // Get what Chicago time this UTC guess actually represents
    const actualChicagoParts = this.getChicagoDateParts(utcGuess);

    // Calculate the difference between desired and actual Chicago time components
    // We want: parts (desired Chicago time)
    // We have: actualChicagoParts (actual Chicago time for this UTC instant)

    // Calculate difference in milliseconds by comparing the time components
    // Create date objects for comparison (both in UTC, representing the Chicago times)
    const desiredChicagoAsUtc = new Date(
      Date.UTC(
        parts.year,
        parts.month - 1,
        parts.day,
        parts.hour,
        parts.minute,
        parts.second,
      ),
    );

    const actualChicagoAsUtc = new Date(
      Date.UTC(
        actualChicagoParts.year,
        actualChicagoParts.month - 1,
        actualChicagoParts.day,
        actualChicagoParts.hour,
        actualChicagoParts.minute,
        actualChicagoParts.second,
      ),
    );

    // The difference in milliseconds between desired and actual Chicago time
    // If actual is earlier than desired, we need to add time to UTC
    // If actual is later than desired, we need to subtract time from UTC
    const diffMs = desiredChicagoAsUtc.getTime() - actualChicagoAsUtc.getTime();

    // Adjust the UTC guess by the difference
    return new Date(utcGuess.getTime() + diffMs);
  }
}

