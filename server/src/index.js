const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const session = require("express-session");
const ConnectMongo = require("connect-mongo");
const taskRoutes = require("./routes/tasks");
const calendarRoutes = require("./routes/calendar");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const isProd = process.env.NODE_ENV === "production";


const env = require("./config/env");
const { connectDb } = require("./db");
const passport = require("./auth/passport");

const authRoutes = require("./routes/auth");

const MongoStore = ConnectMongo.default ?? ConnectMongo;

async function main() {
  store: MongoStore.create({ mongoUrl: env.mongoUri })
  await connectDb();

  const app = express();
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(morgan("dev"));

  app.use(
    cors({
      origin: env.frontendUrl,
      credentials: true
    })
  );

  app.use(express.json());

  app.use(
    session({
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: "lax", secure: false },
      store: MongoStore.create({ mongoUrl: env.mongoUri })
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  const cors = require("cors");
  const config = require("./env"); // or wherever you load env.js

  const allowedOrigins = [
    config.frontendUrl,              // your Netlify URL from Render env
    "http://localhost:5173"          // keep dev working
  ];

  const corsOptions = {
    origin: (origin, cb) => {
      // allow same-origin/non-browser requests (Render health checks, curl, etc.)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  };

  app.use(
    session({
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: config.mongoUri }),
      cookie: {
        httpOnly: true,
        secure: isProd,                 // true on Render (HTTPS)
        sameSite: isProd ? "none" : "lax"
      }
    })
  );

  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions)); // IMPORTANT for preflight
  


  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/auth", authRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/calendar", calendarRoutes);
  app.use("/api/plan", require("./routes/plan"));
  app.use("/api/dayplan", require("./routes/dayplan"));
  app.use("/api/habits", require("./routes/habits"));
  app.use("/api/journal", require("./routes/journal"));
  app.use("/api/goals", require("./routes/goals"));
  app.get("/", (_req, res) => res.status(200).send("OK"));
  app.get("/health", (_req, res) => res.status(200).json({ ok: true }));


  app.listen(env.port, () => console.log(`✅ Server: http://localhost:${env.port}`));
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
