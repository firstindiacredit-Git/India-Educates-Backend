const express = require("express");
const app = express();
const dotenv = require("dotenv");
const mongoose = require("mongoose");
// const multer = require('./utils/multerConfig')
const employeeController = require("./controller/employeeAuth");
const employeeDashboards = require("./controller/employeeDashboards");
const projectRoutes = require("./routes/projectRoutes");
const adminUserRoutes = require("./userRoute/adminUserRoutes");
const taskRoutes = require("./routes/taskRoutes");
const projectMessage = require("./controller/projectMessage");
const taskMessage = require("./controller/taskMessage");
const clientRoutes = require("./controller/clientAuth");
const holidayController = require("./controller/holidayAuth");
const invoiceRoutes = require("./controller/invoiceAuth");
const urlController = require("./controller/urlShortner");
const qrController = require("./controller/qrRoutes");
const adminDashboard = require("./userController/adminDashboard");
const chatAuth = require("./chatController/chatAuth");
const groupAuth = require("./chatController/groupAuth");
const meetingController = require("./controller/meetingScheuler");
const studentAuth = require("./controller/studentAuth");
const studentFormRoutes = require("./controller/studentForm");
const jwt = require("jsonwebtoken");
const https = require("https");
const fs = require("fs");

const http = require("http");
const { Server } = require("socket.io");
const { UserStatus, Notification } = require("./chatModel/chatModel");

const cors = require("cors");
const path = require("path");

dotenv.config();

