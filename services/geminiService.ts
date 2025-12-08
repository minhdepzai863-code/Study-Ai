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
    
    // Updated prompt: Enforcing Strict Sections for Box-in-Box Layout
    const prompt = `
      Đóng vai: Bạn là "SmartStudy AI Coach" - một người bạn đồng hành thông thái, tâm lý và cực kỳ giỏi về quản lý thời gian.
      Tone giọng: Thân thiện, khích lệ (xưng hô "Mình" và "Bạn"), nhưng vẫn rất gãy gọn, khoa học và actionable (dễ hành động).

      DỮ LIỆU ĐẦU VÀO:
      ${tasksJson}

      NHIỆM VỤ:
      Hãy viết một "Study Plan Guidebook" thật sinh động, dễ áp dụng.
      
      QUAN TRỌNG: Hãy trình bày theo CẤU TRÚC CHÍNH XÁC dưới đây (sử dụng dấu ### cho tiêu đề) để hệ thống có thể hiển thị đẹp mắt.

      ### 🌟 Tổng Quan & Sức Khỏe
      - Đánh giá ngắn gọn workload hiện tại (Bạn có đang bị quá tải không?).
      - **Wellbeing Checkpoint**: Đưa ra 1 lời khuyên cụ thể về sức khỏe dựa trên tổng thời gian học (ví dụ: Quy tắc 20-20-20, ngủ đủ giấc, uống nước).

      ### 🧠 Chiến Lược Học Tập
      Phân loại các nhiệm vụ thành các nhóm chiến lược (Sử dụng gạch đầu dòng):
      - **Deep Work (Tập trung sâu)**: Liệt kê các môn khó cần không gian yên tĩnh.
      - **Quick Win (Xử lý nhanh)**: Liệt kê các môn dễ hoặc bài tập ngắn.
      - **Research/Review**: Các nhiệm vụ cần tra cứu hoặc ôn tập nhẹ nhàng.

      ### 🔥 Tiêu Điểm Ưu Tiên & Hành Động
      - Chọn ra 2-3 nhiệm vụ "Must-Do" (Phải làm ngay).
      - Giải thích ngắn gọn tại sao (Deadline gấp hay độ khó cao?). 
      - Đưa ra chiến thuật cụ thể cho từng tiêu điểm (VD: Pomodoro, Eat that Frog).

      ### 📅 Lộ Trình Gợi Ý (3 Ngày Tới)
      Đề xuất một lộ trình học tập ngắn hạn.
      - **Ngày 1**: Tập trung Toán (2h) + Tiếng Anh (30p)
      - **Ngày 2**: Hoàn thành Project Web (4h)

      ### 💡 Thông Điệp Mentor
      - > Hãy viết một câu quote truyền cảm hứng hoặc một lời khuyên tâm huyết đặt trong dấu trích dẫn này.

      LƯU Ý: Chỉ trả về nội dung Markdown thuần túy. Không dùng code block.
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

export const refineStudyPlan = async (tasks: StudyTask[], currentPlan: string, comment: string): Promise<string> => {
  try {
    const cleanTasks = sanitizeData(tasks);
    const tasksJson = JSON.stringify(cleanTasks, null, 2);

    const prompt = `
      CONTEXT:
      Bạn là "SmartStudy AI Coach".
      Tone giọng: Thân thiện, hỗ trợ.
      
      DỮ LIỆU GỐC: ${tasksJson}
      KẾ HOẠCH HIỆN TẠI (Tóm tắt): ${currentPlan.substring(0, 500)}...
      PHẢN HỒI CỦA BẠN HỌC SINH: "${comment}"

      NHIỆM VỤ:
      Viết lại (hoặc điều chỉnh) Guidebook để đáp ứng mong muốn của bạn ấy.
      QUAN TRỌNG: Giữ nguyên cấu trúc 5 phần (### 1... ### 5...) như ban đầu để giao diện không bị lỗi.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });

    return response.text || "Hệ thống đang bận cập nhật.";
  } catch (error) {
    console.error("Gemini Refine Error:", error);
    return "Lỗi kết nối khi cập nhật kế hoạch.";
  }
};