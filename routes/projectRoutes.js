const express = require('express');
const router = express.Router();
const projectController = require('../controller/projectAuth');
const { uploadProject } = require('../utils/multerConfig');

router.post('/projects', uploadProject, projectController.createProject);
router.get('/projects', projectController.getAllProjects);
router.get('/projects/:projectId', projectController.getProjectById);
router.get('/pro/search', projectController.searchProjects);
router.put('/projects/:projectId', uploadProject, projectController.updateProject);
router.delete('/projects/:projectId', projectController.deleteProject);

router.post('/employee-projects', projectController.getProject)
router.get('/auth-task', projectController.getProjecttask)
router.get('/totalProjects', projectController.getTotalProjects);
router.get('/client-projects', projectController.getProjectForClient);
router.post('/totalAssigneeProjects', projectController.getTotalProjectsByAssignee);

// Add this new route
router.get('/projectStatusCounts', projectController.getProjectStatusCounts);

module.exports = router;
