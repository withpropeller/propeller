import { Permission } from '@common/decorators';
import { Body, Controller, Get, Param, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AddBankListDto, BankShortListDto, ProcessorBanksMapsDto, ResolveBankAccountDto } from './banks.dto';
import { TransferService } from './banks.service';
import { Permissions } from '@api/roles/roles.enums';
import { ParamIdDto } from '@common/dtos';

@ApiTags('tools/banks')
@Controller('tools/banks')
export class BanksController {
    constructor(private service: TransferService) {}

    @ApiOperation({ summary: 'Add Multiple Banks' })
    @Put()
    @Permission(Permissions.ToolsBanks)
    public async addBankList(@Body() body: AddBankListDto) {
        return this.service.addBankList(body);
    }

    @ApiOperation({ summary: 'Map Processor Banks' })
    @Put('/mappings')
    @Permission(Permissions.ToolsBanksMapsUpdate)
    public async mapProcessorBanks(@Body() body: ProcessorBanksMapsDto) {
        return this.service.mapProcessorBanks(body);
    }

    @ApiOperation({ summary: 'Get Bank list' })
    @Get()
    @Permission(Permissions.ToolsBanksRead)
    public async getAll() {
        return this.service.getBankList();
    }

    @ApiOperation({ summary: 'Map Processor Banks' })
    @Get('/mappings/:id')
    @Permission(Permissions.ToolsBanksMapsRead)
    public async getBankMappings(@Param() param: ParamIdDto) {
        return this.service.getBankMappings(param.id as any);
    }

    @ApiOperation({ summary: 'Get Bank list' })
    @ApiParam({ name: 'accountNumber', description: 'Account Number', type: String })
    @Get('/short-list/:accountNumber')
    @Permission(Permissions.ToolsBanksRead)
    public async getShortBankList(@Param() param: BankShortListDto) {
        return this.service.getShortBankList(param.accountNumber);
    }

    @ApiOperation({ summary: 'Resolve Bank Account' })
    @Get('/resolve')
    @Permission(Permissions.ToolsBanksRead)
    public async resolveBankAccount(@Query() query: ResolveBankAccountDto) {
        const [resolved] = await this.service.resolveBankAccount(query);
        return resolved;
    }
}
