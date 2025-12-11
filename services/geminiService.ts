// services/aiService.ts
import { GoogleGenAI } from "@google/genai";
import { StudyTask, DifficultyLevel, PriorityLevel, MindMapOptions, StudentProfile } from "../types";

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

export const generateStudyPlan = async (tasks: StudyTask[], profile?: StudentProfile): Promise<string> => {
  try {
    const cleanTasks = sanitizeData(tasks);
    const tasksJson = JSON.stringify(cleanTasks, null, 2);

    // 1. Calculate Statistics & Workload Intensity
    const totalHours = cleanTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
    const highPriorityCount = cleanTasks.filter(t => t.priority === PriorityLevel.HIGH).length;
    const hardCount = cleanTasks.filter(t => t.difficulty === DifficultyLevel.HARD || t.difficulty === DifficultyLevel.VERY_HARD).length;
    
    // Heuristic for Workload Intensity (0-10 scale approximation)
    // 1 hour = 0.5 points, Hard task = 2 points, Very Hard = 3 points
    let workloadScore = (totalHours * 0.5) + (hardCount * 2);
    workloadScore = Math.min(10, Math.max(1, workloadScore)); // Cap between 1-10

    const userEnergy = profile?.energyLevel || 7;
    const userPerformance = profile?.performance || 'Khá';

    // 2. Determine Dynamic Strategy Mode
    let strategyMode = "";
    let toneDirective = "";
    let wellbeingDirective = "";
    let prioritizationLogic = "";

    const energyGap = userEnergy - workloadScore;

    if (userEnergy <= 3) {
      // Low Energy Cases
      if (workloadScore > 6) {
         strategyMode = "CRISIS MANAGEMENT (Quản trị khủng hoảng)";
         toneDirective = "Đồng cảm, trấn an, nhưng cực kỳ dứt khoát cắt giảm workload. Nghiêm khắc với việc nghỉ ngơi.";
         prioritizationLogic = "CHỈ chọn 1 nhiệm vụ quan trọng nhất (Dead or Alive). Gạt bỏ mọi thứ khác sang ngày mai.";
         wellbeingDirective = "BẮT BUỘC: Power Nap 20p, uống nước, và chỉ dùng Pomodoro ngắn (15p làm - 5p nghỉ). Cảnh báo Burnout đỏ.";
      } else {
         strategyMode = "RECOVERY & MAINTENANCE (Phục hồi & Duy trì)";
         toneDirective = "Nhẹ nhàng, chữa lành (Healing), khích lệ.";
         prioritizationLogic = "Ưu tiên các việc nhẹ nhàng, Quick Wins để tạo cảm giác hoàn thành mà không tốn sức.";
         wellbeingDirective = "Khuyến khích đi ngủ sớm, nghe nhạc lo-fi, tránh xa màn hình sau khi xong việc.";
      }
    } else if (userEnergy >= 8) {
      // High Energy Cases
      if (workloadScore > 7) {
         strategyMode = "BEAST MODE / PEAK PERFORMANCE (Hiệu suất đỉnh cao)";
         toneDirective = "Mạnh mẽ, huấn luyện viên thể thao (Coach), thúc đẩy giới hạn.";
         prioritizationLogic = "Tấn công trực diện vào task Khó nhất (Eat the Frog). Xếp lịch Deep Work 90 phút liên tục.";
         wellbeingDirective = "Thử thách giới hạn nhưng nhắc uống nước. Dùng Dopamine detox để giữ sự tập trung cao độ.";
      } else {
         strategyMode = "GROWTH & OPTIMIZATION (Tăng trưởng & Tối ưu)";
         toneDirective = "Thông thái, gợi mở, khuyến khích học sâu hơn (Deep Dive).";
         prioritizationLogic = "Hoàn thành bài tập nhanh gọn để dành thời gian nghiên cứu thêm hoặc đọc sách.";
         wellbeingDirective = "Duy trì năng lượng bằng vận động nhẹ. Thử áp dụng phương pháp Feynman để học.";
      }
    } else {
      // Average Energy Cases
      strategyMode = "BALANCED MARATHON (Chạy bền cân bằng)";
      toneDirective = "Thân thiện, logic, thực tế.";
      prioritizationLogic = "Xen kẽ: 1 Task Khó + 1 Task Dễ để duy trì động lực (Momentum).";
      wellbeingDirective = "Tuân thủ quy tắc 20-20-20 cho mắt. Đứng dậy đi lại sau mỗi 45 phút.";
    }

    // Prompt updated with Dynamic Injection
    const prompt = `
      Đóng vai: Bạn là "SmartStudy AI Coach".
      
      THÔNG TIN NGƯỜI DÙNG (DYNAMIC CONTEXT):
      - Học lực: ${userPerformance}
      - Năng lượng hôm nay: ${userEnergy}/10
      - Workload Score (AI tính toán): ${workloadScore.toFixed(1)}/10
      - Chênh lệch Năng lượng/Workload: ${energyGap}
      
      CHẾ ĐỘ CHIẾN LƯỢC KÍCH HOẠT: **${strategyMode}**
      
      YÊU CẦU TONE GIỌNG (DYNAMIC):
      "${toneDirective}"

      LOGIC ƯU TIÊN (DYNAMIC):
      "${prioritizationLogic}"

      CHỈ ĐẠO WELLBEING (DYNAMIC):
      "${wellbeingDirective}"

      DỮ LIỆU NHIỆM VỤ:
      ${tasksJson}

      THỐNG KÊ: Tổng ${totalHours}h, ${hardCount} task khó.

      HÃY VIẾT GUIDEBOOK THEO CẤU TRÚC SAU (Markdown):

      ### 📊 Phân Tích Dữ Liệu & Lý Do Ưu Tiên
      - **Góc nhìn AI**: Giải thích tại sao hôm nay lại chọn chế độ "${strategyMode}".
      - **Priority Explanation**: Giải thích việc chọn task ưu tiên dựa trên LOGIC ƯU TIÊN phía trên (VD: Vì năng lượng bạn thấp, mình chỉ chọn 1 môn...).

      ### ⚖️ Kiểm Soát Rủi Ro & Wellbeing
      - **Health Check**: Đánh giá mức độ rủi ro burnout dựa trên chênh lệch năng lượng.
      - **Actionable Advice**: Đưa ra lời khuyên từ mục CHỈ ĐẠO WELLBEING phía trên.

      ### 🧠 Chiến Lược Học Tập
      Phân loại task vào các nhóm (Dựa trên năng lượng hiện tại):
      - **Deep Work**: (Chỉ gợi ý nếu năng lượng > 5, nếu thấp hãy cảnh báo).
      - **Quick Win**: Các task dễ làm đà.
      - **Research/Review**: Task nhẹ.

      ### 🔥 Tiêu Điểm Hành Động
      - Chọn 2-3 task theo logic ưu tiên đã định.
      - Gợi ý kỹ thuật (Pomodoro 25/5 vs Deep Work 90/15) tùy vào năng lượng user.

      ### 📅 Lộ Trình Gợi Ý (3 Ngày Tới)
      - Lập lịch ngắn gọn.

      ### 🤝 Góc Đồng Kiến Tạo (Co-creation)
      - Tips học tập phù hợp với học lực "${userPerformance}".
      - AI Tip: Mẹo nhỏ để tiết kiệm sức lực.

      ### 💡 Thông Điệp Mentor
      - Một câu quote phù hợp với tâm trạng "${strategyMode}".

      LƯU Ý: Output Markdown thuần túy.
    `;

    const result = await callModel({
      model: taskModelMapping.analysis.model,
      prompt,
      thinkingZero: taskModelMapping.analysis.thinkingZero,
    });

    return result || "Hệ thống đang bận phân tích chiến lược cá nhân hóa. Vui lòng thử lại.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Không thể kết nối với AI Mentor. Vui lòng kiểm tra kết nối mạng và API Key.";
  }
};

