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
} from "type-graphql";
import { Message, User } from "../entities";
import { ChangeStream, getConnection } from "typeorm";

const messages: Message[] = [];

@Resolver(() => Message)
export class MessageResolvers {
	@Mutation(() => Message)
	async createMessage(
		@PubSub() pubSub: PubSubEngine,
		@Arg("body") body: string,
		@Ctx() { req }: Context
	): Promise<Message | string> {
		const user = await getConnection()
			.createQueryBuilder()
			.select("user")
			.from(User, "user")
			.where("user.id = :id", { id: req.session.userID })
			.getOne();
		if (user) {
            console.log(user)
			try {
				const message = await getConnection()
					.createQueryBuilder()
					.insert()
					.into(Message)
					.values([{ sender: user, body: body }])
					.returning("*")
					.execute()
					.then((res) => res.raw[0]);
				messages.push(message);
				const payload = message;
				await pubSub.publish("MESSAGE", payload);
				return message;
			} catch (err) {
				return "A problem occured";
			}
		} else {
			return "A problem occured";
		}
	}

	@Subscription({
		topics: "MESSAGE",
	})
	newMessage(@Root() { id, sender, body, createdAt }: Message): Message {
		return { id, sender, body, createdAt };
	}
}
