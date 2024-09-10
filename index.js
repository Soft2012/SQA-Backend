const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

app.post("/test", (req,res)=>{
  fileContent = req.body.text

 

  // Spawn a Python process to run the script
  const pythonProcess = spawn('python3', ['script.py', `${fileContent}`]);

  let hasResponseSent = false; 

  // Handle the script's output (stdout)
  pythonProcess.stdout.on('data', (data) => {
    if (!hasResponseSent) {
        hasResponseSent = true;
        console.log(data.toString())
        res.send({
          text: data.toString(),
        });
      }
  });

  // Handle any errors (stderr)
  pythonProcess.stderr.on('data', (data) => {
    console.error(`Error: ${data.toString()}`);
    if (!hasResponseSent) {
      hasResponseSent = true;
      //res.status(500).send("An error occurred while processing the script.");
    }
  });

  // Handle the close event when the script finishes
  pythonProcess.on('close', (code) => {
    console.log(`Python script exited with code ${code}`);
    if (!hasResponseSent) {
      //res.end(); // Only call res.end() if no other response has been sent.
    }
  });

  res.send({
    text: "qqqqqqqqqqqqqqqqq",
  });
})

app.listen(port, () => {
  console.log("Start Server ... ... ...")
});