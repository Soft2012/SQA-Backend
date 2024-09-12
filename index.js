const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();
const openaiService = require('./openaiService');

const app = express();
const port = 5000;

// Middleware
app.use(cors({
  origin: 'https://automatic-testcase-generation.vercel.app',
  methods: 'GET,POST',
  allowedHeaders: 'Content-Type,Authorization'
}));
app.use(bodyParser.json());
app.options('*', cors());  // Enables pre-flight across-the-board

app.post("/test", async (req,res)=>{
  chunk = req.body.chunk
  console.log(chunk)
  const prompt = openaiService.generatePrompt(chunk)
  try {
    const test_cases = await openaiService.chatgptAPIRequest(prompt)
    console.log(test_cases)
    try {
      const testcases_obj = await JSON.parse(test_cases);

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