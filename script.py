# script.py
import sys
import openai
import os

# Initialize the OpenAI API key
openai.api_key = os.getenv('OPENAI_API_KEY')

def read_document(file_path):
    with open(file_path, 'r') as file:
        content = file.read()
    return content

# Function to split the document into chunks
def split_document(document_content, max_chunk_size=3000):
    words = document_content.split()
    chunks = []
    current_chunk = []
    current_chunk_size = 0
    
    for word in words:
        word_size = len(word) + 1  # +1 for the space
        if current_chunk_size + word_size > max_chunk_size:
            chunks.append(' '.join(current_chunk))
            current_chunk = [word]
            current_chunk_size = word_size
        else:
            current_chunk.append(word)
            current_chunk_size += word_size
    
    # Add the last chunk if it exists
    if current_chunk:
        chunks.append(' '.join(current_chunk))
    
    return chunks


def generate_prompt(chunk):

    description = ("Please carefully analyze the attached Product Requirement Document and generate a comprehensive set of test cases.  Each test case should include the following information:"
                    "Title: A brief description of what the test case is verifying."
                    "Objective: The goal or purpose of the test case."
                    "Prerequisites: Any setup or conditions that must be met before executing the test case."
                    "Test Data: Specific data inputs required for the test case."
                    "Steps to Execute: A detailed sequence of actions to perform."
                    "Expected Results: The anticipated outcome of the test case after execution."
                    
                    "Please ensure that your test cases cover all the functionalities and scenarios outlined in the Product Requirement Document."
                    )

    prompt = (
        "Generate test cases for the following functionality described in this document:\n\n"
        f"{chunk}\n\n"
        f"{description}"
        "Text case ID is continuous"
    )
    return prompt

# Function to generate test cases for each chunk
def generate_test_cases_for_chunks(chunks):
    all_test_cases = []
    for i, chunk in enumerate(chunks):
        prompt = generate_prompt(chunk)
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",  # or gpt-4-32k if you have access and need larger context
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates test cases."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,  # Adjust this value if necessary
            n=1,
            stop=None,
            temperature=0.7,
        )
        
        test_cases = response['choices'][0]['message']['content']
        all_test_cases.append(f"Chunk {i+1} Test Cases:\n{test_cases}\n")
    
    return "\n".join(all_test_cases)

def generate_test_cases_from_document(file_path):
    document_content = read_document(file_path)
    prompt = generate_prompt(document_content)
    
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",  # or gpt-3.5-turbo, depending on the version you want to use
        messages=[
            {"role": "system", "content": "You are a helpful assistant that generates test cases."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=10000,
        n=1,
        stop=None,
        temperature=0.7,
    )

    return response.choices[0].message['content']

def main():
    # Simple example that reads input from command line arguments
    if len(sys.argv) > 1:
        name = sys.argv[1]
    else:
        name = "World"
   
    # Example usage
    file_path = name  # Replace with the path to your text document
    document_content = read_document(file_path)

    # Split the document into chunks
    chunks = split_document(document_content)

    # Generate test cases for each chunk
    test_cases = generate_test_cases_for_chunks(chunks)

    # Output the test cases

    print(test_cases)

if __name__ == "__main__":
    main()






