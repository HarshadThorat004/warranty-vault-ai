import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import AuthShell, { AuthBrandMark } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Privacy Policy — Warranty Vault AI",
  description: "Privacy Policy for Warranty Vault AI",
};

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-white">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-white/55">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <AuthShell wide>
      <div className="text-center">
        <AuthBrandMark />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-white/40">
          Last updated: September 2, 2026
        </p>
      </div>

      <div className="mt-10 space-y-8">
        <p className="text-sm leading-7 text-white/55">
          This Privacy Policy explains how Warranty Vault AI (&quot;we,&quot;
          &quot;us&quot;) collects, uses, stores, and shares information when
          you use our website and application at warrantyvault.in (the
          &quot;Service&quot;). By using the Service, you acknowledge this
          Policy.
        </p>
        <p className="text-sm leading-7 text-white/40">
          This document is a practical startup template and is not legal advice.
          Privacy requirements can vary; consult counsel for your situation.
        </p>

        <Section title="1. Who this applies to">
          <p>
            This Policy applies to users of Warranty Vault AI, primarily
            individuals who store product warranties, receipts, and related
            documents and who may receive expiry reminders. Our intended audience
            includes users in India and elsewhere who choose to use the Service.
          </p>
          <p>
            Contact:{" "}
            <a
              href="mailto:warrantyvault.in@gmail.com"
              className="text-white/80 underline decoration-white/25 underline-offset-2"
            >
              warrantyvault.in@gmail.com
            </a>
            .
          </p>
        </Section>

        <Section title="2. Information we collect">
          <p>
            <strong className="font-medium text-white/80">Account information.</strong>{" "}
            Name, email address, authentication identifiers, and password hashes
            (if you use email/password). If you sign in with Google, we receive
            basic profile information Google shares with us (such as name, email,
            and profile image, depending on your Google settings).
          </p>
          <p>
            <strong className="font-medium text-white/80">User content.</strong>{" "}
            Product and warranty details you enter, notes, reminder preferences,
            and files you upload (for example invoices, warranty cards, and
            receipts) via our storage providers.
          </p>
          <p>
            <strong className="font-medium text-white/80">Technical data.</strong>{" "}
            Approximate usage logs such as IP address, device/browser type,
            timestamps, and error diagnostics needed to operate and secure the
            Service.
          </p>
          <p>
            <strong className="font-medium text-white/80">Communications.</strong>{" "}
            Content of support emails you send us, and records related to OTP or
            reminder emails we send you.
          </p>
        </Section>

        <Section title="3. How we use information">
          <ul className="list-disc space-y-1 pl-5">
            <li>Create and manage your account and authenticate you</li>
            <li>Store and display your warranty vault and related documents</li>
            <li>
              Extract product fields from invoices and warranty cards you
              choose to scan, so we can autofill your vault form
            </li>
            <li>
              Send transactional emails such as sign-in codes and warranty expiry
              reminders you enable, and browser push alerts if you turn them on
              in Settings
            </li>
            <li>Maintain security, prevent abuse, and troubleshoot issues</li>
            <li>Improve the Service and comply with legal obligations</li>
          </ul>
          <p>
            We do not sell your personal information. Scans are used only to
            operate the vault features you request. We do not use your warranty
            documents to train public AI models.
          </p>
        </Section>

        <Section title="4. How document scanning works">
          <p>
            When you scan an invoice or warranty card, we try to read fields
            such as invoice number, date, amount, serial or IMEI, and brand.
            Printed GST e-invoice QR codes may be decoded first because they
            already contain structured tax data.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Photo scans usually run in your browser (on-device OCR). The
              image still goes to our storage if you save the product.
            </li>
            <li>
              PDF invoices are parsed on our servers because browsers cannot
              reliably extract that text.
            </li>
            <li>
              Optional cloud AI extraction is off unless we enable it for the
              Service. When off, we do not send document images to a
              third-party model.
            </li>
          </ul>
          <p>
            An invoice may contain extra personal data (billing address, phone,
            GSTIN). We keep that only as part of the file you uploaded. We do
            not copy GSTIN into a separate product field.
          </p>
        </Section>

        <Section title="5. How we share information">
          <p>
            We share information with service providers who process data on our
            behalf to run the Service, including:
          </p>
          <p>
            If you join a household vault, members of that household can see
            the shared products, documents, and reminder status. Invite only
            people you trust. Leaving the household or deleting your account
            does not wipe other members&apos; copies of the shared vault.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Google — OAuth sign-in</li>
            <li>Resend — OTP and reminder email delivery</li>
            <li>UploadThing — file uploads and storage</li>
            <li>Hosting and infrastructure providers (for example Vercel)</li>
            <li>Postgres/database hosting for application data</li>
            <li>
              Optional AI/OCR providers (for example Google Gemini) only if
              cloud extraction is enabled for the Service
            </li>
          </ul>
          <p>
            We may also disclose information if required by law, to protect
            rights and safety, or in connection with a merger, acquisition, or
            reorganization, subject to appropriate safeguards.
          </p>
        </Section>

        <Section title="6. Cookies and similar technologies">
          <p>
            We use cookies and similar technologies as needed for authentication
            sessions, security, and basic Service functionality. You can control
            cookies through your browser settings; disabling essential cookies may
            prevent sign-in from working.
          </p>
        </Section>

        <Section title="7. Data retention">
          <p>
            We keep your account, product records, and uploaded files while
            your account is active. Deleting a product removes that product and
            its files. Deleting your account from Settings removes the account
            and, if you are the last person in the vault, its products and
            files. If you share a household vault, deleting your account leaves
            household products with remaining members.
          </p>
          <p>
            We may retain limited records after deletion where required for
            security, dispute resolution, backups, or legal compliance, for a
            reasonable period, then they fall out of backups.
          </p>
        </Section>

        <Section title="8. Security">
          <p>
            We take reasonable technical and organizational measures to protect
            personal data (such as encrypted transport, access controls, and
            hashed passwords for credential accounts). No method of transmission
            or storage is completely secure; please use a strong unique password
            and protect access to your email for OTP sign-in.
          </p>
        </Section>

        <Section title="9. International processing">
          <p>
            Our providers may process data in India and other countries. By using
            the Service, you understand that your information may be transferred
            to and processed in locations that may have different data-protection
            laws than your home jurisdiction.
          </p>
        </Section>

        <Section title="10. Children">
          <p>
            The Service is intended for users aged 18 and older. We do not
            knowingly collect personal information from children. If you believe
            a minor has provided us data, contact us and we will take appropriate
            steps to delete it.
          </p>
        </Section>

        <Section title="11. Your choices and rights">
          <p>
            If you are in India, you are a Data Principal under the Digital
            Personal Data Protection Act, 2023. You can access and correct
            product details in the app, download a CSV of your vault, and erase
            your account and files from Settings. You may also email{" "}
            <a
              href="mailto:warrantyvault.in@gmail.com"
              className="text-white/80 underline decoration-white/25 underline-offset-2"
            >
              warrantyvault.in@gmail.com
            </a>
            . We may need to verify your identity before acting on email
            requests.
          </p>
          <p>
            This description is how the product works today. It is not legal
            advice and does not replace a formal DPDP notice from counsel.
          </p>
          <p>
            Reminder emails are sent because you use expiry tracking. To stop
            them, delete the product or the account. Transactional messages
            required for security (such as OTP codes) may still be sent when
            you use those features.
          </p>
        </Section>

        <Section title="12. Changes">
          <p>
            We may update this Privacy Policy periodically. We will post the
            revised version with an updated &quot;Last updated&quot; date.
            Material changes may be communicated by email or in-product notice
            when appropriate.
          </p>
        </Section>

        <Section title="13. Contact">
          <p>
            Privacy questions or requests:{" "}
            <a
              href="mailto:warrantyvault.in@gmail.com"
              className="text-white/80 underline decoration-white/25 underline-offset-2"
            >
              warrantyvault.in@gmail.com
            </a>
            .
          </p>
        </Section>
      </div>

      <p className="mt-12 text-center text-sm text-white/40">
        <Link href="/login" className="underline underline-offset-2 hover:text-white/70">
          Back to log in
        </Link>
        <span className="mx-2 text-white/20">·</span>
        <Link href="/terms" className="underline underline-offset-2 hover:text-white/70">
          Terms of Service
        </Link>
      </p>
    </AuthShell>
  );
}
