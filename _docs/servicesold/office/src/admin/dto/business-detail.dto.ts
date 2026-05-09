import { ApiProperty } from '@nestjs/swagger';

export class BusinessDetailDto {
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
  paykkaRawResponse?: Record<string, unknown>;

  @ApiProperty({ required: false })
  sanctionsHits?: Record<string, unknown>[];

  @ApiProperty({ required: false })
  auditTimeline?: Record<string, unknown>[];

  @ApiProperty()
  createdAt!: string;
}
