import "dotenv/config";
import { createConnection } from "typeorm";
import { User } from "./entities/user.entities";
import path from "path";

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
		entities: [User],
		migrations: [path.join(__dirname, ".migrations/*")],
	});
}
