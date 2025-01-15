const express = require('express');
const router = express.Router();
const Client = require('../model/clientModel');
const nodemailer = require('nodemailer');
const { uploadClient } = require('../utils/multerConfig');
const jwt = require('jsonwebtoken');
const dotenv = require("dotenv");
const Project = require('../model/projectModel');

dotenv.config();

// Total Clients
router.get('/totalClients', async (req, res) => {
  try {
    const totalClients = await Client.countDocuments();
    res.json({ totalClients });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// Create a new client
router.post('/clients', uploadClient.single("clientImage"), async (req, res) => {
  try {
    const path = req.file?.path;
    let newPath = path?.replace('uploads\\', "");
    if (newPath === undefined || newPath === null) {
      newPath = "default.jpeg";
    }
    req.body.clientImage = newPath;
    
    // Extract social links from request body
    const socialLinks = {
      linkedin: req.body.linkedin || '',
      instagram: req.body.instagram || '',
      youtube: req.body.youtube || '',
      facebook: req.body.facebook || '',
      pinterest: req.body.pinterest || '',
      github: req.body.github || '',
      website: req.body.website || '',
      other: req.body.other || ''
    };
    
    req.body.socialLinks = socialLinks;
    
    const client = new Client(req.body);
    await client.save();
    // Send email after saving client
    sendEmail(client);
    res.status(201).send(client);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      res.status(400).send({ errors });
    } else {
      res.status(500).send(error);
    }
  }
});
// Email sending function
async function sendEmail(client) {
  // Configure Nodemailer with your email service (for example, Gmail)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.USER_EMAIL,
      pass: process.env.USER_PASSWORD  // your Gmail password or app password
    },
  });

  const mailOptions = {
    from: process.env.USER_EMAIL,
    to: client.clientEmail, // Send email to the client's email address
    subject: 'PIZEONFLY - Your Account Details',
    html: `
            <h1>Hello ${client.clientName},</h1>
            <p>You have been added as an Employee at PIZEONFLY. Here are your details:</p>
            <ul>
                <li><strong>Email:</strong> ${client.clientEmail}</li>
                <li><strong>Password:</strong> ${client.clientPassword}</li>
            </ul>
            <p><a href="https://crm.pizeonfly.com/#/clientsignin">Click here to login</a></p>
            <p>If you have any queries, please contact MD-Afzal at 9015662728</p>
            <p>Thank you for choosing our service!</p>
        `,
  };

  // Send the email
  try {
    await transporter.sendMail(mailOptions);
    // console.log(`Email sent to ${client.clientEmail}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}
// Client login
router.post("/clientlogin", async (req, res) => {
  const { clientEmail, clientPassword } = req.body;

  if (!clientEmail || !clientPassword) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const clientDetails = await Client.findOne({
      clientEmail: clientEmail, // Correct field name
      clientPassword: clientPassword // Correct field name
    }).lean();

    if (!clientDetails) {
      return res.status(400).json({ message: "User not found or invalid credentials." });
    }

    const token = jwt.sign({ _id: clientDetails._id }, process.env.JWT_SECRET, { expiresIn: '10d' });

    return res.status(200).json({
      message: "Login success",
      user: clientDetails,
      token: token
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error." });
  }
});


// Get all clients
router.get('/clients', async (req, res) => {
  try {
    const clients = await Client.find({});
    res.status(200).send(clients);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Get a client by ID
router.get('/clients/:id', async (req, res) => {
  const _id = req.params.id;

  try {
    const client = await Client.findById(_id);

    if (!client) {
      return res.status(404).send({ error: 'Client not found' });
    }

    res.status(200).send(client);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Search clients by name
router.get("/search", async (req, res) => {
  const query = req.query.name;

  if (!query) {
    return res.status(400).json({ message: "Name query parameter is required for search" });
  }

  try {
    const regex = new RegExp(query, 'i');
    const clients = await Client.find({ clientName: { $regex: regex } });

    if (clients.length === 0) {
      return res.status(404).json({ message: 'No clients found with the provided name' });
    }

    res.status(200).json(clients);
  } catch (error) {
    console.error('Error searching clients:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Update a client by ID (with file handling)
router.put('/clients/:id', uploadClient.single("clientImage"), async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).send({ error: 'Client not found' });
    }

    // Handle image update
    if (req.file) {
      const newPath = req.file.path.replace('uploads\\', "");
      client.clientImage = newPath;
    }

    // Update social links
    client.socialLinks = {
      linkedin: req.body.linkedin || client.socialLinks.linkedin,
      instagram: req.body.instagram || client.socialLinks.instagram,
      youtube: req.body.youtube || client.socialLinks.youtube,
      facebook: req.body.facebook || client.socialLinks.facebook,
      pinterest: req.body.pinterest || client.socialLinks.pinterest,
      github: req.body.github || client.socialLinks.github,
      website: req.body.website || client.socialLinks.website,
      other: req.body.other || client.socialLinks.other
    };

    // Update other fields
    const basicFields = ['clientName', 'businessName', 'clientEmail', 
                        'clientPassword', 'clientPhone', 'clientAddress', 'clientGst'];
    basicFields.forEach(field => {
      if (req.body[field]) {
        client[field] = req.body[field];
      }
    });

    await client.save();
    res.status(200).send(client);
  } catch (error) {
    console.error('Error during client update:', error);
    res.status(500).send({ error: 'Internal server error' });
  }
});

// Delete a client by ID
router.delete('/clients/:id', async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);

    if (!client) {
      return res.status(404).send({ error: 'Client not found' });
    }

    res.status(200).send({ message: 'Client deleted successfully', client });
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update this route
router.get('/totalClientProjects', async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const clientId = decoded._id;
    
    // console.log('Looking for projects with clientId:', clientId);
    
    // Update the query to match the field name used in your schema
    const totalProjects = await Project.countDocuments({
      clientAssignPerson: clientId
    });
    
    // console.log('Total projects found:', totalProjects);
    
    res.json({ totalProjects });
  } catch (err) {
    console.error('Error in totalClientProjects:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
