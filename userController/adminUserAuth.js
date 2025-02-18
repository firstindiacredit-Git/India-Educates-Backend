const User = require('../userModel/adminUserModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

exports.signupUser = async (req, res) => {
  const { username, email, password, role } = req.body;

  try {
    if (!username || !email || !password || !role) {
      throw new Error('Missing required fields');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, role, password: hashedPassword });
    await newUser.save();
    res.json({ message: 'User registered successfully', user: newUser });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  const { role, email, password } = req.body;
  const userIp = req.userIp;

  try {
    let user;
    let Model;

    // Determine which model to use based on role
    switch (role) {
      case 'superadmin':
      case 'admin':
        Model = require('../userModel/adminUserModel');
        break;
      case 'employee':
        Model = require('../model/employeeModel');
        break;
      case 'client':
        Model = require('../model/clientModel');
        break;
      case 'student':
        Model = require('../model/studentModel');
        break;
      default:
        return res.status(400).json({ message: 'Invalid role' });
    }

    // Find user based on email and role
    if (role === 'superadmin' || role === 'admin') {
      user = await Model.findOne({ email, role });
    } else {
      // For other roles, use their specific email field names
      const emailField = role === 'client' ? 'clientEmail' : 'emailid';
      user = await Model.findOne({ [emailField]: email });
    }

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Compare password based on role
    let isValidPassword;
    if (role === 'superadmin' || role === 'admin') {
      isValidPassword = await bcrypt.compare(password, user.password);
    } else {
      // For other roles, compare direct password (assuming they're stored as plain text)
      const passwordField = role === 'client' ? 'clientPassword' : 'password';
      isValidPassword = password === user[passwordField];
    }

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user, userIp });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  const { email, oldPassword, newPassword } = req.body;

  try {
    if (!email || !oldPassword || !newPassword) {
      throw new Error('Missing required fields');
    }

    if (newPassword.length < 8) {
      throw new Error('New password must be at least 8 characters long');
    }

    const user = await User.findOne({ email });

    if (user) {
      const match = await bcrypt.compare(oldPassword, user.password);

      if (match) {
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
        await user.save();

        res.json({ message: 'Password changed successfully' });
      } else {
        res.status(401).json('Incorrect old password');
      }
    } else {
      res.status(401).json('User not found');
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.find();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { username } = req.body;
    const userId = req.user.userId;

    const updateData = { username };
    if (req.file) {
      // Store only the filename instead of full path
      updateData.profileImage = req.file.filename;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.verifySecurityPin = async (req, res) => {
  const { pin } = req.body;
  
  try {
    // Replace this with your actual security PIN
    const SECURITY_PIN = process.env.SECURITY_PIN || "123456";
    
    if (pin === SECURITY_PIN) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: "Invalid security PIN" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
