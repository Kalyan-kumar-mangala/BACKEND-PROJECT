import app from "./app.js";

import connectDB from "./db/index.js";

import dotenv from "dotenv";

import mongoose from "mongoose";

dotenv.config();



app.get("/", (req, res) => {
    res.send("backend project");
});

app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`);
});


const mongoDbURI = process.env.MONGODB_URI;


connectDB(mongoose.connect(mongoDbURI));
