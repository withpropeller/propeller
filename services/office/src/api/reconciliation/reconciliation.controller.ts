import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
    Res,
    UploadedFile,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Permissions } from '@api/roles';
import {
    Permission,
    ApiResponseWrapper,
    ApiResponseListWrapper,
    ApiCommonResponse,
    ApiBasicResponse,
} from '@common/decorators';
import { APIPagingDto } from '@common/api-paging';
import { ReconciliationService } from './reconciliation.service';
import { MetricsQueryDto, ParamTagIdDto } from '@common/dtos';
import { ApiHydratedAccountStatement, ApiHydratedReconciliationRun } from './reconciliation.schema';
import { PatchStatementDto, ReconciliationMetricsDto } from './reconciliation.dto';

@ApiTags('reconciliation')
@Controller('reconciliation')
export class ReconciliationController {
    constructor(private service: ReconciliationService) {}

    @ApiOperation({ summary: 'Upload bank statement CSV' })
    @ApiBearerAuth()
    @ApiConsumes('multipart/form-data')
    @Permission(Permissions.ReconciliationUpload)
    @Post('/upload')
    @HttpCode(HttpStatus.CREATED)
    @UseInterceptors(FileInterceptor('file'))
    @ApiResponseWrapper(ApiHydratedReconciliationRun, 201, 'Statement uploaded successfully')
    @ApiCommonResponse()
    public async uploadStatement(@UploadedFile() file: Express.Multer.File) {
        const csvContent = file.buffer.toString('utf-8');
        return this.service.uploadStatement(csvContent);
    }

    @ApiOperation({ summary: 'Get all reconciliation runs' })
    @ApiBearerAuth()
    @Permission(Permissions.ReconciliationRead)
    @Get('/runs')
    @HttpCode(HttpStatus.OK)
    @ApiResponseListWrapper(ApiHydratedReconciliationRun, 200, 'Reconciliation runs retrieved')
    @ApiCommonResponse()
    public async getRuns(@Query() query: APIPagingDto) {
        return this.service.runRepo.findByQuery(query);
    }

    @ApiOperation({ summary: 'Run reconciliation matching for a run' })
    @ApiBearerAuth()
    @Permission(Permissions.ReconciliationRun)
    @Post('/runs/:id/reconcile')
    @HttpCode(HttpStatus.OK)
    @ApiParam({ name: 'id', description: 'Reconciliation run ID', type: String })
    @ApiResponseWrapper(ApiHydratedReconciliationRun, 200, 'Reconciliation completed')
    @ApiCommonResponse()
    public async reconcile(@Param() params: ParamTagIdDto) {
        return this.service.reconcile(params.id);
    }

    @ApiOperation({ summary: 'Get one reconciliation run' })
    @ApiBearerAuth()
    @Permission(Permissions.ReconciliationRead)
    @Get('/runs/:id')
    @HttpCode(HttpStatus.OK)
    @ApiParam({ name: 'id', description: 'Reconciliation run ID', type: String })
    @ApiResponseWrapper(ApiHydratedReconciliationRun, 200, 'Reconciliation run retrieved')
    @ApiCommonResponse()
    public async getOne(@Param() params: ParamTagIdDto) {
        return this.service.runRepo.findById(params.id);
    }

    @ApiOperation({ summary: 'Get reconciliation metrics' })
    @ApiBearerAuth()
    @Permission(Permissions.ReconciliationRead)
    @Get('/metrics')
    @HttpCode(HttpStatus.OK)
    @ApiResponseWrapper(ReconciliationMetricsDto, 200, 'Reconciliation metrics retrieved')
    @ApiCommonResponse()
    public async getMetrics(@Query() query: MetricsQueryDto) {
        return this.service.getMetrics(query);
    }

    @ApiOperation({ summary: 'Get all statements as CSV' })
    @ApiBearerAuth()
    @Permission(Permissions.ReconciliationRead)
    @Get('/statements/csv')
    @HttpCode(HttpStatus.OK)
    @ApiBasicResponse(200, 'CSV file download')
    @ApiCommonResponse()
    public async getStatementsCSV(@Res() res: Response, @Query() query: APIPagingDto) {
        const [csvText, fileName] = await this.service.getStatementsCSV(query);
        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(csvText);
    }

    @ApiOperation({ summary: 'Get all statements' })
    @ApiBearerAuth()
    @Permission(Permissions.ReconciliationRead)
    @Get('/statements')
    @HttpCode(HttpStatus.OK)
    @ApiResponseListWrapper(ApiHydratedAccountStatement, 200, 'Statements retrieved')
    @ApiCommonResponse()
    public async getAllStatements(@Query() query: APIPagingDto) {
        return this.service.statementRepo.findByQuery(query);
    }

    @ApiOperation({ summary: 'Patch a faulty statement with a corrected raw CSV row' })
    @ApiBearerAuth()
    @Permission(Permissions.ReconciliationRun)
    @Patch('/statements/:id')
    @HttpCode(HttpStatus.OK)
    @ApiParam({ name: 'id', description: 'Statement ID', type: String })
    @ApiResponseWrapper(ApiHydratedAccountStatement, 200, 'Statement patched and re-matched')
    @ApiCommonResponse()
    public async patchStatement(@Param() params: ParamTagIdDto, @Body() body: PatchStatementDto) {
        return this.service.patchStatement(params.id, body.rawCsvRow);
    }
}
