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
import { Message } from "../entities";
import { getConnection } from "typeorm";

@ObjectType()
class MessageResponse {
	@Field(() => Message, { nullable: true })
	message?: Message;

	@Field(() => String, { nullable: true })
	error?: string;
}

@ObjectType()
class AllMessageResponse {
	@Field(() => [Message], { nullable: true })
	messages?: Message[];

	@Field(() => String, { nullable: true })
	error?: string;
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
	@Mutation(() => MessageResponse)
	async createMessage(
		@PubSub() pubSub: PubSubEngine,
		@Arg("body") body: string,
		@Ctx() { req }: Context
	): Promise<MessageResponse> {
		if (req.session.userID) {
			try {
				const id = await getConnection()
					.createQueryBuilder()
					.insert()
					.into(Message)
					.values([{ senderId: req.session.userID, body: body }])
					.returning("*")
					.execute()
					.then((res) => res.raw[0]);
				const message = await getConnection()
					.createQueryBuilder(Message, "message")
					.leftJoinAndSelect("message.sender", "sender")
					.where("message.id = :id", { id: id.id })
					.getOne();
				const payload = message;
				await pubSub.publish("MESSAGE", payload);
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
	}
	@Query(() => AllMessageResponse)
	async getAllMessages(
		@Arg("offsetPagination") offsetPagination: OffsetPagination
	): Promise<AllMessageResponse> {
		try {
			const messages = await getConnection()
				.createQueryBuilder(Message, "message")
				.leftJoinAndSelect("message.sender", "sender")
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

	@Subscription({
		topics: "MESSAGE",
	})
	newMessage(@Root() { id, sender, body, createdAt }: Message): Message {
		return { id, sender, body, createdAt };
	}
}
