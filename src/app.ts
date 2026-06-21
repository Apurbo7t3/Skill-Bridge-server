import express, { Request, Response } from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./lib/auth";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./notFound";
// import { notFound } from "./middlewares/not_found";
// import globalErrorHandler from "./middlewares/global_error_handler";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.all("/api/auth/{*any}", toNodeHandler(auth));

app.use(express.json());

app.use("/", (req: Request, res: Response) => {
  res.send("Hello  World");
});

app.use(notFoundHandler);

app.use(errorHandler);

export default app;
