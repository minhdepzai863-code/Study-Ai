import { GoogleGenAI } from "@google/genai";
import { StudyTask } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateStudyPlan = async (tasks: StudyTask[]): Promise<string> => {
  try {
    const tasksJson = JSON.stringify(tasks, null, 2);
    
    // Updated prompt: Prioritize Tasks & Educational Tone
    const prompt = `
      Bạn là SmartStudy AI - một Mentor (Cố vấn học tập) chuyên nghiệp, thấu hiểu tâm lý và khoa học về quản lý thời gian.
      
      NHIỆM VỤ:
      Phân tích danh sách nhiệm vụ của học sinh dưới đây và tạo ra một "Study Plan Guidebook" (Cẩm nang học tập) cá nhân hóa.

      DỮ LIỆU ĐẦU VÀO:
      ${tasksJson}
      
      GIẢI THÍCH DỮ LIỆU:
      - 'priority': Mức độ ưu tiên (1 = Cao nhất/Khẩn cấp, 2 = Trung bình, 3 = Thấp).
      - 'deadline': Hạn chót nộp bài.
      - 'difficulty': Độ khó (Dễ, Trung bình, Khó, Rất khó).

      YÊU CẦU QUAN TRỌNG (STRICT):
      1. **Trọng tâm Ưu tiên:** Phải xác định và làm nổi bật các nhiệm vụ có Priority = 1 hoặc Deadline rất gần. Đây là những việc cần giải quyết trước.
      2. Tuyệt đối KHÔNG nhắc đến mã dự án/kỹ thuật (MTB 1.1.a, ID task...).
      3. Sử dụng ngôn ngữ tự nhiên, học thuật nhưng gần gũi, mang tính khích lệ (Educational & Supportive).
      4. Định dạng Markdown rõ ràng, chuyên nghiệp.

      CẤU TRÚC BÁO CÁO:

      ### 1. 🚨 Tiêu Điểm Ưu Tiên (Priority Focus)
      - Chỉ mặt đặt tên 1-3 nhiệm vụ quan trọng nhất cần làm ngay.
      - Giải thích ngắn gọn tại sao (Ví dụ: "Do độ ưu tiên Cao và deadline ngày mai...").

      ### 2. 📊 Tổng Quan & Sức Bền (Wellbeing)
      - Nhận xét khối lượng công việc tổng thể.
      - Cảnh báo nếu có quá nhiều môn Khó dồn vào thời gian ngắn và gợi ý nghỉ ngơi.

      ### 3. 🗺️ Lộ Trình Hành Động (Action Plan)
      - Đề xuất trình tự học tập hợp lý: Ưu tiên (1) -> Deadline gần -> Môn Khó.
      - **Chiến thuật:** Gợi ý phương pháp học (Ví dụ: Deep Work cho môn Khó, Spaced Repetition cho môn nhớ nhiều).

      ### 4. 🌟 Lời Nhắn Từ Mentor
      - Một lời khuyên ngắn gọn để tạo động lực.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "Hiện tại hệ thống không thể tạo kế hoạch. Vui lòng thử lại sau.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Đã xảy ra lỗi kết nối với AI. Vui lòng kiểm tra lại mạng hoặc API Key.";
  }
};