export const refineStudyPlan = async (
  tasks: StudyTask[],
  currentPlan: string,
  comment: string,
  profile?: StudentProfile
): Promise<string> => {
  try {
    const cleanTasks = sanitizeData(tasks);
    const tasksJson = JSON.stringify(cleanTasks, null, 2);

    const studentProfileText = profile ? `Profile: Học lực ${profile.performance}, Energy ${profile.energyLevel}/10` : '';

    // Refine prompt aligned with the new structure
    const prompt = `
      CONTEXT: Bạn là SmartStudy AI Coach.
      DỮ LIỆU GỐC: ${tasksJson}
      ${studentProfileText}
      KẾ HOẠCH HIỆN TẠI: ${currentPlan.substring(0, 1000)}...
      PHẢN HỒI HỌC SINH: "${comment}"

      NHIỆM VỤ: Điều chỉnh Guidebook nhưng VẪN PHẢI GIỮ NGUYÊN CẤU TRÚC:
      1. Phân Tích Dữ Liệu & Lý Do Ưu Tiên
      2. Kiểm Soát Rủi Ro & Wellbeing (Quan trọng)
      3. Chiến Lược Học Tập
      4. Tiêu Điểm Hành Động
      5. Lộ Trình Gợi Ý
      6. Góc Đồng Kiến Tạo (Co-creation)
      7. Thông Điệp Mentor

      Hãy cập nhật nội dung dựa trên phản hồi của bạn học sinh một cách thân thiện, chú ý đến mức năng lượng hiện tại của bạn ấy.
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

export const generateMindMap = async (
  tasks: StudyTask[],
  options: MindMapOptions = { showDifficulty: true, showHours: false, showDeadline: false }
): Promise<string> => {
  try {
    const cleanTasks = sanitizeData(tasks);
    
    // Dynamically construct JSON based on user options
    const minimalTasks = cleanTasks.map(t => {
      const item: any = { s: t.subject }; // Subject is always mandatory
      if (options.showDifficulty) item.d = t.difficulty;
      if (options.showHours) item.h = `${t.estimatedHours}h`;
      if (options.showDeadline) item.dl = t.deadline;
      return item;
    });

    const tasksJson = JSON.stringify(minimalTasks, null, 2);

    const prompt = `
      Bạn là chuyên gia Visual Thinking & Mermaid.js "Information Architect".
      DỮ LIỆU: ${tasksJson}
      YÊU CẦU: Tạo code Mermaid.js dạng "graph LR" (Trái sang Phải) phong cách Technical Blueprint.
      
      NGUYÊN TẮC SEMANTIC GEOMETRY (Hình học ngữ nghĩa):
      1. Khó/Rất khó (Hard/Very Hard): Dùng hình lục giác {{Label}}.
      2. Trung bình (Medium): Dùng hình chữ nhật [Label].
      3. Dễ (Easy): Dùng hình bo tròn (Label).
      
      NGUYÊN TẮC COLOR CODING (Bảng màu kỹ thuật):
      - Khó: fill:#f59e0b,stroke:#b45309,color:#fff (Amber)
      - Trung bình: fill:#3b82f6,stroke:#1d4ed8,color:#fff (Blue)
      - Dễ: fill:#10b981,stroke:#047857,color:#fff (Emerald)
      - Nền Grid: Transparent (để UI xử lý).

      SYNTAX RULES:
      1. Label phải dùng ngoặc kép: A["Label"]
      2. Luôn kèm emoji trong label.
      3. Style nodes bằng classDef hoặc style trực tiếp.
      
      OUTPUT:
      Trả về block code markdown:
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
