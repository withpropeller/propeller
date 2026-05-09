import { Inject, Injectable, Scope } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Repository, RepositoryFactory } from '@core/abstracts/repository';
import { GetModelTag, GetTenantDataSource, TagMongoId, TenantRequestPayload } from '@core/helpers';
import { REQUEST, ModuleRef } from '@nestjs/core';
import { Request } from 'express';
import * as DeviceDetector from 'device-detector-js';
import { getClientIp } from 'request-ip';
import { AdminAudit, AuditParams } from './admin-audit.schema';
import { ReporterService } from '@common/services/reporter.service';
import { AuditAction, AuditObjectModel } from './audit.enums';
import { Admin } from '@api/admins/admin.schema';
import { ExecutionOptions } from '@common/interfaces';
import { HydratedDocument, Types } from 'mongoose';
import { ReserveAccount } from '@api/reserve-accounts/reserve-accounts.schema';

@Injectable({ scope: Scope.REQUEST, durable: true })
export class AdminAuditService {
    public repo: Repository<AdminAudit>;
    private deviceDetector: DeviceDetector;

    constructor(
        @Inject(REQUEST) private request: TenantRequestPayload,
        private moduleRef: ModuleRef,
        private reporter: ReporterService,
    ) {
        const model = this.moduleRef.get(getModelToken(AdminAudit.name, GetTenantDataSource(this.request)), {
            strict: false,
        });
        this.repo = RepositoryFactory<AdminAudit>(model);
        this.deviceDetector = new DeviceDetector();
    }

    create(data: Partial<AdminAudit>, req: Request, options?: ExecutionOptions) {
        const ipAddress = getClientIp(req);
        const deviceData = this.deviceDetector.parse(req.headers['user-agent']);

        data.source = { ipAddress, ...deviceData };
        this.repo.createAndSave(data, options);
    }

    async registerAuditObj(params: AuditParams) {
        const entity = {
            actor: params.actor,
            action: params.action,
            object: params.object,
            objectRef: params.objectRef,
            data: params.data,
        };

        await this.create(entity, params.req, params.options);

        const buildMessage = () => {
            if (params.message) return params.message;

            const name = `${params.actor.firstName} ${params.actor.lastName}`;
            const objectTag = GetModelTag(params.objectRef);

            if (objectTag && params.object) {
                return `${name}(${params.actor.email}) performed an audit action of ${
                    entity.action
                } on object ${TagMongoId(objectTag, params.object)}`;
            }

            return `${name}(${params.actor.email}) performed an audit action of ${entity.action}`;
        };

        if (params.options?.dryRun) {
            this.reporter.pushInfo({ message: buildMessage() });
        }
    }

    async registerAudit(
        action: AuditAction,
        object: Types.ObjectId,
        objectRef: AuditObjectModel,
        actor: Admin,
        req: Request,
        data?: any,
        options?: ExecutionOptions,
        message?: string,
    ) {
        return this.registerAuditObj({ action, object, objectRef, actor, req, data, options, message });
    }

    async registerPaymentForceCharge(paymentId: Types.ObjectId, actor: Admin, req: Request) {
        return this.registerAudit(AuditAction.PaymentForceCharge, paymentId, AuditObjectModel.Payment, actor, req);
    }

    async registerPaymentChargeBilling(billingId: Types.ObjectId, actor: Admin, req: Request) {
        return this.registerAudit(AuditAction.PaymentChargeBilling, billingId, AuditObjectModel.Billing, actor, req);
    }

    async registerPaymentRefund(paymentId: Types.ObjectId, actor: Admin, req: Request) {
        return this.registerAudit(AuditAction.PaymentRefund, paymentId, AuditObjectModel.Payment, actor, req);
    }

    async registerPaymentRequeue(paymentId: Types.ObjectId, actor: Admin, req: Request, options?: ExecutionOptions) {
        return this.registerAudit(
            AuditAction.PaymentRequeue,
            paymentId,
            AuditObjectModel.Payment,
            actor,
            req,
            undefined,
            options,
        );
    }

