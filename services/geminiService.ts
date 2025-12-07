import { GoogleGenAI } from "@google/genai";
import { StudyTask } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to sanitize data before sending to AI
const sanitizeData = (tasks: StudyTask[]): StudyTask[] => {
  return tasks.map(task => ({
    ...task,
    // Normalize hours to be within realistic bounds (0.5 to 24)
    estimatedHours: Math.max(0.5, Math.min(task.estimatedHours, 24)),
    // Ensure subject is not empty
    subject: task.subject || 'Môn học không tên'
  }));
};

export const generateStudyPlan = async (tasks: StudyTask[]): Promise<string> => {
  try {
    const cleanTasks = sanitizeData(tasks);
    const tasksJson = JSON.stringify(cleanTasks, null, 2);
    
    // Updated prompt: Sophisticated, Clean, and strictly formatted for the custom renderer
    const prompt = `
      Đóng vai: Bạn là "SmartStudy Senior Coach" - một chuyên gia cố vấn học tập cấp cao, chuyên sâu về quản lý thời gian và hiệu suất. Phong cách của bạn: Chuyên nghiệp, Tinh tế, Sâu sắc nhưng vẫn Gần gũi.

      NHIỆM VỤ:
      Phân tích dữ liệu học tập dưới đây và soạn thảo một "Báo Cáo Chiến Lược Học Tập" (Strategic Study Guidebook).

      DỮ LIỆU ĐẦU VÀO:
      ${tasksJson}

      QUY TẮC TRÌNH BÀY (BẮT BUỘC):
      Để hệ thống hiển thị đẹp, bạn KHÔNG ĐƯỢC dùng các định dạng Markdown phức tạp (như bảng, code block). Chỉ sử dụng:
      1. Tiêu đề: Bắt đầu bằng "### " (Ví dụ: ### 1. Phân Tích)
      2. In đậm: Dùng "**" cho từ khóa quan trọng nhất. Hạn chế dùng quá nhiều dấu sao.
      3. Gạch đầu dòng: Dùng "- " ở đầu dòng.
      4. Tuyệt đối KHÔNG dùng in nghiêng (*) hoặc gạch chân.

      CẤU TRÚC BÁO CÁO:

      ### 1. Tổng Quan & Sức Khỏe Học Tập
      (Đánh giá ngắn gọn về tổng khối lượng. Nếu tổng giờ > 8h/ngày, hãy cảnh báo về Burnout một cách khoa học).

      ### 2. Tiêu Điểm Ưu Tiên (Priority Focus)
      (Chỉ liệt kê tối đa 2 nhiệm vụ quan trọng nhất/gấp nhất. Giải thích ngắn gọn tại sao cần làm ngay).

      ### 3. Chiến Lược Tối Ưu Hóa (Study Tactics)
      (Đưa ra lời khuyên dựa trên Khoa học não bộ. Ví dụ: Spaced Repetition cho môn nhớ nhiều, Deep Work cho môn khó, Chunking cho task dài > 4h).

      ### 4. Lộ Trình Hành Động (Action Roadmap)
      (Gợi ý thứ tự thực hiện thông minh để tối đa hóa sự tập trung).

      ### 5. Thông Điệp Mentor
      (Một câu trích dẫn hoặc lời khuyên đắt giá về tư duy phát triển - Growth Mindset).

      Hãy viết nội dung thật sự giá trị, không sáo rỗng.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "Hệ thống đang bận phân tích. Vui lòng thử lại sau giây lát.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Không thể kết nối với AI Mentor. Vui lòng kiểm tra kết nối mạng và API Key.";
  }
};