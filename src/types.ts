import { Session } from "express-session";

export type Context = {
	req: Express.Request & { session: Session & { userID: string } };
};
