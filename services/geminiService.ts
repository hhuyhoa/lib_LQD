
import { GoogleGenAI, Type } from "@google/genai";
import { OCRResult, BookSource } from "../types";

// Initialize the Gemini client with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractBookMetadata = async (images: string[]): Promise<OCRResult> => {
  // Use gemini-3-pro-preview for high-quality complex reasoning and extraction tasks
  const model = "gemini-3-pro-preview";
  
  const imageParts = images.map(base64 => ({
    inlineData: {
      mimeType: "image/jpeg",
      data: base64.split(',')[1]
    }
  }));

const prompt = `
Bạn là chuyên gia biên mục thư viện. 
Hãy phân tích các hình ảnh được cung cấp (bìa, trang bản quyền, mục lục/phụ lục).

1) Trích xuất metadata: title, author, isbn, publisher, year, pages, edition, language.
2) Viết summary theo quy tắc:
- Nếu có MỤC LỤC/PHỤ LỤC: hãy tóm tắt DỰA TRÊN mục lục/phụ lục, càng chi tiết càng tốt:
  + Nêu các chương/phần chính (gạch đầu dòng)
  + Mỗi chương mô tả 1–2 câu về nội dung
  + Tổng thể 200–400 từ (nếu đủ dữ liệu)
- Nếu KHÔNG có mục lục/phụ lục: viết mô tả ngắn 2–4 câu dựa trên tên sách + thông tin bìa (nếu có), KHÔNG bịa nội dung.

Trả về JSON đúng schema.
`;


  try {
    // googleSearch tool is removed to ensure compatibility with responseMimeType: "application/json"
    // and to comply with guidelines prohibiting JSON parsing of grounded responses.
    const response = await ai.models.generateContent({
      model,
      contents: { 
        parts: [...imageParts, { text: prompt }] 
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            author: { type: Type.STRING },
            isbn: { type: Type.STRING },
            publisher: { type: Type.STRING },
            year: { type: Type.INTEGER },
            edition: { type: Type.STRING },
            pages: { type: Type.INTEGER },
            language: { type: Type.STRING },
            summary: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["title", "author"]
        }
      }
    });

    // Directly access the .text property of GenerateContentResponse
    const result = JSON.parse(response.text || "{}");
    
    return {
      ...result,
      summarySources: [], // Summary sources are unavailable without the googleSearch tool
      confidence: result.confidence || 0.9
    };
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw new Error("Không thể phân tích ảnh hoặc tìm kiếm thông tin. Vui lòng nhập dữ liệu thủ công.");
  }
};
