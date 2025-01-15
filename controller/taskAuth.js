const express = require('express');
const nodemailer = require('nodemailer');
const Project = require('../model/projectModel');
const Task = require('../model/taskModel');
const jwt = require('jsonwebtoken');
const Employee = require('../model/employeeModel');
const User = require('../userModel/adminUserModel');
const dotenv = require('dotenv');

dotenv.config();

// Create Task
// exports.createTask = async (req, res) => {
//   try {
//     // Extracting paths of uploaded files
//     const paths = req.files?.map(file => file.location);

//     // Removing 'uploads\' from paths
//     // const newPaths = paths?.map(path => path.replace('uploads\\', ""));

//     // Filtering task assigners to remove empty strings
//     const taskAssigner = req.body.taskAssignPerson?.filter(task => task !== "");

//     // Fetching emails of task assigners
//     const employees = [];
//     for (let i = 0; i < taskAssigner.length; i++) {
//       try {
//         const taskPerson = await Employee.findById(taskAssigner[i]);
//         if (taskPerson) {
//           employees.push(taskPerson.emailid);
//         }
//       } catch (err) {
//         console.error(`Error fetching employee with ID ${taskAssigner[i]}: ${err.message}`);
//       }
//     }

//     // Adding paths of uploaded images to req.body
//     req.body.taskImages = paths;

//     // Creating a new Task instance
//     const task = new Task({ ...req.body, taskAssignPerson: taskAssigner });

//     // Saving the task to the database
//     const savedTask = await task.save();
//     // console.log(savedTask);

//     // Email configuration
//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         user: process.env.USER_EMAIL,
//         pass: process.env.USER_PASSWORD
//       }
//     });

//     // Sending email to each task assigner
//     const sendEmailPromises = employees.map(email => {
//       const mailOptions = {
//         from: process.env.USER_EMAIL, // sender address
//         to: email, // list of receivers
//         subject: 'Pizeonfly CRM Task', // subject line
// html: `
//   <h2>New Task Assigned: ${req.body.projectName}</h2>
//   <p><strong>Assigned By:</strong> ${req.body.assignedBy}</p>
//   <p><strong>Due Date:</strong> ${req.body.taskEndDate}</p>
//   <p><strong>Priority:</strong> ${req.body.taskPriority}</p>
//   <p><strong>Description:</strong>${req.body.description}</p>
//   <br/>
//   <p>Please review the task details and start working on it at your earliest convenience.</p>
//   <p>You can view and manage this task by logging into our project management tool:</p>
//   <a href="https://crm.pizeonfly.com/#/employee-tasks">Pizeonfly CRM Employee Tasks</a>
// `
//       };

//       return transporter.sendMail(mailOptions);
//     });

//     await Promise.all(sendEmailPromises);

//     // console.log(savedTask);
//     // Sending the saved task as response
//     res.status(201).json(savedTask);
//   } catch (error) {
//     // Handling errors
//     res.status(500).json({ error: error.message });
//   }
// };
exports.createTask = async (req, res) => {
  try {
    // Extracting paths of uploaded files
    const paths = req.files?.map(file => file.path);

    // Removing 'uploads\' from paths
    const newPaths = paths?.map(path => path.replace('uploads\\', ""));

    // Filtering task assigners to remove empty strings
    const taskAssigner = req.body.taskAssignPerson?.filter(task => task !== "");

    // Fetching emails of task assigners
    const employees = [];
    for (let i = 0; i < taskAssigner.length; i++) {
      try {
        const taskPerson = await Employee.findById(taskAssigner[i]);
        if (taskPerson) {
          employees.push(taskPerson.emailid);
        }
      } catch (err) {
        console.error(`Error fetching employee with ID ${taskAssigner[i]}: ${err.message}`);
      }
    }

    // Adding paths of uploaded images to req.body
    req.body.taskImages = newPaths;

    // Add current Indian time
    req.body.taskDate = new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"});

    // Creating a new Task instance
    const task = new Task({ ...req.body, taskAssignPerson: taskAssigner });

    // Saving the task to the database
    const savedTask = await task.save();
    // console.log(savedTask);

    // Email configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD
      }
    });

    // Sending email to each task assigner
    const sendEmailPromises = employees.map(email => {
      const mailOptions = {
        from: process.env.USER_EMAIL, // sender address
        to: email, // list of receivers
        subject: 'Pizeonfly CRM Task', // subject line
        html: `
          <h2>New Task Assigned: ${req.body.projectName}</h2>
          <p><strong>Assigned By:</strong> ${req.body.assignedBy}</p>
          <p><strong>Due Date:</strong> ${req.body.taskEndDate}</p>
          <p><strong>Priority:</strong> ${req.body.taskPriority}</p>
          <p><strong>Description:</strong>${req.body.description}</p>
          <br/>
          <p>Please review the task details and start working on it at your earliest convenience.</p>
          <p>You can view and manage this task by logging into our project management tool:</p>
          <a href="https://crm.pizeonfly.com/#/employee-tasks">Pizeonfly CRM Employee Tasks</a>
        `
      };

      return transporter.sendMail(mailOptions);
    });

    await Promise.all(sendEmailPromises);

    // console.log(savedTask);
    // Sending the saved task as response
    res.status(201).json(savedTask);
  } catch (error) {
    // Handling errors
    res.status(500).json({ error: error.message });
  }
};

