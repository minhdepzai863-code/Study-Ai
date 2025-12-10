// services/aiService.ts
import { GoogleGenAI } from "@google/genai";
import { StudyTask, DifficultyLevel, PriorityLevel } from "../types";

const googleAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to sanitize data before sending to AI
const sanitizeData = (tasks: StudyTask[]): StudyTask[] => {
  return tasks.map(task => ({
    ...task,
    estimatedHours: (typeof task.estimatedHours === 'number' && !isNaN(task.estimatedHours)) ? Math.max(0.5, Math.min(task.estimatedHours, 24)) : 2,
    subject: task.subject || "Môn học không tên",
    difficulty: task.difficulty ?? DifficultyLevel.MEDIUM,
    priority: task.priority ?? PriorityLevel.MEDIUM,
  }));
};

// Configuration for models
const taskModelMapping = {
  // Main analysis uses Flash 2.5 with 0 thinking budget for speed/efficiency on structured data
  analysis: { model: "gemini-2.5-flash", thinkingZero: true },
  // Refinement also uses Flash
  refine: { model: "gemini-2.5-flash" },
};

// Unified caller
async function callModel(opts: {
  model: string;
  prompt: string;
  thinkingZero?: boolean;
}): Promise<string> {
  try {
    const response = await googleAI.models.generateContent({
      model: opts.model,
      contents: opts.prompt,
      ...(opts.thinkingZero ? { config: { thinkingConfig: { thinkingBudget: 0 } } } : {}),
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Google AI Error:", error);
    return "";
  }
}

// —————————————————————————————————————————————
// DO NOT CHANGE: Main Gemini prompts remain intact
// —————————————————————————————————————————————

export const generateStudyPlan = async (tasks: StudyTask[]): Promise<string> => {
  try {
    const cleanTasks = sanitizeData(tasks);
    const tasksJson = JSON.stringify(cleanTasks, null, 2);

    // Prompt updated to SmartStudy AI Coach persona as requested
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

    const result = await callModel({
      model: taskModelMapping.analysis.model,
      prompt,
      thinkingZero: taskModelMapping.analysis.thinkingZero,
    });

    return result || "Hệ thống đang bận phân tích. Vui lòng thử lại sau giây lát.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Không thể kết nối với AI Mentor. Vui lòng kiểm tra kết nối mạng và API Key.";
  }
};

export const refineStudyPlan = async (
  tasks: StudyTask[],
  currentPlan: string,
  comment: string
): Promise<string> => {
  try {
    const cleanTasks = sanitizeData(tasks);
    const tasksJson = JSON.stringify(cleanTasks, null, 2);

    // Refine prompt aligned with the new structure
    const prompt = `
      CONTEXT: Bạn là SmartStudy AI Coach.
      DỮ LIỆU GỐC: ${tasksJson}
      KẾ HOẠCH HIỆN TẠI: ${currentPlan.substring(0, 1000)}...
      PHẢN HỒI HỌC SINH: "${comment}"

      NHIỆM VỤ: Điều chỉnh Guidebook nhưng VẪN PHẢI GIỮ NGUYÊN CẤU TRÚC:
      1. Tổng Quan & Sức Khỏe
      2. Chiến Lược Học Tập
      3. Tiêu Điểm Ưu Tiên
      4. Lộ Trình Gợi Ý
      5. Thông Điệp Mentor

      Hãy cập nhật nội dung dựa trên phản hồi của bạn học sinh một cách thân thiện.
    `;

    const result = await callModel({
      model: taskModelMapping.refine.model,
      prompt,
    });

    return result || "Hệ thống đang bận cập nhật.";
  } catch (error) {
    console.error("Gemini Refine Error:", error);
    return "Lỗi kết nối khi cập nhật kế hoạch.";
  }
};

export const generateMindMap = async (tasks: StudyTask[]): Promise<string> => {
  try {
    const cleanTasks = sanitizeData(tasks);
    const tasksJson = JSON.stringify(cleanTasks.map(t => ({ s: t.subject, d: t.difficulty })), null, 2);

    const prompt = `
      Bạn là chuyên gia Visual Thinking & Mermaid.js.
      DỮ LIỆU: ${tasksJson}
      YÊU CẦU: Tạo code Mermaid.js dạng "graph LR" (Trái sang Phải) để vẽ Mindmap kế hoạch học tập.
      
      NGUYÊN TẮC VISUAL & SYNTAX:
      1. QUAN TRỌNG: Luôn dùng dấu ngoặc kép cho label node để tránh lỗi ký tự đặc biệt. 
         Ví dụ đúng: A["📐 Toán"] --> B["📝 Bài tập"]
         Ví dụ sai: A[📐 Toán] --> B[📝 Bài tập]
      2. EMOJI: Bắt buộc dùng Emoji trong label.
      3. MÀU SẮC: Dùng lệnh "style" để tô màu rực rỡ.
      
      OUTPUT:
      Hãy trả về một block code markdown:
      \`\`\`mermaid
      graph LR
        ... code here ...
      \`\`\`
    `;

    const result = await callModel({
      model: taskModelMapping.analysis.model,
      prompt,
      thinkingZero: true
    });

    let code = result || "";
    
    // Robust Regex Extraction to ignore conversational filler
    const mermaidRegex = /```mermaid([\s\S]*?)```/;
    const match = code.match(mermaidRegex);
    
    if (match && match[1]) {
      code = match[1].trim();
    } else {
      // Fallback cleanup if regex fails
      code = code.replace(/```mermaid/g, "").replace(/```/g, "").trim();
    }
    
    return code;
  } catch (error) {
    console.error("MindMap Error:", error);
    return "";
  }
};

export const generateMarkdownTable = async (tasks: StudyTask[]): Promise<string> => {
  try {
    const cleanTasks = sanitizeData(tasks);
    const tasksJson = JSON.stringify(
      cleanTasks.map((t) => ({ subject: t.subject, desc: t.description })),
      null,
      2
    );

    const prompt = `
      Bạn là "SmartStudy Visual Architect".
      NHIỆM VỤ: Tạo một bảng Markdown để trực quan hóa kế hoạch học tập.
      Cột: Môn học | Keywords/Chiến lược
      DỮ LIỆU: ${tasksJson}
    `;

    const out = await callModel({
      model: taskModelMapping.analysis.model,
      prompt,
    });
    return out || "";
  } catch (error) {
    console.error("Table Error:", error);
    return "";
  }
};