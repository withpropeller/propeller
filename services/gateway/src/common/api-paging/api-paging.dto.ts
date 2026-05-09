import { IsString, IsOptional, IsNotEmpty, IsNumber, Validate, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { Utils } from '@core/helpers';
import { TagId } from '@common/decorators/validators.decorators';
import { ExecutionOptions } from '@common/interfaces/execution.options';
import { parseQueryBoolean } from './utils';

export class APIPagingDto implements ExecutionOptions {
    @ApiPropertyOptional()
    @IsOptional()
    @Transform(({ value }) => Utils.safeNumber(value) )
    @IsNumber()
    readonly limit?: number;

    @ApiPropertyOptional({ example: '-state' })
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    readonly sort?: string;

    @ApiPropertyOptional({
        type: [String],
        description: 'List of relations to be populated.',
    })
    @IsString({ each: true })
    @IsOptional()
    readonly expand?: string | string[];

    @ApiPropertyOptional({
        type: [String],
        description: 'List of fields to select.',
    })
    @IsString({ each: true })
    @IsOptional()
    readonly select?: string | string[];

    @ApiPropertyOptional({
        type: Object,
        description: 'Filter options',
        example: 'state|eq|published',
    })
    @IsString({ each: true })
    @IsOptional()
    readonly filter?: string | string[]; //FindConditions<T> | ObjectLiteral |

    @ApiPropertyOptional({
        type: Object,
        description: 'Or options',
        example: 'state|eq|published',
    })
    @IsString({ each: true })
    @IsOptional()
    readonly or?: string | string[];

    @ApiPropertyOptional({
        type: Object,
        description: 'Nor options',
        example: 'state|eq|published',
    })
    @IsString({ each: true })
    @IsOptional()
    readonly nor?: string | string[];

    @ApiPropertyOptional({
        type: Object,
        description: 'And options',
        example: 'state|eq|published',
    })
    @IsString({ each: true })
    @IsOptional()
    readonly and?: string | string[];

    @ApiPropertyOptional({})
    @IsOptional()
    @Transform(v => Utils.parseIdTag(v.value))
    @Validate(TagId)
    readonly before?: string;

    @ApiPropertyOptional({})
    @IsOptional()
    @Transform(v => Utils.parseIdTag(v.value))
    @Validate(TagId)
    readonly after?: string;

    @ApiPropertyOptional({})
    @IsOptional()
    @Transform((v) => parseQueryBoolean(v.value) )
    @IsBoolean()
    readonly countTotal?: boolean;

    @ApiPropertyOptional({})
    @IsOptional()
    @Transform((v) => parseQueryBoolean(v.value) )
    @IsBoolean()
    readonly dryRun?: boolean;
}


/*
const exampleFilter = '/customers?filter=email|eq|john@doe.com metadata.key|eq|value accountType|in|main,sub,virtual';
const exampleFilterShortcut = '/customers?filter=email:john@doe.com metadata.key:value -accountType:sub';
const exampleSort = '/customers?sort=-createdAt -publishedAt';
const exampleExpand = '/customers?expand=user:firstName,email business:name,description';
const exampleFull = `/logs?filter=method|eq|POST path|eq|/card-programs&select=path method initiator&countTotal=true`;
const exampleFullWithShortQueryBoolean = `/logs?filter=method|eq|POST path|eq|/card-programs&select=path method initiator&countTotal`;
*/