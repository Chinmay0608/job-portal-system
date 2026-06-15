import LegalLayout from "../components/LegalLayout";

function CookiePolicy() {
  return (
    <LegalLayout title="Cookie Policy">
      <section>
        <h2>
          1. What Are Cookies?
        </h2>

        <p>
          Cookies are small text files
          stored on your device to help
          websites function properly
          and improve user experience.
        </p>
      </section>

      <section>
        <h2>
          2. How We Use Cookies
        </h2>

        <p>
          SkillBridge uses cookies to
          remember preferences, improve
          performance, and analyze user
          behavior for better service.
        </p>
      </section>

      <section>
        <h2>
          3. Managing Cookies
        </h2>

        <p>
          You may disable cookies
          through your browser
          settings, but some features
          of the platform may not work
          properly.
        </p>
      </section>
    </LegalLayout>
  );
}

export default CookiePolicy;