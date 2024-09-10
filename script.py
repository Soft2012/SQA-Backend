import re
import sys
import openai
import os
import json
import asyncio
from dotenv import load_dotenv

# Load environment variables from a .env file
load_dotenv()

API_KEY = os.getenv('OPENAI_API_KEY')
MAX_WORD_SIZE = 50

openai.api_key = API_KEY

def split_document(document_content, max_chunk_size=500):
    words = document_content.split('.')
    chunks = []
    current_chunk = []
    current_chunk_size = 0

    for word in words:
        word_size = len(word) + 1
        if current_chunk_size + word_size > max_chunk_size:
            cur_paragraph = '.\n'.join(current_chunk)
            chunks.append(cur_paragraph)
            current_chunk = [word]
            current_chunk_size = word_size
        else:
            current_chunk.append(word)
            current_chunk_size += word_size

    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    return chunks

def optimize_document(document):
    document = re.sub(r'[ \t]+', ' ', document)
    document = re.sub(r'\n{3,}', '\n\n', document)
    return document

def segment_prd(document):
    sections = document.split('\n\n')
    chunks = []
    for section in sections:
        words = section.split(' ')
        word_size = len(words)
        if word_size > MAX_WORD_SIZE:
            chunks.extend(segment_section(section))
        else:
            chunks.append(section)
    
    return chunks

def segment_section(section):
    sentences = section.split('\n')
    chunk_size = 0
    chunks = []
    current_chunk = ""

    for sentence in sentences:
        word_size = len(sentence.split(' '))
        if chunk_size + word_size > MAX_WORD_SIZE:
            chunks.append(current_chunk)
            current_chunk = sentence + "\n"
            chunk_size = word_size
        else:
            current_chunk += sentence + "\n"
            chunk_size += word_size

    if current_chunk:
        chunks.append(current_chunk)
    
    return chunks

async def generate_summaries(chunks):
    summaries = []
    for chunk in chunks:
        prompt = f"Summarize the following PRD section: \n\n{chunk}\n\n"
        summary = await chatgpt_api_request(prompt)
        summaries.append(summary)
    
    return summaries

def generate_prompt(chunk):
    description = (
        "Please carefully analyze the attached Product Requirement Document and generate a comprehensive set of test cases.\n"
        "Each test case should include the following information:\n\n"
        "Title: A brief description of what the test case is verifying.\n"
        "Objective: The goal or purpose of the test case.\n"
        "Prerequisites: Any setup or conditions that must be met before executing the test case.\n"
        "Test Data: Specific data inputs required for the test case.\n"
        "Steps to Execute: A detailed sequence of actions to perform.\n"
        "Expected Results: The anticipated outcome of the test case after execution.\n"
        "Please ensure that your test cases cover all the functionalities and scenarios outlined in the Product Requirement Document.\n"
        "Generate a lot of test cases as possible.\n\n"
    )

    user_prompt = (
        f"{description}Generate test cases for the following functionality described in this document:\n\n{chunk}\n"
    )
    
    return user_prompt

async def chatgpt_api_request(user_prompt):
    system_prompt = (
        "You are an AI assistant tasked with generating test cases from Product Requirements Documents (PRDs) for a software quality assurance (SQA) project.\n"
        "Your goal is to produce comprehensive, accurate, and well-structured test cases.\n"
        "You must generate exactly a lot of test cases as possible.\n"
        "Generate with Json format like below. (allowing Json Grammar):\n\n"
        "{\n"
        "  \"test_cases\": [\n"
        "    {\n"
        "      \"Title\": \"xxx\",\n"
        "      \"Description\": \"xxx\",\n"
        "      \"Preconditions\": \"xxx\",\n"
        "      \"Test Steps\": [\n"
        "        \"xxx\",\n"
        "        \"xxx\"\n"
        "      ],\n"
        "      \"Expected Outcome\": \"xxx\",\n"
        "      \"Priority\": \"xxx\"\n"
        "    },\n"
        "    {\n"
        "      \"Title\": \"xxx\",\n"
        "      \"Description\": \"xxx\",\n"
        "      \"Preconditions\": \"xxx\",\n"
        "      \"Test Steps\": [\n"
        "        \"xxx\",\n"
        "        \"xxx\"\n"
        "      ],\n"
        "      \"Expected Outcome\": \"xxx\",\n"
        "      \"Priority\": \"xxx\"\n"
        "    }\n"
        "  ]\n"
        "}\n\n"
        "The test cases should cover all functionalities described in the PRD, including positive, negative, edge cases, and boundary conditions.\n"
    )

    response = openai.ChatCompletion.create(
        model='gpt-3.5-turbo',
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        max_tokens=3500,
        temperature=0.7
    )

    return response['choices'][0]['message']['content']

async def main():
    file_content = "Your file content here"
    # Simple example that reads input from command line arguments
    if len(sys.argv) > 1:
        file_content = sys.argv[1]
    else:
        file_content = "World"
   
    chunks = segment_section(optimize_document(file_content))

    all_test_cases = []
    for chunk in chunks:
        prompt = generate_prompt(chunk)
        try:
            test_cases = await chatgpt_api_request(prompt)
            all_test_cases.append(test_cases)
        except Exception as error:
            print(f"Error calling ChatGPT API: {error}")

    test_case_list = []
    for test_case in all_test_cases:
        print(test_case)
        json_obj = json.loads(test_case)
        child_list = json_obj["test_cases"]
        for one_child in child_list:
            test_case_list.append(one_child)

    output_string = f"Total Count: {len(test_case_list)}\n\n"

    id = 1
    for test_case in test_case_list:
        test_step_string = ""
        test_step = test_case["Test Steps"]
        step_id = 1
        for step in test_step:
            test_step_string += f"{step_id}. {step}\n"
            step_id += 1
        
        output_string += (
            f"Test Case {id}\n"
            f"Title: {test_case['Title']}\n"
            f"Description: {test_case['Description']}\n"
            f"Test Steps:\n{test_step_string}"
            f"Expected Outcome: {test_case['Expected Outcome']}\n"
            f"Priority: {test_case['Priority']}\n\n"
        )
        id += 1

    print(output_string)

if __name__ == "__main__":
    asyncio.run(main())