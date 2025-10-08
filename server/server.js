import http from 'http'
import express from "express";
import "dotenv/config";
import cors from "cors";
import cookieParser from "cookie-parser";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// Initialise socket.io server
export const io = new Server(server,{
	cors: {
    origin: CLIENT_URL, 
    credentials: true,
  },
});

// store online users
export const userSocketMap = {}; // {userId: socketId}

// Socket.io connection handler
io.on("connection", (socket) => {
	const userId = socket.handshake.query.userId;
	console.log("User Connected", userId);

	if (userId) userSocketMap[userId] = socket.id;

	// emit online users to all connected client
	io.emit("getOnlineUsers", Object.keys(userSocketMap));

	socket.on("disconnect", () => {
		console.log("User disconnected", userId);
		delete userSocketMap[userId];
		io.emit("getOnlineUsers", Object.keys(userSocketMap));
	});
});

app.use(cookieParser());
app.use(express.json({ limit: "4mb" }));
app.use(cors({
	origin: CLIENT_URL,
	credentials: true
}));


// connect to DB
await connectDB();

// Routes setup
app.use("/api/status", (req, res) => {
	res.send("Server is live");
});
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
	console.log("Server listening on PORT: " + PORT);
});
