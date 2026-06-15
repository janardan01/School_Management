// Apex Scheduler & Task Coordinator - Smart Assigner Engine & Database Seeding

export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// School Day Shift Period Layout (12:00 PM - 05:00 PM)
export const PERIODS = [
  { id: 1, name: "Period 1", time: "12:00 PM - 12:45 PM" },
  { id: 2, name: "Period 2", time: "12:45 PM - 01:30 PM" },
  { id: 3, name: "Period 3", time: "01:30 PM - 02:15 PM" },
  // Recess is 02:15 PM - 02:45 PM
  { id: 4, name: "Period 4", time: "02:45 PM - 03:30 PM" },
  { id: 5, name: "Period 5", time: "03:30 PM - 04:15 PM" },
  { id: 6, name: "Period 6", time: "04:15 PM - 05:00 PM" }
];

// Classes 9 to 12 (separated by Arts & Science for 11th/12th)
export const CLASSES = [
  "Grade 9",
  "Grade 10",
  "Grade 11 (Arts)",
  "Grade 11 (Science)",
  "Grade 12 (Arts)",
  "Grade 12 (Science)"
];

// Watson High School Student Enrollment metadata
export const CLASS_METADATA = {
  "Grade 9": { students: 170, stream: "General Shift" },
  "Grade 10": { students: 156, stream: "General Shift" },
  "Grade 11 (Arts)": { students: 25, stream: "Arts Stream" },
  "Grade 11 (Science)": { students: 10, stream: "Science Stream" },
  "Grade 12 (Arts)": { students: 16, stream: "Arts Stream" },
  "Grade 12 (Science)": { students: 4, stream: "Science Stream" }
};

export const DEFAULT_TEACHERS = [
  { id: "T1", name: "Mr. Janardan Kumar", subject: "Computer Science", email: "janardan.computer@school.edu", phone: "9876543201", color: "#00f0ff", preferredDay: "Monday", preferredPeriodId: 1, maxWeeklyLoad: 18 },
  { id: "T2", name: "Mr. Anil Kumar Thakur", subject: "Social Science", email: "anil.headmaster@school.edu", phone: "9876543202", color: "#a855f7", preferredDay: "Tuesday", preferredPeriodId: 2, maxWeeklyLoad: 18 },
  { id: "T3", name: "Mr. Ranjeet Kumar Thakur", subject: "Commerce", email: "ranjeet.commerce@school.edu", phone: "9876543203", color: "#22c55e", preferredDay: "Wednesday", preferredPeriodId: 3, maxWeeklyLoad: 18 },
  { id: "T4", name: "Mr. Rajeev Kumar", subject: "Physics", email: "rajeev.physics@school.edu", phone: "9876543204", color: "#eab308", preferredDay: "Thursday", preferredPeriodId: 4, maxWeeklyLoad: 18 },
  { id: "T5", name: "Mr. Raushan Kumar Yadav", subject: "Science", email: "raushan.science@school.edu", phone: "9876543205", color: "#f97316", preferredDay: "Friday", preferredPeriodId: 5, maxWeeklyLoad: 18 },
  { id: "T6", name: "Mr. Ajay Suman", subject: "Social Science", email: "ajay.social@school.edu", phone: "9876543206", color: "#ec4899", preferredDay: "Saturday", preferredPeriodId: 6, maxWeeklyLoad: 18 },
  { id: "T7", name: "Mr. Hari Om", subject: "Zoology", email: "hariom.zoology@school.edu", phone: "9876543207", color: "#ef4444", preferredDay: "Monday", preferredPeriodId: 3, maxWeeklyLoad: 18 },
  { id: "T8", name: "Mr. Ankit Kumar Sah", subject: "Mathematics", email: "ankit.math@school.edu", phone: "9876543208", color: "#06b6d4", preferredDay: "Wednesday", preferredPeriodId: 2, maxWeeklyLoad: 18 },
  { id: "T9", name: "Mr. Ravi Bhushan Jha", subject: "Social Science", email: "ravi.social@school.edu", phone: "9876543209", color: "#84cc16", preferredDay: "Friday", preferredPeriodId: 1, maxWeeklyLoad: 18 },
  { id: "T10", name: "Mrs. Nisha Choudhary", subject: "Entrepreneurship", email: "nisha.entrepreneur@school.edu", phone: "9876543210", color: "#3b82f6", preferredDay: "Thursday", preferredPeriodId: 5, maxWeeklyLoad: 18 },
  { id: "T11", name: "Mr. Sumit Kumar", subject: "Social Science", email: "sumit.social@school.edu", phone: "9876543211", color: "#6366f1", preferredDay: "Saturday", preferredPeriodId: 4, maxWeeklyLoad: 18 }
];

