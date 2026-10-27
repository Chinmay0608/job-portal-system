import LegalLayout from "../../Components/LegalLayout";

function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy">
      <p className="effective-date">Last reviewed: October 23, 2026</p>
      <p>
        This policy explains how SkillBridge handles information when you use the job search, candidate, recruiter, and support features. The legal entity responsible for the service has not been identified in the information available in this application. For privacy questions or requests, contact <a href="mailto:skillbridge684@gmail.com" className="text-blue-600 hover:underline">skillbridge684@gmail.com</a>.
      </p>

      <h2>1. Information you provide</h2>
      <p>Depending on how you use SkillBridge, this can include your name, email, password, role, phone number, location and country; candidate profile details such as skills, education, experience, links and resume; recruiter profile and company details; job postings and applications; saved jobs; messages; and information in support reports.</p>
      <p>If you upload a resume and use automatic resume parsing, resume text may be sent to configured AI providers to extract profile fields. Do not upload information you are not comfortable sharing for this purpose.</p>

      <h2>2. How we use information</h2>
      <ul>
        <li>Create and secure accounts, authenticate users, and provide role-specific features.</li>
        <li>Maintain candidate profiles, job listings, saved jobs, applications, and job recommendations.</li>
        <li>Deliver messages, notifications, support, and troubleshooting.</li>
        <li>Parse resumes and generate or improve job descriptions when you use those features.</li>
        <li>Protect the service, investigate abuse, and meet legal obligations.</li>
      </ul>

      <h2>3. When information is shared</h2>
      <p>When you apply for a job, application information and your resume are made available to the recruiter for that job. Some listings link to an external employer or job source; their site and privacy policy apply after you leave SkillBridge.</p>
      <p>SkillBridge uses service providers configured for the application, including database, file storage, authentication, email, and AI services. Information is sent to a provider when needed for the feature you use—for example, a resume may be processed by an AI provider when parsing is requested. When you use voice dictation, recorded audio is sent to ElevenLabs for transcription. Support reports may be sent to the configured Telegram support channel. Providers process information under their own terms and applicable arrangements.</p>
      <p>We do not knowingly sell personal information. We may disclose information where required by law or to protect users, the service, or legal rights.</p>

      <h2>4. Storage and retention</h2>
      <p>Account and application data is stored in the service database; uploaded resumes and profile images use the configured file-storage provider. We keep information while needed to provide the service and for legitimate operational or legal needs. Signed-in users can request account deletion from their profile, verify the request using a code sent to their account email, and receive an administrator decision by email. If you cannot access your account, email us to request access, correction, or deletion. We will review requests under applicable law and explain any information that must be retained.</p>

      <h2>5. Your choices and rights</h2>
      <p>You can edit supported profile information in your account and control available notification preferences. Depending on where you live, privacy laws may give you additional rights, such as access, correction, deletion, portability, or objection. Contact us to make a request. We may need to verify your identity before responding.</p>

      <h2>6. International processing</h2>
      <p>Our service providers may process information in countries other than your own. The application does not identify a single hosting region. Where required, transfers are handled under applicable data protection law.</p>

      <h2>7. Children</h2>
      <p>SkillBridge is intended for people seeking or providing employment services and is not directed to children. Please do not create an account if you are not legally permitted to use the service in your location.</p>

      <h2>8. Changes</h2>
      <p>We may revise this policy as the service or its data practices change. The review date above indicates the latest revision. Material changes will be communicated through the service where practicable.</p>
    </LegalLayout>
  );
}

export default PrivacyPolicy;
