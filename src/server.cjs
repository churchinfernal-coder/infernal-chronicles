import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import { router as authRoutes } from "./routes/auth.js";
import timelineRoutes from "./routes/timeline.js";
import superadminRoutes from "./routes/superadmin.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(morgan("combined"));

app.use("/auth", authRoutes);
app.use("/user", timelineRoutes);
app.use("/superadmin", superadminRoutes);

app.get("/health", (req, res) => res.json({ status: "ok", uptime: process.uptime() }));

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Engine backend running on port ${PORT}`));
