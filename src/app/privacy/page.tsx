import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import AuthShell, { AuthBrandMark } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Privacy Policy — Warranty Vault AI",
  description:
    "Privacy Policy for Warranty Vault AI, including DPDP 2023 rights, document scanning, email-forward, and household vaults.",
};

const CONTACT = "warrantyvault.in@gmail.com";

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

function MailLink() {
  return (
    <a
      href={`mailto:${CONTACT}`}
      className="text-white/80 underline decoration-white/25 underline-offset-2"
    >
      {CONTACT}
    </a>
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
          Last updated: September 3, 2026
        </p>
      </div>

      <div className="mt-10 space-y-8">
        <p className="text-sm leading-7 text-white/55">
          This Privacy Policy is the notice of how Warranty Vault AI
          (&quot;we,&quot; &quot;us,&quot; the Data Fiduciary) collects, uses,
          stores, and shares personal data when you use warrantyvault.in (the
          &quot;Service&quot;). It should be read with our{" "}
          <Link
            href="/terms"
            className="text-white/80 underline decoration-white/25 underline-offset-2"
          >
            Terms of Service
          </Link>
          . By creating an account or using the Service, you acknowledge this
          notice.
        </p>
        <p className="text-sm leading-7 text-white/40">
          This document is a practical startup template for an India-first
          product. It is not legal advice and is not a substitute for a
          counsel-drafted Digital Personal Data Protection Act, 2023
          (&quot;DPDP Act&quot;) notice.
        </p>

        <Section title="1. Who we are">
          <p>
            We operate a personal warranty vault: you store invoices and cover
            dates, we help you organise them and remind you before they lapse.
            Contact / grievance: <MailLink />.
          </p>
          <p>
            This Policy applies to people who create an account or otherwise
            use the Service, mainly individuals in India and others who choose
            to use it. It does not apply to websites we link to or to
            manufacturers and marketplaces whose invoices you upload.
          </p>
        </Section>

        <Section title="2. Information we collect">
          <p>
            <strong className="font-medium text-white/80">Account.</strong>{" "}
            Name, email, authentication identifiers, and password hashes if you
            use email/password. Google sign-in gives us the basic profile Google
            shares (typically name, email, and image, depending on your Google
            settings).
          </p>
          <p>
            <strong className="font-medium text-white/80">Vault content.</strong>{" "}
            Product and warranty details you enter, notes, reminder history, and
            files you upload (invoices, warranty cards, photos) via our storage
            provider.
          </p>
          <p>
            <strong className="font-medium text-white/80">Email-forward.</strong>{" "}
            If you use your inbound address, we receive the message sent to that
            address, the sender, subject, and PDF or image attachments. Those
            items are stored as a draft until you review, save, or dismiss them.
            We do not fetch files from links in the email body.
          </p>
          <p>
            <strong className="font-medium text-white/80">Household.</strong>{" "}
            If you join a family vault: member names and emails, invite emails
            you send, roles (owner/member), and the shared products and drafts
            in that vault.
          </p>
          <p>
            <strong className="font-medium text-white/80">Notifications.</strong>{" "}
            Preference that you turned on browser push; a device push endpoint
            and keys if you did. Records of OTP, reminder emails, in-app
            notices, and support mail you send us.
          </p>
          <p>
            <strong className="font-medium text-white/80">Technical.</strong>{" "}
            Approximate logs such as IP address, device or browser type,
            timestamps, and error diagnostics needed to run and secure the
            Service. We use cookies required for sign-in and security.
          </p>
        </Section>

        <Section title="3. Why we use it (purpose limitation)">
          <p>
            We process personal data only to operate the vault features you
            request, not for unrelated profiling or advertising. That includes:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Creating and authenticating your account</li>
            <li>Storing and showing your products and documents</li>
            <li>
              Extracting printed fields (invoice number, date, amount, serial
              or IMEI, brand) so we can autofill a form you still confirm
            </li>
            <li>
              Holding inbound mail as a draft until you decide it should become
              a product — we do not auto-save a live product from a forwarded
              file
            </li>
            <li>
              Sharing the vault with household members you invite
            </li>
            <li>
              Sending OTP codes, expiry reminders (about 30 days, 7 days, last
              day of cover, and related notices), and optional browser push
            </li>
            <li>
              Letting you export CSV or calendar files and download a claim pack
            </li>
            <li>Security, abuse prevention, troubleshooting, and legal duties</li>
          </ul>
          <p>
            We do not sell personal data. We do not use your warranty documents
            to train public AI models. Scans exist only to fill the form you
            asked us to fill.
          </p>
        </Section>

        <Section title="4. How document scanning works">
          <p>
            When you scan an invoice or warranty card — including a forwarded
            PDF — we try to read fields such as invoice number, date, amount,
            serial or IMEI, and brand. Printed GST e-invoice QR codes may be
            decoded first because they already contain structured tax data. We
            prefer to leave a field blank rather than guess a wrong expiry.
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
              Optional cloud AI extraction (for example Google Gemini) is off
              unless we enable it for the Service. When off, we do not send
              document images to a third-party model.
            </li>
          </ul>
          <p>
            An invoice may also show billing address, phone, and GSTIN. Those
            stay inside the file you uploaded. We do not copy GSTIN into a
            separate product field. You are responsible for checking extracted
            values before you rely on them.
          </p>
        </Section>

        <Section title="5. Email-forward inbox">
          <p>
            Settings can show a personal address such as
            ab2dk4xq@inbound.warrantyvault.in. Forward Amazon or Flipkart invoice
            PDFs there. We keep PDF/JPEG/PNG attachments (size-limited) and
            whatever fields the extractor can fill. The result is a draft you
            must review. Dismissing a draft removes it from your pending list;
            saving it attaches the files to a product you confirm.
          </p>
          <p>
            Anyone who obtains the address can send mail to it. Do not post it
            publicly. Inbound mail is processed by Resend and then stored by us.
            We may drop unknown addresses, duplicates, or non-document files.
          </p>
        </Section>

        <Section title="6. Household vaults">
          <p>
            A household is a shared family vault (up to five people, all 18+).
            Members can see shared products, documents, reminder status, and
            inbound drafts. Invite only people you trust. Their email is stored
            so we can send the invite.
          </p>
          <p>
            Leaving the household or deleting your account does not wipe other
            members&apos; copies of the shared vault. If you are the last
            remaining member, deleting your account also deletes that vault&apos;s
            products and files.
          </p>
        </Section>

        <Section title="7. How we share information">
          <p>
            We share data with processors who run the Service on our behalf:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Google — OAuth sign-in</li>
            <li>
              Resend — OTP, reminder email, and optional inbound invoice
              forwarding
            </li>
            <li>UploadThing — file uploads and storage</li>
            <li>Hosting and infrastructure (for example Vercel)</li>
            <li>Postgres / database hosting for application data</li>
            <li>
              Optional AI/OCR providers (for example Google Gemini) only if
              cloud extraction is enabled for the Service
            </li>
          </ul>
          <p>
            Household members you invite can see the shared vault as described
            above. We may also disclose information if required by law, to
            protect rights and safety, or in a merger, acquisition, or
            reorganization, with appropriate safeguards.
          </p>
        </Section>

        <Section title="8. Cookies and similar technologies">
          <p>
            We use cookies and similar storage as needed for authentication
            sessions, security, and basic Service functions. You can control
            cookies in your browser; blocking essential cookies may prevent
            sign-in. We do not use advertising cookies.
          </p>
        </Section>

        <Section title="9. Retention">
          <p>
            We keep your account, product records, inbound drafts, and uploaded
            files while the account is active. Deleting a product removes that
            product and its files. Dismissing an inbound draft removes it from
            your review queue. Deleting your account in Settings removes the
            account and, if you are the last person in the vault, its products
            and files. If you share a household, remaining members keep the
            shared products.
          </p>
          <p>
            We may retain limited records after deletion where needed for
            security, disputes, backups, or legal compliance, then they fall
            out of backups. Push endpoints are stored only for devices you
            enable and are removed when you turn alerts off or delete the
            account.
          </p>
        </Section>

        <Section title="10. Security">
          <p>
            We use reasonable technical and organisational measures (encrypted
            transport, access controls, hashed passwords for credential
            accounts, signed inbound webhooks). No method of transmission or
            storage is completely secure. Use a strong unique password and
            protect the email inbox used for OTP.
          </p>
        </Section>

        <Section title="11. International processing">
          <p>
            Our providers may process data in India and other countries. By
            using the Service you understand that information may be transferred
            to and processed in places with different data-protection laws than
            your home jurisdiction. We remain responsible for personal data we
            share with our processors for the purposes in this Policy.
          </p>
        </Section>

        <Section title="12. Children">
          <p>
            The Service is for users aged 18 and older. We do not knowingly
            collect personal data from children. If you believe a minor has
            provided data, contact us and we will delete it.
          </p>
        </Section>

        <Section title="13. Your rights (DPDP Act)">
          <p>
            If you are in India, you are a Data Principal under the DPDP Act.
            Subject to the Act and verification of your identity, you may:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Access and correct product details in the app, and download a CSV
              of your vault from Settings
            </li>
            <li>
              Erase your account and files from Settings (household products
              stay with remaining members)
            </li>
            <li>
              Withdraw consent for optional features such as browser push by
              turning them off, or for the Service as a whole by deleting the
              account
            </li>
            <li>
              Nominate, in writing to us, another person to exercise rights on
              your behalf in the event of death or incapacity, as the Act allows
            </li>
            <li>
              Raise a grievance with us at <MailLink />
            </li>
          </ul>
          <p>
            Reminder emails are sent because you use expiry tracking. Stop them
            by deleting the product or the account. Transactional messages
            required for security (such as OTP codes) may still be sent when
            you use those features.
          </p>
          <p>
            This description is how the product works today. It is not legal
            advice and does not replace a formal DPDP notice from counsel.
          </p>
        </Section>

        <Section title="14. Grievance redressal">
          <p>
            For privacy questions, correction, erasure, or complaints, email{" "}
            <MailLink />. We will acknowledge and aim to resolve grievances
            within a reasonable period, and in any case within the timelines
            required by applicable law. If you are not satisfied, you may have
            the right to approach the Data Protection Board of India once that
            mechanism is available to you.
          </p>
        </Section>

        <Section title="15. Changes">
          <p>
            We may update this Privacy Policy. We will post the revised version
            with an updated &quot;Last updated&quot; date. Material changes may
            be communicated by email or in-product notice when appropriate.
          </p>
        </Section>

        <Section title="16. Contact">
          <p>
            Privacy and grievance contact: <MailLink />.
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
