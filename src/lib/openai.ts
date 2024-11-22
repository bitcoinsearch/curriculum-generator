import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


export async function generateCompletion(prompt: string): Promise<string | undefined> {
    try {

        // Call OpenAI API to create a completion
        const response = await openai.chat.completions.create({
            model: "text-davinci-003", // Specify the model
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: prompt },
            ],
            max_tokens: 100,          // Set max tokens
            temperature: 0.7,         // Adjust response creativity
        });

        // Extract and return the AI's reply
        const completion = response.choices[0]?.message?.content?.trim();
        console.log("Generated Completion:", completion);
        return completion;
    } catch (error) {
        console.error("Error generating completion:", error);
        return undefined;
    }
}


export default openai;