const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();
const openaiService = require('./openaiService');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

app.post("/test", async (req,res)=>{
  chunk = req.body.chunk
  console.log(chunk)
  const prompt = openaiService.generatePrompt(chunk)
  try {
    const test_cases = await openaiService.chatgptAPIRequest(prompt)
    console.log(test_cases)
    try {
      const testcases_obj = await JSON.parse(test_cases);
      
      // Add CORS headers
      res.setHeader('Access-Control-Allow-Origin', 'https://automatic-testcase-generation.vercel.app');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.send({testcases:testcases_obj})
    } catch (error) {
      console.error('Json Parse Error:', error.response ? error.response.data : error.message);
    }
  } 
  catch (error) {
      console.error('Error calling ChatGPT API:', error.response ? error.response.data : error.message);
  }
})

app.listen(port, () => {
  console.log("Start Server ... ... ...")
});