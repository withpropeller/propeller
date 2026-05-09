import { ArgsType, Field, InputType, Int } from '@nestjs/graphql';
import { IsOptional, Length, Max, MaxLength, Min } from 'class-validator';

@ArgsType()
export class CustomersArgs {
    @Field(type => Int)
    @Min(0)
    skip = 0;

    @Field(type => Int)
    @Min(1)
    @Max(50)
    take = 25;
}


@InputType()
export class NewCustomerInput {
    @Field()
    @MaxLength(30)
    title: string;

    @Field({ nullable: true })
    @IsOptional()
    @Length(30, 255)
    description?: string;

    @Field(type => [String])
    ingredients: string[];
}