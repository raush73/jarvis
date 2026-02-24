import { PrismaClient } from '@prisma/client';

export type EffectivePermissionsResult = {
  roles: string[];
  permissions: string[];
};

/**
 * Canonical resolver for a user's effective roles and permissions.
 *
 * Rules:
 * - No side effects
 * - No authorization decisions
 * - Deterministic output
 * - No schema assumptions beyond existing relations
 */
export async function resolveEffectivePermissions(
  prisma: PrismaClient,
  userId: string
): Promise<EffectivePermissionsResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      roles: {
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return { roles: [], permissions: [] };
  }

  const roleNames = new Set<string>();
  const permissionKeys = new Set<string>();

  for (const userRole of user.roles) {
    const role = userRole.role;
    if (!role) continue;

    roleNames.add(role.name);

    for (const rp of role.permissions) {
      if (rp.permission?.key) {
        permissionKeys.add(rp.permission.key);
      }
    }
  }

  return {
    roles: Array.from(roleNames).sort(),
    permissions: Array.from(permissionKeys).sort(),
  };
}
