const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const port = 5000;

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Middleware
app.use(cors());
app.use(express.json());

// Create upload directory if doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// File upload endpoint
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  const text = req.body.text;

  if (!file) {
    return res.status(400).send('No file uploaded.');
  }

  // Spawn a Python process to run the script
  const pythonProcess = spawn('python', ['script.py', `uploads/${file.filename}`]);

  console.log("Generating...............")

  let hasResponseSent = false; 
  // Handle the script's output (stdout)
  pythonProcess.stdout.on('data', (data) => {
      console.log(`Finished................`);
      if (!hasResponseSent) {
        hasResponseSent = true;
        res.send({
          fileName: file.filename,
          originalName: file.originalname,
          text: data.toString(),
        });
      }
  });

  // Handle any errors (stderr)
  pythonProcess.stderr.on('data', (data) => {
    console.error(`Error: ${data.toString()}`);
    if (!hasResponseSent) {
      hasResponseSent = true;
      res.status(500).send("An error occurred while processing the script.");
    }
  });

  // Handle the close event when the script finishes
  pythonProcess.on('close', (code) => {
    console.log(`Python script exited with code ${code}`);
    if (!hasResponseSent) {
      res.end(); // Only call res.end() if no other response has been sent.
    }
  });

});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});