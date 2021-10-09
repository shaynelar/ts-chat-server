import {
	Arg,
	Field,
	Mutation,
	ObjectType,
	Query,
	Resolver,
} from "type-graphql";
import { getConnection, getManager } from "typeorm";
import { User } from "../entities/user.entities";

type Error = string | null;

@ObjectType()
class UserResponse {
	@Field(() => User, { nullable: true })
	user?: User;

	@Field(() => String, { nullable: true })
	error?: Error;
}

@Resolver(User)
export class UserResolvers {
	@Mutation(() => UserResponse)
	async registerUser(@Arg("username") username: string): Promise<UserResponse> {
		try {
			const user = await getConnection()
				.createQueryBuilder()
				.insert()
				.into(User)
				.values({ username: username })
				.execute()
				.then((response) => response.raw[0]);
                console.log(user)
			return {
				user,
			};
		} catch (err) {
            console.error(err)
			const error = "There was an error";
			return {
				error,
			};
		}
	}

	@Query(() => UserResponse)
	async getUser(@Arg("username") username: string): Promise<UserResponse> {
		try {
			const user = await getConnection()
				.createQueryBuilder()
				.select("user")
				.from(User, "user")
				.where("user.username = :username", { username: username })
				.getOne();

			return {
				user,
			};
		} catch (err) {
			console.error(err);
			const error = "No user exists";
			return {
				error,
			};
		}
	}
}