// Helper to generate a realistic default routine that respects shift limits
export const generateDefaultRoutine = () => {
  const routine = {};
  
  // Initialize routine layout
  CLASSES.forEach(cls => {
    routine[cls] = {};
    DAYS.forEach(day => {
      routine[cls][day] = {};
      PERIODS.forEach(p => {
        routine[cls][day][p.id] = { teacherId: "", subject: "" };
      });
    });
  });

  // Class constraints pools
  const generalTeachers = [
    { id: "T1", subject: "Computer Science" }, // Only Grade 9-10
    { id: "T2", subject: "Social Science" },
    { id: "T3", subject: "Social Science" }, // Ranjeet Kumar Thakur teaches general SS
    { id: "T4", subject: "Science" },
    { id: "T5", subject: "Science" },
    { id: "T6", subject: "Social Science" },
    { id: "T7", subject: "Science" },
    { id: "T8", subject: "Mathematics" },
    { id: "T9", subject: "Social Science" },
    { id: "T10", subject: "Social Science" }, // Nisha Choudhary teaches general SS
    { id: "T11", subject: "Social Science" }
  ];

  const artsTeachers = [
    { id: "T2", subject: "Social Science" }, // Headmaster
    { id: "T6", subject: "Social Science" },
    { id: "T9", subject: "Social Science" },
    { id: "T11", subject: "Social Science" }
  ];

  const scienceTeachers = [
    { id: "T4", subject: "Physics" }, // Rajeev Kumar
    { id: "T5", subject: "Science" }, // Raushan Kumar Yadav
    { id: "T7", subject: "Zoology" }, // Hari Om
    { id: "T8", subject: "Mathematics" } // Ankit Kumar Sah
  ];

  // Cyclic routine generator avoiding double-bookings
  DAYS.forEach(day => {
    const dayIndex = DAYS.indexOf(day);
    PERIODS.forEach(p => {
      const pId = p.id;
      const busyTeachers = new Set();

      CLASSES.forEach((cls, classIndex) => {
        let pool = [];
        if (cls.includes("Science")) {
          pool = scienceTeachers;
        } else if (cls.includes("Arts")) {
          pool = artsTeachers;
        } else {
          pool = generalTeachers;
        }

        for (let i = 0; i < pool.length; i++) {
          const teacherIndex = (dayIndex + pId + classIndex + i) % pool.length;
          const candidate = pool[teacherIndex];
          
          if (!busyTeachers.has(candidate.id)) {
            // Occupy 80% slots for realism
            if ((dayIndex + pId + classIndex * 2) % 5 !== 0) {
              routine[cls][day][pId] = {
                teacherId: candidate.id,
                subject: candidate.subject
              };
              busyTeachers.add(candidate.id);
            }
            break;
          }
        }
      });
    });
  });

  return routine;
};

export const DEFAULT_ORDERS = [
  {
    id: "ORD-001",
    title: "Prepare & Submit U-DISE+ Student Profile Data",
    authority: "DEO Office",
    dateReceived: "2026-05-22",
    deadline: "2026-05-29",
    eventTime: "",
    duration: 0,
    description: "Upload detailed demographic and academic records of all students in Grades 9-12 on the U-DISE+ state portal. Requires compiling CSV spreadsheets and verifying data integrity.",
    category: "IT & Digital",
    assignedTeacherId: "T1", // Assigned to computer teacher
    status: "In Progress",
    priority: "High",
    reports: []
  },
  {
    id: "ORD-002",
    title: "Conduct Block-Level Science Exhibition Prep",
    authority: "BRC Office",
    dateReceived: "2026-05-24",
    deadline: "2026-05-28",
    eventTime: "2026-05-28 01:30 PM", // Shift-aligned time
    duration: 2,
    description: "Organize the selection of top 3 science projects from school to represent in the Block-Level Science Exhibition. Need to guide students and coordinate judging on Thursday morning.",
    category: "Science & Maths",
    assignedTeacherId: "T5", // Assigned to Raushan Kumar Yadav (Science)
    status: "In Progress",
    priority: "High",
    reports: []
  },
  {
    id: "ORD-003",
    title: "Submit Mid-Day Meal (MDM) Monthly Accounts Audits",
    authority: "BRC Office",
    dateReceived: "2026-05-20",
    deadline: "2026-05-26",
    eventTime: "",
    duration: 0,
    description: "Compile MDM stock usage registers, expenditures, cook honorarium payments, and student attendance lists for official audit reporting.",
    category: "Administrative",
    assignedTeacherId: "T2", // Assigned to Headmaster (Anil Kumar Thakur)
    status: "Completed",
    priority: "Medium",
    reports: [
      {
        submitterId: "T2",
        submitterName: "Mr. Anil Kumar Thakur",
        submittedAt: "2026-05-24 04:15 PM",
        content: "Completed MDM balance worksheets. Verified ledger totals with local supplier receipts. Signed by Headmaster and uploaded to BRC portal."
      }
    ]
  },
  {
    id: "ORD-004",
    title: "Organize Block-Level Sports Selection Meet",
    authority: "DEO Office",
    dateReceived: "2026-05-25",
    deadline: "2026-05-30",
    eventTime: "2026-05-29 12:45 PM", // Friday Day Shift Period 2
    duration: 3,
    description: "Select students for Under-17 Athletics, Kho-Kho, and Volleyball teams. Host standard physical trials on the school ground.",
    category: "Co-curricular",
    assignedTeacherId: null,
    status: "Pending",
    priority: "High",
    reports: []
  }
];

