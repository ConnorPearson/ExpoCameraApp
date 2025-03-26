const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());

// Increase the request payload size limit
app.use(express.json({ limit: '50mb' })); // For base64 encoded images, set to 50MB or as needed
app.use(express.urlencoded({ limit: '50mb', extended: true })); // For form-data with large files

// Set up multer storage for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Specify where to store uploaded files
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // Allow up to 50MB per file
});

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Endpoint to receive multipart image uploads
app.post('/upload/multipart', (req, res, next) => {
  // Log the body of the request before Multer processes it
  console.log('Request body:', req.body);
  console.log('Request files:', req.files);

  // Continue with Multer processing
  next();
}, upload.array('images[]'), (req, res) => {
  console.log('Traffic via /upload/multipart route');
  console.log('Received files:', req.files); // This will show processed files after Multer
  res.json({
    message: 'Images uploaded successfully!',
    files: req.files.map(file => ({ filename: file.filename, path: `/uploads/${file.filename}` }))
  });
});

// Endpoint to receive base64 image uploads
app.post('/upload/base64', express.json(), (req, res) => {
  console.log('Traffic via /upload/base64 route');
  const images = req.body.images; // Array of { uri, base64 } objects
  if (!images || images.length === 0) {
    return res.status(400).json({ error: 'No images provided' });
  }

  const imagePaths = [];
  images.forEach((image, index) => {
    const base64Data = image.base64.replace(/^data:image\/jpeg;base64,/, ''); // Remove base64 header
    const filePath = `uploads/image_${Date.now()}_${index}.jpg`;

    fs.writeFileSync(filePath, base64Data, 'base64');
    imagePaths.push({ filename: path.basename(filePath), path: `/${filePath}` });
  });

  res.json({
    message: 'Base64 images uploaded successfully!',
    images: imagePaths
  });
});

// Serve static files (uploaded images)
app.use('/uploads', express.static('uploads'));

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

