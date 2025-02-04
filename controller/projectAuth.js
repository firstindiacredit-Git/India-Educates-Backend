const express = require('express');
const router = express.Router();
const Project = require('../model/projectModel');
const jwt = require('jsonwebtoken');
const Task = require('../model/taskModel');


// Total projects
exports.getTotalProjects = async (req, res) => {
    try {
        const totalProjects = await Project.countDocuments();
        res.json({ totalProjects });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create a new project
exports.createProject = async (req, res) => {
    try {
        // Handle project images
        const projectImages = req.files['projectImage']?.map(file => file.path.replace('uploads\\', "")) || [];

        // Handle project icon
        const projectIcon = req.files['projectIcon']?.[0]?.path.replace('uploads\\', "") || null;

        // Filter taskAssignPerson to remove empty values
        const taskAssigner = req.body.taskAssignPerson || [];
        const filteredTaskAssigner = taskAssigner.filter(task => task !== "");

        // Filter clientAssignPerson to remove empty values
        const clientAssigner = req.body.clientAssignPerson || [];
        const filteredClientAssigner = clientAssigner.filter(client => client !== "");

        // Create new project
        const project = new Project({
            ...req.body,
            projectImage: projectImages,
            projectIcon: projectIcon,
            taskAssignPerson: filteredTaskAssigner,
            clientAssignPerson: filteredClientAssigner,
        });

        const savedProject = await project.save();
        res.status(201).json(savedProject);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};


// Get all projects
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find().populate("taskAssignPerson").populate("clientAssignPerson");
        const allTasks = await Task.find().populate("taskAssignPerson");

        const updatedProjects = projects.map(project => {
            const projectTasks = allTasks.filter(task => task.projectName === project.projectName);

            // Count overall project tasks by status
            const totalTasks = projectTasks.length;
            const completedTasks = projectTasks.filter(task => task.isCompleted).length;
            const inProgressTasks = projectTasks.filter(task => !task.isCompleted && task.taskStatus === 'In Progress').length;
            const notStartedTasks = projectTasks.filter(task => !task.isCompleted && (!task.taskStatus || task.taskStatus === 'Not Started')).length;

            // Calculate member-specific statistics
            const memberStats = project.taskAssignPerson.map(member => {
                const memberTasks = projectTasks.filter(task => {
                    // Ensure taskAssignPerson is an array
                    const assignees = Array.isArray(task.taskAssignPerson) ? 
                        task.taskAssignPerson : 
                        [task.taskAssignPerson];

                    // Check if the member is in the assignees
                    return assignees.some(assignee => 
                        assignee && assignee._id && 
                        assignee._id.toString() === member._id.toString()
                    );
                });

                return {
                    _id: member._id,
                    employeeName: member.employeeName,
                    totalTasks: memberTasks.length,
                    completed: memberTasks.filter(task => task.isCompleted).length,
                    inProgress: memberTasks.filter(task => !task.isCompleted && task.taskStatus === 'In Progress').length,
                    notStarted: memberTasks.filter(task => !task.isCompleted && (!task.taskStatus || task.taskStatus === 'Not Started')).length
                };
            });

            const percent = (completedTasks / totalTasks * 100 || 0).toFixed(2);
            const status = percent === "100.00" ? "Completed" : "In Progress";

            return {
                ...project._doc,
                progress: percent,
                status: status,
                totalTasks,
                taskStats: {
                    completed: completedTasks,
                    inProgress: inProgressTasks,
                    notStarted: notStartedTasks
                },
                memberStats
            };
        });

        res.json(updatedProjects);
    } catch (err) {
        console.error('Error in getAllProjects:', err);
        res.status(500).json({ message: err.message });
    }
};

// Get a single project by projectId
exports.getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId).populate('taskAssignPerson').populate("clientAssignPerson");
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json(project);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
exports.searchProjects = async (req, res) => {
    const queries = req.query;
    if (!queries.id) {
        return res.status(400).json({ message: "id is required to search" });
    }

    try {
        const q_regex = new RegExp(queries.id, 'i');
        // console.log(q_regex);
        const proj = await Project.find({ projectName: { $regex: q_regex } });
        return res.status(200).json(proj);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Update a project
exports.updateProject = async (req, res) => {
    try {
        const updateData = { ...req.body };

        // Handle project images if new ones are uploaded
        if (req.files && req.files['projectImage'] && req.files['projectImage'].length > 0) {
            const projectImages = req.files['projectImage'].map(file =>
                file.path.replace('uploads\\', '')
            );
            updateData.projectImage = projectImages;
        }

        // Handle project icon if a new one is uploaded
        if (req.files && req.files['projectIcon'] && req.files['projectIcon'].length > 0) {
            updateData.projectIcon = req.files['projectIcon'][0].path.replace('uploads\\', '');
        }

        // Handle taskAssignPerson
        if (updateData.taskAssignPerson) {
            updateData.taskAssignPerson = Array.isArray(updateData.taskAssignPerson)
                ? updateData.taskAssignPerson.filter(id => id && id !== 'undefined')
                : [updateData.taskAssignPerson].filter(id => id && id !== 'undefined');
        }

        // Handle clientAssignPerson
        if (updateData.clientAssignPerson) {
            updateData.clientAssignPerson = Array.isArray(updateData.clientAssignPerson)
                ? updateData.clientAssignPerson.filter(id => id && id !== 'undefined')
                : [updateData.clientAssignPerson].filter(id => id && id !== 'undefined');
        }

        const updatedProject = await Project.findByIdAndUpdate(
            req.params.projectId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedProject) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json(updatedProject);
    } catch (err) {
        console.error('Error updating project:', err);
        res.status(400).json({ message: err.message });
    }
};

// Delete a project
exports.deleteProject = async (req, res) => {
    try {
        const deletedProject = await Project.findByIdAndDelete(req.params.projectId);
        if (!deletedProject) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

//Get project by Task Assigne Person (token)
exports.getProject = async (req, res) => {
    const { _id } = req.body
    try {
        const projects = await Project.find({
            taskAssignPerson: _id
        })
            .sort({ createdAt: -1 })
            .populate("taskAssignPerson")
            .populate("clientAssignPerson");

        const allTasks = await Task.find();

        const updatedProjects = projects.map(project => {
            const projectTasks = allTasks.filter(task => task.projectName === project.projectName);
            const totalTasks = projectTasks.length;
            const completedTaskNum = projectTasks.filter(task => task.isCompleted).length;
            const percent = (completedTaskNum / totalTasks * 100 || 0).toFixed(2);
            const status = percent === "100.00" ? "Completed" : "In Progress";

            return {
                ...project._doc,
                progress: percent,
                status: status
            };
        });

        res.json(updatedProjects);
        return updatedProjects;
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

//Get project by Task (token)
exports.getProjecttask = async (req, res) => {

    const auth = req.headers.authorization
    const decodedToken = jwt.decode(auth)
    try {
        const task = await Project.find({
            taskManager: {
                $in: [decodedToken]
            }
        }).populate("taskManager");
        res.json(task)
        return task;
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
}
// Get projects assigned to a client (based on token)
exports.getProjectForClient = async (req, res) => {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith('Bearer ')) {
        return res.status(401).json({ message: "Authorization token is required" });
    }

    const token = auth.split(' ')[1];
    const decodedToken = jwt.decode(token);

    if (!decodedToken || !decodedToken._id) {
        return res.status(400).json({ message: "Invalid token or missing client ID" });
    }

    try {
        const projects = await Project.find({
            clientAssignPerson: decodedToken._id
        }).populate("clientAssignPerson").populate("taskAssignPerson");

        if (!projects || projects.length === 0) {
            return res.status(404).json({ message: 'No projects found for this client' });
        }

        // Fetch all tasks in a single query for efficiency
        const allTasks = await Task.find();

        // Calculate progress and status for each project
        const updatedProjects = projects.map(project => {
            const projectTasks = allTasks.filter(task => task.projectName === project.projectName);
            const totalTasks = projectTasks.length;
            const completedTaskNum = projectTasks.filter(task => task.isCompleted).length;
            const percent = (completedTaskNum / totalTasks * 100 || 0).toFixed(2);
            const status = percent === "100.00" ? "Completed" : "In Progress";

            return {
                ...project._doc,
                progress: percent,
                status: status
            };
        });

        res.json(updatedProjects);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error", error: err.message });
    }
};

// Total projects by Task Assignee Person (token)
exports.getTotalProjectsByAssignee = async (req, res) => {

    const { _id } = req.body

    try {
        const totalProjects = await Project.countDocuments({
            taskAssignPerson: _id
        });
        return res.json({ totalProjects });
    } catch (err) {
        res.status(500).json({ message: err.message[0] });
    }
};

// Add this new function to the exports
exports.getProjectStatusCounts = async (req, res) => {
    try {
        const projects = await Project.find();
        const allTasks = await Task.find();

        let completedCount = 0;
        let inProgressCount = 0;

        projects.forEach(project => {
            const projectTasks = allTasks.filter(task => task.projectName === project.projectName);
            const totalTasks = projectTasks.length;
            const completedTaskNum = projectTasks.filter(task => task.isCompleted).length;
            const percent = (completedTaskNum / totalTasks * 100 || 0).toFixed(2);

            if (percent === "100.00") {
                completedCount++;
            } else {
                inProgressCount++;
            }
        });

        res.json({ completed: completedCount, inProgress: inProgressCount });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
