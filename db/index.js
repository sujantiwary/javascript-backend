import mongoose from "mongoose";
import { DB_NAME } from "../src/constants.js";

const connectDB = async()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process .env.DATABASE_URI}/${DB_NAME}`);
        console.log(`Database connected: ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log("Error connecting to the database:", error);
        
    }
}

export default connectDB;