    async registerPaymentValidate(paymentId: Types.ObjectId, actor: Admin, req: Request, options?: ExecutionOptions) {
        return this.registerAudit(
            AuditAction.PaymentValidate,
            paymentId,
            AuditObjectModel.Payment,
            actor,
            req,
            undefined,
            options,
        );
    }

    async registerPaymentUpdateProcessorData(
        paymentId: Types.ObjectId,
        actor: Admin,
        data: any,
        req: Request,
        options?: ExecutionOptions,
    ) {
        return this.registerAudit(
            AuditAction.PaymentUpdateProcessorData,
            paymentId,
            AuditObjectModel.Payment,
            actor,
            req,
            data,
            options,
        );
    }

    async registerPaymentReserveValidate(paymentId: Types.ObjectId, actor: Admin, req: Request) {
        return this.registerAudit(AuditAction.PaymentReserveValidate, paymentId, AuditObjectModel.Payment, actor, req);
    }

    async registerPaymentReserve(paymentId: Types.ObjectId, actor: Admin, req: Request) {
        return this.registerAudit(AuditAction.PaymentReserve, paymentId, AuditObjectModel.ReservePayment, actor, req);
    }

    async registerPaymentReserveRequeue(paymentId: Types.ObjectId, actor: Admin, req: Request) {
        return this.registerAudit(
            AuditAction.PaymentReserveRequeue,
            paymentId,
            AuditObjectModel.ReservePayment,
            actor,
            req,
        );
    }

    async registerCardProgramUpdate(id: Types.ObjectId, actor: Admin, req: Request, data?: any) {
        return this.registerAudit(AuditAction.CardProgramUpdate, id, AuditObjectModel.CardProgram, actor, req, data);
    }

    async registerCardProgramApprove(cardProgramId: Types.ObjectId, actor: Admin, req: Request, data: any) {
        return this.registerAudit(
            AuditAction.CardProgramApprove,
            cardProgramId,
            AuditObjectModel.CardProgram,
            actor,
            req,
            data,
        );
    }

    async registerCardProgramUpdatePersonalise(cardProgramId: Types.ObjectId, actor: Admin, req: Request, data: any) {
        return this.registerAudit(
            AuditAction.CardProgramPersonalise,
            cardProgramId,
            AuditObjectModel.CardProgram,
            actor,
            req,
            data,
        );
    }

    async registerCardUnlink(cardId: Types.ObjectId, actor: Admin, req: Request, data?: any) {
        return this.registerAudit(AuditAction.CardUnlink, cardId, AuditObjectModel.CardProgram, actor, req, data);
    }

    async registerCardProgramGoLive(cardProgramId: Types.ObjectId, actor: Admin, req: Request) {
        return this.registerAudit(
            AuditAction.CardProgramGoLive,
            cardProgramId,
            AuditObjectModel.CardProgram,
            actor,
            req,
        );
    }

    async registerCardProgramUnlink(cardProgramId: Types.ObjectId, actor: Admin, req: Request) {
        return this.registerAudit(
            AuditAction.CardProgramUnlink,
            cardProgramId,
            AuditObjectModel.CardProgram,
            actor,
            req,
        );
    }

    async registerCardAuthRefund(cardAuthId: Types.ObjectId, actor: Admin, req: Request, options?: ExecutionOptions) {
        return this.registerAudit(
            AuditAction.CardAuthorizationRefund,
            cardAuthId,
            AuditObjectModel.CardAuthorization,
            actor,
            req,
            null,
            options,
        );
    }

    async registerPaymentReverseLien(cardAuthId: Types.ObjectId, actor: Admin, req: Request) {
        return this.registerAudit(
            AuditAction.CardAuthorizationReverseLien,
            cardAuthId,
            AuditObjectModel.CardAuthorization,
            actor,
            req,
        );
    }

