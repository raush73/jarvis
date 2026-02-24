import "dotenv/config";
import { PrismaClient } from "@prisma/client";



const prisma = new PrismaClient();


async function main() {
  const roles = [
    { name: "admin", description: "System administrator" },
    { name: "recruiting", description: "Recruiting team" },
    { name: "sales", description: "Sales team" },
    { name: "accounting", description: "Accounting team" },
    { name: "customer", description: "Customer user" },
    { name: "worker", description: "Field worker" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  // PERMISSIONS
  const permissions = [
    { key: "users.read", description: "Read users" },
    { key: "users.write", description: "Create/update users" },

    { key: "roles.read", description: "Read roles" },
    { key: "roles.write", description: "Create/update roles" },

    { key: "permissions.read", description: "Read permissions" },
    { key: "permissions.write", description: "Create/update permissions" },

    { key: "orders.read", description: "Read orders" },
    { key: "orders.write", description: "Create/update orders" },

    { key: "customers.read", description: "Read customers" },
{ key: "customers.write", description: "Create/update customers" },

{ key: "companies.read", description: "Read companies" },
{ key: "companies.write", description: "Create/update companies" },

{ key: "companySignals.read", description: "Read company signals" },
{ key: "companySignals.write", description: "Create/update company signals" },

    { key: "candidates.read", description: "Read candidates" },
    { key: "candidates.write", description: "Create/update candidates" },

    { key: "hours.read", description: "Read hours" },
    { key: "hours.write", description: "Create/update hours" },
    { key: "hours.read.all", description: "Read all hours entries" },
    { key: "hours.read.self", description: "Read own hours entries only" },
    { key: "hours.resolve.rejected", description: "Resolve rejected hours entries" },
    { key: "customer.portal.access", description: "Access customer portal" },
    { key: "orders.read.customer", description: "Read orders as customer" },
    { key: "hours.read.customer", description: "Read hours as customer" },
    { key: "hours.approve.customer", description: "Approve hours as customer" },
    { key: "invoices.read.customer", description: "Read invoices as customer" },
    { key: "payments.read.customer", description: "Read payments as customer" },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: {},
      create: p,
    });
  }

  // ROLE -> PERMISSION MAPPING
  const allPermissions = await prisma.permission.findMany();

  const admin = await prisma.role.findUnique({ where: { name: "admin" } });
  if (!admin) throw new Error("admin role not found");

  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: admin.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: admin.id,
        permissionId: perm.id,
      },
    });
  }

  console.log("✅ Roles seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
