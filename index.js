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

const http = require("http");
const { Server } = require("socket.io");
const { UserStatus, Notification } = require("./chatModel/chatModel");

const cors = require("cors");
const path = require("path");
const { ExpressPeerServer } = require("peer");

dotenv.config();

//Middleware setup
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "10mb" })); // For JSON payloads
app.use(express.urlencoded({ limit: "10mb", extended: true })); // For URL-encoded payloads
app.use(express.static("uploads"));

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

// Create HTTP server
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
  allowEIO3: true,
  path: "/socket.io/",
  transports: ["websocket", "polling"],
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e8,
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  // console.log('A user connected');

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
    console.log(`User ${userId} joined their chat room`);
    socket.join(userId);
  });

  // Handle leaving a chat room
  socket.on("leave_chat", (userId) => {
    console.log(`User ${userId} left their chat room`);
    socket.leave(userId);
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

  socket.on("disconnect", async () => {
    try {
      const user = await UserStatus.findOne({ socketId: socket.id });
      if (user) {
        user.isOnline = false;
        user.lastSeen = new Date();
        await user.save();

        // Broadcast the status change
        io.emit("user_status_changed", {
          userId: user.userId,
          isOnline: false,
          lastSeen: user.lastSeen,
        });
      }
    } catch (error) {
      console.error("Error updating user status on disconnect:", error);
    }
  });

  // Add notification handlers
  socket.on("join_notifications", (userId) => {
    socket.join(`notifications_${userId}`);
  });

  // Handle call initiation
  socket.on("call-user", (data) => {
    console.log("Call initiated:", data);
    // Emit to specific user's room
    io.to(data.receiverId).emit("incoming-call", {
      callerId: data.callerId,
      callerName: data.callerName,
      offer: data.offer,
    });
  });

  socket.on("call-answered", (data) => {
    console.log("Call answered:", data);
    io.to(data.callerId).emit("call-accepted", {
      answer: data.answer,
      receiverId: data.receiverId,
    });
  });

  socket.on("ice-candidate", (data) => {
    console.log("ICE candidate:", data.callerId, "->", data.receiverId);
    io.to(data.receiverId).emit("ice-candidate", {
      candidate: data.candidate,
      callerId: data.callerId,
    });
  });

  socket.on("end-call", (data) => {
    console.log("Call ended by:", data.callerId);
    io.to(data.receiverId).emit("call-ended", {
      callerId: data.callerId,
    });
  });

  socket.on("call-rejected", (data) => {
    console.log("Call rejected by:", data.receiverId);
    io.to(data.callerId).emit("call-rejected", {
      receiverId: data.receiverId,
    });
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

app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

//Port setup
const port = process.env.APP_PORT || 5000;
server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});

// Move PeerServer configuration before routes
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: "/myapp",
  proxied: true,
  ssl: false,
  allow_discovery: true,
  alive_timeout: 60000,
  key: "peerjs",
  concurrent_limit: 5000,
  cleanup_out_msgs: 1000,
});

app.use("/peerjs", peerServer);

// Comment out or remove this until WebSocket is working
// peerServer.on("connection", (client) => {
//   const token = client.token;
//   if (!validateToken(token)) {
//     client.socket.close();
//   }
// });
