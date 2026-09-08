export const NOTIFICATIONS_STORAGE_KEY_PREFIX = "skillbridge_notifications_v1_";

export const INITIAL_NOTIFICATIONS_CANDIDATE = [
  {
    id: "notif-1",
    type: "application",
    title: "Application Under Review",
    message: "Stripe has moved your application for Senior Frontend / React Engineer to the 'Under Review' stage.",
    company: "Stripe",
    time: "15m ago",
    read: false,
    link: "/my-applications",
    linkText: "View Application",
    tag: "Application"
  },
  {
    id: "notif-2",
    type: "interview",
    title: "Interview Request Received",
    message: "Sarah Jenkins from Google Cloud requested an introductory technical screen for Core Cloud Tools.",
    company: "Google Cloud",
    time: "1h ago",
    read: false,
    link: "messages",
    linkText: "Reply in Messages",
    tag: "Interview"
  },
  {
    id: "notif-3",
    type: "recommendation",
    title: "New AI Job Match (96% Match)",
    message: "SkillBridge AI identified 3 new openings that match your React & distributed systems background.",
    company: "SkillBridge AI",
    time: "4h ago",
    read: false,
    link: "/candidate-dashboard",
    linkText: "Explore Matches",
    tag: "Recommendation"
  },
  {
    id: "notif-4",
    type: "resume",
    title: "ATS Resume Score: 92/100",
    message: "Your uploaded resume was verified by SkillBridge ATS. Adding 2 cloud tools will optimize recruiter discoverability.",
    company: "SkillBridge ATS",
    time: "Yesterday",
    read: true,
    link: "/candidate-profile",
    linkText: "View Profile",
    tag: "Resume"
  },
  {
    id: "notif-5",
    type: "view",
    title: "Profile Viewed by Employer",
    message: "A senior technical recruiter from Amazon Web Services viewed your candidate profile.",
    company: "AWS",
    time: "2d ago",
    read: true,
    link: "/my-applications",
    linkText: "View Applications",
    tag: "Application"
  }
];

export const INITIAL_NOTIFICATIONS_RECRUITER = [
  {
    id: "notif-r1",
    type: "application",
    title: "New Candidate Applied",
    message: "Arjun Mehta submitted an application for Full Stack Engineer (React / Node.js) with 94% profile match.",
    company: "Applicant Tracking",
    time: "10m ago",
    read: false,
    link: "/recruiter-applications",
    linkText: "Review Candidate",
    tag: "Applicant"
  },
  {
    id: "notif-r2",
    type: "system",
    title: "Job Milestone Reached",
    message: "Your listing 'Senior React Developer' reached 50 views and 12 qualified applicants this week.",
    company: "SkillBridge Insights",
    time: "3h ago",
    read: false,
    link: "/recruiter-dashboard",
    linkText: "Manage Job",
    tag: "Analytics"
  },
  {
    id: "notif-r3",
    type: "interview",
    title: "Assessment Completed",
    message: "Candidate Priya Sharma completed the Frontend Technical Assessment with an 88/100 score.",
    company: "SkillBridge Assessment",
    time: "1d ago",
    read: true,
    link: "/recruiter-applications",
    linkText: "View Report",
    tag: "Assessment"
  }
];

export const getUnreadNotificationsCount = (user) => {
  try {
    const key = NOTIFICATIONS_STORAGE_KEY_PREFIX + (user?._id || user?.email || "guest");
    const saved = localStorage.getItem(key);
    if (saved) {
      const notifs = JSON.parse(saved);
      return notifs.filter((n) => !n.read).length;
    }
  } catch (e) {
    console.error("Error reading unread notifications count:", e);
  }
  return user?.role === "recruiter" ? 2 : 3;
};
