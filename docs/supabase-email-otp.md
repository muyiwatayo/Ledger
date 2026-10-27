# Supabase email OTP setup

Ledger uses Supabase Auth to create accounts, generate and verify one-time
codes, and manage sessions. The Next.js app does not generate OTPs or store
passwords itself.

## Configure a no-reply sender

1. Verify a sending domain with an SMTP email provider and set up its required
   DNS records (such as SPF and DKIM).
2. In the Supabase project, open **Authentication → SMTP Settings** and enable
   custom SMTP. Enter the provider's SMTP host, port, username, and password.
   Set the sender name to `Ledger` and the sender email to a verified
   no-reply address on your domain, such as `no-reply@yourdomain.com`.
3. Keep SMTP credentials in the Supabase dashboard or provider secret store.
   Do not add them to client code, `NEXT_PUBLIC_*` environment variables, or
   this repository.
4. In **Authentication → Email Templates**, set both **Confirm signup** and
   **Magic Link** email templates to display the one-time code with
   `{{ .Token }}`. For example:

   ```html
   <h2>Your Ledger verification code</h2>
   <p>Enter this code in Ledger to continue:</p>
   <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px">{{ .Token }}</p>
   <p>This code expires soon. If you did not request it, you can ignore this email.</p>
   ```

5. In **Authentication → URL Configuration**, set the production site URL and
   any local development redirect URLs that you use.
6. Confirm email verification is enabled, then test sign-up, code resend,
   code verification, and email sign-in from the deployed site.

Supabase Auth creates the pending account at sign-up and marks its email
verified only after a valid code is submitted. The SMTP provider sends the
message; Nodemailer is not needed in this Supabase-managed flow.