    async registerCardAuthReverseLien(cardAuthId: Types.ObjectId, actor: Admin, req: Request) {
        return this.registerAudit(
            AuditAction.CardAuthorizationReverseLien,
            cardAuthId,
            AuditObjectModel.CardAuthorization,
            actor,
            req,
        );
    }

    async registerCardAuthDebitLien(
        cardAuthId: Types.ObjectId,
        actor: Admin,
        req: Request,
        options?: ExecutionOptions,
    ) {
        return this.registerAudit(
            AuditAction.CardAuthorizationDebitLien,
            cardAuthId,
            AuditObjectModel.CardAuthorization,
            actor,
            req,
            null,
            options,
        );
    }

    async registerCardAuthForceReversal(
        cardAuthId: Types.ObjectId,
        actor: Admin,
        req: Request,
        options?: ExecutionOptions,
    ) {
        return this.registerAudit(
            AuditAction.CardAuthorizationForceReversal,
            cardAuthId,
            AuditObjectModel.CardAuthorization,
            actor,
            req,
            null,
            options,
        );
    }

    async registerApprovalAccept(
        id: Types.ObjectId,
        actor: Admin,
        req: Request,
        options?: ExecutionOptions,
        reportMessage?: string,
    ) {
        return this.registerAudit(
            AuditAction.ApprovalAccept,
            id,
            AuditObjectModel.Approval,
            actor,
            req,
            undefined,
            options,
            reportMessage,
        );
    }

    async registerApprovalDecline(
        id: Types.ObjectId,
        actor: Admin,
        req: Request,
        options?: ExecutionOptions,
        reportMessage?: string,
    ) {
        return this.registerAudit(
            AuditAction.ApprovalDecline,
            id,
            AuditObjectModel.Approval,
            actor,
            req,
            undefined,
            options,
            reportMessage,
        );
    }

    async registerDisputeUpdate(id: Types.ObjectId, actor: Admin, req: Request, data?: any) {
        return this.registerAudit(AuditAction.DisputeUpdate, id, AuditObjectModel.Dispute, actor, req, data);
    }

    async registerDisputeClose(id: Types.ObjectId, actor: Admin, req: Request, data?: any) {
        return this.registerAudit(AuditAction.DisputeClose, id, AuditObjectModel.Dispute, actor, req, data);
    }

    async registerDisputeResolve(id: Types.ObjectId, actor: Admin, req: Request, data?: any) {
        return this.registerAudit(AuditAction.DisputeResolve, id, AuditObjectModel.Dispute, actor, req, data);
    }

    async registerDisputeReopen(id: Types.ObjectId, actor: Admin, req: Request, data?: any) {
        return this.registerAudit(AuditAction.DisputeReopen, id, AuditObjectModel.Dispute, actor, req, data);
    }

    async registerProvidusRepushSettlement(data: any, actor: Admin, req: Request) {
        return this.registerAudit(AuditAction.ProvidusRepushSettlement, undefined, undefined, actor, req, data);
    }

    async registerToolsSettingsUpdateTransfer(data: any, actor: Admin, req: Request) {
        return this.registerAudit(AuditAction.ToolsSettingsUpdateTransfer, undefined, undefined, actor, req, data);
    }

    async registerToolsMerchantCreate(id: Types.ObjectId, data: any, actor: Admin, req: Request) {
        return this.registerAudit(AuditAction.ToolsMerchantCreate, id, AuditObjectModel.Merchant, actor, req, data);
    }

    async registerToolsMerchantUpdate(id: Types.ObjectId, data: any, actor: Admin, req: Request) {
        return this.registerAudit(AuditAction.ToolsMerchantUpdate, id, AuditObjectModel.Merchant, actor, req, data);
    }

    async registerToolsMerchantUpdateUpload(id: Types.ObjectId, actor: Admin, req: Request) {
        return this.registerAudit(
            AuditAction.ToolsMerchantUpdateIconUpload,
            id,
            AuditObjectModel.Merchant,
            actor,
            req,
            undefined,
        );
    }

