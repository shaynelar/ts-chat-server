import {
	Arg,
	Ctx,
	Field,
	InputType,
	Mutation,
	ObjectType,
	Query,
	Resolver,
} from "type-graphql";
import { getConnection } from "typeorm";
import { User } from "../entities/user.entities";
import * as argon2 from "argon2";
import { Context, SingleFieldError } from "../types";
import { validate } from "uuid";

@ObjectType()
class UserResponse {
	@Field(() => User, { nullable: true })
	user?: User;

	@Field(() => String, { nullable: true })
	error?: SingleFieldError;
}
@InputType()
class UserBaseInput {
	@Field()
	username: string;

	@Field()
	password: string;
}
@InputType()
class RegisterInput extends UserBaseInput {
	@Field()
	confirmPassword: string;
}

@Resolver(User)
export class UserResolvers {
	@Mutation(() => UserResponse)
	async registerUser(
		@Arg("userInput") userInput: RegisterInput,
		@Ctx() { req }: Context
	): Promise<UserResponse> {
		try {
			if (userInput.password === userInput.confirmPassword) {
				const user = await getConnection()
					.createQueryBuilder()
					.insert()
					.into(User)
					.values([
						{
							username: userInput.username,
							password: await argon2.hash(userInput.password),
						},
					])
					.returning("*")
					.execute()
					.then((response) => response.raw[0]);
				req.session.userID = user.id;
				return {
					user,
				};
			} else {
				const error = "Passwords do not match";
				return {
					error,
				};
			}
		} catch (err) {
			console.error(err);
			const error = "There was an error";
			return {
				error,
			};
		}
	}

	@Mutation(() => UserResponse)
	async loginUser(
		@Arg("userInput") userInput: UserBaseInput,
		@Ctx() { req }: Context
	): Promise<UserResponse> {
		const user = await getConnection()
			.createQueryBuilder()
			.select("user")
			.from(User, "user")
			.where("user.username = :username", { username: userInput.username })
			.getOne();
		if (user) {
			try {
				if (await argon2.verify(user.password, userInput.password)) {
					req.session.userID = user.id;
					return {
						user,
					};
				} else {
					const error = "Username or password is incorrect";
					return {
						error,
					};
				}
			} catch (err) {
				const error = "An error occured";
				console.error(err);
				return {
					error,
				};
			}
		} else {
			const error = "That user does not exist";
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

	@Query(() => UserResponse)
	async getMe(@Ctx() { req }: Context): Promise<UserResponse> {
		try {
			const user = await getConnection()
				.createQueryBuilder()
				.select("user")
				.from(User, "user")
				.where("user.id = :id", { id: req.session.userID })
				.getOne();
			if (validate(req.sessionID)) {
				//check that session data has not been tampered with
				return {
					user,
				};
			} else {
				const error = "An issue occured with the session data";
				return {
					error,
				};
			}
		} catch (err) {
			const error = "An error occured";
			return {
				error,
			};
		}
	}
}
