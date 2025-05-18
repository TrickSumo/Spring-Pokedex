import OpenAI from 'openai';

let openai;

export const initOpenAI = async (apiKey) => {
    if (!openai) {
        openai = new OpenAI({ apiKey });
    }
};

export const createChatCompletion = async (signedUrl) => {
    if (!openai) {
        throw new Error('OpenAI not initialized. Call initOpenAI first.');
    }
    return await openai.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: `
            Identify the species in this image for a Pokédex-like application. Please output the result in JSON format containing the following fields: commonName, scientificName, and info.
            
            category: Broad category where the species belongs (e.g., "Birds", "Mammals", "Reptiles").
            commonName: The common name of the species (e.g., "American Robin").
            scientificName: The scientific name of the species (e.g., "Turdus migratorius").
            info: A brief description of the species, including notable traits, habitat, and any interesting facts.

            Example Output:
                        {
                        "category": "Bird",
                        "commonName": "American Robin",
                        "scientificName": "Turdus migratorius",
                        "info": "The American Robin is a migratory songbird native to North America. Known for its orange-red breast, it is a common sight in gardens and parks during spring and summer."
                        }
            Please do not add any string/detials like json in the output 🙏🏽 It is breaking my application!!!  Please Please give output in well formatted json {} only.
`,
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: signedUrl,
                        },
                    },
                ],
            },
        ],
        max_tokens: 300,
    });
};

