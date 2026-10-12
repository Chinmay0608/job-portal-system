import React, { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Sparkles,
  Mic,
  MicOff,
  Send,
  CheckCircle2,
  AlertTriangle,
  Award,
  ArrowRight,
  RefreshCw,
  X,
  Loader2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  startInterviewSessionAPI,
  submitInterviewAnswerAPI,
} from "../Services/interviewService";

const DOMAIN_LIST = [
  "Software Engineering",
  "Data & Analytics",
  "Healthcare & Medical",
  "Media & Video Creation",
  "Design & Creative",
  "Management & Operations",
  "Marketing & Sales",
  "Finance & Accounting",
  "Customer Support / Operations",
];

const SENIORITY_LIST = [
  "Intern / Trainee",
  "Entry Level",
  "Mid Level",
  "Senior Level",
  "Staff / Principal",
  "Executive / Manager",
];

const getJobSeniority = (job, user) => {
  const experience = `${job?.experienceRequired || ""} ${job?.title || ""}`.toLowerCase();
  if (/intern|trainee/.test(experience)) return "Intern / Trainee";
  if (/fresher|entry|junior|0-2/.test(experience)) return "Entry Level";
  if (/2-5|mid/.test(experience)) return "Mid Level";
  if (/5\+|senior/.test(experience)) return "Senior Level";
  const userSeniority = Array.isArray(user?.targetSeniority)
    ? user.targetSeniority[0]
    : user?.targetSeniority;
  return SENIORITY_LIST.includes(userSeniority) ? userSeniority : "Entry Level";
};

const getJobDomain = (job, user) => {
  if (DOMAIN_LIST.includes(job?.domain)) return job.domain;
  if (DOMAIN_LIST.includes(user?.field)) return user.field;
  const jobSkills = Array.isArray(job?.skillsRequired)
    ? job.skillsRequired.join(" ")
    : job?.skillsRequired || "";
  const details = `${job?.title || ""} ${jobSkills}`.toLowerCase();
  if (/data|analytics|machine learning|ai engineer/.test(details)) return "Data & Analytics";
  if (/health|medical|clinical/.test(details)) return "Healthcare & Medical";
  if (/design|ux|creative/.test(details)) return "Design & Creative";
  if (/marketing|sales/.test(details)) return "Marketing & Sales";
  if (/finance|account/.test(details)) return "Finance & Accounting";
  return "Software Engineering";
};

