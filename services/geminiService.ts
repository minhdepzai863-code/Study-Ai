
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

// --- STUDENT CLASSIFICATION LOGIC ---
const determineStudentArchetype = (
  tasks: StudyTask[], 
  profile: StudentProfile, 
  workloadScore: number
): { name: string; description: string; scheduleStyle: string; icon: string } => {
  const { energyLevel, performance } = profile;
  const urgentTasks = tasks.filter(t => t.priority === PriorityLevel.HIGH).length;
  
  // 1. THE BURNT-OUT WARRIOR (Chiến Binh Kiệt Sức)
  // Low Energy + High Workload
  if (energyLevel <= 4 && workloadScore >= 7) {
    return {
      name: "Chiến Binh Kiệt Sức (The Burnt-out Warrior)",
      description: "Bạn có năng lực nhưng đang gánh quá nhiều việc trong khi năng lượng chạm đáy. Nguy cơ Burnout rất cao.",
      scheduleStyle: "Recovery Mode: Các phiên làm việc cực ngắn (25m), nghỉ dài (15m). Cắt bỏ mọi task không khẩn cấp.",
      icon: "❤️‍🩹"
    };
  }

  // 2. THE DEADLINE FIGHTER (Chiến Thần Deadline)
  // High Urgency + High Energy + Medium/Low Performance (Usually waits till last minute)
  if (urgentTasks >= 3 && energyLevel >= 6) {
    return {
      name: "Chiến Thần Deadline (The Deadline Fighter)",
      description: "Bạn sống nhờ Adrenaline. Bạn có năng lượng nhưng khối lượng task gấp đang dồn lại quá nhiều.",
      scheduleStyle: "Sprint Mode: Time-boxing cực kỳ nghiêm ngặt. Loại bỏ hoàn toàn xao nhãng. 'Eat the Frog' ngay lập tức.",
      icon: "🔥"
    };
  }

  // 3. THE PERFECTIONIST (Người Cầu Toàn)
  // High Performance + High Hours on Medium Tasks
  if (performance === 'Giỏi' || performance === 'Khá') {
    const avgHours = tasks.reduce((sum, t) => sum + t.estimatedHours, 0) / (tasks.length || 1);
    if (avgHours > 3) {
      return {
        name: "Người Cầu Toàn (The Perfectionist)",
        description: "Bạn học giỏi nhưng có xu hướng dành quá nhiều thời gian cho một việc, dẫn đến thiếu thời gian cho việc khác.",
        scheduleStyle: "Optimization Mode: Đặt 'Hard Stop' cho từng task. Áp dụng quy tắc 80/20.",
        icon: "💎"
      };
    }
  }

  // 4. THE EXPLORER (Nhà Thám Hiểm)
  // High Energy + Low Workload
  if (energyLevel >= 8 && workloadScore <= 5) {
    return {
      name: "Nhà Thám Hiểm (The Explorer)",
      description: "Bạn đang ở trạng thái sung sức và rảnh rang. Đây là lúc để học sâu hoặc học vượt.",
      scheduleStyle: "Deep Dive Mode: Các phiên Deep Work dài (90m). Tập trung vào nghiên cứu mở rộng.",
      icon: "🚀"
    };
  }

  // 5. THE BALANCER (Người Cân Bằng) - Default
  return {
    name: "Người Cân Bằng (The Balancer)",
    description: "Bạn đang duy trì nhịp độ ổn định. Không quá áp lực nhưng cũng không quá rảnh rỗi.",
    scheduleStyle: "Consistency Mode: Pomodoro tiêu chuẩn (25/5). Duy trì đều đặn.",
    icon: "⚖️"
  };
};

// —————————————————————————————————————————————
// Main Gemini prompts
// —————————————————————————————————————————————

