import "dotenv/config";
import { createConnection } from "typeorm";
import { User, Message } from "./entities";
import path from "path";
import { Room } from "./entities/room.entities";

export async function connection() {
	return createConnection({
		type: "postgres",
		host: "localhost",
		port: 5432,
		username: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: "ts-chat",
		logging: true,
		synchronize: true,
		entities: [User, Message, Room],
		migrations: [path.join(__dirname, ".migrations/*")],
	});
}
