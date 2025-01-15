const express = require('express');
const router = express.Router();
const userController = require('../userController/adminUserAuth');
const { uploadProfile } = require('../utils/multerConfig');
const auth = require('../middleware/auth');

router.post('/signup', userController.signupUser);
router.post('/login', userController.loginUser);
router.get('/adminuser', userController.getUserProfile);
router.post('/change-password', userController.changePassword);
router.put('/update-profile', auth, uploadProfile.single('profileImage'), userController.updateProfile);
router.post('/verify-security-pin', userController.verifySecurityPin);

module.exports = router;