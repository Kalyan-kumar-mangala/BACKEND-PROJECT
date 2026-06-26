import mongoose from 'mongoose';
import dns from 'dns';
import connectDB from "./ConnectDbWrapper.js";

dns.setServers([
    '1.1.1.1',
    '8.8.8.8'
]);

// async function connectDB() {
//     try {
//         console.log("URI =", process.env.MONGODB_URI);
//         const connection = await mongoose.connect(process.env.MONGODB_URI);
//         console.log(`Connected to MongoDB at: ${connection.connection.host}`);
//     } catch (error) {
//         console.error('Error connecting to MongoDB:', error);
//         process.exit(1);
//     }
// }



export default connectDB;