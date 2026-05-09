export enum ModelIdTag {
  ApiRequest = 'req',
  Balance = 'bal',
  BalanceHistory = 'bal.h',
  Business = 'bz',
  BusinessEntity = 'bze',
  User = 'usr',
  Customer = 'cus',
  Webhook = 'wh',
  Account = 'ac',
  AccountLog = 'ac.log',
  LedgerEntry = 'le',
  Payment = 'p',
  PaymentRequest = 'p.req',
  PaymentAuthorization = 'p.auth',
  Event = 'evt',
  EventAttempt = 'evt.a',
  Request = 'req',
  Log = 'log',
  Configuration = 'cfg',
  Fee = 'fee',
  SecretKey = 'sk',
}

export enum MongoErrors {
  Conflict = 'conflict',
  NotFound = 'not-found',
  InvalidObjectId = 'invalid-object-id',
}