export default function AiInterviewAssistant({ user, job, onClose, autoGenerate = false }) {
  const [step, setStep] = useState(1); // 1: Setup, 2: Question Active, 3: Answer Scorecard, 4: Summary
  const [jobDomain, setJobDomain] = useState(() => getJobDomain(job, user));
  const [targetSeniority, setTargetSeniority] = useState(() => getJobSeniority(job, user));
  const [interviewType, setInterviewType] = useState("mixed");

  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const [answer, setAnswer] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const [evaluation, setEvaluation] = useState(null);
  const [overallScore, setOverallScore] = useState(0);
  const [answeredHistory, setAnsweredHistory] = useState([]);
  const [showSuggested, setShowSuggested] = useState(false);
  const autoStartedJobRef = useRef(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setAnswer(currentTranscript);
      };

      rec.onerror = (err) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Voice input is not supported in your browser. Please type your response.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.success("Listening... Speak your answer clearly.");
      } catch (err) {
        console.error("Start speech error:", err);
      }
    }
  };

  const handleStartSession = useCallback(async () => {
    try {
      setLoading(true);
      const res = await startInterviewSessionAPI({
        jobDomain,
        targetSeniority,
        interviewType,
        jobId: job?._id,
      });

      if (res?.sessionId && Array.isArray(res.questions)) {
        setSessionId(res.sessionId);
        setQuestions(res.questions);
        setCurrentIdx(0);
        setAnswer("");
        setAnsweredHistory([]);
        setStep(2);
        toast.success(job ? "Your TRAO AI prep kit is ready!" : "TRAO AI Interview Round Initialized!");
      }
    } catch (err) {
      console.error("Failed to start session:", err);
      toast.error(err?.response?.data?.message || "Failed to initialize TRAO AI Session.");
    } finally {
      setLoading(false);
    }
  }, [job, jobDomain, targetSeniority, interviewType]);

  useEffect(() => {
    if (!autoGenerate || !job?._id || autoStartedJobRef.current === job._id) return;
    autoStartedJobRef.current = job._id;
    handleStartSession();
  }, [autoGenerate, job?._id, handleStartSession]);

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      toast.error("Please speak or type your answer before submitting.");
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const currentQ = questions[currentIdx];
    try {
      setLoading(true);
      const res = await submitInterviewAnswerAPI({
        sessionId,
        questionId: currentQ.questionId,
        candidateAnswer: answer.trim(),
      });

      if (res?.evaluation) {
        setEvaluation(res.evaluation);
        setOverallScore(res.overallScore || 0);

        setAnsweredHistory((prev) => [
          ...prev,
          {
            questionText: currentQ.questionText,
            candidateAnswer: answer.trim(),
            score: res.evaluation.score,
            evaluation: res.evaluation,
          },
        ]);

        setStep(3);
      }
    } catch (err) {
      console.error("Failed to submit answer:", err);
      toast.error(err?.response?.data?.message || "Failed to evaluate answer.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
      setAnswer("");
      setEvaluation(null);
      setShowSuggested(false);
      setStep(2);
    } else {
      setStep(4);
    }
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 80) return { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" };
    if (score >= 60) return { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" };
    return { bg: "#fffbeb", border: "#fef3c7", text: "#b45309" };
  };

  const currentQ = questions[currentIdx];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "640px",
          maxHeight: "90vh",
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid rgba(226, 232, 240, 0.8)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #f1f5f9",
            background: "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "10px",
                background: "#2563eb",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                {job ? "TRAO AI Interview Prep Kit" : "TRAO AI Interview Assistant"}
              </h2>
              <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                {job ? `Preparing for ${job.title} at ${job.company}` : "Role-specific AI Mock Practice & Real-time Scoring"}
              </span>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                padding: "4px",
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* BODY CONTENT */}
        <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1 }}>
          {/* STEP 1: SETUP */}
          {step === 1 && (
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", marginBottom: "6px" }}>
                {job ? "Your tailored interview prep kit" : "Configure Your Mock Interview Round"}
              </h3>
              <p style={{ fontSize: "0.88rem", color: "#64748b", marginBottom: "20px", lineHeight: "1.5" }}>
                {job
                  ? "We’re using this job posting and your profile to build role-specific questions. Your kit will be saved to your TRAO practice sessions."
                  : "Select your target field and position level. TRAO AI generates realistic technical and behavioral questions tailored to your profile."}
              </p>

              {job && (
                <div style={{ padding: "12px 14px", borderRadius: "10px", background: "#f8fafc", border: "1px solid #e2e8f0", marginBottom: "18px" }}>
                  <strong style={{ color: "#0f172a" }}>{job.title}</strong>
                  <div style={{ color: "#64748b", fontSize: "0.82rem", marginTop: "3px" }}>
                    {[job.company, job.location].filter(Boolean).join(" · ")}
                  </div>
                  <div style={{ color: "#475569", fontSize: "0.78rem", marginTop: "7px" }}>
                    Profile: {user?.name || "Candidate"}{user?.skills?.length ? ` · ${user.skills.slice(0, 5).join(", ")}` : ""}
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Target Job Domain
                  </label>
                  <select
                    value={jobDomain}
                    onChange={(e) => setJobDomain(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "0.9rem",
                      color: "#1e293b",
                    }}
                  >
                    {DOMAIN_LIST.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Target Position Level
                  </label>
                  <select
                    value={targetSeniority}
                    onChange={(e) => setTargetSeniority(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: "1.5px solid #cbd5e1",
                      fontSize: "0.9rem",
                      color: "#1e293b",
                    }}
                  >
                    {SENIORITY_LIST.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Interview Style
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                    {[
                      { id: "mixed", label: "Mixed Round" },
                      { id: "technical", label: "Technical Focus" },
                      { id: "behavioral", label: "Behavioral / STAR" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setInterviewType(opt.id)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: "8px",
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          border: interviewType === opt.id ? "2px solid #2563eb" : "1px solid #cbd5e1",
                          background: interviewType === opt.id ? "#eff6ff" : "#ffffff",
                          color: interviewType === opt.id ? "#2563eb" : "#475569",
                          cursor: "pointer",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: ACTIVE QUESTION SCREEN */}
          {step === 2 && currentQ && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#2563eb", background: "#eff6ff", padding: "3px 10px", borderRadius: "999px" }}>
                  {currentQ.category.toUpperCase()}
                </span>
              </div>

              <div style={{ background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "16px 20px", marginBottom: "18px" }}>
                <p style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: 0, lineHeight: "1.4" }}>
                  "{currentQ.questionText}"
                </p>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "8px" }}>
                  Your Answer (Speak or Type):
                </label>

                <textarea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Click the microphone to speak your answer, or type here..."
                  style={{
                    width: "100%",
                    height: "140px",
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: "1.5px solid #cbd5e1",
                    fontSize: "0.92rem",
                    color: "#1e293b",
                    outline: "none",
                    resize: "none",
                    boxSizing: "border-box",
                  }}
                />

                <div style={{ marginTop: "10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <button
                    type="button"
                    onClick={toggleListening}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      border: "none",
                      cursor: "pointer",
                      background: isListening ? "#ef4444" : "#f1f5f9",
                      color: isListening ? "#ffffff" : "#334155",
                    }}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                    {isListening ? "Stop Voice Input" : "Speak Answer (STT)"}
                  </button>

                  <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                    {answer.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: REAL-TIME SCORECARD */}
          {step === 3 && evaluation && (
            <div>
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                {(() => {
                  const colors = getScoreBadgeColor(evaluation.score);
                  return (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 20px",
                        borderRadius: "999px",
                        background: colors.bg,
                        border: `1.5px solid ${colors.border}`,
                        color: colors.text,
                        fontSize: "1.2rem",
                        fontWeight: 800,
                      }}
                    >
                      <Award size={22} />
                      Score: {evaluation.score} / 100
                    </div>
                  );
                })()}
              </div>

              {/* STRENGTHS */}
              {evaluation.strengths && evaluation.strengths.length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#15803d", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <CheckCircle2 size={16} /> What Went Well:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.88rem", color: "#334155" }}>
                    {evaluation.strengths.map((st, i) => (
                      <li key={i} style={{ marginBottom: "4px" }}>
                        {st}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* IMPROVEMENTS */}
              {evaluation.improvements && evaluation.improvements.length > 0 && (
                <div style={{ marginBottom: "18px" }}>
                  <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#b45309", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertTriangle size={16} /> TRAO Actionable Tips:
                  </h4>
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.88rem", color: "#334155" }}>
                    {evaluation.improvements.map((imp, i) => (
                      <li key={i} style={{ marginBottom: "4px" }}>
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* SUGGESTED ANSWER */}
              {evaluation.suggestedAnswer && (
                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "14px" }}>
                  <button
                    type="button"
                    onClick={() => setShowSuggested((prev) => !prev)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#2563eb",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: 0,
                    }}
                  >
                    <HelpCircle size={16} />
                    {showSuggested ? "Hide Exemplary Response" : "View Exemplary Response Snippet"}
                    {showSuggested ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {showSuggested && (
                    <div style={{ marginTop: "10px", padding: "12px 14px", background: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.85rem", color: "#475569", lineHeight: "1.5" }}>
                      {evaluation.suggestedAnswer}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: FINAL SUMMARY */}
          {step === 4 && (
            <div style={{ textAlign: "center", padding: "10px 0" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "#dcfce7",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <Award size={32} />
              </div>

              <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a", marginBottom: "6px" }}>
                TRAO AI Interview Round Completed! 🎉
              </h3>
              <p style={{ fontSize: "0.9rem", color: "#64748b", marginBottom: "20px" }}>
                Overall Performance Score for <strong>{jobDomain} ({targetSeniority})</strong>
              </p>

              <div
                style={{
                  display: "inline-block",
                  padding: "12px 28px",
                  borderRadius: "16px",
                  background: "#eff6ff",
                  border: "2px solid #bfdbfe",
                  color: "#2563eb",
                  fontSize: "1.8rem",
                  fontWeight: 900,
                  marginBottom: "24px",
                }}
              >
                {overallScore} / 100
              </div>

              <div style={{ textAlign: "left", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "16px 20px" }}>
                <h4 style={{ fontSize: "0.82rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "10px" }}>
                  Question Breakdown
                </h4>
                {answeredHistory.map((item, idx) => (
                  <div key={idx} style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: idx !== answeredHistory.length - 1 ? "1px solid #e2e8f0" : "none" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                      <span>Q{idx + 1}: {item.questionText}</span>
                      <span style={{ color: "#2563eb" }}>{item.score}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div
          style={{
            padding: "16px 28px",
            borderTop: "1px solid #f1f5f9",
            background: "#ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {step === 1 && (
            <div style={{ marginLeft: "auto" }}>
              <button
                type="button"
                onClick={handleStartSession}
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 22px",
                  background: "#2563eb",
                  color: "#ffffff",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                {job ? "Generate my prep kit" : "Start TRAO Practice"}
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={loading || !answer.trim()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 22px",
                  background: !answer.trim() ? "#cbd5e1" : "#2563eb",
                  color: "#ffffff",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  cursor: !answer.trim() || loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    TRAO AI Evaluating...
                  </>
                ) : (
                  <>
                    Submit & Score Answer
                    <Send size={16} />
                  </>
                )}
              </button>
            </div>
          )}

          {step === 3 && (
            <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={handleNextQuestion}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 22px",
                  background: "#2563eb",
                  color: "#ffffff",
                  borderRadius: "10px",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  cursor: "pointer",
                }}
              >
                {currentIdx + 1 < questions.length ? "Next Question" : "View Final Scorecard"}
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {step === 4 && (
            <div style={{ width: "100%", display: "flex", justifyContent: "space-between" }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "10px 18px",
                  background: "transparent",
                  border: "1px solid #cbd5e1",
                  borderRadius: "10px",
                  color: "#475569",
                  fontWeight: 600,
                  fontSize: "0.88rem",
                  cursor: "pointer",
                }}
              >
                <RefreshCw size={16} />
                Practice Another Round
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: "10px 22px",
                    background: "#2563eb",
                    color: "#ffffff",
                    borderRadius: "10px",
                    border: "none",
                    fontWeight: 600,
                    fontSize: "0.92rem",
                    cursor: "pointer",
                  }}
                >
                  Done
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
