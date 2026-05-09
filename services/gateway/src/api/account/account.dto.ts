import { MoneyAmount } from '@common/decorators/validators.decorators';
import { ApiProperty } from '@nestjs/swagger';
import { Validate } from 'class-validator';

export class RequestOverdraftDto {
    @ApiProperty()
    @Validate(MoneyAmount)
    overdraftLimit: number;
}
