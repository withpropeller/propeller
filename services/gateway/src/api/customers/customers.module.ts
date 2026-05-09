import { UsersModule } from '@api/users/users.module';
import { Module } from '@nestjs/common';
import { CustomerController } from './customer.controller';
import { CustomersService } from './customers.service';

@Module({
    imports: [UsersModule],
    controllers: [CustomerController],
    providers: [CustomersService],
})
export class CustomersModule { }