import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  ValidateIf,
  Min,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  Validate,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isEitherTotalMinutesOrBothTimes', async: false })
export class IsEitherTotalMinutesOrBothTimesConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const obj = args.object as EmployeeHoursSelfReportSubmitDto;
    const hasTotalMinutes = obj.totalMinutes !== undefined && obj.totalMinutes !== null;
    const hasStartTime = obj.startTime !== undefined && obj.startTime !== null;
    const hasEndTime = obj.endTime !== undefined && obj.endTime !== null;

    // Require EITHER totalMinutes OR both startTime and endTime
    if (hasTotalMinutes) {
      return true;
    }
    if (hasStartTime && hasEndTime) {
      return true;
    }
    return false;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'Either totalMinutes must be provided, or both startTime and endTime must be provided.';
  }
}

@ValidatorConstraint({ name: 'endTimeAfterStartTime', async: false })
export class EndTimeAfterStartTimeConstraint
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean {
    const obj = args.object as EmployeeHoursSelfReportSubmitDto;
    if (obj.startTime && obj.endTime) {
      const start = new Date(obj.startTime);
      const end = new Date(obj.endTime);
      return end > start;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    return 'endTime must be after startTime';
  }
}

export class EmployeeHoursSelfReportSubmitDto {
  @IsString()
  @IsDateString()
  workDate: string;

  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'totalMinutes must be greater than 0' })
  totalMinutes?: number;

  @ValidateIf((o) => o.startTime !== undefined || o.endTime !== undefined)
  @IsString()
  @IsDateString()
  startTime?: string;

  @ValidateIf((o) => o.startTime !== undefined || o.endTime !== undefined)
  @IsString()
  @IsDateString()
  @Validate(EndTimeAfterStartTimeConstraint)
  endTime?: string;

  @IsOptional()
  @IsString()
  note?: string;

  // Virtual property for class-level validation (either/or rule)
  @Validate(IsEitherTotalMinutesOrBothTimesConstraint)
  _eitherOr?: any; // Optional dummy property to trigger class-level validation
}

