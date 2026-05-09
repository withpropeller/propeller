import { Permission } from '@common/decorators';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BankShortListDto, ResolveBankAccountDto } from './banks.dto';
import { TransferService } from './banks.service';
import { SecretKeyPermissions as Permissions } from '@api/secret-keys';

@ApiTags('tools/banks')
@Controller('tools/banks')
export class BanksController {
    constructor(private service: TransferService) {}

    @ApiOperation({ summary: 'Get Bank list' })
    @Get('/')
    @Permission(Permissions.ToolsBanksRead)
    public async getAll() {
        return this.service.getBankList();
    }

    @ApiOperation({ summary: 'Get Bank list' })
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
