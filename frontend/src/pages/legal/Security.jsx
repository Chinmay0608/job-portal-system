import LegalLayout from "../../Components/LegalLayout";

function Security() {
  return (
    <LegalLayout title="Security Overview">
      <p className="effective-date">Last reviewed: October 23, 2026</p>
      <p>This page describes security controls visible in the current SkillBridge application. It is not a certification or guarantee that every risk can be prevented.</p>

      <h2>1. Account security</h2>
      <p>Passwords created through the email and password registration flow are hashed with bcrypt before they are stored. Login sessions use signed tokens with a five-day expiry. The server sets an HTTP-only authentication cookie, and the browser application also stores the token in localStorage to authorize API requests.</p>

      <h2>2. Access controls</h2>
      <p>Authenticated routes and role checks restrict access to account and recruiter features. Application resumes are made available to the candidate and the recruiter for the relevant job through an authorized route; the generated Cloudinary link expires after one hour.</p>

      <h2>3. Uploaded files and external services</h2>
      <p>Resumes and profile images are uploaded to the configured Cloudinary account. Resume parsing may send extracted resume text to configured AI providers. As with any external provider, information processed there is also subject to that provider's service terms and security practices.</p>

      <h2>4. Application protections</h2>
      <p>The server uses Helmet security headers and rate limits authentication attempts. These measures reduce some risks but do not eliminate the possibility of unauthorized access, service interruption, or data loss.</p>

      <h2>5. Report a security issue</h2>
      <p>If you believe you have found a security issue, please email <a href="mailto:skillbridge684@gmail.com" className="text-blue-600 hover:underline">skillbridge684@gmail.com</a> with a description and steps to reproduce it. Please avoid accessing, changing, or sharing other users' information while investigating.</p>
    </LegalLayout>
  );
}

export default Security;