// More detailed CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      "https://192.168.1.24:3000",
      "https://localhost:3000",
    ];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Place this before your routes
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://192.168.1.24:3000");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", true);

  // Handle preflight
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: "10mb" })); // For JSON payloads
app.use(express.urlencoded({ limit: "10mb", extended: true })); // For URL-encoded payloads
app.use(express.static("./uploads"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB setup
const url = process.env.MONGODB_URI;
mongoose.connect(url);

const connection = mongoose.connection;
connection.on(
  "error",
  console.error.bind(console, "MongoDB connection error:")
);
connection.once("open", () => {
  console.log("MongoDB database connected");
});

// Add SSL certificate configuration
const options = {
  key: fs.readFileSync("./certificates/key.pem"),
  cert: fs.readFileSync("./certificates/cert.pem"),
};

// Create HTTPS server
const server = https.createServer(options, app);

// Socket.IO setup with better connection handling
const io = new Server(server, {
  cors: {
    origin: "*", // Be more specific in production
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ["websocket"], // Use only websocket
  allowEIO3: true, // Allow Engine.IO 3
  cookie: false, // Disable socket.io cookie
});

// Keep track of connected users and their sockets
const connectedUsers = new Map();

io.on("connection", (socket) => {
  console.log("New socket connection:", socket.id);

  // Handle joining rooms
  socket.on("join_rooms", (data) => {
    const { userId, userType } = data;
    console.log(`User ${userId} joining rooms with socket ${socket.id}`);

    // Store the socket ID for this user
    connectedUsers.set(userId, socket.id);

    // Join personal room
    socket.join(userId);
    console.log(`User ${userId} joined rooms with socket ${socket.id}`);
  });

  // Handle call initiation
  socket.on("call-user", (data) => {
    console.log("Call initiation request:", data);
    const receiverSocketId = connectedUsers.get(data.receiverId);

    if (receiverSocketId) {
      const callRoom = `call_${data.callerId}_${data.receiverId}`;
      socket.join(callRoom);
      console.log(`Caller ${data.callerId} joined room: ${callRoom}`);

      // Emit to specific socket ID
      io.to(receiverSocketId).emit("incoming-call", {
        callerId: data.callerId,
        callerName: data.callerName,
        type: data.type,
        callRoom: callRoom,
      });

      console.log(
        `Call offer sent to ${data.receiverId} via socket ${receiverSocketId}`
      );
    } else {
      console.log(`No socket found for receiver: ${data.receiverId}`);
      socket.emit("call-failed", { message: "User is not available" });
    }
  });

  // Handle call acceptance
  socket.on("call-accepted", (data) => {
    const { callerId, receiverId, callRoom } = data;
    socket.join(callRoom);
    console.log(`Receiver ${receiverId} joined room: ${callRoom}`);

    // Log all sockets in this room
    const room = io.sockets.adapter.rooms.get(callRoom);
    const socketsInRoom = room ? Array.from(room) : [];
    console.log(`Current sockets in room ${callRoom}:`, socketsInRoom);

    io.to(callRoom).emit("call-accepted", data);
  });

  // Handle call rejection
  socket.on("call-rejected", (data) => {
    const { callerId, receiverId, callRoom } = data;
    console.log(`Call rejected in room ${callRoom} by ${receiverId}`);
    io.to(callRoom).emit("call-rejected", data);
  });

  // Handle call end
  socket.on("end-call", (data) => {
    const { callerId, receiverId, callRoom } = data;
    console.log(`Call ended in room ${callRoom}`);
    io.to(callRoom).emit("call-ended");
    socket.leave(callRoom);
    console.log(`Socket ${socket.id} left room ${callRoom}`);
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    // Remove user from connectedUsers
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });

  // Handle joining a project room
  socket.on("join project", (projectId) => {
    socket.join(projectId);
  });

  // Handle joining a task room
  socket.on("join task", (taskId) => {
    socket.join(taskId);
  });

  // Handle new project message
  socket.on("new message", (data) => {
    io.to(data.projectId).emit("new message", data);
  });

  // Handle new task message
  socket.on("new task message", (data) => {
    io.to(data.taskId).emit("new task message", data);
  });

  // Handle joining a personal chat room
  socket.on("join_chat", (userId) => {
    socket.join(userId);
    // console.log(`User ${userId} joined their chat room`);
  });

  // Handle private message with acknowledgment
  socket.on("private_message", async (data) => {
    const { receiverId, message } = data;

    // Create notification
    const notification = new Notification({
      userId: receiverId,
      chatId: message._id,
      senderId: message.senderId,
      senderType: message.senderType,
      message: message.message || "New message received",
      type: "private",
    });
    await notification.save();

    // Emit both message and notification
    io.to(receiverId).emit("receive_message", message);
    io.to(`notifications_${receiverId}`).emit("new_notification", notification);
    socket.emit("message_sent", message);
  });

  // Handle typing status
  socket.on("typing", (data) => {
    const { receiverId } = data;
    socket.to(receiverId).emit("user_typing", data);
  });

  socket.on("join_group", (groupId) => {
    socket.join(groupId);
  });

  socket.on("group_message", async (data) => {
    // Create notifications for all group members except sender
    const notifications = data.members
      .filter((member) => member.userId !== data.senderDetails.userId)
      .map((member) => ({
        userId: member.userId,
        chatId: data._id,
        senderId: data.senderId,
        senderType: data.senderType,
        message: data.message || "New group message",
        type: "group",
      }));

    await Notification.insertMany(notifications);

    // Emit notifications to all members
    notifications.forEach((notification) => {
      io.to(`notifications_${notification.userId}`).emit(
        "new_notification",
        notification
      );
    });

    io.to(data.groupId).emit("receive_group_message", data.message);
  });

  socket.on("user_connected", async (userData) => {
    try {
      const socketId = socket.id;
      await UserStatus.findOneAndUpdate(
        { userId: userData.userId },
        {
          userId: userData.userId,
          userType: userData.userType,
          isOnline: true,
          lastSeen: new Date(),
          socketId: socketId,
        },
        { upsert: true, new: true }
      );

      // Broadcast the status change to all connected clients
      io.emit("user_status_changed", {
        userId: userData.userId,
        isOnline: true,
        lastSeen: new Date(),
      });
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  });

  // Add notification handlers
  socket.on("join_notifications", (userId) => {
    socket.join(`notifications_${userId}`);
  });
});

// Make io accessible to our router
app.set("io", io);

app.get("/hello", (req, res) => {
  res.send("Hello World");
});

//Route setup
app.use("/api", clientRoutes);
app.use("/api", employeeController);
app.use("/api", employeeDashboards);
app.use("/api", projectRoutes);
app.use("/api", projectMessage);
app.use("/api", taskMessage);
app.use("/api", taskRoutes);
app.use("/api", adminUserRoutes);
app.use("/api", holidayController);
app.use("/api", invoiceRoutes);
app.use("/api", qrController);
app.use("/api", adminDashboard);
app.use("/", urlController);
app.use("/api", chatAuth);
app.use("/api", groupAuth);
app.use("/api", meetingController);
app.use("/api", studentAuth);
app.use("/api", studentFormRoutes);

// app.use(express.static(path.join(__dirname, 'dist')));

// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, 'dist', 'index.html'));
// });

//Port setup
const port = process.env.APP_PORT || 5000;
server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
