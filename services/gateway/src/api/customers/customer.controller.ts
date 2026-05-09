import { Body, Controller, Get, Param, Post, Put, Query, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Permission } from '@common/decorators';
import { Permissions } from '@api/roles';
import { Response } from 'express'
import { JWTUser } from '@auth/jwt.strategy';
import { CustomersService } from './customers.service';

@ApiTags('customers')
@Controller('customers')
export class CustomerController {
    constructor(
        private service: CustomersService) { }

    @ApiOperation({ summary: 'Get Customers' })
    @Get()
    @Permission(Permissions.CustomersRead)
    public async getAll(@Res() res: Response, @CurrentUser() user: JWTUser, @Query() query: any) {
        const response = await this.service.get(user, query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Create Customer' })
    @Permission(Permissions.CustomersCreate)
    @Post()
    public async create(
        @CurrentUser() user: JWTUser, @Body() body: any, @Res() res: Response,
        ) {
        const response = await this.service.create(user, body);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Get Customer' })
    @Permission(Permissions.CustomersRead)
    @Get('/:id')
    public async get(
        @CurrentUser() user: JWTUser, 
        @Param() param: any, 
        @Query() query: any,
        @Res() res: Response,
        ) {
        const response = await this.service.getOne(user, param.id, query);
        res.status(response.status).send(response.data);
    }

    @ApiOperation({ summary: 'Update a customer' })
    @Permission(Permissions.CustomersUpdate)
    @Put('/:id')
    public async update(@Res() res: Response, @CurrentUser() user: JWTUser, @Param() param: any,  @Body() body: any) {
        const response = await this.service.put(user, param.id, body);
        res.status(response.status).send(response.data);
    }

}
