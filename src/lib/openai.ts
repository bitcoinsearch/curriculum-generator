import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


export async function generateCompletion(data: any[]): Promise<any[]> {
    try {

        const prompt = `Using the following JSON data, categorize the topics into four levels of complexity: Introduction, Simple, Medium, and Hard, to create a structured Bitcoin SegWit curriculum. Use the summary field in the JSON to understand the content and assign appropriate difficulty levels, loop through each topic and assign a level.
        Here is the JSON data: ${JSON.stringify(data)}
        Categorize each topic into one of the four levels:

          - Introduction: Foundational topics for beginners.
          - Simple: Straightforward topics that build on basic concepts.
          - Medium: Intermediate topics requiring some prior knowledge.
          - Hard: Advanced and technical topics.
        
          Provide a brief explanation for why each topic belongs to its assigned level.  Provide the output in JSON format with the fields: topic, category, and reason.
        `;
        // Call OpenAI API to create a completion
        const response = await openai.chat.completions.create({
            model: "gpt-4o", // Specify the model
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: prompt },
            ],
            max_tokens: 1000,          // Set max tokens
            temperature: 0.2,         // Adjust response creativity
        });

        // Extract and return the AI's reply
        const completionText = response.choices[0]?.message?.content?.trim();

        if (!completionText) {
            throw new Error("No response received from the AI.");
        }

        // Preprocess the response to remove markdown formatting
        const sanitizedResponse = completionText.replace(/```json|```/g, "").trim();

        // Parse the JSON response
        const categorizedTopics = JSON.parse(sanitizedResponse);

        // Return the JSON output for further use
        return categorizedTopics;
    } catch (error) {
        console.error("Error generating completion:", error);
        return [];
    }
}


export default openai;