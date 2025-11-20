import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GeneratedQuiz, QuizQuestion, Flashcard, RoadmapStep } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const streamChatResponse = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  onChunk: (text: string) => void,
  imageBase64?: string | null
) => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        // Updated system instruction with specific attribution rule AND Safety Flagging
        systemInstruction: "You are StudyMate, a friendly and encouraging AI study companion. Keep answers concise, formatted clearly with bullet points. IMPORTANT RULES:\n1. If asked who made you, created you, or developed you, you MUST reply: 'I was made by Sandeep Bhalerao'. Do not mention Google.\n2. If provided with an image, analyze it to help the student learn.\n3. SAFETY & PARENTAL CONTROL: If the user's input is inappropriate, sexually explicit, dangerous, indicates self-harm, or if the conversation becomes emotionally unhealthy/intense or goes completely 'out of the box' (irrelevant to a student context), you MUST start your response with `[[FLAGGED: Reason]]` (e.g. `[[FLAGGED: Inappropriate Topic]]`). Then, provide a firm but safe, redirecting response.",
      },
      history: history,
    });

    // Construct the message. If an image is present, we send a multimodal message for this turn.
    let result;
    if (imageBase64) {
        const mimeType = imageBase64.substring(imageBase64.indexOf(':') + 1, imageBase64.indexOf(';'));
        const data = imageBase64.substring(imageBase64.indexOf(',') + 1);
        
        result = await chat.sendMessageStream({
            message: [
                { text: message || "Explain this image" },
                { inlineData: { mimeType: mimeType, data: data } }
            ]
        });
    } else {
        result = await chat.sendMessageStream({ message });
    }
    
    for await (const chunk of result) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  } catch (error) {
    console.error("Chat stream error:", error);
    onChunk("\n\n*Sorry, I encountered an error. Please try again.*");
  }
};

export const generateSummary = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Summarize the following study notes into clear, easy-to-memorize bullet points. Highlight key terms in bold:\n\n${text}`,
    });
    return response.text || "Could not generate summary.";
  } catch (error) {
    console.error("Summary error:", error);
    throw error;
  }
};

export const generateQuiz = async (topic: string, difficulty: string): Promise<GeneratedQuiz> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      topic: { type: Type.STRING },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            correctAnswer: { type: Type.STRING },
            explanation: { type: Type.STRING }
          },
          required: ["id", "question", "options", "correctAnswer", "explanation"]
        }
      }
    },
    required: ["topic", "questions"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a ${difficulty} level quiz about "${topic}" with 5 multiple choice questions.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    if (!response.text) throw new Error("No data returned");
    
    return JSON.parse(response.text) as GeneratedQuiz;
  } catch (error) {
    console.error("Quiz generation error:", error);
    throw error;
  }
};

export const generateFlashcards = async (topic: string, count: number = 8): Promise<Flashcard[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create ${count} flashcards for the topic: "${topic}". 
            'Front' should be a key term or concept. 
            'Back' should be a concise definition or explanation (max 20 words).`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            front: { type: Type.STRING },
                            back: { type: Type.STRING }
                        },
                        required: ["front", "back"]
                    }
                }
            }
        });

        if (!response.text) return [];
        const cards = JSON.parse(response.text);
        return cards.map((c: any, i: number) => ({...c, id: `${Date.now()}-${i}`, status: 'new'}));
    } catch (e) {
        console.error("Flashcard error", e);
        throw e;
    }
};

export const generateStudyRoadmap = async (goal: string, duration: string): Promise<RoadmapStep[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create a step-by-step study roadmap to learn "${goal}" in "${duration}". 
            Break it down into logical milestones.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING, description: "Title of the milestone (e.g. Week 1: Basics)" },
                            duration: { type: Type.STRING, description: "Estimated time for this step" },
                            description: { type: Type.STRING, description: "What to study in this step" },
                            keyTopics: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 specific concepts" }
                        },
                        required: ["title", "duration", "description", "keyTopics"]
                    }
                }
            }
        });

        if (!response.text) return [];
        const steps = JSON.parse(response.text);
        return steps.map((s: any, i: number) => ({...s, id: `step-${i}`}));
    } catch (e) {
        console.error("Roadmap error", e);
        throw e;
    }
};

export const getSmartSuggestions = async (input: string): Promise<string[]> => {
    if (input.length < 3) return [];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Given the user's partial input "${input}" for a study question, suggest 3 likely complete questions they might ask. Return only the questions as a JSON array of strings.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        if(response.text) {
            return JSON.parse(response.text);
        }
        return [];
    } catch (e) {
        return [];
    }
}

export const generateStudyImage = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: `A clear, educational illustration, diagram, or realistic depiction explaining: ${prompt}. High quality, suitable for a textbook.`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '4:3',
      },
    });

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64ImageBytes) throw new Error("No image generated");
    
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } catch (error) {
    console.error("Image generation error:", error);
    throw error;
  }
};

export const generateBoardGuide = async (classLevel: string, subject: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a comprehensive Board Exam Cheat Sheet for Class ${classLevel} ${subject}. 
      Focus SPECIFICALLY on:
      1. Important Years/Dates and their significance (Timeline format).
      2. Key Events/Formulas that are frequently asked.
      3. 3 High-value tips for the board exam.
      Format nicely with Markdown headers and bullet points.`,
    });
    return response.text || "Could not generate guide.";
  } catch (error) {
    console.error("Board guide error:", error);
    throw error;
  }
};

export const generateDetailedNotes = async (topic: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Using Pro for deeper notes
      contents: `Provide EXTREMELY detailed, deep-dive study notes on the topic: "${topic}". 
      These are premium "Extra Notes" for a student who wants to master the subject.
      Include:
      - Comprehensive definitions.
      - Historical context or derivation.
      - Complex examples and scenarios.
      - Common misconceptions.
      - Advanced concepts related to this topic.
      Format with clear Markdown, using headers, lists, and bold text.`,
    });
    return response.text || "Could not generate detailed notes.";
  } catch (error) {
    console.error("Detailed notes error:", error);
    throw error;
  }
};