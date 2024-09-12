const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();
const openaiService = require('./openaiService');

const app = express();
const port = 5000;

// Middleware
app.use(cors({ origin: 'https://automatic-testcase-generation.vercel.app' }));
app.use(bodyParser.json());

app.post("/test", async (req,res)=>{
  chunk = req.body.chunk
  console.log(chunk)
  const prompt = openaiService.generatePrompt(chunk)
  try {
    const test_cases = await openaiService.chatgptAPIRequest(prompt)
    console.log(test_cases)
    const testcases_obj = await JSON.parse(test_cases);

    const test_case_list = testcases_obj["test_cases"]

    let out_put_string = ''
    let id = 1
    for (const test_case of test_case_list)
    {
      let test_step_string = ""
      const test_step = test_case["Test Steps"]
      let step_id = 1
      for (const step of test_step)
      {
        test_step_string += `${step_id}. ` + step + ".\n"
        step_id++
      }

      const data_object = test_case["Data to use"]
      let data_to_use = '';
      let data_to_use_id = 1;
      Object.entries(data_object).forEach(([key, value]) => {
        // console.log(`Key: ${key}, Value: ${value}`);
        data_to_use += `${data_to_use_id}. ${key} : ${value}\n`
        data_to_use_id++
      });
      // console.log("data to use:\n", data_to_use)
      
      let testcase_string = (
        `Test Case ${id}\n` +
        `Title: ${test_case["Title"]}\n` +
        `Description: ${test_case["Description"]}\n` +
        `Precondition: ${test_case["Preconditions"]}\n` +
        `Test Steps:\n${test_step_string}` +
        `Expected Outcome: ${test_case["Expected Outcome"]}\n` +
        `Data to use:\n${data_to_use}` +
        `Priority: ${test_case["Priority"]}\n\n`)
      
      out_put_string += testcase_string
      id++;
    }

    res.send({text:out_put_string})
  } 
  catch (error) {
      console.error('Error calling ChatGPT API:', error.response ? error.response.data : error.message);
  }
})

app.listen(port, () => {
  console.log("Start Server ... ... ...")
});