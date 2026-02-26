// server/src/index.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const session = require("express-session");
const ConnectMongo = require("connect-mongo");

const env = require("./config/env"); // your must() based env loader
const { connectDb } = require("./db");
const passport = require("./auth/passport");

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const calendarRoutes = require("./routes/calendar");

const planRoutes = require("./routes/plan");
const dayplanRoutes = require("./routes/dayplan");
const habitsRoutes = require("./routes/habits");
const journalRoutes = require("./routes/journal");
const goalsRoutes = require("./routes/goals");

const isProd = process.env.NODE_ENV === "production";

// ConnectMongo export shape can differ by bundler; handle both safely
const MongoStore = ConnectMongo.default ?? ConnectMongo;

async function main() {
  // 1) DB
  await connectDb();

  // 2) App
  const app = express();

  // Render/Proxies: required so secure cookies work behind proxy
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(morgan("dev"));

  // 3) CORS (must be BEFORE routes, and must allow credentials)
  const allowedOrigins = [
    env.frontendUrl,        // Netlify URL in production
    "http://localhost:5173" // local dev
  ];

  const corsOptions = {
    origin: (origin, cb) => {
      // Allow non-browser requests (curl/Render health checks)
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  };

  app.use(cors(corsOptions));
  app.options(/.*/, cors(corsOptions));

  // 4) Parsers
  app.use(express.json());

  // 5) Sessions (cross-site cookies need SameSite=None + Secure in production)
  app.use(
    session({
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({ mongoUrl: env.mongoUri }),
      cookie: {
        httpOnly: true,
        secure: isProd,                 // true on Render (HTTPS)
        sameSite: isProd ? "none" : "lax"
      }
    })
  );

  // 6) Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // 7) Health routes
  app.get("/", (_req, res) => res.status(200).send("OK"));
  app.get("/health", (_req, res) => res.status(200).json({ ok: true }));
  app.get("/api/health", (_req, res) => res.status(200).json({ ok: true }));

  // 8) Routes
  app.use("/auth", authRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use("/api/calendar", calendarRoutes);
  app.use("/api/plan", planRoutes);
  app.use("/api/dayplan", dayplanRoutes);
  app.use("/api/habits", habitsRoutes);
  app.use("/api/journal", journalRoutes);
  app.use("/api/goals", goalsRoutes);

  // 9) Start
  app.listen(env.port, () => {
    console.log(`✅ Server listening on port ${env.port}`);
  });
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});