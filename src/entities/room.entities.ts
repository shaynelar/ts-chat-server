import "reflect-metadata";
import { Field, ID, ObjectType } from "type-graphql";
import {
	Column,
	CreateDateColumn,
	Entity,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	Timestamp,
} from "typeorm";
import { Message } from ".";
import { User } from "./user.entities";

@ObjectType()
@Entity()
export class Room {
	@PrimaryGeneratedColumn()
	@Field(() => ID)
	id: string;

	@Field(() => String)
	@Column()
	roomName: string;

	@Field(() => User)
	@ManyToOne(() => User, (user) => user.createdRooms, { cascade: ["insert"] })
	creater: User;

	@Field()
	@Column()
	createrId?: string;

	@Field(() => [Message])
	@OneToMany(() => Message, (message) => message.id, { nullable: true })
	messages: Message[];

	@Field(() => Date, { defaultValue: new Date() })
	@CreateDateColumn()
	createdAt: Timestamp;
}
