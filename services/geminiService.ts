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
    
    // Updated prompt: Student-centric, friendly, actionable & structured
    const prompt = `
      Bạn là SmartStudy AI - một Mentor học tập cực kỳ tâm lý, thông thái và vui vẻ (Gen Z style).
      
      NHIỆM VỤ:
      Hãy đóng vai một người bạn đồng hành, phân tích danh sách bài tập dưới đây và viết một "Chiến Lược Học Tập" (Study Guidebook) thật cụ thể.

      DỮ LIỆU ĐẦU VÀO (Đã được làm sạch):
      ${tasksJson}
      
      GIẢI THÍCH DỮ LIỆU:
      - 'priority': 1 là Cao nhất (Gấp), 2 là Vừa.
      - 'deadline': Hạn chót.
      - 'difficulty': Độ khó.
      - 'estimatedHours': Thời gian ước tính (Max 24h).

      QUY TẮC "VÀNG" KHI VIẾT (STRICT):
      1. **Tone giọng:** Thân thiện, khích lệ, xưng hô "Mình - Bạn". Dùng ngôn ngữ tự nhiên, không máy móc.
      2. **Logic Tư vấn (Algorithm):**
         - **Phân Tích Workload:** Tính sơ bộ tổng giờ học. Nếu > 8h/ngày -> Cảnh báo nhẹ nhàng về Burnout.
         - **Môn Khó/Rất khó:** Gợi ý phương pháp **Feynman** (giảng lại) hoặc **Eat That Frog** (làm ngay đầu ngày).
         - **Task > 4 giờ:** BẮT BUỘC khuyên chia nhỏ task (Chunking) thành các phần 2h để không bị ngợp.
         - **Task dài (gần 24h):** Đây là việc rất lớn, cần cảnh báo không thể làm xong trong 1 lần ngồi. Gợi ý lập kế hoạch dài hạn.
         - **Nhiều Deadline gấp:** Gợi ý ma trận **Eisenhower** (Ưu tiên gấp & quan trọng).
      3. **Trình bày:** Dùng Markdown, Bold từ khóa, và Emoji 🌟 để bài viết sinh động, dễ đọc lướt.

      CẤU TRÚC BÁO CÁO (Bắt buộc theo format này):

      ### 👋 Chào bạn! Check-in năng lượng nào
      (Nhận xét tổng quan về độ "căng" của lịch học. Ví dụ: "Tuần này deadline 'dí' hơi căng nha!" hoặc "Lịch trình khá 'chill', thoải mái đấy!").

      ### 📊 Phân Tích Dữ Liệu & Workload
      - **Tổng quan:** Bạn cần khoảng **[Tổng giờ]** giờ tập trung.
      - **Đánh giá:** (Dựa trên tổng giờ: Quá tải, Vừa sức hay Nhẹ nhàng).

      ### 🚨 Tiêu Điểm: Nhiệm Vụ "Sống Còn"
      (Chọn 1-3 việc Priority 1 hoặc Deadline gần nhất).
      - 🔥 **[Tên môn]**: [Lời khuyên ngắn gọn tại sao cần làm ngay].

      ### 🧠 Chiến Thuật & Bí Kíp (Study Hacks)
      (Lời khuyên cụ thể dựa trên độ khó và thời gian).
      - *Ví dụ:* "Môn **[Tên môn]** (Khó) cần sự tập trung sâu. Hãy tắt thông báo điện thoại và dùng phương pháp Deep Work nhé."
      - *Ví dụ:* "Với **[Tên môn]** (Kéo dài [x] giờ), đừng cố làm một mạch! Hãy chia nhỏ nó ra..."

      ### 🗺️ Lộ Trình Gợi Ý (Action Plan)
      (Sắp xếp thứ tự học hợp lý. Nhắc nhở nghỉ giải lao Pomodoro 25/5).

      ### 💌 Lời Nhắn Nhủ
      (Một câu quote động lực hoặc lời chúc dễ thương để bạn bắt tay vào làm ngay).
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "Hmm, mình đang suy nghĩ chút mà bị ngắt quãng. Bạn thử lại giúp mình nhé!";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Oops! Có chút trục trặc kết nối với vũ trụ AI. Bạn kiểm tra lại mạng hoặc API Key xem sao nhé!";
  }
};