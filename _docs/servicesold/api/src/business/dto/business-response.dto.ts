import { ApiProperty } from '@nestjs/swagger';

export class BusinessResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  country!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  kybStatus!: string;

  @ApiProperty({ required: false })
  paykkaMerchId?: string;

  @ApiProperty({ required: false })
  authorizeLink?: string;

  @ApiProperty()
  createdAt!: string;
}
