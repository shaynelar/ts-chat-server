import { Field, ID, ObjectType } from "type-graphql";
import { Column, PrimaryGeneratedColumn } from "typeorm";

@ObjectType()
export class User {
	@PrimaryGeneratedColumn()
	@Field(() => ID)
	id: string;

	@Column()
	@Field((type) => String)
	username: string;

	// @Column()
	// password: string;
}
