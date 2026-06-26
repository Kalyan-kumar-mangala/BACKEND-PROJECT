
const connectDB = (connection) => {
    return async () => {

        try {
          const conn = await connection();
           console.log("Connected to MongoDB successfully at:", conn.connection.host);

        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
            process.exit(1);
        }

    }
};

export default connectDB;