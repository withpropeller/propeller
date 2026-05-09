import { Directive, Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'customer' })
export class Customer {
  @Field(type => ID)
  id: string;

  @Directive('@upper')
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  creationDate: Date;

  @Field(type => [String])
  ingredients: string[];
}