export const generateStudyPlan = async (tasks: StudyTask[], profile?: StudentProfile): Promise<string> => {
  try {
    const cleanTasks = sanitizeData(tasks);
    const tasksJson = JSON.stringify(cleanTasks, null, 2);

    // 1. Calculate Statistics & Workload Intensity
    const totalHours = cleanTasks.reduce((sum, t) => sum + t.estimatedHours, 0);
    const highPriorityCount = cleanTasks.filter(t => t.priority === PriorityLevel.HIGH).length;
    const hardCount = cleanTasks.filter(t => t.difficulty === DifficultyLevel.HARD || t.difficulty === DifficultyLevel.VERY_HARD).length;
    
    // Heuristic for Workload Intensity (0-10 scale)
    let workloadScore = (totalHours * 0.5) + (hardCount * 2);
    workloadScore = Math.min(10, Math.max(1, workloadScore)); 

    const userEnergy = profile?.energyLevel || 7;
    const userPerformance = profile?.performance || 'Khá';
    const learningStyle = profile?.learningStyle || 'Mixed';
    const studyMethod = profile?.studyMethod || 'Pomodoro';

    // 2. Classify Student
    const archetype = determineStudentArchetype(cleanTasks, { energyLevel: userEnergy, performance: userPerformance }, workloadScore);

    const prompt = `
      Đóng vai: Bạn là "SmartStudy AI Mentor" - Một chuyên gia tâm lý giáo dục và quản lý thời gian cực kỳ cá nhân hóa.
      
      DỮ LIỆU NGƯỜI DÙNG:
      - Profile: Học lực ${userPerformance}, Energy ${userEnergy}/10.
      - Phong cách học (VARK): **${learningStyle}**.
      - Phương pháp ưa thích: **${studyMethod}**.
      - Workload Score: ${workloadScore.toFixed(1)}/10.
      - Thống kê: ${cleanTasks.length} tasks, Tổng ${totalHours} giờ.
      
      PHÂN LOẠI HỌC SINH (ARCHETYPE):
      - Loại: **${archetype.name}** ${archetype.icon}
      - Đặc điểm: ${archetype.description}
      - Phong cách lịch trình: ${archetype.scheduleStyle}

      DỮ LIỆU TASKS:
      ${tasksJson}

      YÊU CẦU OUTPUT (Markdown):
      Hãy viết một bản kế hoạch cực kỳ cá nhân hóa, nói chuyện trực tiếp với Archetype "${archetype.name}".
      
      *LƯU Ý ĐẶC BIỆT*:
      - Vì người dùng học theo kiểu "${learningStyle}", hãy đề xuất cách tiếp cận phù hợp (Ví dụ: Visual -> Vẽ sơ đồ, Auditory -> Nghe lại bài giảng/Giảng lại cho người khác).
      - Áp dụng phương pháp "${studyMethod}" vào thiết kế lịch trình (Ví dụ: Nếu Feynman -> Dành thời gian tự giảng lại; Nếu Pomodoro -> Chia block 25p).

      ### 👤 Hồ Sơ Học Tập (Classification)
      - **Archetype**: ${archetype.name}
      - **Phong cách học tập**: ${learningStyle} (Đề xuất nhanh cách tối ưu: [Gợi ý ngắn]).
      - **Tình trạng hiện tại**: (Mô tả ngắn gọn dựa trên Energy vs Workload).
      - **Điểm mạnh cần phát huy**: ...
      - **Bẫy cần tránh**: ...

      ### 📊 Chiến Lược Chủ Đạo (Dựa trên ${archetype.scheduleStyle} + ${studyMethod})
      - Giải thích cách sắp xếp lịch hôm nay.
      - **Chiến thuật áp dụng**: Giải thích cách dùng phương pháp ${studyMethod} cho các task cụ thể dưới đây.
      - **Quy tắc vàng hôm nay**: Một quy tắc duy nhất user phải nhớ.

      ### 📅 Lộ Trình Cá Nhân Hóa (Visual Schedule)
      *QUAN TRỌNG: Thiết kế timeline dựa trên phong cách "${archetype.scheduleStyle}" và chia block theo "${studyMethod}".*
      
      Trình bày dạng danh sách có icon.
      Ví dụ định dạng:
      **Ngày 1 - [Ngày tháng]**:
      - 08:00 - 08:25: [Icon] Task A (Block 1 - ${studyMethod})
      - 08:25 - 08:30: Nghỉ ngắn
      - ...

      ### 💡 Lời Khuyên Riêng (Personalized Advice)
      - Dành riêng cho học lực "${userPerformance}".
      - Dành riêng cho Energy ${userEnergy}.
      - **Góc ${learningStyle}**: Mẹo học nhanh nhớ lâu phù hợp với phong cách này.

      ### 🧘 Wellbeing & Đồng Kiến Tạo
      - Một câu trích dẫn (Quote) truyền cảm hứng cho "${archetype.name}".
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
    
    // Recalculate basic archetype for context
    const workloadScore = 5; // Simplified for refine
    const archetype = profile ? determineStudentArchetype(cleanTasks, profile, workloadScore) : { name: "Học sinh", scheduleStyle: "Cân bằng", description: "", icon: "" };

    const prompt = `
      CONTEXT: Bạn là SmartStudy AI Mentor.
      ARCHETYPE NGƯỜI DÙNG: ${archetype.name} (${archetype.scheduleStyle}).
      PROFILE MỞ RỘNG: Học kiểu ${profile?.learningStyle || 'Mixed'}, thích ${profile?.studyMethod || 'Linh hoạt'}.
      
      KẾ HOẠCH HIỆN TẠI: ${currentPlan.substring(0, 1500)}...
      PHẢN HỒI HỌC SINH: "${comment}"

      NHIỆM VỤ: Điều chỉnh Guidebook. 
      LƯU Ý QUAN TRỌNG:
      1. Giữ nguyên cấu trúc Markdown (Hồ Sơ Học Tập, Chiến Lược, Lộ Trình...).
      2. Mọi thay đổi phải phù hợp với Archetype "${archetype.name}" và phong cách học của họ.
      3. Cập nhật lịch trình cụ thể theo ý user.
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
    
    const minimalTasks = cleanTasks.map(t => {
      const item: any = { s: t.subject };
      if (options.showDifficulty) item.d = t.difficulty;
      if (options.showHours) item.h = `${t.estimatedHours}h`;
      if (options.showDeadline) item.dl = t.deadline;
      return item;
    });

    const tasksJson = JSON.stringify(minimalTasks, null, 2);

    const prompt = `
      Bạn là chuyên gia Visual Thinking & Mermaid.js.
      DỮ LIỆU: ${tasksJson}
      YÊU CẦU: Tạo code Mermaid.js dạng "graph LR".
      Output ONLY the code block.
    `;

    const result = await callModel({
      model: taskModelMapping.analysis.model,
      prompt,
      thinkingZero: true
    });

    let code = result || "";
    const mermaidRegex = /```mermaid([\s\S]*?)```/;
    const match = code.match(mermaidRegex);
    if (match && match[1]) code = match[1].trim();
    else code = code.replace(/```mermaid/g, "").replace(/```/g, "").trim();
    
    return code;
  } catch (error) {
    console.error("MindMap Error:", error);
    return "";
  }
};

export const generateMarkdownTable = async (tasks: StudyTask[]): Promise<string> => {
  return ""; // Deprecated or unused
};
