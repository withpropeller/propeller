import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Utils } from '@propeller/core';

@ApiTags('health')
@Controller('healthz')
export class HealthController {
  @Get()
  @ApiOkResponse({ description: 'Service is alive' })
  liveness(): { status: 'ok'; request_id: string } {
    return { status: 'ok', request_id: Utils.generateRandomBytes(8) };
  }

  @Get('ready')
  @ApiOkResponse({ description: 'Service and dependencies are ready' })
  readiness(): { status: 'ok' } {
    // TODO Wave 2+: check Mongo, TigerBeetle, Flo
    return { status: 'ok' };
  }
}
