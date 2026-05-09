import { forwardRef, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { AppException } from '@core/exceptions';
import { catchError, map, Observable, of, timeout } from 'rxjs';
import { GrpcResponseData } from './grpc.response.data';
import { AccountCurrency } from '@api/account/account.enums';

export const ISV_SERVICE_GRPC_TOKEN = 'ISV_SERVICE_GRPC_TOKEN';

export interface GetBalanceRequestDto {
    tenant: string;
    id: string;
    limit?: number;
}

export interface GetBalanceResponse {
    id: string;
    available: number;
    availableChange: number;
    overdraftLimit?: number;
    currency: AccountCurrency;
    mode: number;
    source: string;
    sourceRef: string;
    _meta: any;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBalanceRequestDto {
    tenant: string;
    currency: AccountCurrency;
    pi: string;
    piRef: string;
    business?: string;
}

export interface CreateBalanceResponse {
    balanceId: string;
}

export interface ReverseLienDto {
    balanceId: string;
    transactionId: string;
    lienAmount: number;
}

export interface UpdateOverdraftRequestDto {
    tenant: string;
    id: string;
    overdraftLimit: number;
    source: string;
    sourceRef: string;
}

interface ISVService {
    createBalance(data: CreateBalanceRequestDto): Observable<GrpcResponseData<CreateBalanceResponse>>;
    getBalance(data: GetBalanceRequestDto): Observable<GrpcResponseData<GetBalanceResponse>>;
    getBalance(data: GetBalanceRequestDto): Observable<GrpcResponseData<GetBalanceResponse>>;
    updateOverdraft(data: UpdateOverdraftRequestDto): Observable<GrpcResponseData<GetBalanceResponse>>;
}

@Injectable()
export class GRPCService implements OnModuleInit {
    private isvService: ISVService;

    constructor(@Inject(forwardRef(() => ISV_SERVICE_GRPC_TOKEN)) private balanceClient: ClientGrpc) {}

    onModuleInit() {
        this.isvService = this.balanceClient.getService<ISVService>('ISVService');
        this.isvService = this.balanceClient.getService<ISVService>('ISVService');
    }

    createBalance(data: CreateBalanceRequestDto): Observable<GrpcResponseData> {
        return this.isvService.createBalance(data).pipe(
            timeout(200 * 1000), // timeout in 200 seconds
            map(this.decodeStructpb),
            catchError(this.handleServiceError(AppException.ServiceUnavailable)),
            catchError(this.handleServiceError(AppException.ServiceUnavailable)),
        );
    }

    getBalance(data: GetBalanceRequestDto): Observable<GrpcResponseData> {
        return this.isvService.getBalance(data).pipe(
            timeout(200 * 1000), // timeout in 200 seconds
            map(this.decodeStructpb),
            catchError(this.handleServiceError(AppException.ServiceUnavailable)),
        );
    }

    updateOverdraft(data: UpdateOverdraftRequestDto): Observable<GrpcResponseData> {
        return this.isvService.updateOverdraft(data).pipe(
            timeout(200 * 1000), // timeout in 200 seconds
            map(this.decodeStructpb),
            catchError(this.handleServiceError(AppException.ServiceUnavailable)),
        );
    }

    private handleServiceError(exception: AppException) {
        return (e) => {
            if (e.message === 'Timeout has occurred') {
                return of(AppException.REQUEST_TIMEOUT as GrpcResponseData<any>);
                return of(AppException.REQUEST_TIMEOUT as GrpcResponseData<any>);
            }
            return of(exception as GrpcResponseData<any>);
        };
    }

    private decodeStructpb(v: GrpcResponseData) {
        const decode = (obj) => {
            if (obj.fields) {
                const data = obj.fields;
                for (const [k, v] of Object.entries(data)) {
                    if (data[k].listValue) {
                        if (data[k].listValue.values) {
                            data[k] = data[k].listValue.values.map((v) => decode(v.structValue));
                        } else {
                            data[k] = [];
                        }
                    } else if (data[k].nullValue === 0) {
                        data[k] = null;
                    } else {
                        data[k] = Object.values(v)[0];
                        if (data[k] && data[k]['fields']) {
                            data[k] = decode(data[k]);
                        }
                    }
                }
                return data;
            }
            return obj;
        };

        if (v.data && v.data.fields) {
            return { ...v, data: decode(v.data) };
        }
        return v;
    }
}
