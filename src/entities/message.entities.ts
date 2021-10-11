import "reflect-metadata"
import { Field, ID, ObjectType } from "type-graphql";
import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	PrimaryGeneratedColumn,
	Timestamp,
} from "typeorm";
import { User } from "./user.entities";

@ObjectType()
@Entity()
export class Message {
	@PrimaryGeneratedColumn()
	@Field(() => ID)
	id: string;

	@Field(() => User)
	@ManyToOne(() => User, (user) => user.sentMessages)
	sender: User;

	@Field(() => Date, { defaultValue: new Date() })
	@CreateDateColumn()
	createdAt: Timestamp;

	@Field(() => String)
	@Column()
	body: string;
}
