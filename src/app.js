import express from "express";
import cors from "cors";
import UserRoute from "./routers/User.route.js";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN
}));

app.use(express.json({limit: '16kb'}));

app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/users", UserRoute);

export default app;