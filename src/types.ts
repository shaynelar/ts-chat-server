import { Session } from "express-session";
import { EntityManager } from "typeorm";

export type Context = {
	req: Express.Request & { session: Session & { userID: string } };
	em: EntityManager;
};

export type SingleFieldError = string | null;
