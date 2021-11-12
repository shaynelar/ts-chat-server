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
import { Room } from "./room.entities";

@ObjectType()
@Entity()
export class User {
	@PrimaryGeneratedColumn()
	@Field(() => ID)
	id: string;

	@Column()
	@Field(() => String)
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

	@Field(() => [Room])
	@OneToMany(() => Room, (room) => room.creater)
	createdRooms: Room[];
}
