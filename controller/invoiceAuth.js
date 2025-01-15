const express = require('express');
const router = express.Router();
const Invoice = require('../model/invoiceModel');
const { uploadInvoice } = require('../utils/multerConfig');

// Create a new invoice with logo upload
router.post('/invoices', uploadInvoice.single('logo'), async (req, res) => {
    try {
        // Parse the JSON data from the request
        const invoiceData = JSON.parse(req.body.data);

        // If a new file was uploaded, use the file path
        if (req.file) {
            invoiceData.logo = req.file.path;
        }
        // If no new file but logo path exists in data, keep using that
        // (no need to modify as it's already in invoiceData)

        const newInvoice = new Invoice(invoiceData);
        const savedInvoice = await newInvoice.save();
        res.status(201).json(savedInvoice);
    } catch (error) {
        console.error('Error creating invoice:', error);
        res.status(400).json({ message: error.message });
    }
});

// Get all invoices
router.get('/invoices', async (req, res) => {
    try {
        const invoices = await Invoice.find().populate('clientDetail');
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get last invoice
router.get('/invoices/last', async (req, res) => {
    try {
        const invoice = await Invoice.findOne().sort({ _id: -1 });
        res.json(invoice.invoiceNumber);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a single invoice by ID
router.get('/invoices/:id', async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (invoice) {
            res.json(invoice);
        } else {
            res.status(404).json({ message: 'Invoice not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update an existing invoice
router.put('/invoices/:id', async (req, res) => {
    try {
        const updatedInvoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (updatedInvoice) {
            res.json(updatedInvoice);
        } else {
            res.status(404).json({ message: 'Invoice not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete an existing invoice
router.delete('/invoices/:id', async (req, res) => {
    try {
        const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
        if (deletedInvoice) {
            res.json({ message: 'Invoice deleted successfully' });
        } else {
            res.status(404).json({ message: 'Invoice not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get unique logos from all invoices
router.get('/invoice-logos', async (req, res) => {
    try {
        // Update the default logos array to include the new logo
        const defaultLogos = [
            'uploads/a2zlogo.png',
            'uploads/ficlogo.png',
            'uploads/pizeonflylogo.png',
            'uploads/IndiaEducatesLogo.png'
        ];

        // Get unique logos from all invoices
        const dbLogos = await Invoice.distinct('logo');
        
        // Filter out null/empty values from database logos
        const validDbLogos = dbLogos.filter(logo => logo != null && logo !== '');
        
        // Combine default logos with database logos and remove duplicates
        const allLogos = [...new Set([...defaultLogos, ...validDbLogos])];
        
        res.json(allLogos);
    } catch (error) {
        console.error('Error fetching logos:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

