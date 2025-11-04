import { GoogleGenAI, Modality } from "@google/genai";

// FIX: Initialize GoogleGenAI directly with process.env.API_KEY as per guidelines.
// The API key is sourced from the environment and is assumed to be available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const editImageBackground = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
          responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    throw new Error("No image data found in the Gemini API response.");

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to process image with Gemini API.");
  }
};
