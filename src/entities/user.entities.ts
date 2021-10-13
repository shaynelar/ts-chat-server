import { Field, ID, ObjectType } from "type-graphql";
import {
	Column,
	CreateDateColumn,
	Entity,
	OneToMany,
	PrimaryGeneratedColumn,
	Timestamp,
} from "typeorm";
import { Message } from "./message.entities";

@ObjectType()
@Entity()
export class User {
	@PrimaryGeneratedColumn()
	@Field(() => ID)
	id: string;

	@Column()
	@Field((type) => String)
	username: string;

	@Column()
	password: string;

	@CreateDateColumn()
	@Field(() => Date, { defaultValue: new Date() })
	createdAt: Timestamp;

	@Field(() => [Message])
	@OneToMany(() => Message, (message) => message.sender, {
		cascade: true,
		eager: true,
	})
	sentMessages: Message[];
}
