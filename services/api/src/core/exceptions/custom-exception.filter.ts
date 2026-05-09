import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { CustomException } from './custom-exception';
import { ReporterService } from '../../common/services/reporter.service';
import { ConfigService } from '@config/config.service';
import { AppStatus, LocalRequestProperty, Utils } from '@core/helpers';
import { AccessKey } from '@core/interfaces';
import { ModelIdTag, TagMongoId } from '@core/mongo';

@Catch(CustomException)
export class CustomExceptionFilter implements ExceptionFilter {
    constructor(private readonly config: ConfigService, private reporter: ReporterService) {}

    public catch(exception: CustomException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const req = request.raw ?? request;

        const data = exception.toJSON();

        const accessKey = req[LocalRequestProperty.AccessKey] as AccessKey;
        this.reporter.pushError({
            error: data,
            requestUrl: request.url,
            tenant: request[LocalRequestProperty.TenantId],
            business: TagMongoId(ModelIdTag.Business, accessKey?.businessId),
            context: 'infra.api',
        });

        const json = {
            ...data,
            error: this.config.inProduction && data.code != AppStatus.BadRequest ? undefined : exception.getError(),
        };

        if (response.json) {
            response.status(exception.getStatus()).json(Utils.removeNilValues(json));
        } else {
            response.status(exception.getStatus()).send(Utils.removeNilValues(json));
        }
    }
}
