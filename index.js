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
const studentAuth = require('./controller/studentAuth');
const studentFormRoutes = require('./controller/studentForm');
const jwt = require('jsonwebtoken');
const zoomAuth = require("./chatController/zoomAuth");
const http = require('http');
const { Server } = require("socket.io");
const { UserStatus, Notification } = require("./chatModel/chatModel");
const iccrForm2 = require('./controller/iccrForm2Auth');
const iccrForm1 = require('./controller/iccrForm1Auth');
const loanController = require('./controller/loanController');

const cors = require("cors");
const path = require("path");

dotenv.config();

//Middleware setup
app.use(cors());
app.use(express.json({ limit: '10mb' })); // For JSON payloads
app.use(express.urlencoded({ limit: '10mb', extended: true })); // For URL-encoded payloads
app.use(express.static("./uploads"));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB setup
const url = process.env.MONGODB_URI;
mongoose.connect(url);

const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'MongoDB connection error:'));
connection.once('open', () => {
  console.log('MongoDB database connected');
});

// Create HTTP server
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*", // Be more specific in production
    methods: ["GET", "POST"],
    pingTimeout: 60000, // Add ping timeout
    reconnection: true, // Enable reconnection
    reconnectionAttempts: 5 // Set max reconnection attempts
  }
});



// Socket.IO connection handling
io.on('connection', (socket) => {
  // console.log('A user connected');

  // Handle joining a project room
  socket.on('join project', (projectId) => {
    socket.join(projectId);
  });

  // Handle joining a task room
  socket.on('join task', (taskId) => {
    socket.join(taskId);
  });

  // Handle new project message
  socket.on('new message', (data) => {
    io.to(data.projectId).emit('new message', data);
  });

  // Handle new task message
  socket.on('new task message', (data) => {
    io.to(data.taskId).emit('new task message', data);
  });

  // Handle joining a personal chat room
  socket.on('join_chat', (userId) => {
    socket.join(userId);
    // console.log(`User ${userId} joined their chat room`);
  });

  // Handle private message with acknowledgment
  socket.on('private_message', async (data) => {
    const { receiverId, message } = data;
    
    // Create notification
    const notification = new Notification({
      userId: receiverId,
      chatId: message._id,
      senderId: message.senderId,
      senderType: message.senderType,
      message: message.message || 'New message received',
      type: 'private'
    });
    await notification.save();

    // Emit both message and notification
    io.to(receiverId).emit('receive_message', message);
    io.to(`notifications_${receiverId}`).emit('new_notification', notification);
    socket.emit('message_sent', message);
  });

  // Handle typing status
  socket.on('typing', (data) => {
    const { receiverId } = data;
    socket.to(receiverId).emit('user_typing', data);
  });

  socket.on('join_group', (groupId) => {
    socket.join(groupId);
  });

  socket.on('group_message', async (data) => {
    // Create notifications for all group members except sender
    const notifications = data.members
      .filter(member => member.userId !== data.senderDetails.userId)
      .map(member => ({
        userId: member.userId,
        chatId: data._id,
        senderId: data.senderId,
        senderType: data.senderType,
        message: data.message || 'New group message',
        type: 'group'
      }));

    await Notification.insertMany(notifications);

    // Emit notifications to all members
    notifications.forEach(notification => {
      io.to(`notifications_${notification.userId}`).emit('new_notification', notification);
    });

    io.to(data.groupId).emit('receive_group_message', data.message);
  });

  socket.on('user_connected', async (userData) => {
    // console.log('User connected:', userData);
    try {
      const socketId = socket.id;
      await UserStatus.findOneAndUpdate(
        { userId: userData.userId },
        {
          userId: userData.userId,
          userType: userData.userType,
          isOnline: true,
          lastSeen: new Date(),
          socketId: socketId
        },
        { upsert: true, new: true }
      );

      // Broadcast the status change to all connected clients
      io.emit('user_status_changed', {
        userId: userData.userId,
        isOnline: true,
        lastSeen: new Date()
      });

      // Store the socket mapping
      socket.userId = userData.userId;
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  });

  socket.on('disconnect', async () => {
    try {
      const user = await UserStatus.findOne({ socketId: socket.id });
      if (user) {
        user.isOnline = false;
        user.lastSeen = new Date();
        await user.save();

        // Broadcast the status change
        io.emit('user_status_changed', {
          userId: user.userId,
          isOnline: false,
          lastSeen: user.lastSeen
        });
      }

      // console.log('User disconnected:', socket.userId);
    } catch (error) {
      console.error('Error updating user status on disconnect:', error);
    }
  });

  // Add notification handlers
  socket.on('join_notifications', (userId) => {
    socket.join(`notifications_${userId}`);
  });

  // Add disconnect handler
  socket.on('disconnect', () => {
    // console.log('User disconnected:', socket.id);
  });

  // Video call request handler
  socket.on('video_call_request', (data) => {
    console.log('Video call request received:', data);
    const { senderId, receiverId, senderName } = data;
    
    // Emit to the receiver
    io.to(receiverId).emit('incoming_video_call', {
      senderId,
      receiverId,
      senderName
    });
    
    console.log('Video call request sent to:', receiverId);
  });

  // Video call accepted handler
  socket.on('video_call_accepted', (data) => {
    console.log('Video call accepted:', data);
    const { senderId, receiverId } = data;
    
    io.to(senderId).emit('video_call_accepted', {
      receiverId,
      timestamp: Date.now()
    });
    
    console.log('Acceptance sent to:', senderId);
  });

  // Video call rejected handler
  socket.on('video_call_rejected', (data) => {
    console.log('Video call rejected:', data);
    const { senderId } = data;
    
    io.to(senderId).emit('video_call_rejected');
    console.log('Rejection sent to:', senderId);
  });

  // WebRTC signaling
  socket.on('offer', (data) => {
    socket.to(data.receiverId).emit('offer', {
      offer: data.offer,
      senderId: data.senderId
    });
  });

  socket.on('answer', (data) => {
    socket.to(data.receiverId).emit('answer', {
      answer: data.answer,
      senderId: data.senderId
    });
  });

  socket.on('ice-candidate', (data) => {
    socket.to(data.receiverId).emit('ice-candidate', {
      candidate: data.candidate,
      senderId: data.senderId
    });
  });
});

// Make io accessible to our router
app.set('io', io);

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
app.use('/api', studentFormRoutes);
app.use("/api", zoomAuth);
app.use('/api', iccrForm2);
app.use('/api', iccrForm1);
app.use('/api', loanController);

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

//Port setup
const port = process.env.APP_PORT || 5000;
server.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
