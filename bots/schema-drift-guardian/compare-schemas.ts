import { PrismaEnum, PrismaField, PrismaSchema } from './discover-prisma';

export type DriftSeverity = 'HIGH' | 'MED' | 'LOW';

export type DriftFinding = {
  severity: DriftSeverity;
  message: string;
  kind:
    | 'missing-table'
    | 'missing-column'
    | 'type-mismatch'
    | 'enum-mismatch'
    | 'extra-column';
  model?: string;
  field?: string;
};

export type DriftResult = {
  findings: DriftFinding[];
  summary: {
    high: number;
    med: number;
    low: number;
    total: number;
  };
};

export function compareSchemas(
  prismaSchema: PrismaSchema,
  dbSchema: PrismaSchema
): DriftResult {
  const findings: DriftFinding[] = [];

  for (const modelName of Object.keys(prismaSchema.models)) {
    const prismaModel = prismaSchema.models[modelName];
    if (prismaModel.ignored) {
      continue;
    }

    const dbModel = dbSchema.models[modelName];
    if (!dbModel) {
      findings.push({
        severity: 'HIGH',
        kind: 'missing-table',
        model: modelName,
        message: `Missing table: ${modelName}`,
      });
      continue;
    }

    for (const fieldName of prismaModel.fieldOrder) {
      const prismaField = prismaModel.fields[fieldName];
      if (!prismaField || prismaField.ignored) {
        continue;
      }

      const dbField = dbModel.fields[fieldName];
      if (!dbField) {
        findings.push({
          severity: 'HIGH',
          kind: 'missing-column',
          model: modelName,
          field: fieldName,
          message: `Missing column: ${modelName}.${fieldName}`,
        });
        continue;
      }

      if (!fieldTypeMatches(prismaField, dbField)) {
        findings.push({
          severity: 'MED',
          kind: 'type-mismatch',
          model: modelName,
          field: fieldName,
          message: `Type mismatch: ${modelName}.${fieldName} (Prisma: ${formatFieldType(
            prismaField
          )}, DB: ${formatFieldType(dbField)})`,
        });
      }
    }

    for (const dbFieldName of dbModel.fieldOrder) {
      if (!prismaModel.fields[dbFieldName]) {
        findings.push({
          severity: 'LOW',
          kind: 'extra-column',
          model: modelName,
          field: dbFieldName,
          message: `Extra DB column: ${modelName}.${dbFieldName}`,
        });
      }
    }
  }

  compareEnums(prismaSchema.enums, dbSchema.enums, findings);

  const summary = summarizeFindings(findings);
  return { findings, summary };
}

function compareEnums(
  prismaEnums: Record<string, PrismaEnum>,
  dbEnums: Record<string, PrismaEnum>,
  findings: DriftFinding[]
): void {
  for (const enumName of Object.keys(prismaEnums)) {
    const prismaEnum = prismaEnums[enumName];
    const dbEnum = dbEnums[enumName];

    if (!dbEnum) {
      findings.push({
        severity: 'MED',
        kind: 'enum-mismatch',
        message: `Enum mismatch: ${enumName} missing in DB schema`,
      });
      continue;
    }

    const missingValues = prismaEnum.values.filter(
      (value) => !dbEnum.values.includes(value)
    );
    const extraValues = dbEnum.values.filter(
      (value) => !prismaEnum.values.includes(value)
    );

    if (missingValues.length > 0 || extraValues.length > 0) {
      const detailParts = [];
      if (missingValues.length > 0) {
        detailParts.push(`missing values: ${missingValues.join(', ')}`);
      }
      if (extraValues.length > 0) {
        detailParts.push(`extra values: ${extraValues.join(', ')}`);
      }

      findings.push({
        severity: 'MED',
        kind: 'enum-mismatch',
        message: `Enum mismatch: ${enumName} (${detailParts.join('; ')})`,
      });
    }
  }
}

function fieldTypeMatches(a: PrismaField, b: PrismaField): boolean {
  return (
    a.type === b.type &&
    a.isList === b.isList &&
    a.isOptional === b.isOptional
  );
}

function formatFieldType(field: PrismaField): string {
  const optionalSuffix = field.isOptional ? '?' : '';
  const listSuffix = field.isList ? '[]' : '';
  return `${field.type}${listSuffix}${optionalSuffix}`;
}

function summarizeFindings(findings: DriftFinding[]): DriftResult['summary'] {
  const summary = {
    high: 0,
    med: 0,
    low: 0,
    total: findings.length,
  };

  for (const finding of findings) {
    if (finding.severity === 'HIGH') {
      summary.high += 1;
    } else if (finding.severity === 'MED') {
      summary.med += 1;
    } else {
      summary.low += 1;
    }
  }

  return summary;
}