// Helper to count how many periods a teacher teaches per week
export const calculateTeacherTeachingPeriods = (routine, teacherId) => {
  let count = 0;
  CLASSES.forEach(cls => {
    DAYS.forEach(day => {
      PERIODS.forEach(p => {
        if (routine[cls]?.[day]?.[p.id]?.teacherId === teacherId) {
          count++;
        }
      });
    });
  });
  return count;
};

// Helper to check if a teacher is teaching at a specific day/period
export const getTeacherScheduleAt = (routine, teacherId, day, periodId) => {
  const assignments = [];
  CLASSES.forEach(cls => {
    const slot = routine[cls]?.[day]?.[periodId];
    if (slot && slot.teacherId === teacherId) {
      assignments.push({ classId: cls, subject: slot.subject });
    }
  });
  return assignments.length > 0 ? assignments[0] : null;
};

// Core Smart recommendation logic
export const getRecommendations = (teachers, routine, activeOrders, task, leaves = []) => {
  let eventDay = null;
  let eventPeriods = [];

  if (task.eventTime) {
    try {
      const date = new Date(task.eventTime);
      const dayIndex = date.getDay();
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      eventDay = daysOfWeek[dayIndex];
      
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const timeInMinutes = hours * 60 + minutes;
      
      const duration = task.duration || 1;

      // Period mapping based on Day Shift: 12:00 PM - 05:00 PM
      if (timeInMinutes >= 720 && timeInMinutes < 765) eventPeriods = [1];
      else if (timeInMinutes >= 765 && timeInMinutes < 810) eventPeriods = [2];
      else if (timeInMinutes >= 810 && timeInMinutes < 855) eventPeriods = [3];
      else if (timeInMinutes >= 885 && timeInMinutes < 930) eventPeriods = [4];
      else if (timeInMinutes >= 930 && timeInMinutes < 975) eventPeriods = [5];
      else if (timeInMinutes >= 975 && timeInMinutes < 1020) eventPeriods = [6];
      else {
        // If it falls in Recess (02:15 PM - 02:45 PM / 855 - 885 min), flag adjacent periods
        if (timeInMinutes >= 855 && timeInMinutes < 885) {
          eventPeriods = [3, 4];
        } else {
          eventPeriods = [2]; // fallback
        }
      }

      for (let i = 1; i < duration; i++) {
        const nextPeriod = eventPeriods[eventPeriods.length - 1] + 1;
        if (nextPeriod <= 6) {
          eventPeriods.push(nextPeriod);
        }
      }
    } catch (e) {
      console.error("Failed to parse eventTime for collision analysis", e);
    }
  }

  return teachers.map(teacher => {
    let score = 60;
    const reasons = [];
    const activeTasks = activeOrders.filter(o => o.assignedTeacherId === teacher.id && o.status !== "Completed");
    const activeTasksCount = activeTasks.length;
    const weeklyPeriods = calculateTeacherTeachingPeriods(routine, teacher.id);
    
    let isConflicted = false;
    let conflictDetails = null;

    // Check if the teacher is on leave on the event day
    const isOnLeaveToday = eventDay && leaves.some(l => l.teacherId === teacher.id && l.day === eventDay);
    if (isOnLeaveToday) {
      isConflicted = true;
      score = 0;
      conflictDetails = `On Leave on ${eventDay}`;
      reasons.push(`CRITICAL CONFLICT: Teacher is on Leave on ${eventDay}.`);
    }

    // 1. Direct Schedule Collision Check
    if (!isOnLeaveToday && eventDay && eventPeriods.length > 0) {
      if (eventDay === "Sunday") {
        reasons.push(`+10 Bonus: Event is on a Sunday, no regular classes are affected.`);
        score += 10;
      } else {
        const collisions = [];
        eventPeriods.forEach(pId => {
          const schedule = getTeacherScheduleAt(routine, teacher.id, eventDay, pId);
          if (schedule) {
            collisions.push({ periodId: pId, ...schedule });
          }
        });

        if (collisions.length > 0) {
          isConflicted = true;
          score -= 80;
          conflictDetails = `Teaching ${collisions.map(c => `${c.subject} in ${c.classId} (Period ${c.periodId})`).join(", ")} on ${eventDay}.`;
          reasons.push(`CRITICAL CONFLICT: Teaching classes during the scheduled event time (${conflictDetails}).`);
        } else {
          reasons.push(`+20 Bonus: Free from teaching during the scheduled event window on ${eventDay} (Periods: ${eventPeriods.join(", ")}).`);
          score += 20;
        }
      }
    }

    // 2. Active Admin Tasks Load Penalty
    if (activeTasksCount === 0) {
      reasons.push("+15 Workload Balance: Has no active administrative duties. Highly available.");
      score += 15;
    } else {
      const deduction = activeTasksCount * 15;
      reasons.push(`-${deduction} Workload Burden: Currently managing ${activeTasksCount} active BRC/DEO administrative tasks.`);
      score -= deduction;
    }

    // 3. Subject Specialization Matching
    const cat = task.category;
    const sub = teacher.subject;
    let subjectMatch = false;

    if (cat === "IT & Digital" && sub === "Computer Science") {
      subjectMatch = true;
    } else if (cat === "Science & Maths" && ["Science", "Mathematics", "Physics", "Zoology"].includes(sub)) {
      subjectMatch = true;
    } else if (cat === "Co-curricular" && ["Physical Education", "Art & Craft"].includes(sub)) {
      subjectMatch = true;
    } else if (cat === "Administrative" && ["English", "Social Science", "Hindi", "Commerce", "Entrepreneurship"].includes(sub)) {
      subjectMatch = true;
      score += 10;
      reasons.push("+10 Expertise: Humanities, Commerce or Languages are excellent for administrative drafting.");
    }

    if (subjectMatch && cat !== "Administrative") {
      score += 30;
      reasons.push(`+30 Specialty Match: Subject expert in '${sub}' which directly aligns with the '${cat}' order.`);
    }

    // 4. Teaching Timetable Workload Adjustment
    if (weeklyPeriods >= 22) {
      score -= 15;
      reasons.push(`-15 Schedule Density: Heavy weekly teaching schedule (${weeklyPeriods} periods). Shielding from extra duties.`);
    } else if (weeklyPeriods <= 15) {
      score += 15;
      reasons.push(`+15 Teaching Capacity: Lighter weekly teaching load (${weeklyPeriods} periods). Available for supportive work.`);
    } else {
      reasons.push(`+0 Mid-Load Baseline: Average teaching timetable (${weeklyPeriods} periods/week).`);
    }

    // 5. Teacher Preferences & Wishlist Adjustments
    const preferredDay = teacher.preferredDay || "";
    const preferredPeriodId = teacher.preferredPeriodId || null;
    const maxWeeklyLoad = teacher.maxWeeklyLoad || 18;

    if (eventDay && preferredDay === eventDay) {
      score += 10;
      reasons.push(`+10 Wishlist Bonus: Event day aligns with teacher's preferred day (${preferredDay}).`);
    }

    if (preferredPeriodId && eventPeriods.includes(preferredPeriodId)) {
      score += 10;
      reasons.push(`+10 Wishlist Bonus: Event period aligns with teacher's preferred period (Period ${preferredPeriodId}).`);
    }

    if (weeklyPeriods > maxWeeklyLoad) {
      score -= 20;
      reasons.push(`-20 Overloaded: Weekly teaching periods (${weeklyPeriods}) exceed teacher's custom max weekly limit of ${maxWeeklyLoad}.`);
    }

    score = Math.max(0, Math.min(100, score));

    return {
      teacherId: teacher.id,
      name: teacher.name,
      subject: teacher.subject,
      color: teacher.color,
      score: Math.round(score),
      isConflicted,
      conflictDetails,
      activeTasksCount,
      weeklyPeriods,
      reasons
    };
  }).sort((a, b) => b.score - a.score);
};
