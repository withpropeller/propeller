export enum AuditAction {
    ApprovalAccept = 'approval.accept',
    ApprovalDecline = 'approval.decline',

    SecretKeyCreate = 'secret-key.create',
    SecretKeyDelete = 'secret-key.delete',
    SecretKeyUpdate = 'secret-key.update',

    CardUnlink = 'card.unlink',

    CardProgramCreate = 'card-program.create',
    CardProgramDelete = 'card-program.delete',
    CardProgramUpdate = 'card-program.update',
    CardProgramApprove = 'card-program.approve',
    CardProgramPersonalise = 'card-program.personalise',
    CardProgramGoLive = 'card-program.go-live',
    CardProgramUnlink = 'card-program.unlink',

    CardAuthorizationRefund = 'card.authorization.refund',
    CardAuthorizationReverseLien = 'card.authorization.reverse-lien',
    CardAuthorizationDebitLien = 'card.authorization.debit-lien',
    CardAuthorizationForceReversal = 'card.authorization.force-reversal',

    WebhookCreate = 'webhook.create',
    WebhookDelete = 'webhook.delete',
    WebhookReadSecret = 'webhook.read.secret',

    ShippingAddressCreate = 'shipping.create',
    ShippingAddressDelete = 'shipping.delete',

    PaymentForceCharge = 'payment.force-charge',
    PaymentChargeBilling = 'payment.charge-billing',
    PaymentRefund = 'payment.refund',
    PaymentReserve = 'payment.reserve',
    PaymentReverseLien = 'payment.reverse-lien',
    PaymentRequeue = 'payment.requeue',
    PaymentReserveRequeue = 'payment.reserve.validate',
    PaymentValidate = 'payment.validate',
    PaymentUpdateProcessorData = 'payment.update.processor-data',
    PaymentReserveValidate = 'payment.reserve.validate',

    DisputeUpdate = 'dispute.update',
    DisputeClose = 'dispute.close',
    DisputeResolve = 'dispute.resolve',
    DisputeReopen = 'dispute.reopen',

    ProvidusRepushSettlement = 'tools.providus.repush.settlement',
    ToolsSettingsUpdateTransfer = 'tools.settings.update.transfer',

    ToolsMerchantCreate = 'tool.merchant.create',
    ToolsMerchantUpdate = 'tool.merchant.update',
    ToolsMerchantUpdateIconUpload = 'tool.merchant.update.icon-upload',
    ToolsMerchantDelete = 'tool.merchant.delete',

    ToolsBillProductCreate = 'tool.bill-product.create',
    ToolsBillProductRead = 'tool.bill-product.read',
    ToolsBillProductUpdate = 'tool.bill-product.update',
    ToolsBillProductUpdateIconUpload = 'tool.bill-product.update.icon-upload',
    ToolsBillProductDelete = 'tool.bill-product.delete',

    ReserveAccountCreate = 'reserve-account.create',
    ReserveAccountDebit = 'reserve-account.debit',
    ReserveAccountCredit = 'reserve-account.credit',
    ReserveAccountAddDepositChannel = 'reserve-account.add-deposit-channel',

    SettlementAccountTransfer = 'settlement-account.transfer',
}

export enum AuditObjectModel {
    AccessKey = 'AccessKey',
    Approval = 'Approval',
    CardProgram = 'CardProgram',
    CardAuthorization = 'CardAuthorization',
    Webhook = 'Webhook',
    ShippingAddress = 'ShippingAddress',
    Payment = 'Payment',
    Billing = 'Billing',
    ReservePayment = 'ReservePayment',
    Dispute = 'Dispute',
    Merchant = 'Merchant',
    BillProduct = 'BillProduct',
    ReserveAccount = 'ReserveAccount',
    SettlementAccount = 'SettlementAccount',
}
