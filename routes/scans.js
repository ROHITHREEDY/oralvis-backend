const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const Scan = require('../models/scan');
const { verifyToken } = require('./auth');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Upload scan (Technician only)
router.post('/upload', verifyToken, upload.single('scanImage'), async (req, res) => {
  try {
    // Check if user is technician
    if (req.user.role !== 'technician') {
      return res.status(403).json({ message: 'Only technicians can upload scans' });
    }

    const { patient_name, patient_id, scan_type, region } = req.body;

    // Validate required fields
    if (!patient_name || !patient_id || !region) {
      return res.status(400).json({ message: 'Patient name, ID, and region are required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Scan image is required' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'oralvis-scans',
      public_id: `scan-${Date.now()}`,
    });

    // Delete local file after upload
    fs.unlinkSync(req.file.path);

    // Save to database
    const scanData = {
      patient_name,
      patient_id,
      scan_type: scan_type || 'RGB',
      region,
      image_url: result.secure_url,
      uploaded_by: req.user.userId
    };

    const newScan = await Scan.create(scanData);

    res.status(201).json({
      message: 'Scan uploaded successfully',
      scan: newScan
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading scan' });
  }
});

// Get all scans (Dentist only)
router.get('/list', verifyToken, async (req, res) => {
  try {
    // Check if user is dentist
    if (req.user.role !== 'dentist') {
      return res.status(403).json({ message: 'Only dentists can view scans' });
    }

    const scans = await Scan.getAll();
    res.json({ scans });

  } catch (error) {
    console.error('Error fetching scans:', error);
    res.status(500).json({ message: 'Error fetching scans' });
  }
});

// Get single scan by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'dentist') {
      return res.status(403).json({ message: 'Only dentists can view scans' });
    }

    const scan = await Scan.getById(req.params.id);
    if (!scan) {
      return res.status(404).json({ message: 'Scan not found' });
    }

    res.json({ scan });

  } catch (error) {
    console.error('Error fetching scan:', error);
    res.status(500).json({ message: 'Error fetching scan' });
  }
});

// Generate PDF report for a scan
router.get('/:id/pdf', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'dentist') {
      return res.status(403).json({ message: 'Only dentists can generate PDF reports' });
    }

    const scan = await Scan.getById(req.params.id);
    if (!scan) {
      return res.status(404).json({ message: 'Scan not found' });
    }

    // Create PDF document
    const doc = new PDFDocument();
    const filename = `scan-report-${scan.id}-${Date.now()}.pdf`;

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add content to PDF
    doc.fontSize(20).text('OralVis Healthcare - Scan Report', 100, 100);
    doc.moveDown();

    doc.fontSize(14);
    doc.text(`Patient Name: ${scan.patient_name}`, 100, 150);
    doc.text(`Patient ID: ${scan.patient_id}`, 100, 170);
    doc.text(`Scan Type: ${scan.scan_type}`, 100, 190);
    doc.text(`Region: ${scan.region}`, 100, 210);
    doc.text(`Upload Date: ${new Date(scan.upload_date).toLocaleDateString()}`, 100, 230);
    doc.text(`Uploaded by: ${scan.uploaded_by_email}`, 100, 250);

    doc.moveDown();
    doc.text('Scan Image:', 100, 280);
    doc.text(`Image URL: ${scan.image_url}`, 100, 300);

    doc.end();

  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ message: 'Error generating PDF report' });
  }
});

module.exports = router;
