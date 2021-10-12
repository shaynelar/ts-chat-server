import "dotenv/config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import {
	ApolloServerPluginDrainHttpServer,
	ApolloServerPluginLandingPageGraphQLPlayground,
} from "apollo-server-core";
import http from "http";
import cors from "cors";
import { buildSchema } from "type-graphql";
import { UserResolvers } from "./resolvers";
import { connection } from "./connection";
import session from "express-session";
import Redis from "ioredis";
import connectRedis from "connect-redis";
import { v4 as uuidv4 } from "uuid";
import { execute, subscribe } from "graphql";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { MessageResolvers } from "./resolvers/message.resolvers";

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
		resolvers: [UserResolvers, MessageResolvers],
		validate: false,
	});

	const corsOptions = {
		origin: process.env.ORIGIN,
		credentials: true,
	};
	
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
			{
				async serverWillStart() {
					return {
						async drainServer() {
							subscriptionServer.close();
						},
					};
				},
			},
		],
	});
	const subscriptionServer = SubscriptionServer.create(
		{
			// This is the `schema` we just created.
			schema,
			// These are imported from `graphql`.
			execute,
			subscribe,
		},
		{
			// This is the `httpServer` we created in a previous step.
			server: httpServer,
			// This `server` is the instance returned from `new ApolloServer`.
			path: server.graphqlPath,
		}
	);

	app.use(cors(corsOptions));
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
		cors: corsOptions,
	});
	//@ts-ignore
	await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
	console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
}
main().catch((err) => console.error(err));
