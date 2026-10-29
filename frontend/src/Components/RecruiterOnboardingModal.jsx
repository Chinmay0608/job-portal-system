import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ImagePlus, Upload } from "lucide-react";
import { completeRecruiterOnboardingAPI } from "../Services/jobService";

const detectTimeZone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; }
  catch { return "UTC"; }
};

const normalizeWebsite = (value) => {
  const input = value.trim();
  if (!input) throw new Error("Company website is required.");
  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    if (!/^https?:$/.test(url.protocol) || !url.hostname.includes(".")) throw new Error();
    return url.toString();
  } catch {
    throw new Error("Enter a valid website, such as https://example.com.");
  }
};

export default function RecruiterOnboardingModal({ user, onComplete, onSkip }) {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState(user?.companyName || "");
  const [companyWebsite, setCompanyWebsite] = useState(user?.companyWebsite || "");
  const [designation, setDesignation] = useState(user?.designation || "");
  const [logo, setLogo] = useState(null);
  const [preview, setPreview] = useState("");
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!logo) { setPreview(""); return undefined; }
    const objectUrl = URL.createObjectURL(logo);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [logo]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  const selectLogo = (file) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP logo.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Logo must be smaller than 5 MB.");
      return;
    }
    setError("");
    setLogo(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!companyName.trim()) return setError("Company name is required.");
    if (!designation.trim()) return setError("Your designation is required.");

    let website;
    try { website = normalizeWebsite(companyWebsite); }
    catch (validationError) { setError(validationError.message); return; }

    const payload = new FormData();
    payload.append("companyName", companyName.trim());
    payload.append("companyWebsite", website);
    payload.append("designation", designation.trim());
    payload.append("timeZone", detectTimeZone());
    if (logo) payload.append("companyLogo", logo);

    try {
      setSaving(true);
      const response = await completeRecruiterOnboardingAPI(payload);
      const updatedUser = { ...user, ...response.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      onComplete?.(updatedUser);
      navigate("/jobs/create");
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Could not save your details. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    setError("");
    try {
      setSkipping(true);
      const response = await completeRecruiterOnboardingAPI({ skip: true, timeZone: detectTimeZone() });
      const updatedUser = { ...user, ...response.user };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      onSkip?.(updatedUser);
      navigate("/recruiter-dashboard", { state: { showRecruiterOnboardingReminder: true } });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Could not save your preference. Please try again.");
    } finally {
      setSkipping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1500] grid place-items-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-labelledby="recruiter-onboarding-title" className="w-full max-w-xl overflow-hidden rounded-3xl border border-[#eadcc7] bg-[#fffdfa] shadow-2xl">
        <header className="border-b border-[#eee1d0] bg-[#fff7eb] px-6 py-5 sm:px-8">
          <span className="mb-2 inline-flex items-center gap-2 text-[10px] font-extrabold tracking-[0.14em] text-[#a9592d]"><Building2 size={14} /> RECRUITER SETUP</span>
          <h2 id="recruiter-onboarding-title" className="m-0 font-serif text-2xl font-semibold text-[#30271f]">Let’s set up your company</h2>
          <p className="mb-0 mt-1 text-sm text-[#746555]">A few details help candidates recognize your team.</p>
          {(user?.name || user?.email) && <p className="mb-0 mt-3 text-xs font-medium text-[#857565]">{[user?.name, user?.email].filter(Boolean).join(" · ")}</p>}
        </header>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5 sm:px-8 sm:py-6">
          <div>
            <label htmlFor="recruiter-onboarding-logo" className="mb-1.5 block text-xs font-bold text-[#493b2e]">Company logo <span className="font-normal text-[#857565]">(optional)</span></label>
            <label
              htmlFor="recruiter-onboarding-logo"
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => { event.preventDefault(); setDragging(false); selectLogo(event.dataTransfer.files?.[0]); }}
              className={`flex min-h-24 cursor-pointer items-center gap-4 rounded-2xl border border-dashed p-4 transition ${dragging ? "border-[#a9592d] bg-[#fff2df]" : "border-[#d9c4a8] bg-[#fffaf2] hover:bg-[#fff5e7]"}`}
            >
              <span className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#eadcc7] bg-white text-[#a9592d]">
                {preview ? <img src={preview} alt="Company logo preview" className="h-full w-full object-contain" /> : <ImagePlus size={23} />}
              </span>
              <span className="grid gap-1 text-left"><strong className="text-sm text-[#30271f]">{logo ? logo.name : "Drop your logo here or browse"}</strong><small className="text-xs text-[#857565]">PNG, JPG, or WebP · Up to 5 MB</small></span>
              <input id="recruiter-onboarding-logo" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => selectLogo(event.target.files?.[0])} />
            </label>
          </div>

          <label className="block text-xs font-bold text-[#493b2e]">Company name <span className="text-[#b94e35]">*</span>
            <input required autoComplete="organization" value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder="e.g., Acme Technologies" className="mt-1.5 min-h-11 w-full rounded-xl border border-[#e5d6c2] bg-white px-3.5 text-sm font-normal text-[#30271f] outline-none placeholder:text-[#9b8874] focus:border-[#b96d3c] focus:ring-2 focus:ring-[#a9592d]/15" />
          </label>

          <label className="block text-xs font-bold text-[#493b2e]">Company website <span className="text-[#b94e35]">*</span>
            <input required type="url" autoComplete="url" value={companyWebsite} onChange={(event) => setCompanyWebsite(event.target.value)} placeholder="https://example.com" className="mt-1.5 min-h-11 w-full rounded-xl border border-[#e5d6c2] bg-white px-3.5 text-sm font-normal text-[#30271f] outline-none placeholder:text-[#9b8874] focus:border-[#b96d3c] focus:ring-2 focus:ring-[#a9592d]/15" />
          </label>

          <label className="block text-xs font-bold text-[#493b2e]">Your designation <span className="text-[#b94e35]">*</span>
            <input required autoComplete="organization-title" value={designation} onChange={(event) => setDesignation(event.target.value)} placeholder="e.g., Talent Acquisition Lead, Founder, Tech Recruiter" className="mt-1.5 min-h-11 w-full rounded-xl border border-[#e5d6c2] bg-white px-3.5 text-sm font-normal text-[#30271f] outline-none placeholder:text-[#9b8874] focus:border-[#b96d3c] focus:ring-2 focus:ring-[#a9592d]/15" />
          </label>

          {error && <p role="alert" className="m-0 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</p>}

          <div className="flex flex-col-reverse items-center justify-between gap-3 pt-2 sm:flex-row">
            <button type="button" onClick={handleSkip} disabled={saving || skipping} className="border-0 bg-transparent px-2 py-2 text-xs font-semibold text-[#857565] underline-offset-4 hover:text-[#8f4a24] hover:underline disabled:opacity-50">{skipping ? "Saving..." : "Skip to Dashboard"}</button>
            <button type="submit" disabled={saving || skipping} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-0 bg-[#a9592d] px-5 text-sm font-bold text-white shadow-md shadow-[#a9592d]/20 transition hover:bg-[#8f4a24] disabled:cursor-wait disabled:opacity-60 sm:w-auto">
              <Upload size={16} /> {saving ? "Saving details..." : "Save & Post Your First Job"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
