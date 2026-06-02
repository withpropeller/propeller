import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ApiBasicResponse, ApiCommonResponse, CurrentUser, Permission } from '@common/decorators';
import { Permissions } from '@api/roles';
import { Response } from 'express';
import { JWTUser } from '@auth/jwt.strategy';
import { CustomersService } from './customers.service';
import { APIPagingDto } from '@common/api-paging';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomerController {
    constructor(private service: CustomersService) {}

    @ApiOperation({ summary: 'Get Customers' })
    @Get()
    @HttpCode(HttpStatus.OK)
    @Permission(Permissions.CustomersRead)
    @ApiBasicResponse(200, 'Customers retrieved successfully')
    @ApiCommonResponse()
    public async getAll(@Res() res: Response, @CurrentUser() user: JWTUser, @Query() query: APIPagingDto) {
        const response = await this.service.get(user, query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Create Customer' })
    @Permission(Permissions.CustomersCreate)
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiBasicResponse(201, 'Customer created successfully')
    @ApiCommonResponse()
    public async create(@CurrentUser() user: JWTUser, @Body() body: any, @Res() res: Response) {
        const response = await this.service.create(user, body);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get Customer' })
    @Permission(Permissions.CustomersRead)
    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiParam({ name: 'id', description: 'Customer ID', type: String })
    @ApiBasicResponse(200, 'Customer retrieved successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Customer not found')
    public async get(
        @CurrentUser() user: JWTUser,
        @Param() param: any,
        @Query() query: APIPagingDto,
        @Res() res: Response,
    ) {
        const response = await this.service.getOne(user, param.id, query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Update Customer' })
    @Permission(Permissions.CustomersUpdate)
    @Put('/:id')
    @HttpCode(HttpStatus.OK)
    @ApiParam({ name: 'id', description: 'Customer ID', type: String })
    @ApiBasicResponse(200, 'Customer updated successfully')
    @ApiCommonResponse()
    @ApiBasicResponse(404, 'Customer not found')
    public async update(@Res() res: Response, @CurrentUser() user: JWTUser, @Param() param: any, @Body() body: any) {
        const response = await this.service.put(user, param.id, body);
        res.status(response.status).send(response.data);
    }
}
