const axios = require('axios');

const API_KEY = process.env.OPENAI_API_KEY
const API_URL = 'https://api.openai.com/v1/chat/completions';

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

    const prompt = (
        `${description}` +
        `Generate test cases for the following functionality described in this document:\n\n` +
        `${chunk}\n\n`
    );

    const user_prompt = (
        'Please carefully analyze the attached Product Requirement Document and generate a comprehensive set of test cases.\n' +
        'Ensure that your test cases cover all functionalities and scenarios outlined in the Product Requirement Document.\n' +
        'Generate more than 20 test cases for the following functionality described in this document:\n' + 
        `${chunk}\n`)
    return user_prompt;
};

const chatgptAPIRequest = async (user_prompt) => {
    const system_prompt = (`You are an AI assistant tasked with generating test cases from Product Requirements Documents (PRDs) for a software quality assurance (SQA) project.\n` + 
        `Your goal is to produce comprehensive, accurate, and well-structured test cases.\n` +
        `You must generate a comprehensive set of test cases covering all functionalities described in the PRD, including positive, negative, edge cases, and boundary conditions.\n` +
        'You must generate specific data inputs required for the test case.\n' +
        `The test cases should be provided in the JSON format as shown below(It should be generated in JSON syntax and checked again carefully.):\n` +
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
            `"Data to use": {\n` +
            `"key" : "value"\n` +
            `},\n` + 
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
            `"Data to use": {\n` +
            `"key" : "value"\n` +
            `},\n` + 
            `"Priority": "xxx"\n` +
            `}\n` +
        `]\n` +
        `}\n\n`
    )

    const response = await axios.post(
        API_URL,
        {
        model: 'gpt-3.5-turbo', // Specify the model
        messages: [
            { role: "system", content: system_prompt },
            { role: "user", content: user_prompt }
        ],
        max_tokens: 3500, // Limit the response length (adjust as needed)
        temperature: 0.7, // Controls the randomness of the output (adjust as needed)
        },
        {
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${API_KEY}`,
        },
        }
    );

    console.log(system_prompt)
    console.log(user_prompt)

    return response.data.choices[0].message.content;
}

module.exports = {
    generatePrompt,
    chatgptAPIRequest,
};