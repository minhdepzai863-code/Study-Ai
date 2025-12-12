
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
  // Chat also uses Flash for speed
  chat: { model: "gemini-2.5-flash" }
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

// --- STUDENT CLASSIFICATION & WELLBEING LOGIC ---

export const calculateWellbeingStats = (tasks: StudyTask[], profile: StudentProfile) => {
  const cleanTasks = sanitizeData(tasks);
  const now = new Date();
  
  // 1. Calculate Demand (Workload + Urgency)
  let totalWeightedHours = 0;
  let urgencyPenalty = 0;

  cleanTasks.forEach(task => {
    // Difficulty Weighting
    const diffMap = { [DifficultyLevel.EASY]: 1, [DifficultyLevel.MEDIUM]: 1.4, [DifficultyLevel.HARD]: 2.2, [DifficultyLevel.VERY_HARD]: 3.0 };
    const weight = diffMap[task.difficulty] || 1.4;
    totalWeightedHours += task.estimatedHours * weight;

    // Urgency Calculation (Days until deadline)
    const deadline = new Date(task.deadline);
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Closer deadlines = Higher stress penalty
    // Due today/tomorrow: High penalty. Due within 3 days: Med penalty.
    let urgencyFactor = 1.0;
    if (diffDays <= 1) urgencyFactor = 2.5;
    else if (diffDays <= 3) urgencyFactor = 1.8;
    else if (diffDays <= 7) urgencyFactor = 1.2;

    // Priority multiplier
    const priorityMap = { [PriorityLevel.HIGH]: 1.5, [PriorityLevel.MEDIUM]: 1.1, [PriorityLevel.LOW]: 1.0 };
    const priorityFactor = priorityMap[task.priority] || 1.1;

    urgencyPenalty += (task.estimatedHours * urgencyFactor * priorityFactor);
  });

  // 2. Determine Capacity (Energy + Ability)
  // Energy 1-10 -> Capacity Factor 0.6 - 1.4
  const energyCapacity = 0.6 + (profile.energyLevel / 12.5); 
  
  // Performance acts as efficiency multiplier (Better students handle load better)
  const perfMap = { 'Yếu': 0.8, 'Trung bình': 0.9, 'Khá': 1.1, 'Giỏi': 1.25 };
  const efficiency = perfMap[profile.performance] || 1.0;

  // Base Daily Capacity (e.g., average student handles ~8-10 weighted units/day well)
  const baseDailyCapacity = 10; 
  const totalCapacity = baseDailyCapacity * energyCapacity * efficiency;

  // 3. Calculate "Raw Stress" Ratio (Demand / Capacity)
  // We use the higher of totalWeightedHours or urgencyPenalty to represent peak stress
  const effectiveLoad = Math.max(totalWeightedHours, urgencyPenalty * 0.8);
  const stressRatio = effectiveLoad / (totalCapacity || 1); // Avoid div by 0
  
  // 4. Map Stress Ratio to 0-100 Wellbeing Scale
  // Ratio 0.5 (Easy) -> Wellbeing 95
  // Ratio 1.0 (Balanced) -> Wellbeing 70
  // Ratio 1.5 (Heavy) -> Wellbeing 40
  // Ratio 2.0+ (Burnout) -> Wellbeing < 20
  
  let currentWellbeing = 100 - (stressRatio * 35); 
  // Clamp
  currentWellbeing = Math.max(10, Math.min(98, currentWellbeing));

  // 5. Calculate Projected Wellbeing (AI Optimization Impact)
  // AI Optimization Factors:
  // - Strategic Breaks (Flow/Pomodoro): Recovers ~15% capacity
  // - Prioritization (Reducing Urgency Panic): Reduces urgency penalty by ~20%
  // - Load Balancing: Reduces effective peak load
  
  const optimizedLoad = effectiveLoad * 0.85; // Efficiency gain
  const optimizedCapacity = totalCapacity * 1.15; // Capacity boost via breaks

  const optimizedStressRatio = optimizedLoad / optimizedCapacity;
  let projectedWellbeing = 100 - (optimizedStressRatio * 35);
  
  // Ensure meaningful improvement logic
  let improvement = projectedWellbeing - currentWellbeing;
  if (improvement < 5) improvement = 5; // AI always finds some way to help
  projectedWellbeing = currentWellbeing + improvement;
  
  // Cap at 100
  projectedWellbeing = Math.min(99, projectedWellbeing);

  // Analysis Factors for UI
  const factors = {
    workload: stressRatio > 1.3 ? 'Quá tải' : stressRatio > 0.8 ? 'Vừa sức' : 'Nhẹ nhàng',
    pressure: urgencyPenalty > totalWeightedHours * 1.4 ? 'Gấp rút (Deadline)' : 'Ổn định',
    capacity: energyCapacity < 0.9 ? 'Năng lượng thấp' : 'Sẵn sàng'
  };

  return {
    totalHours: cleanTasks.reduce((sum, t) => sum + t.estimatedHours, 0),
    current: Math.round(currentWellbeing),
    projected: Math.round(projectedWellbeing),
    factors
  };
};

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
    
    // Default profile if missing
    const safeProfile = profile || { performance: 'Khá', energyLevel: 7 };

    // 1. Calculate Wellbeing Stats
    const stats = calculateWellbeingStats(cleanTasks, safeProfile);
    
    // Heuristic for Workload Intensity (0-10 scale)
    const hardCount = cleanTasks.filter(t => t.difficulty === DifficultyLevel.HARD || t.difficulty === DifficultyLevel.VERY_HARD).length;
    let workloadScore = (stats.totalHours * 0.5) + (hardCount * 2);
    workloadScore = Math.min(10, Math.max(1, workloadScore)); 

    const userEnergy = safeProfile.energyLevel;
    const userPerformance = safeProfile.performance;
    const learningStyle = safeProfile.learningStyle || 'Mixed';
    const studyMethod = safeProfile.studyMethod || 'Pomodoro';

    // 2. Classify Student
    const archetype = determineStudentArchetype(cleanTasks, safeProfile, workloadScore);

    const prompt = `
      Đóng vai: Bạn là "SmartStudy AI Mentor" - Một chuyên gia tâm lý giáo dục và quản lý thời gian cực kỳ cá nhân hóa.
      
      DỮ LIỆU NGƯỜI DÙNG:
      - Profile: Học lực ${userPerformance}, Energy ${userEnergy}/10.
      - Phong cách học (VARK): **${learningStyle}**.
      - Phương pháp ưa thích: **${studyMethod}**.
      - Workload Score: ${workloadScore.toFixed(1)}/10.
      - Thống kê: ${cleanTasks.length} tasks, Tổng ${stats.totalHours} giờ.
      
      PHÂN TÍCH WELLBEING (Dữ liệu khách quan từ thuật toán):
      - Điểm Wellbeing HIỆN TẠI (Trước plan): **${stats.current}/100**.
      - Điểm Wellbeing DỰ KIẾN (Sau plan): **${stats.projected}/100**.
      - Các yếu tố chính: Khối lượng công việc (${stats.factors.workload}), Áp lực Deadline (${stats.factors.pressure}), Năng lượng cá nhân (${stats.factors.capacity}).
      => Hãy giải thích logic tại sao điểm lại tăng lên (Ví dụ: Do giảm áp lực deadline bằng cách ưu tiên, hoặc do chia nhỏ khối lượng việc "Quá tải" thành các phần dễ nuốt).

      PHÂN LOẠI HỌC SINH (ARCHETYPE):
      - Loại: **${archetype.name}** ${archetype.icon}
      - Đặc điểm: ${archetype.description}
      - Phong cách lịch trình: ${archetype.scheduleStyle}

      DỮ LIỆU TASKS:
      ${tasksJson}

      YÊU CẦU OUTPUT (Markdown):
      Hãy viết một bản kế hoạch cực kỳ cá nhân hóa, nói chuyện trực tiếp với Archetype "${archetype.name}".
      
      *LƯU Ý ĐẶC BIỆT*:
      - Vì người dùng học theo kiểu "${learningStyle}", hãy đề xuất cách tiếp cận phù hợp.
      - Áp dụng phương pháp "${studyMethod}" vào thiết kế lịch trình.
      - NHẤN MẠNH vào việc cải thiện Wellbeing từ ${stats.current} lên ${stats.projected}.

      ### 👤 Hồ Sơ Học Tập (Classification)
      - **Archetype**: ${archetype.name}
      - **Phong cách học tập**: ${learningStyle} (Đề xuất nhanh cách tối ưu: [Gợi ý ngắn]).
      - **Wellbeing Impact**: Từ **${stats.current}** ➔ **${stats.projected}** / 100.
      - **Yếu tố tác động**: ${stats.factors.workload} | ${stats.factors.pressure} | ${stats.factors.capacity}. (Giải thích ngắn 1 câu về tình trạng này).

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

// --- CHAT WITH MENTOR ---
export const chatWithMentor = async (
  currentMessage: string,
  contextData: {
    plan: string;
    profile: StudentProfile;
    taskSummary: string;
  },
  history: { role: 'user' | 'model', content: string }[]
): Promise<string> => {
  try {
    // Construct history for prompt to give illusion of memory without full chat API
    // We limit history to last 6 turns to save context window
    const historyText = history.slice(-6).map(h => `${h.role === 'user' ? 'Student' : 'AI Mentor'}: ${h.content}`).join('\n');

    const prompt = `
      ROLE: Bạn là SmartStudy AI Mentor. Bạn vừa tạo một bản kế hoạch học tập cho học sinh.
      
      CONTEXT (Kế hoạch hiện tại):
      ${contextData.plan.substring(0, 2000)}... (Đã rút gọn)

      CONTEXT (Hồ sơ học sinh):
      - Năng lượng: ${contextData.profile.energyLevel}/10
      - Phong cách học: ${contextData.profile.learningStyle}
      - Phương pháp: ${contextData.profile.studyMethod}
      
      NHIỆM VỤ: Trả lời câu hỏi của học sinh về kế hoạch bạn vừa tạo.
      - Giải thích TẠI SAO bạn lại sắp xếp như vậy.
      - Động viên học sinh.
      - Nếu học sinh muốn đổi, hãy gợi ý họ dùng tính năng "Phản hồi & Điều chỉnh" (Feedback Loop) ở cuối trang, nhưng ở đây bạn chỉ giải thích và tư vấn.
      - Giữ câu trả lời ngắn gọn (dưới 100 từ), thân thiện, dùng emoji.

      LỊCH SỬ CHAT:
      ${historyText}

      STUDENT HỎI: "${currentMessage}"
      
      MENTOR TRẢ LỜI:
    `;

    const result = await callModel({
      model: taskModelMapping.chat.model,
      prompt,
    });

    return result || "Xin lỗi, mình đang suy nghĩ chút. Bạn hỏi lại được không?";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Mất kết nối với Mentor. Vui lòng kiểm tra mạng.";
  }
};

export const generateMarkdownTable = async (tasks: StudyTask[]): Promise<string> => {
  return ""; // Deprecated or unused
};
