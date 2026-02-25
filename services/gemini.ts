
import { GoogleGenAI, Type } from "@google/genai";
import { OCRResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractBookData = async (images: string[]): Promise<OCRResult> => {
  const model = 'gemini-3-flash-preview';
  
  const prompt = `
    Analyze the provided images of a book (cover, copyright page, table of contents).
    Extract the following metadata accurately:
    - Title (Tên sách)
    - ISBN
    - Author (Tác giả, multiple authors separated by ;)
    - Publisher (Nhà xuất bản)
    - Publish Year (Năm xuất bản, 4 digits)
    - Edition (Lần xuất bản)
    - Language (Ngôn ngữ: Tiếng Việt, English, Français, etc.)
    - Page Count (Số trang)
    - A brief summary (Tóm tắt nội dung) based on the blurb or TOC.
    
    If a field is not found, leave it null. 
    Provide a confidence score between 0 and 1 for the overall extraction.
  `;

  const imageParts = images.map(base64 => ({
    inlineData: {
      mimeType: "image/jpeg",
      data: base64.split(',')[1] || base64
    }
  }));

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: prompt },
        ...imageParts
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          isbn: { type: Type.STRING },
          author: { type: Type.STRING },
          publisher: { type: Type.STRING },
          publishYear: { type: Type.INTEGER },
          edition: { type: Type.STRING },
          language: { type: Type.STRING },
          pageCount: { type: Type.INTEGER },
          summary: { type: Type.STRING },
          confidence: { type: Type.NUMBER }
        },
        required: ["confidence"]
      }
    }
  });

  try {
    const text = response.text;
    return JSON.parse(text) as OCRResult;
  } catch (error) {
    console.error("Failed to parse Gemini response:", error);
    return { confidence: 0 };
  }
};
