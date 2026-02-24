export const PERMISSIONS = {
    USERS_READ: 'users.read',
    USERS_WRITE: 'users.write',
  
    ROLES_READ: 'roles.read',
    ROLES_WRITE: 'roles.write',
  
    PERMISSIONS_READ: 'permissions.read',
    PERMISSIONS_WRITE: 'permissions.write',
  
    ORDERS_READ: 'orders.read',
    ORDERS_WRITE: 'orders.write',
  
    CANDIDATES_READ: 'candidates.read',
    CANDIDATES_WRITE: 'candidates.write',

    ASSIGNMENTS_READ: 'assignments.read',
    ASSIGNMENTS_WRITE: 'assignments.write',
  
    HOURS_READ: 'hours.read',
    HOURS_WRITE: 'hours.write',
    HOURS_READ_ALL: 'hours.read.all',
    HOURS_READ_SELF: 'hours.read.self',
    HOURS_RESOLVE_REJECTED: 'hours.resolve.rejected',

    companies: {
        read: 'companies.read',
        write: 'companies.write',
      },
      companySignals: {
        read: 'companySignals.read',
        write: 'companySignals.write',
      },
      callLogs: {
        read: 'callLogs.read',
        write: 'callLogs.write',
      },
   

    CUSTOMERS_READ: 'customers.read',
    CUSTOMERS_WRITE: 'customers.write',

    // CUST-REL-01: Customer Contacts
    CUSTOMER_CONTACTS_READ: 'customerContacts.read',
    CUSTOMER_CONTACTS_WRITE: 'customerContacts.write',

    CUSTOMER_PORTAL_ACCESS: 'customer.portal.access',
    ORDERS_READ_CUSTOMER: 'orders.read.customer',
    HOURS_READ_CUSTOMER: 'hours.read.customer',
    HOURS_APPROVE_CUSTOMER: 'hours.approve.customer',
    INVOICES_READ_CUSTOMER: 'invoices.read.customer',
    PAYMENTS_READ_CUSTOMER: 'payments.read.customer',
    COMMISSIONS_READ: 'commissions.read',
    COMMISSIONS_WRITE: 'commissions.write',
    COMMISSION_EXPORT: 'commissions.export',

    PAYMENTS_WRITE: 'payments.write',

  } as const;
  
  export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
  

  