// Get all tasks
exports.getAllTasks = async (req, res) => {
  try {
    // Sort by taskDate in descending order (-1)
    const tasks = await Task.find()
      .sort({ taskDate: -1 })
      .populate('taskAssignPerson');

    const projectNames = tasks.map(task => task.projectName);

    const projects = await Project.find({ projectName: { $in: projectNames } }).populate({
      path: 'taskAssignPerson',
      select: 'employeeName'
    });

    tasks.forEach(task => {
      const projectPersons = projects.filter(project => project.projectName === task.projectName);
      task = task.toObject();
      task.projectMembers = projectPersons;

      // Performance calculation
      task.performancePercentage = task.totalPoints && task.achievedPoints ?
        (task.achievedPoints / task.totalPoints) * 100 : 0;
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};




// Get a single task
exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('taskAssignPerson');
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.searchTask = async (req, res) => {
  const queries = req.query;
  if (!queries.id) {
    return res.status(400).json({ message: "id is required to search" });
  }

  try {
    const q_regex = new RegExp(queries.id, 'i');
    // console.log(q_regex);
    const proj = await Task.find({ projectName: { $regex: q_regex } });
    return res.status(200).json(proj);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update a task
exports.updateTaskById = async (req, res) => {
  try {
    // console.log(req.file);
    req.body.taskImages = req.file?.path;
    const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a task
exports.deleteTaskById = async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Get task by Task Assigne Person (token)
exports.getTask = async (req, res) => {
  const { _id } = req.body

  try {
    // Added sort by createdAt in descending order
    const tasks = await Task.find({
      taskAssignPerson: {
        $in: [_id]
      }
    })
      .sort({ createdAt: -1 }) // Add this line to sort by most recent
      .populate("taskAssignPerson");

    // Count tasks by status
    const taskStatusCount = {
      completed: 0,
      inProgress: 0,
      notStarted: 0
    };

    tasks.forEach(task => {
      if (task.isCompleted) {
        taskStatusCount.completed++;
      } else if (task.taskStatus === 'In Progress') {
        taskStatusCount.inProgress++;
      } else {
        taskStatusCount.notStarted++;
      }
    });

    res.json({ tasks, taskStatusCount });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Update task status
exports.updateTaskStatus = async (req, res) => {
  const { isCompleted, taskStatus } = req.body;
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { isCompleted, taskStatus },
      { new: true }
    );
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get total tasks by Task Assignee Person (token)
exports.getTotalTasksByAssignee = async (req, res) => {
  // const auth = req.headers.authorization;
  // if (!auth || !auth.startsWith('Bearer ')) {
  //   return res.status(401).json({ message: "Authorization token is required" });
  // }

  // const token = auth.split(' ')[1];
  // const decodedToken = jwt.decode(token);

  // if (!decodedToken || !decodedToken._id) {
  //   return res.status(400).json({ message: "Invalid token or missing user ID" });
  // }
  const { _id } = req.body

  try {
    const totalTasks = await Task.countDocuments({
      taskAssignPerson: _id
    });
    return res.json({ totalTasks });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
