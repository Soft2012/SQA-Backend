const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
require('dotenv').config();
const { Configuration, OpenAIApi } = require("openai");

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

const API_KEY = process.env.OPENAI_API_KEY
// const API_URL = 'http://localhost:8080/v1/chat/completions';
const API_URL = 'https://api.openai.com/v1/chat/completions';
const MAX_WORD_SIZE = 50;


const splitDocument = (documentContent, maxChunkSize = 500) => {
  const words = documentContent.split('.');
  const chunks = [];
  let currentChunk = [];
  let currentChunkSize = 0;

  for (const word of words) {
    const wordSize = word.length + 1;
    if (currentChunkSize + wordSize > maxChunkSize) {
      let cur_paragraph = currentChunk.join('.\n')
      // console.log("-------------Generated Chunk-------------\n", cur_paragraph)
      chunks.push(cur_paragraph);
      currentChunk = [word];
      currentChunkSize = wordSize;
    } else {
      currentChunk.push(word);
      currentChunkSize += wordSize;
    }
  }
  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }
  return chunks;
};

const optimizeDocument = (document) => {
  // Replace one or more spaces or tabs with a single space
  document = document.replace(/[ \t]+/g, ' ');

  // Replace two or more newlines with a single newline
  document = document.replace(/\n{3,}/g, '\n\n');
  
  return document;
}

const segmentPRD = (document) => {
  const sections = document.split('\n\n')

  const chunks = [];
  for (const section of sections) 
  {
    const words = section.split(' ')
    const word_size = words.length
    if (word_size > MAX_WORD_SIZE)
    {
      
    }
    else
    {
      chunks.push(section)
    }

  }
}

const segmentSection = (section) => {
  const sentences = section.split('\n')
  let chunk_size = 0
  const chunks = [];
  let current_chunk = "";

  for (const sentence of sentences)
  {
    const word_size = sentence.split(' ').length
    if (chunk_size > MAX_WORD_SIZE)
    {
      chunks.push(current_chunk)
      current_chunk = sentence + "\n"
      chunk_size = word_size
      
    }
    else
    {
      current_chunk += sentence + "\n"
      chunk_size += word_size
    }

  }
  
  if (current_chunk.length > 0) {
    chunks.push(current_chunk);
  }

  return chunks
}

const generateSummaries = async (chunks) => {
  const summaries = []
  for (const chunk of chunks) 
  {
    const prompt = `Summarize the following PRD section: \n\n` +
                  `${chunk}\n\n`;
    const summary = await chatgptAPIRequest(prompt)
    summaries.push(summary)
  }

  return summaries
}

const generatePrompt = (chunk) => {
  const description = (
    `Please carefully analyze the attached Product Requirement Document and generate a comprehensive set of test cases.\n` + 
    `Each test case should include the following information:\n\n` +
    `Title: A brief description of what the test case is verifying.\n` +
    `Objective: The goal or purpose of the test case.\n` +
    `Prerequisites: Any setup or conditions that must be met before executing the test case.\n` +
    `Test Data: Specific data inputs required for the test case.\n` +
    `Steps to Execute: A detailed sequence of actions to perform.\n` +
    `Expected Results: The anticipated outcome of the test case after execution.\n` +
    `Please ensure that your test cases cover all the functionalities and scenarios outlined in the Product Requirement Document.\n` + 
    `Generate a lot of test cases as possible.\n\n`
  );

  // const summary_description = (
  //   'Based on the previous sections: ' + 
  //   `${previous_summary}\n\n`
  // )

  const prompt = (
    `${description}` +
    `Generate test cases for the following functionality described in this document:\n\n` +
    `${chunk}\n\n`
  );

  const user_prompt = (
    `Please carefully analyze the attached Product Requirement Document and generate a comprehensive set of test cases.\n` + 
    `Please ensure that your test cases cover all the functionalities and scenarios outlined in the Product Requirement Document.\n` + 
    `Generate test cases more than 30 for the following functionality described in this document:\n\n` +
    `${chunk}\n`)
  return user_prompt;
};

const chatgptAPIRequest = async (user_prompt) => {
  const system_prompt = (`You are an AI assistant tasked with generating test cases from Product Requirements Documents (PRDs) for a software quality assurance (SQA) project.\n` + 
    `Your goal is to produce comprehensive, accurate, and well-structured test cases.\n` +
    `you must generate exactly a lot of test cases as possible.\n` +
    `Generate with Json format like below.(allowing Json Grammar):\n\n` +
    `{\n` +
      `"test_cases": [\n` +
        `{\n` +
          `"Title": "xxx",\n` +
          `"Description": "xxx",\n` +
          `"Preconditions": "xxx",\n` +
          `"Test Steps": [\n` +
            `"xxx",\n` +
            `"xxx"\n` +
          `],\n` +
          `"Expected Outcome": "xxx",\n` +
          `"Priority": "xxx"\n` +
        `},\n` +
        `{\n` +
          `"Title": "xxx",\n` +
          `"Description": "xxx",\n` +
          `"Preconditions": "xxx",\n` +
          `"Test Steps": [\n` +
            `"xxx",\n` +
            `"xxx"\n` +
          `],\n` +
          `"Expected Outcome": "xxx",\n` +
          `"Priority": "xxx"\n` +
        `},\n` +
      `]\n` +
    `}\n\n` +
    `The test cases should cover all functionalities described in the PRD, including positive, negative, edge cases, and boundary conditions.\n`)

  const response = await axios.post(
    API_URL,
    {
      model: 'gpt-3.5-turbo', // Specify the model
      messages: [
        { role: "system", content: system_prompt },
        { role: "user", content: user_prompt }
      ],
      max_tokens: 3000, // Limit the response length (adjust as needed)
      temperature: 0.7, // Controls the randomness of the output (adjust as needed)
    },
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  ); 
  
  return response.data.choices[0].message.content
}

app.post("/test", async (req,res)=>{
  fileContent = req.body.fileContent

  const chunks = segmentSection(optimizeDocument(fileContent))
  const allTestCases = [];
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const prompt = generatePrompt(chunk)
    try {
        const test_cases = await chatgptAPIRequest(prompt)
        allTestCases.push(test_cases);
    } 
    catch (error) {
        console.error('Error calling ChatGPT API:', error.response ? error.response.data : error.message);
        console.log("API_KEY ----- ", API_KEY)
    }
  }
  
  const test_case_list = []
  for (const test_case of allTestCases)
  {
    console.log(test_case)
    const json_obj = JSON.parse(test_case);
    const child_list = json_obj["test_cases"]
    for (const one_child of child_list)
    {
      test_case_list.push(one_child);
    }
  }
  
  let out_put_string = `Total Count : ${test_case_list.length}\n\n`
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

    out_put_string += (
      `Test Case ${id}\n` +
      `Title: ${test_case["Title"]}\n` +
      `Description: ${test_case["Description"]}\n` +
      `Test Steps:\n${test_step_string}` +
      `Expected Outcome: ${test_case["Expected Outcome"]}\n` +
      `Priority: ${test_case["Priority"]}\n\n`)
      
    id++;
  }
  res.send({text:out_put_string})
})

app.listen(port, () => {
  console.log("Start Server ... ... ...")
});