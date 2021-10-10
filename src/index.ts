import "dotenv/config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import {
	ApolloServerPluginDrainHttpServer,
	ApolloServerPluginLandingPageGraphQLPlayground,
} from "apollo-server-core";
import http from "http";

import { buildSchema } from "type-graphql";
import { UserResolvers } from "./resolvers/user.resolvers";
import { connection } from "./connection";
import session from "express-session";
import Redis from "ioredis";
import connectRedis from "connect-redis";
import { v4 as uuidv4 } from "uuid";

async function main(): Promise<void> {
	const __prod__ = process.env.NODE_ENV ? true : false;

	const app = express();
	const httpServer = http.createServer(app);
	const RedisStore = connectRedis(session);
	const redis = new Redis();
	try {
		const connect = await connection();
		await connect.runMigrations();
	} catch (err) {
		console.error(err);
	}

	const schema = await buildSchema({
		resolvers: [UserResolvers],
		validate: false,
	});

	const server = new ApolloServer({
		schema: schema,
		context: ({ req, res }) => ({
			req,
			res,
			redis,
		}),
		plugins: [
			ApolloServerPluginDrainHttpServer({ httpServer }),
			ApolloServerPluginLandingPageGraphQLPlayground,
		],
	});
	app.use(
		session({
			name: "ts-chat-cookie",
			secret: "test-secret",
			genid: () => uuidv4(),
			saveUninitialized: false,
			resave: false,
			store: new RedisStore({
				client: redis,
				disableTouch: true,
			}),
			cookie: {
				maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
				secure: __prod__,
			},
		})
	);
	await server.start();
	server.applyMiddleware({
		app,
	});
	//@ts-ignore
	await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
	console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
}
main();
