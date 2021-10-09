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

async function main() {
	const app = express();
	const httpServer = http.createServer(app);
    const connect = await connection()
    await connect.runMigrations()
	const schema = await buildSchema({
		resolvers: [UserResolvers],
        validate: false
	});

	const server = new ApolloServer({
		schema: schema,
		plugins: [
			ApolloServerPluginDrainHttpServer({ httpServer }),
			ApolloServerPluginLandingPageGraphQLPlayground,
		],
	});

	await server.start();
	server.applyMiddleware({
		app,
	});
	//@ts-ignore
	await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
	console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
}
main();
