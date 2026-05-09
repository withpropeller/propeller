import { ConfigService } from '@config/config.service';
import { Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';

@Catch()
export class OAuthExceptionFilter implements ExceptionFilter {
    constructor(private readonly config: ConfigService) {}

    public catch(exception: Error, response) {
        if (exception.name === 'InternalOAuthError') {
            response.status(HttpStatus.UNAUTHORIZED).json({
                code: HttpStatus.UNAUTHORIZED,
                message: exception.message || 'Could not authorise user',
                error: this.config.inProduction ? undefined : exception,
            });
        }
    }
}
