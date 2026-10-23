import LegalLayout from "../../Components/LegalLayout";

function TermsOfUse() {
  return (
    <LegalLayout title="Terms of Use">
      <p className="effective-date">
        Last reviewed: October 23, 2026
      </p>

      <section>
        <h2>1. Acceptance of Agreement</h2>
        <p>
          Welcome to SkillBridge. By creating an account, accessing, or using our job search platform, candidate discovery engine, recruiter dashboard, or API services (collectively, the "Platform"), you enter into a legally binding agreement with SkillBridge ("we," "us," or "our") and agree to comply with these Terms of Use ("Terms"). If you do not agree to these Terms, you must immediately cease all access and use of the Platform.
        </p>
      </section>

      <section>
        <h2>2. User Eligibility & Account Registration</h2>
        <p>
          The Platform is intended exclusively for individuals seeking employment ("Candidates") and corporate employers or authorized recruitment professionals seeking to hire talent ("Recruiters").
        </p>
        <ul>
          <li><strong>Age Requirement:</strong> You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to register an account.</li>
          <li><strong>Account Integrity:</strong> You agree to provide accurate, current, and complete information during registration and maintain the confidentiality of your login credentials. You are fully responsible for all activities occurring under your account.</li>
          <li><strong>Non-Transferability:</strong> Accounts are non-transferable and may not be shared, sold, or assigned to third parties without prior written consent from SkillBridge.</li>
        </ul>
      </section>

      <section>
        <h2>3. Candidate Obligations & Application Rules</h2>
        <p>
          As a Candidate on SkillBridge, you agree to uphold professional standards when interacting with employers:
        </p>
        <ul>
          <li><strong>Truthful Information:</strong> All information contained within your profile, resume, work history, skill tags, and application submissions must be authentic, accurate, and unmisleading.</li>
          <li><strong>No Automated Bot Applications:</strong> Applications must be submitted directly by you or through authorized candidate workflows. The use of unauthorized automated scripts, application bots, or spam submitters is strictly prohibited.</li>
          <li><strong>Professional Conduct:</strong> You agree to communicate respectfully with recruiters and hiring managers via our messaging tools and refrain from harassing, abusive, or deceptive behavior.</li>
        </ul>
      </section>

      <section>
        <h2>4. Recruiter Obligations & Job Posting Guidelines</h2>
        <p>
          Recruiters and corporate hiring managers using SkillBridge to publish job requisitions and evaluate candidates must comply with the following hiring standards:
        </p>
        <ul>
          <li><strong>Genuine Open Requisitions:</strong> All posted job listings must represent genuine, active employment opportunities with clear job responsibilities and accurate compensation parameters.</li>
          <li><strong>Equal Opportunity & Non-Discrimination:</strong> Job postings and candidate evaluations must comply with applicable employment laws and non-discrimination regulations (e.g., EEO compliance). Discriminatory requirements based on race, gender, religion, age, disability, or national origin are strictly prohibited.</li>
          <li><strong>Prohibited Listings:</strong> Deceptive job ads, multi-level marketing (MLM) schemes, positions requiring candidates to pay upfront fees, or illegal solicitations are banned and subject to immediate removal and account termination.</li>
        </ul>
      </section>

      <section>
        <h2>5. AI Features & Algorithmic Recommendation Disclaimer</h2>
        <p>
          SkillBridge uses automated matching and recommendation features, and may use configured AI services for resume parsing or job description assistance. These features can produce incomplete or inaccurate results:
        </p>
        <ul>
          <li>AI-generated match scores, automated summaries, and job recommendations serve purely as decision-support tools and do not guarantee interview invitations or employment offers.</li>
          <li>Hiring decisions remain the sole responsibility of the respective Recruiter and Candidate. SkillBridge does not participate in or guarantee contractual employment terms.</li>
        </ul>
      </section>

      <section>
        <h2>6. Prohibited Activities & Anti-Scraping Rules</h2>
        <p>
          You agree not to engage in any of the following prohibited actions while accessing the Platform:
        </p>
        <ul>
          <li><strong>Unauthorized Scraping:</strong> Using automated crawlers, bots, scrapers, or data-mining tools to extract candidate profiles, resumes, job listings, or site data without explicit API authorization.</li>
          <li><strong>Security Interference:</strong> Attempting to probe, scan, or test the vulnerability of our systems, bypass authentication mechanisms, or launch denial-of-service attacks.</li>
          <li><strong>Spam & Unsolicited Outreach:</strong> Utilizing candidate data or recruiter contact information for commercial spam, mass unsolicited marketing, or non-hiring solicitations.</li>
        </ul>
      </section>

      <section>
        <h2>7. Intellectual Property Rights</h2>
        <p>
          SkillBridge and its licensors retain rights they hold in the Platform's software, branding, graphics, and interface. These Terms do not transfer those rights to users. The service operator's legal identity should be provided in a formal publication of these Terms.
        </p>
        <p>
          <strong>User Content:</strong> You retain any rights you hold in resumes, profile information, job descriptions, and other content you submit. You authorize SkillBridge to host, display, and process that content as needed to provide the features you use, including showing an application to its relevant recruiter and processing a resume when you request parsing. This permission ends when the content is removed, subject to copies retained for operational or legal reasons.
        </p>
      </section>

      <section>
        <h2>8. Limitation of Liability & Warranty Disclaimer</h2>
        <p>
          THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. SKILLBRIDGE DISCLAIMS ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>
        <p>
          SKILLBRIDGE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR PUNITIVE DAMAGES, OR FOR ANY LOSS OF PROFITS, DATA, OR GOODWILL ARISING FROM YOUR USE OF OR INABILITY TO USE THE PLATFORM, UNVERIFIED RECRUITER POSTINGS, OR OFF-PLATFORM EMPLOYMENT DISPUTES.
        </p>
      </section>

      <section>
        <h2>9. Account Termination & Suspension</h2>
        <p>
          SkillBridge reserves the right, in its sole discretion, to suspend, restrict, or terminate user accounts immediately and without prior notice in cases of policy violations, fraudulent listings, abusive conduct, or security threats.
        </p>
      </section>

      <section>
        <h2>10. Governing Law & Legal Support</h2>
        <p>
          The service operator's legal entity, governing law, and dispute venue have not been specified in the application materials available for this review. Nothing in these Terms limits rights that cannot lawfully be limited. Contact the address below for legal inquiries.
        </p>
        <p>
          For legal inquiries, dispute notifications, or questions regarding these Terms of Use, please contact:
        </p>
        <p>
          <strong>Legal Department:</strong> <a href="https://mail.google.com/mail/?view=cm&fs=1&to=skillbridge684@gmail.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">skillbridge684@gmail.com</a>
        </p>
      </section>
    </LegalLayout>
  );
}

export default TermsOfUse;
