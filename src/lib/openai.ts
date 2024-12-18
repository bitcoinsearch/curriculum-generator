import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


type Topic = {
    topic: string;
    description: string;
    aliases: string[];
    associated_topic: string;
    slug: string;
}

export async function getAITopic(search: string): Promise<Topic | null> {
    try {
        const prompt = `
            Generate a JSON object that includes the Bitcoin topic ${search} and its related information. The JSON object should include the following fields:
                - topic: The name of the Bitcoin topic.
                - description: A brief explanation of the topic.
                - aliases: A list of alternative names or closely related terms.
                - associated_topic: The broader or related Bitcoin topic that BECH32 belongs to.
                - slug: A URL-friendly version of the topic name.
        `;

        // Call OpenAI API to create a completion
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: prompt }
            ],
            max_tokens: 500,
            temperature: 0.2
        });

        // Extract and parse the response
        const completionText = response.choices[0]?.message?.content?.trim();
        if (!completionText) {
            throw new Error("No response received from the AI.");
        }

        // Parse the JSON response and return it
        const topicInfo = JSON.parse(completionText);
        return topicInfo;

    } catch (err) {
        console.error("Error generating topic:", err);
        return null;
    }
}

export async function generateCurriculum(data: any[]): Promise<any[]> {
    try {

        const prompt = `Using the following JSON data, categorize the Bitcoin topics into five levels of complexity: Concepts, Benefits, Technical Aspects, Security Considerations, and Hard, to create a structured Bitcoin curriculum. Use the summary field in the JSON to understand the content and assign appropriate difficulty levels, loop through each topic and assign a level.
        Here is the JSON data: ${JSON.stringify(data)}
        Categorize each topic into one of the four levels:

          - Introduction: Foundational topics for beginners.
          - Concepts: Topics that introduce a new concept or idea.
          - Benefits: Topics that explain the benefits of a new concept or idea.
          - Technical Aspects: Topics that explain the technical aspects of a new concept or idea.
          - Security considerations: Topics that explain the security considerations of a new concept or idea.

          Provide a brief explanation for why each topic belongs to its assigned level.  Provide the output in JSON format with the fields: title, category, and reason, Do not include any explanations or markdown formatting, only return valid JSON.
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
        let sanitizedResponse = completionText.replace(/```json|```/g, "").trim();

        // Escape problematic characters
        sanitizedResponse = sanitizedResponse.replace(/\\n/g, " "); // Replace newline characters
        sanitizedResponse = sanitizedResponse.replace(/\\'/g, "'"); // Fix single quotes
        sanitizedResponse = sanitizedResponse.replace(/\\"/g, '"'); // Fix escaped double quotes

        // Parse the JSON response
        const categorizedTopics = JSON.parse(sanitizedResponse);

        // Return the JSON output for further use
        return categorizedTopics;
    } catch (error) {
        console.error("Error generating curriculum:", error);
        return [];
    }
}


export default openai;