import { MongoAPIPaging } from '@common/api-paging';
import { RequestService, RResponse, RResponseData } from '@common/services';
import { ConfigService } from '@config/config.service';
import { HttpService } from '@nestjs/axios';
import { AxiosHeaders, HttpStatusCode } from 'axios';
import { catchError, firstValueFrom, Observable } from 'rxjs';
import { Injectable, Logger } from '@nestjs/common';
import { ICardAuthDetails } from '@api/cards/cards.schema';
import { AppException } from '@core/exceptions';
import { AppStatus } from '@core/helpers';
const Evervault = require('@evervault/sdk');

@Injectable()
export class CageService extends RequestService {
    private evervault: any;
    private readonly logger = new Logger(CageService.name);

    constructor(http: HttpService, protected config: ConfigService) {
        super(http, config.CAGE_SERVICE_URL);
        this.evervault = new Evervault(this.config.EVERVAULT_API_KEY);
    }

    public getHeaders(): AxiosHeaders {
        return new AxiosHeaders({
            'api-key': this.config.EVERVAULT_API_KEY,
        });
    }

    async hashPan(pan: string): Promise<string> {
        const res = await this.post<string>('/cards/hash-pan', { pan });

        if (res.status !== HttpStatusCode.Ok || res.data.code !== AppStatus.Success) {
            this.logger.debug(res);
            throw AppException.ServiceUnavailable.setError(res.data.error);
        }

        return res.data.data;
    }

    async encryptPan(pan: string): Promise<any> {
        const res = await this.post<string>('/cards/encrypt-pan', { pan });

        if (res.status !== HttpStatusCode.Ok || res.data.code !== AppStatus.Success) {
            this.logger.debug(res);
            throw AppException.ServiceUnavailable.setError(res.data.error);
        }

        return res.data.data;
    }

    async generateAuthData(details: ICardAuthDetails) {
        const res = await this.post<string>('/cards/auth-data', {
            pan: details.pan,
            expiry: details.expiry,
            cvv: details.cvv,
            pin: details.pin,
        });

        if (res.status !== HttpStatusCode.Ok || res.data.code !== AppStatus.Success) {
            this.logger.debug(res);
            throw AppException.ServiceUnavailable.setError(res.data.error);
        }

        return res.data.data;
    }

    async get(url: string) {
        await this.evervault.enableCagesBeta();
        return firstValueFrom(this.sendGet(url));
    }

    async post<T>(url: string, data: any): Promise<RResponse<RResponseData<T>>> {
        try {
            const res = await this.evervault.enableCagesBeta();
        } catch (e) {
            this.logger.error(e);
        }
        return firstValueFrom(this.sendPost(url, data));
    }

    sendGet(url: string, query?: MongoAPIPaging): Observable<RResponse> {
        const headers = this.getHeaders();
        return this.sendGetRequest(url, query as any, headers).pipe(catchError(this.handleError()));
    }

    sendPost(url: string, data?: any): Observable<RResponse> {
        const headers = this.getHeaders();
        return this.sendPostRequest(url, data, headers).pipe(catchError(this.handleError()));
    }
}
