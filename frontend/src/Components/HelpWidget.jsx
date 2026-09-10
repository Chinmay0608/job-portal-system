import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import html2canvas from "html2canvas";
import axios from "axios";
import toast from "react-hot-toast";
import { LifeBuoy, X, Camera, Upload, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { getStoredUser } from "../Services/authUtils";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function HelpWidget() {
  const [user, setUser] = useState(getStoredUser);
  const [guestEmail, setGuestEmail] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [description, setDescription] = useState("");
  const [screenshotDataUrl, setScreenshotDataUrl] = useState("");
  const [screenshotBlob, setScreenshotBlob] = useState(null);
  const [manualFile, setManualFile] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatusText, setSubmitStatusText] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const syncUser = () => {
      const stored = getStoredUser();
      setUser(stored);
    };
    syncUser();
    window.addEventListener("storage", syncUser);
    return () => window.removeEventListener("storage", syncUser);
  }, [location.pathname, isOpen]);

  const captureScreen = async () => {
    setIsCapturing(true);
    setErrorMsg("");
    try {
      // Temporarily hide the modal if it's currently open
      const modalEl = document.getElementById("help-widget-modal");
      if (modalEl) modalEl.style.visibility = "hidden";

      // Viewport-focused capture: snapshot what the user is actively viewing on screen
      const viewportWidth = Math.min(window.innerWidth || 800, 1920);
      const viewportHeight = Math.min(window.innerHeight || 600, 1080);
      const scrollX = window.scrollX || window.pageXOffset || 0;
      const scrollY = window.scrollY || window.pageYOffset || 0;

      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        logging: false,
        scale: 1, // Crisp 1:1 scale without creating massive canvases on high-DPI/mobile
        width: viewportWidth,
        height: viewportHeight,
        x: scrollX,
        y: scrollY,
        windowWidth: viewportWidth,
        windowHeight: viewportHeight,
        ignoreElements: (el) =>
          el.id === "help-widget-button" || el.id === "help-widget-modal",
      });

      if (modalEl) modalEl.style.visibility = "visible";

      // Compress to high-efficiency JPEG (0.8 quality, ~100KB instead of multi-MB PNG)
      canvas.toBlob(
        (blob) => {
          setScreenshotBlob(blob);
        },
        "image/jpeg",
        0.8
      );

      setScreenshotDataUrl(canvas.toDataURL("image/jpeg", 0.8));
      setManualFile(null);
    } catch (err) {
      console.warn("Screenshot capture error:", err);
      const modalEl = document.getElementById("help-widget-modal");
      if (modalEl) modalEl.style.visibility = "visible";
      setErrorMsg("Auto-capture failed. You can upload a screenshot below.");
    } finally {
      setIsCapturing(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setSubmitSuccess(false);
    setErrorMsg("");
    setDescription("");
    setSubmitStatusText("");
    // Give modal a tick to render, then auto-capture the background page
    setTimeout(() => {
      captureScreen();
    }, 150);
  };

  const handleClose = () => {
    setIsOpen(false);
    setScreenshotDataUrl("");
    setScreenshotBlob(null);
    setManualFile(null);
    setDescription("");
    setErrorMsg("");
    setGuestEmail("");
    setSubmitStatusText("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select an image file (.png, .jpg, .webp)");
      return;
    }

    setManualFile(file);
    setScreenshotBlob(null);
    setErrorMsg("");

    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotDataUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || description.trim().length < 5) {
      setErrorMsg("Please provide a bit more detail (at least 5 characters).");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");
    setSubmitStatusText("");

    // If server takes more than 3.5s (cold-start on Render free-tier), display reassuring message
    const statusTimer = setTimeout(() => {
      setSubmitStatusText("Connecting to server (waking up service if idle, please wait)...");
    }, 3500);

    try {
      const formData = new FormData();
      formData.append("description", description.trim());
      formData.append("pageUrl", window.location.pathname + window.location.search);

      if (!user && guestEmail.trim()) {
        formData.append("email", guestEmail.trim());
      }

      if (manualFile) {
        formData.append("screenshot", manualFile);
      } else if (screenshotBlob) {
        formData.append("screenshot", screenshotBlob, "screenshot.jpg");
      }

      const headers = {
        "Content-Type": "multipart/form-data",
        "x-requested-with": "XMLHttpRequest",
      };

      const token = localStorage.getItem("token");
      if (token && token !== "null" && token !== "undefined") {
        headers.Authorization = `Bearer ${token}`;
      }

      await axios.post(`${API_BASE_URL}/api/support/report`, formData, {
        headers,
        withCredentials: true,
        timeout: 45000,
      });

      setSubmitSuccess(true);
      toast.success("Thanks — your report has been submitted.");
      setTimeout(() => {
        handleClose();
      }, 1800);
    } catch (err) {
      console.error("Failed to submit support ticket:", err);
      const msg =
        err.response?.data?.message ||
        (err.code === "ECONNABORTED"
          ? "Request timed out. The server may still be spinning up. Please try again."
          : "Failed to submit report. Please try again.");
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      clearTimeout(statusTimer);
      setSubmitStatusText("");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          id="help-widget-button"
          type="button"
          onClick={handleOpen}
          className="fixed bottom-5 right-4 sm:bottom-20 sm:right-8 z-[10001] flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm shadow-2xl transition-all duration-200 ease-out hover:scale-105 active:scale-95 border border-slate-700/60 cursor-pointer select-none"
          title="Report an Issue"
          aria-label="Report an Issue"
        >
          <LifeBuoy size={18} className="text-emerald-400 shrink-0" />
          <span className="text-white whitespace-nowrap font-semibold">
            Report Issue
          </span>
        </button>
      )}


      {/* Modal Backdrop & Dialog */}
      {isOpen && (
        <div
          id="help-widget-modal"
          className="fixed inset-0 z-[10002] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <LifeBuoy size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Report an Issue</h3>
                  <p className="text-xs text-slate-500">Auto-captured page screenshot + details</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {submitSuccess ? (
                <div className="py-10 text-center space-y-3">
                  <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                    <CheckCircle2 size={28} />
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg">Report Submitted!</h4>
                  <p className="text-sm text-slate-600 max-w-sm mx-auto">
                    Thank you for letting us know. Our engineering team will review the issue and screenshot shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {errorMsg && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Screenshot Section */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Camera size={14} className="text-slate-400" />
                        Page Screenshot Preview
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={captureScreen}
                          disabled={isCapturing || isSubmitting}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline disabled:opacity-50"
                        >
                          <RefreshCw size={12} className={isCapturing ? "animate-spin" : ""} />
                          Retake
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isSubmitting}
                          className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 hover:underline"
                        >
                          <Upload size={12} />
                          Upload file
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </div>
                    </div>

                    <div className="relative border border-slate-200 rounded-xl overflow-hidden bg-slate-900 min-h-[160px] flex items-center justify-center">
                      {isCapturing ? (
                        <div className="text-center p-6 text-slate-400 flex flex-col items-center gap-2">
                          <Loader2 size={24} className="animate-spin text-blue-500" />
                          <span className="text-xs">Capturing active screen...</span>
                        </div>
                      ) : screenshotDataUrl ? (
                        <img
                          src={screenshotDataUrl}
                          alt="Issue screenshot"
                          className="w-full max-h-48 object-contain bg-slate-950"
                        />
                      ) : (
                        <div className="text-center p-6 text-slate-500 text-xs">
                          No screenshot available. Click Retake or Upload file.
                        </div>
                      )}
                      {manualFile && (
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/75 text-white text-[10px] rounded">
                          Uploaded: {manualFile.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      What went wrong? <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what happened, what you expected, or any steps to reproduce the problem..."
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 placeholder:text-slate-400 resize-none"
                      disabled={isSubmitting}
                      required
                    />
                    <div className="flex justify-between items-center mt-1 text-[11px] text-slate-400">
                      <span>URL: {window.location.pathname}</span>
                      <span>{description.length}/2000</span>
                    </div>
                  </div>

                  {/* Guest email input (only if not logged in) */}
                  {!user && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Your Email <span className="text-slate-400 font-normal">(optional — to receive triage updates)</span>
                      </label>
                      <input
                        type="email"
                        value={guestEmail}
                        onChange={(e) => setGuestEmail(e.target.value)}
                        placeholder="name@example.com"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 placeholder:text-slate-400"
                        disabled={isSubmitting}
                      />
                    </div>
                  )}

                  {/* Submit buttons & cold-start indicator */}
                  {submitStatusText && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2 animate-pulse">
                      <Loader2 size={14} className="animate-spin text-amber-600 shrink-0" />
                      <span>{submitStatusText}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || isCapturing || description.trim().length < 5}
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Report"
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
