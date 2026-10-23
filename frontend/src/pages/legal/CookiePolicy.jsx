import LegalLayout from "../../Components/LegalLayout";

function CookiePolicy() {
  return (
    <LegalLayout title="Cookie & Storage Policy">
      <p className="effective-date">Last reviewed: October 23, 2026</p>
      <p>SkillBridge uses browser storage for authentication, account state, and remembering your response to the privacy banner. This policy describes the storage keys currently used by the application. Browser storage can change as features change.</p>

      <h2>1. How browser storage is used</h2>
      <p>SkillBridge saves a small amount of information in your browser to keep you signed in, display your account information, and remember your choice on the privacy banner. Sign-in information is stored in browser storage and an HTTP-only cookie. Account display information and your banner choice are stored in your browser so they remain available as you use the site.</p>
      <p>You can clear this information through your browser settings. Clearing sign-in information will sign you out; clearing other saved information may reset the account display or cause the privacy banner to appear again.</p>

      <h2>2. Optional tracking</h2>
      <p>The application code currently does not configure analytics or advertising trackers. The banner stores whether you selected “Accept All” or “Essential Only”; at present, that choice does not enable or disable separate analytics technologies.</p>

      <h2>3. Managing storage</h2>
      <p>You can clear this site's cookies and local storage in your browser settings. Blocking storage may prevent account features from working.</p>

      <h2>4. Contact</h2>
      <p>Questions about browser storage can be sent to <a href="mailto:skillbridge684@gmail.com" className="text-blue-600 hover:underline">skillbridge684@gmail.com</a>.</p>
    </LegalLayout>
  );
}

export default CookiePolicy;
