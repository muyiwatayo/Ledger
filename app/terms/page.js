import LegalPage from "../../components/LegalPage";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <section>
        <h2>Using Ledger</h2>
        <p>
          Ledger helps you record personal expenses, set budgets, review
          spending, and manage reminders for recurring expenses. By creating an
          account or using the service, you agree to these terms.
        </p>
      </section>
      <section>
        <h2>Your account and information</h2>
        <p>
          Keep your sign-in details secure and provide accurate information.
          You are responsible for activity carried out through your account.
          Only add information you are entitled to store.
        </p>
      </section>
      <section>
        <h2>Personal finance information</h2>
        <p>
          Ledger is a record-keeping tool, not a bank, financial adviser, tax
          adviser, or accounting service. Budgets, summaries, and reminders are
          provided for your personal reference. Check your records before
          relying on them to make financial decisions.
        </p>
      </section>
      <section>
        <h2>Acceptable use</h2>
        <p>
          Do not misuse Ledger, interfere with its operation, attempt
          unauthorized access, or use it in a way that violates applicable law
          or another person&apos;s rights.
        </p>
      </section>
      <section>
        <h2>Availability and changes</h2>
        <p>
          We work to keep Ledger available, but access may sometimes be
          interrupted for maintenance or other reasons. Features and these
          terms may change as the service develops. The current terms will be
          published on this page.
        </p>
      </section>
      <section>
        <h2>Contact</h2>
        <p>
          Questions about these terms? Contact Ledger on WhatsApp at{" "}
          <a href="https://wa.me/2349081416637">09081416637</a>.
        </p>
      </section>
    </LegalPage>
  );
}
