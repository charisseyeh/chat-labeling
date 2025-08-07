// Project Goal:
// Create a tool to analyze `conversations.json` exported from ChatGPT
// It should:
// 1. Load the file
// 2. Extract the title and first user message from each conversation
// 3. Send that to OpenAI to classify as Regulated / Dysregulated / Neutral
// 4. Save the result (label + explanation) into a new JSON file for manual review

// Project Setup:
// - Make sure you have a `.env` file with OPENAI_API_KEY
// - Run `npm install dotenv openai fs`
// - File to process: conversations.json (in root directory)

