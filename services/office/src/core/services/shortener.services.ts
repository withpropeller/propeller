import { GRPCService } from '@common/grpc/grpc.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ShortenService {
    constructor(private grpcService: GRPCService) {}

    async shorten(url: string, ttl?: number) {
        return url;
        /*
        const res = await firstValueFrom(this.grpcService.shortenURL({ url, ttl }));
        if (res.code === AppStatus.Success) {
            return res.data.shortenedUrl;
        }
        return null;*/
    }
}
