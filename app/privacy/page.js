import LegalPage from "../../components/LegalPage";

export const metadata = { title: "Privacy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy">
      <section>
        <h2>Information Ledger uses</h2>
        <p>
          Ledger processes the email address and account details needed to sign
          you in, along with the expenses, budgets, and recurring reminders you
          choose to save. If you sign in with Google, Google provides account
          information needed to complete sign-in.
        </p>
      </section>
      <section>
        <h2>How information is used</h2>
        <p>
          Your information is used to provide Ledger&apos;s account, expense
          tracking, budgeting, and reminder features. Ledger does not connect to
          your bank account.
        </p>
      </section>
      <section>
        <h2>Storage and service providers</h2>
        <p>
          Account and finance records are stored using Supabase, which provides
          Ledger&apos;s authentication and database services. Your sign-in
          session and appearance preference may also be stored in your browser
          so the app can work and remember your choice.
        </p>
      </section>
      <section>
        <h2>Sharing and retention</h2>
        <p>
          Ledger does not sell your personal information. Information may be
          processed by the service providers needed to operate Ledger, or
          disclosed when required by law. Your records remain associated with
          your account until they are deleted or you request account-data
          removal.
        </p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p>
          You can edit or remove transactions and reminders in the app. To ask
          about your account information or request account-data deletion,
          contact Ledger on WhatsApp at{" "}
          <a href="https://wa.me/2349081416637">09081416637</a>.
        </p>
      </section>
      <section>
        <h2>Updates to this notice</h2>
        <p>
          This notice may be updated when Ledger&apos;s features or data
          practices change. The latest version and its effective date will
          appear on this page.
        </p>
      </section>
    </LegalPage>
  );
}
