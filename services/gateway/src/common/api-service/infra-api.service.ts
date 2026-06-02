import { JWTUser } from '@auth/jwt.strategy';
import { MongoAPIPaging } from '@common/api-paging';
import { ConfigService } from '@config/config.service';
import { InfraToken } from '@hyphen/node-common';
import { TenantRequestPayload } from '@core/helpers';
import { HttpService } from '@nestjs/axios';
import { randomBytes } from 'crypto';
import { AxiosHeaders, AxiosRequestConfig } from 'axios';
import { catchError, firstValueFrom, Observable } from 'rxjs';
import { RequestService, RResponse } from './request.service';

export class InfraApiService extends RequestService {
    constructor(
        http: HttpService,
        protected request: TenantRequestPayload,
        protected config: ConfigService,
        routeBase = '',
    ) {
        super(http, config.API_SERVICE_URL + routeBase);
    }

    public getHeaders(user: JWTUser): AxiosHeaders {
        // Mint a short-lived, HMAC-signed token that binds the caller identity to
        // the credential. The api verifies the signature + expiry and derives the
        // machine AccessKey — identity can no longer be spoofed via loose headers.
        const token = InfraToken.sign(
            {
                iss: 'gateway',
                businessId: user.businessId.toString(),
                userId: user.userId.toString(),
                tenantId: this.request.tenantId.toString(),
                // ObjectId-shaped so the api can adopt it as the request id verbatim.
                requestId: randomBytes(12).toString('hex'),
            },
            this.config.INFRA_SIGNING_KEY,
        );

        return new AxiosHeaders({
            authorization: `Infra ${token}`,
            // Device context for audit logging only — never trusted for identity.
            'hyphen-forwarded-user-agent': this.request.forwardedUserAgent,
            'hyphen-forwarded-ip': this.request.forwardedIp,
        });
    }

    create(user: JWTUser, data: any): Promise<RResponse> {
        return firstValueFrom(this.sendPost('', user, data));
    }

    get(user: JWTUser, query: MongoAPIPaging, apiBase?: string): Promise<RResponse> {
        return firstValueFrom(this.sendGet('', user, query, apiBase));
    }

    getOne(user: JWTUser, id: string, query: MongoAPIPaging): Promise<RResponse> {
        return firstValueFrom(this.sendGet(`/${id}`, user, query));
    }

    getIdAction(user: JWTUser, id: string, action?: any, query?: any): Promise<RResponse> {
        return firstValueFrom(this.sendGet(`/${id}/${action}`, user, query));
    }

    getIdActionStream(user: JWTUser, id: string, action?: any, query?: any): Promise<RResponse> {
        return firstValueFrom(
            this.sendGet(`/${id}/${action}`, user, query, undefined, {
                responseType: 'stream',
            }),
        );
    }

    getAction(user: JWTUser, action?: any, query?: any): Promise<RResponse> {
        return firstValueFrom(this.sendGet(`/${action}`, user, query));
    }

    put(user: JWTUser, id: string, data: any, query?: MongoAPIPaging): Promise<RResponse> {
        return firstValueFrom(this.sendPut(`/${id}`, user, data));
    }

    putIdAction(user: JWTUser, id: string, action?: any, data?: any): Promise<RResponse> {
        return firstValueFrom(this.sendPut(`/${id}/${action}`, user, data));
    }

    postId(user: JWTUser, id: string, data?: any): Promise<RResponse> {
        return firstValueFrom(this.sendPost(`/${id}`, user, data));
    }

    postIdAction(user: JWTUser, id: string, action?: any, data?: any): Promise<RResponse> {
        return firstValueFrom(this.sendPost(`/${id}/${action}`, user, data));
    }

    postAction(user: JWTUser, action: any, data?: any): Promise<RResponse> {
        return firstValueFrom(this.sendPost(`/${action}`, user, data));
    }

    patchId(user: JWTUser, id: string, data?: any): Promise<RResponse> {
        return firstValueFrom(this.sendPatch(`/${id}`, user, data));
    }

    post(user: JWTUser, url: string, data?: any): Promise<RResponse> {
        return firstValueFrom(this.sendPost(url, user, data));
    }

    delete(user: JWTUser, id: string): Promise<RResponse> {
        return firstValueFrom(this.sendDelete(`/${id}`, user));
    }

    sendPost(url: string, user: JWTUser, data?: any, apiBase?: string): Observable<RResponse> {
        const headers = this.getHeaders(user);
        return this.sendPostRequest(url, data, headers, apiBase).pipe(catchError(this.handleError()));
    }

    sendGet(
        url: string,
        user: JWTUser,
        query?: MongoAPIPaging,
        apiBase?: string,
        additionalConfig?: AxiosRequestConfig,
    ): Observable<RResponse> {
        const headers = this.getHeaders(user);
        return this.sendGetRequest(url, query as Record<string, string>, headers, apiBase, additionalConfig).pipe(
            catchError(this.handleError()),
        );
    }

    sendPut(url: string, user: JWTUser, data: any, query?: MongoAPIPaging): Observable<RResponse> {
        const headers = this.getHeaders(user);
        return this.sendPutRequest(url, data, query as Record<string, string>, headers).pipe(
            catchError(this.handleError()),
        );
    }

    sendPatch(url: string, user: JWTUser, data?: any, apiBase?: string): Observable<RResponse> {
        const headers = this.getHeaders(user);
        return this.sendPatchRequest(url, data, headers, apiBase).pipe(catchError(this.handleError()));
    }

    sendDelete(url: string, user: JWTUser): Observable<RResponse> {
        const headers = this.getHeaders(user);
        return this.sendDeleteRequest(url, null, headers).pipe(catchError(this.handleError()));
    }
}
