import { SecretKeyPermissions } from '@api/secret-keys';
import { ApiVersion } from '@core/helpers';
import { Types } from 'mongoose';

export enum AccessKeyScopes {
    identityRead = 'identity.read',
    CreditRead = 'credit.read',
}

export enum AccessKeyTag {
    MachineKey = 'mk',
    RecoveryKey = 'rk',
    LiveKey = 'sk.live',
    TestKey = 'sk.test',
    WebhookSigningKey = 'wsk',
}

export enum AccessKeyType {
    SecretKey = 'secret-key',
    MachineKey = 'machine-key',
}

export interface AccessKey {
    type: AccessKeyType;
    id?: string;
    initiator?: string;
    name: string;
    scopes: SecretKeyPermissions[];
    businessId: Types.ObjectId;
    apiVersion?: ApiVersion;
    requestId: Types.ObjectId;
    grpEnabled: boolean;
    cidrWhitelist: string[];
}
