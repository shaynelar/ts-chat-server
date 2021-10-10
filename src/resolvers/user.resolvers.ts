import {
	Arg,
	Field,
	Mutation,
	ObjectType,
	Query,
	Resolver,
} from "type-graphql";
import { getConnection } from "typeorm";
import { User } from "../entities/user.entities";
import * as argon2 from "argon2";

type SingleFieldError = string | null;
type MultiFieldError = {
	field: string;
	message: string;
}[];

@ObjectType()
class UserResponse {
	@Field(() => User, { nullable: true })
	user?: User;

	@Field(() => String, { nullable: true })
	error?: SingleFieldError;
}

@Resolver(User)
export class UserResolvers {
	@Mutation(() => UserResponse)
	async registerUser(
		@Arg("username") username: string,
		@Arg("password") password: string
	): Promise<UserResponse> {
		try {
			const user = await getConnection()
				.createQueryBuilder()
				.insert()
				.into(User)
				.values([{ username: username, password: await argon2.hash(password) }])
				.returning("*")
				.execute()
				.then((response) => response.raw[0]);

			return {
				user,
			};
		} catch (err) {
			console.error(err);
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
