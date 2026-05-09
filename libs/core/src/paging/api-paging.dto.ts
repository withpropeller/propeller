import { IsString, IsOptional, IsNotEmpty, IsNumber, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { Utils } from '../helpers/utils.js';

/**
 * Standard API paging DTO.
 *
 * Usage in controllers:
 *   @Get('businesses')
 *   async list(@Query() query: APIPagingDto) { ... }
 *
 * Supports: limit, sort, select, expand, filter, cursor-based after/before
 */
export class APIPagingDto {
  /** Maximum number of records to return (default 20, max 100) */
  @IsOptional()
  @Transform(({ value }) => Utils.safeNumber(value))
  @IsNumber()
  readonly limit?: number;

  /** Sort field(s), comma-separated, prefix with - for desc. Example: '-createdAt' */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  sort?: string;

  /** Relations to populate (e.g. 'business' or ['business','owner']) */
  @IsString({ each: true })
  @IsOptional()
  readonly expand?: string | string[];

  /** Fields to select (space-separated). Example: 'name status createdAt' */
  @IsString({ each: true })
  @IsOptional()
  readonly select?: string | string[];

  /** Filter conditions (field|operator|value). Example: 'status|eq|active' */
  @IsString({ each: true })
  @IsOptional()
  filter?: string | string[];

  /** Cursor: fetch records after this ID */
  @IsOptional()
  @IsString()
  readonly after?: string;

  /** Cursor: fetch records before this ID */
  @IsOptional()
  @IsString()
  readonly before?: string;

  /** Include total count (may be slow on large collections) */
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  readonly includeCount?: boolean;
}
