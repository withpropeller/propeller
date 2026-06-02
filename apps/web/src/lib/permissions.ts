export interface ExpandedRole {
  id: string
  name: string
  slug: string
  type: string
  permissions: string[]
  createdAt: string
  updatedAt: string
}

function matchPermission(pattern: string, required: string): boolean {
  if (pattern === required) return true
  if (pattern.endsWith('.*')) {
    const prefix = pattern.slice(0, -2)
    return required === prefix || required.startsWith(prefix + '.')
  }
  return false
}

export function hasPermission(roles: ExpandedRole[], required: string): boolean {
  return roles.some(role =>
    role.permissions.some(pattern => matchPermission(pattern, required))
  )
}

export enum Permission {
  // Business
  Business = 'business.*',
  BusinessRead = 'business.read',
  BusinessUpdate = 'business.update',

  // Business KYC
  BusinessKyc = 'business-kyc.*',
  BusinessKycRead = 'business-kyc.read',
  BusinessKycUpdate = 'business-kyc.update',

  // Secret Keys
  SecretKey = 'secret-key.*',
  SecretKeyRead = 'secret-key.read',
  SecretKeyCreate = 'secret-key.create',
  SecretKeyDelete = 'secret-key.delete',

  // Approvals
  Approvals = 'approvals.*',
  ApprovalsRead = 'approvals.read',
  ApprovalsUpdate = 'approvals.update',

  // Team
  Team = 'team.*',
  TeamReadMembers = 'team.read.members',
  TeamCreateInvite = 'team.create.invite',
  TeamDeleteInvite = 'team.delete.invite',
  TeamUpdateMember = 'team.update.member',

  // Accounts
  Accounts = 'accounts.*',
  AccountsRead = 'accounts.read',
  AccountsCreate = 'accounts.create',
  AccountsUpdate = 'accounts.update',
  AccountsReadBalance = 'accounts.read.balance',
  AccountsReadLogs = 'accounts.read.logs',
  AccountsUpdateDepositChannel = 'accounts.update.deposit-channel',

  // Billings
  Billings = 'billings.*',
  BillingsRead = 'billings.read',
  BillingsUpdate = 'billings.update',

  // Payments
  Payments = 'payments.*',
  PaymentsRead = 'payments.read',
  PaymentsPayoutCreate = 'payments.payout.create',
  PaymentsLocalCreate = 'payments.local.create',
  PaymentsBillCreate = 'payments.bill.create',
  PaymentsBillValidate = 'payments.bill.validate',

  // Transfers
  Transfers = 'transfer.*',
  TransfersCreate = 'transfer.create',
  TransfersRead = 'transfer.read',

  // Profile
  Profile = 'profile.*',
  ProfileRead = 'profile.read',
  ProfileUpdate = 'profile.update',

  // Tools
  Tools = 'tools.*',
  ToolsBanks = 'tools.banks.*',
  ToolsBanksRead = 'tools.banks.read',
  ToolsFx = 'tools.fx.*',
  ToolsFxRate = 'tools.fx.rate.read',
  ToolsFxQuote = 'tools.fx.quote.read',

  // Audit
  Audit = 'audit.*',
  AuditRead = 'audit.read',

  // Configurations
  Configurations = 'configurations.*',
  ConfigurationsRead = 'configurations.read',
  ConfigurationsUpdate = 'configurations.update',

  // Customers
  Customers = 'customers.*',
  CustomersRead = 'customers.read',
  CustomersCreate = 'customers.create',
  CustomersUpdate = 'customers.update',

  // Events
  Events = 'events.*',
  EventsRead = 'events.read',
  EventsRetry = 'events.update.retry',

  // Webhooks
  Webhooks = 'webhook.*',
  WebhooksRead = 'webhook.read',
  WebhooksCreate = 'webhook.create',
  WebhooksUpdate = 'webhook.update',
  WebhooksDelete = 'webhook.delete',

  // Logs
  ApiLogs = 'api-logs.*',
  ApiLogsRead = 'api-logs.read',
  Logs = 'logs.*',
  LogsRead = 'logs.read',

  // Simulation
  Simulation = 'simulation.*',
  SimulationCreate = 'simulation.create',
}
