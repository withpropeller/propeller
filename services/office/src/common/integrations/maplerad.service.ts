import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@config/config.service';
import { firstValueFrom } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { AppException } from '@core/exceptions';
import { TransactionProcessor } from '@api/transactions/transactions.enums';
import { ISettlementAccountIntegration } from './integrations.interfaces';
import { ReporterService } from '@common/services/reporter.service';

@Injectable()
export class MapleradService implements ISettlementAccountIntegration {
    public processor = TransactionProcessor.Maplerad;

    constructor(
        private readonly config: ConfigService,
        private readonly http: HttpService,
        private readonly reporter: ReporterService,
    ) {}

    async getSettlementAccountBalance(identifier: string): Promise<number> {
        const url = this.config.MAPLERAD_URI_LIVE.baseUrl + `/v1/wallets`;

        const config = {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.config.MAPLERAD_URI_LIVE.secret}`,
            },
        };

        try {
            const res = await firstValueFrom(this.http.get(url, config));

            if (res.data.status && Array.isArray(res.data.data)) {
                return res.data.data.find((wallet: any) => wallet.id === identifier)?.available_balance;
            }

            throw AppException.ServiceUnavailable.setError(res.data);
        } catch (e) {
            throw AppException.ServiceUnavailable.setError(e);
        }
    }
}
