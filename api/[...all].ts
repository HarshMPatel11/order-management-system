import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import { setupAuth } from "../server/auth";
import { registerRoutes } from "../server/routes";
import { client } from "../server/db";

const app = express();

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false }));
setupAuth(app);

let initialized = false;
let initPromise: Promise<void> | null = null;

async function initializeApp() {
  if (initialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      await client.connect();
      await registerRoutes(null, app);

      app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";

        if (res.headersSent) {
          return next(err);
        }

        return res.status(status).json({ message });
      });

      initialized = true;
    })();
  }

  await initPromise;
}

export default async function handler(req: Request, res: Response) {
  await initializeApp();
  return app(req, res);
}
