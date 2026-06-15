import LegalLayout from "../Components/LegalLayout";

function Security() {
  return (
    <LegalLayout title="Security Practices">
      <p className="effective-date">Last Updated: June 15, 2026</p>
      
      <p>
        Safeguarding the data profiles, professional resumes, and contact indices entrusted 
        to our ecosystem is SkillBridge's absolute priority. We maintain strict, multi-layered 
        operational security protocols across all infrastructure planes.
      </p>

      <h2>1. End-to-End Cryptographic Protection</h2>
      <p>
        All communications routed across our network are encrypted using Transport Layer Security (TLS 1.3). 
        Additionally, sensitive personal data assets stored within our production databases are secured 
        using industry-standard Advanced Encryption Standard (AES-256) wrappers at rest.
      </p>

      <h2>2. Infrastructure Hardening & Monitoring</h2>
      <p>Our server architectures are isolated within hardened, audited cloud server frames:</p>
      <ul>
        <li>Continuous real-time activity scanning networks flag anomalous request streams immediately.</li>
        <li>Automated edge defensive routing dynamically limits exposure to brute-force threats or DDoS strikes.</li>
        <li>Production environments undergo scheduled, independent diagnostic penetration checks to identify structural gaps.</li>
      </ul>

      <h2>3. User Access Control Guidelines</h2>
      <p>
        While our platform safeguards core infrastructure lines, application integrity requires proactive 
        account safety habits. Never share authentication credentials, use complex personal passwords, 
        and log out completely when operating on public or shared workstations.
      </p>
    </LegalLayout>
  );
}

export default Security;