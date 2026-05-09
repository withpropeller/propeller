import { UsersService } from '@api/users';
import { ParamTagIdDto } from '@common/dtos';
import { NotFoundException } from '@nestjs/common';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { CustomersArgs, NewCustomerInput } from './customers.args';
import { Customer } from './customers.model';
import { CustomersService } from './customers.service';

/*
const pubSub = new PubSub();

@Resolver(of => Customer)
export class CustomerResolver {
    constructor(
        private readonly recipesService: CustomersService,
        private readonly userService: UsersService) { }

    @Query(returns => [Customer])
    async customers(): Promise<Customer[]> {
        /* const recipe = await this.recipesService.findOneById(id);
         if (!recipe) {
             throw new NotFoundException(id);
         }
         return recipe;*
        return null;
    }

    @Query(returns => Customer)
    async recipe(@Args() param: ParamMongoIdDto): Promise<Customer> {
        const recipe = await this.userService.findOneAndPopulate({ _id: param.id }, undefined)
        if (!recipe) {
            throw new NotFoundException(param.id);
        }
        return recipe as any;
    }

    @Query(returns => [Customer])
    recipes(@Args() recipesArgs: CustomersArgs): Promise<Customer[]> {
       // return this.recipesService.findAll(recipesArgs);
    }

    @Mutation(returns => Customer)
    async addCustomer(
        @Args('newCustomerData') newCustomerData: NewCustomerInput,
    ): Promise<Customer> {
        const recipe = await this.recipesService.create(newCustomerData);
        pubSub.publish('recipeAdded', { recipeAdded: recipe });
        return recipe;
    }

    @Mutation(returns => Boolean)
    async removeCustomer(@Args('id') id: string) {
        return this.recipesService.remove(id);
    }

    @Subscription(returns => Customer)
    recipeAdded() {
        return pubSub.asyncIterator('recipeAdded');
    }
}*/