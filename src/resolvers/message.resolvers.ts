import { Context } from "../types";
import {
	Mutation,
	ObjectType,
	PubSub,
	Root,
	Subscription,
	PubSubEngine,
	Ctx,
	Resolver,
	Arg,
	Field,
	Query,
	InputType,
	Int,
} from "type-graphql";
import { Message, Room } from "../entities";
import { getConnection } from "typeorm";

@ObjectType()
class BaseResponse {
	@Field(() => String, { nullable: true })
	error?: string;
}

@ObjectType()
class MessageResponse extends BaseResponse {
	@Field(() => Message, { nullable: true })
	message?: Message;
}

@ObjectType()
class RoomResponse extends BaseResponse {
	@Field(() => Room, { nullable: true })
	room?: Room;
}

@ObjectType()
class AllMessageResponse extends BaseResponse {
	@Field(() => [Message], { nullable: true })
	messages?: Message[];
}

@InputType()
class OffsetPagination {
	@Field(() => Int, { defaultValue: 0 })
	offset?: number;

	@Field(() => Int, { defaultValue: 20 })
	limit?: number;
}

@Resolver(Message)
export class MessageResolvers {
	@Mutation(() => RoomResponse)
	async createRoom(
		@PubSub() pubSub: PubSubEngine,
		@Arg("roomName") roomName: string,
		@Ctx() { req }: Context
	): Promise<RoomResponse> {
		console.log(req);
		if (req.session.userID) {
			try {
				const room = await getConnection()
					.createQueryBuilder()
					.insert()
					.into(Room)
					.values([{ createrId: req.session.userID, roomName: roomName }])
					.returning("*")
					.execute()
					.then((res) => res.raw[0]);
				pubSub.publish(roomName, roomName);
				return {
					room,
				};
			} catch (err) {
				const error = "Some error occured";
				return {
					error,
				};
			}
		}
		const error = "Not Authenticated";
		return {
			error,
		};
	}
	@Mutation(() => MessageResponse)
	async createMessage(
		@PubSub() pubSub: PubSubEngine,
		@Arg("body") body: string,
		@Arg("roomId") roomId: string,
		@Ctx() { req }: Context
	): Promise<MessageResponse> {
		const room = await getConnection()
			.createQueryBuilder()
			.select("room")
			.from(Room, "room")
			.where("room.id = :id", { id: roomId })
			.getOne();
		console.log(room);
		if (room) {
			if (req.session.userID) {
				try {
					const id = await getConnection()
						.createQueryBuilder()
						.insert()
						.into(Message)
						.values([
							{
								senderId: req.session.userID,
								body: body,
								roomId: room.id,
							},
						])
						.returning("*")
						.execute()
						.then((res) => res.raw[0]);
					const message = await getConnection()
						.createQueryBuilder(Message, "message")
						.leftJoinAndSelect("message.sender", "sender")
						.where("message.id = :id", { id: id.id })
						.getOne();
					const payload = message;

					await pubSub.publish(roomId, payload);
					console.log(roomId);
					return {
						message,
					};
				} catch (err) {
					const error = "A problem occured";
					return {
						error,
					};
				}
			} else {
				const error = "A problem occured";
				return {
					error,
				};
			}
		} else {
			const error = "There was a problem creating the subscription";
			return {
				error,
			};
		}
	}
	@Query(() => AllMessageResponse)
	async getAllMessages(
		@Arg("offsetPagination") offsetPagination: OffsetPagination
	): Promise<AllMessageResponse> {
		try {
			const messages = await getConnection()
				.createQueryBuilder(Message, "message")
				.leftJoinAndSelect("message.sender", "sender")
				.orderBy("message.id", "DESC")
				.take(offsetPagination.limit)
				.getMany();
			return {
				messages,
			};
		} catch (err) {
			const error = "A problem occured";
			return {
				error,
			};
		}
	}

	@Query(() => AllMessageResponse)
	async getAllMessagesForRoom(
		@Arg("roomId") roomId: string
		// @Arg("offsetPagination") offsetPagination: OffsetPagination
	): Promise<AllMessageResponse> {
		try {
			const messages = await getConnection()
				.createQueryBuilder(Message, "message")
				.leftJoinAndSelect("message.sender", "sender")
				.where("message.roomId = :roomId", { roomId: roomId })
				.orderBy("message.id", "DESC")
				.getMany();
			return {
				messages,
			};
		} catch (err) {
			const error = "A problem occured";
			return {
				error,
			};
		}
	}

	@Subscription({
		topics: ({ args }) => args.topic,
	})
	newMessage(
		@Arg("topic") topic: string, //topic is roomId which will be passed in dynamically
		@Root() { id, sender, body, createdAt, room, roomId }: Message
	): Message {
		return { id, sender, body, createdAt, room, roomId };
	}
}