    async registerToolsMerchantDelete(id: Types.ObjectId, actor: Admin, req: Request) {
        return this.registerAudit(
            AuditAction.ToolsMerchantDelete,
            id,
            AuditObjectModel.Merchant,
            actor,
            req,
            undefined,
        );
    }

    async registerToolsBillProductCreate(id: Types.ObjectId, data: any, actor: Admin, req: Request) {
        return this.registerAudit(
            AuditAction.ToolsBillProductCreate,
            id,
            AuditObjectModel.BillProduct,
            actor,
            req,
            data,
        );
    }

    async registerToolsBillProductRead(id: Types.ObjectId, actor: Admin, req: Request) {
        return this.registerAudit(
            AuditAction.ToolsBillProductRead,
            id,
            AuditObjectModel.BillProduct,
            actor,
            req,
            undefined,
        );
    }

    async registerToolsBillProductUpdate(id: Types.ObjectId, data: any, actor: Admin, req: Request) {
        return this.registerAudit(
            AuditAction.ToolsBillProductUpdate,
            id,
            AuditObjectModel.BillProduct,
            actor,
            req,
            data,
        );
    }

    async registerToolsBillProductUpdateUpload(id: Types.ObjectId, actor: Admin, req: Request) {
        return this.registerAudit(
            AuditAction.ToolsBillProductUpdateIconUpload,
            id,
            AuditObjectModel.BillProduct,
            actor,
            req,
            undefined,
        );
    }

    async registerToolsBillProductDelete(id: Types.ObjectId, actor: Admin, req: Request) {
        return this.registerAudit(
            AuditAction.ToolsBillProductDelete,
            id,
            AuditObjectModel.BillProduct,
            actor,
            req,
            undefined,
        );
    }

    async registerReserveAccountCreate(
        object: Types.ObjectId,
        actor: Admin,
        req: Request,
        data: any,
        message?: string,
    ) {
        return this.registerAuditObj({
            action: AuditAction.ReserveAccountCreate,
            object,
            objectRef: AuditObjectModel.ReserveAccount,
            actor,
            req,
            data,
            message,
        });
    }

    async registerReserveAccountDebit(object: Types.ObjectId, actor: Admin, req: Request, data: any, message?: string) {
        return this.registerAuditObj({
            action: AuditAction.ReserveAccountDebit,
            object,
            objectRef: AuditObjectModel.ReserveAccount,
            actor,
            req,
            data,
            message,
        });
    }

    async registerReserveAccountCredit(
        object: Types.ObjectId,
        actor: Admin,
        req: Request,
        data: any,
        message?: string,
    ) {
        return this.registerAuditObj({
            action: AuditAction.ReserveAccountCredit,
            object,
            objectRef: AuditObjectModel.ReserveAccount,
            actor,
            req,
            data,
            message,
        });
    }

    async registerSettlementAccountTransfer(
        object: Types.ObjectId,
        actor: Admin,
        req: Request,
        data: any,
        message?: string,
    ) {
        return this.registerAuditObj({
            action: AuditAction.SettlementAccountTransfer,
            object,
            objectRef: AuditObjectModel.SettlementAccount,
            actor,
            req,
            data,
            message,
        });
    }

    async registerReserveAccountAddDepositChannel(
        object: HydratedDocument<ReserveAccount>,
        actor: Admin,
        req: Request,
        data: any,
        options?: ExecutionOptions,
    ) {
        const message = `${actor.firstName} ${actor.lastName}(${actor.email}) added deposit channel: ${data.type} to reserve account: ${object.name}`;

        return this.registerAuditObj({
            action: AuditAction.ReserveAccountAddDepositChannel,
            object: object._id,
            objectRef: AuditObjectModel.ReserveAccount,
            actor,
            req,
            data,
            message,
            options,
        });
    }
}
