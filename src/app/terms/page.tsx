import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import AuthShell, { AuthBrandMark } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Terms of Service — Warranty Vault AI",
  description:
    "Terms of Service for Warranty Vault AI, including accounts, scanning, email-forward, household vaults, and liability limits.",
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

export default function TermsPage() {
  return (
    <AuthShell wide>
      <div className="text-center">
        <AuthBrandMark />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-white/40">
          Last updated: September 3, 2026
        </p>
      </div>

      <div className="mt-10 space-y-8">
        <p className="text-sm leading-7 text-white/55">
          These Terms of Service (&quot;Terms&quot;) are a binding agreement
          between you and the operator of Warranty Vault AI
          (&quot;Warranty Vault,&quot; &quot;we,&quot; &quot;us&quot;) for the
          website, application, and related services at warrantyvault.in (the
          &quot;Service&quot;). By creating an account, signing in, or using
          the Service, you agree to these Terms and to our{" "}
          <Link
            href="/privacy"
            className="text-white/80 underline decoration-white/25 underline-offset-2"
          >
            Privacy Policy
          </Link>
          . If you do not agree, do not use the Service.
        </p>
        <p className="text-sm leading-7 text-white/40">
          This is a practical template for an early-stage product in India. It
          is not legal advice and does not replace counsel.
        </p>

        <Section title="1. Who we are">
          <p>
            Warranty Vault is a personal warranty vault. It helps you store
            product details, GST invoices, warranty cards, and related files,
            scan those documents to autofill forms, share a family vault, and
            receive expiry reminders. It is not a manufacturer, retailer,
            insurer, claims agent, or law firm.
          </p>
          <p>
            Questions: <MailLink />.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p>
            You must be at least 18 years old and able to form a binding
            contract under the laws of India to use the Service. By using the
            Service you represent that you meet these requirements. Household
            invites may only be sent to people who are 18 or older.
          </p>
        </Section>

        <Section title="3. Accounts and security">
          <p>
            You may register with Google, email and password, or an email
            one-time passcode (OTP). You are responsible for your credentials,
            for access to the inbox used for OTP and reminders, and for all
            activity on your account. Tell us promptly if you suspect
            unauthorized access.
          </p>
          <p>
            Keep account details accurate. We may suspend or close accounts
            that appear compromised, abusive, inactive for a long period, or in
            breach of these Terms.
          </p>
        </Section>

        <Section title="4. The Service">
          <p>Depending on the features we enable, the Service may let you:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Store products, serials, invoice numbers, purchase amounts, notes,
              and manufacturer or store/extended cover dates
            </li>
            <li>
              Upload invoices, warranty cards, and photos, and scan them to
              suggest form fields
            </li>
            <li>
              Forward marketplace invoice PDFs to a personal inbound address
              and review them as drafts before they become products
            </li>
            <li>
              Invite household members to a shared family vault (up to five
              people)
            </li>
            <li>
              Receive email reminders (including about 30 days, 7 days, and the
              last day of cover), in-app notices, optional browser push, and
              calendar or CSV exports
            </li>
            <li>Download a claim pack of the facts you stored for a product</li>
          </ul>
          <p>
            Features may change, be limited by capacity (for example email
            quotas), or be unavailable in some regions or browsers.
          </p>
        </Section>

        <Section title="5. Important limits">
          <p>
            The Service is a record-keeping and reminder tool. It is{" "}
            <strong className="font-medium text-white/80">not</strong> legal
            advice, insurance, a warranty, a guarantee, or a claims service.
          </p>
          <p>
            Any warranty, guarantee, return, or consumer-protection claim stays
            between you and the manufacturer, retailer, marketplace, or other
            issuer. We do not file claims, contact service centres on your
            behalf, or control third-party outcomes.
          </p>
          <p>
            Scan results, suggested dates, and extracted fields can be wrong or
            incomplete. Prefer a blank field over a guessed expiry. You must
            check every date and serial before you rely on a reminder or a
            claim pack. We do not warrant that stored details are enough to
            prove ownership or to succeed on a claim.
          </p>
        </Section>

        <Section title="6. Email-forward inbox">
          <p>
            If inbound receiving is live, Settings shows a personal address on
            inbound.warrantyvault.in. Forward Amazon, Flipkart, or similar
            invoice PDFs or images to that address. We store usable PDF/JPEG/PNG
            attachments as a <strong className="font-medium text-white/80">draft</strong>.
            Nothing becomes a live product until you review and save it. We do
            not fetch invoice links from an email body; attach the file.
          </p>
          <p>
            Anyone who knows the address can send mail to it. Treat it as
            private. Do not publish it. We may reject oversized files,
            non-document types, duplicates, or abuse. Drafts may include the
            sender address, subject, and attachments. If you share a household
            vault, members may see those drafts.
          </p>
        </Section>

        <Section title="7. Household vaults">
          <p>
            A household is a shared family vault, not a company workspace.
            Invite only people you trust. Members can see shared products,
            documents, reminder status, and inbound drafts, including personal
            data printed on invoices (name, address, phone, GSTIN).
          </p>
          <p>
            Owners can invite, rename the vault, and manage membership. Members
            can add and edit products. Leaving or deleting your account does
            not erase other members&apos; copies of the shared vault. If you
            are the last remaining member, deletion of your account also
            removes that vault&apos;s products and files.
          </p>
        </Section>

        <Section title="8. Your content">
          <p>
            You keep ownership of content you upload or enter, including product
            details, files, notes, forwarded emails, and related metadata
            (&quot;User Content&quot;).
          </p>
          <p>
            You grant us a worldwide, non-exclusive licence to host, process,
            display, transmit, and delete User Content only as needed to run
            the Service — for example storing files, running OCR or GST QR
            decode, sending reminders you use, sharing with household members
            you invite, and exporting files you request.
          </p>
          <p>
            You represent that you have the rights to upload User Content, that
            it is lawful, and that it does not infringe others&apos; rights. Do
            not upload other people&apos;s invoices or identity documents
            without authority.
          </p>
        </Section>

        <Section title="9. Acceptable use">
          <p>You agree not to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Use the Service for unlawful, fraudulent, or harmful purposes</li>
            <li>Access another user&apos;s account, inbound address, or data</li>
            <li>
              Upload malware, or content you have no right to share
            </li>
            <li>
              Probe, overload, or disrupt the Service, or reverse engineer it
              except where Indian law allows
            </li>
            <li>
              Abuse OTP, reminder, inbound, invite, or authentication features
              (including spam or automated abuse)
            </li>
            <li>
              Present the Service as a lawyer, insurer, manufacturer, or
              warranty issuer
            </li>
            <li>Invite minors or share a vault with anyone under 18</li>
          </ul>
        </Section>

        <Section title="10. Third-party services">
          <p>
            The Service depends on providers whose own terms also apply,
            including Google (sign-in), Resend (OTP, reminders, and inbound
            receiving), UploadThing (file storage), hosting such as Vercel,
            PostgreSQL hosting, and — only if we turn it on for the Service —
            an optional cloud AI extractor such as Google Gemini. We are not
            responsible for those providers&apos; outages or policy changes.
          </p>
        </Section>

        <Section title="11. Fees">
          <p>
            The Service is currently offered free of charge, subject to fair
            use and provider limits (for example daily email caps). We may
            introduce paid plans or usage limits later. If we do, we will post
            the change and, where required, ask you to accept new terms before
            charging you.
          </p>
        </Section>

        <Section title="12. Intellectual property">
          <p>
            The Service — including software, design, branding, and
            documentation, but excluding User Content — is owned by Warranty
            Vault or its licensors. You may not copy, modify, or distribute our
            materials except as these Terms allow or with prior written
            permission. Feedback you send us may be used to improve the Service
            without obligation to you.
          </p>
        </Section>

        <Section title="13. Disclaimers">
          <p>
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
            AVAILABLE.&quot; TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE
            DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING
            MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
            NON-INFRINGEMENT. We do not warrant uninterrupted access, error-free
            operation, or accurate OCR, QR, or AI extraction.
          </p>
        </Section>

        <Section title="14. Limitation of liability">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, WARRANTY VAULT
            AND ITS OPERATORS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL,
            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS,
            DATA, CLAIMS, OR BUSINESS OPPORTUNITIES, ARISING FROM YOUR USE OF
            THE SERVICE — INCLUDING A MISSED WARRANTY WINDOW, A WRONG EXTRACTED
            DATE, OR A FAILED THIRD-PARTY CLAIM.
          </p>
          <p>
            OUR TOTAL LIABILITY FOR CLAIMS RELATING TO THE SERVICE WILL NOT
            EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID US FOR THE SERVICE
            IN THE TWELVE (12) MONTHS BEFORE THE CLAIM OR (B) INR 5,000.
          </p>
          <p>
            Nothing in these Terms limits liability that cannot be limited
            under Indian law, including liability for fraud or for death or
            personal injury caused by negligence where such a limit is void.
            Mandatory consumer protections that apply to you still apply.
          </p>
        </Section>

        <Section title="15. Indemnity">
          <p>
            You will defend and indemnify us against claims, losses, and
            reasonable costs arising from your User Content, your household
            invites, your misuse of an inbound address, or your breach of these
            Terms, except to the extent caused by our wilful misconduct.
          </p>
        </Section>

        <Section title="16. Suspension, termination, and deletion">
          <p>
            You may stop using the Service at any time and delete your account
            in Settings. Deletion removes your account and, if you are the last
            person in the vault, its products, inbound drafts, and files.
            Household products stay with remaining members. Backups may retain
            residual copies for a short period.
          </p>
          <p>
            We may suspend or terminate access if you violate these Terms, if
            required by law, to protect the Service, or if we discontinue it.
            Licence grants, disclaimers, liability limits, indemnity, and
            governing law survive termination.
          </p>
        </Section>

        <Section title="17. Changes">
          <p>
            We may update these Terms. We will post the new version with a
            revised &quot;Last updated&quot; date. Material changes may also be
            sent by email or shown in the product. Continued use after the
            effective date is acceptance, except where law requires extra notice
            or consent.
          </p>
        </Section>

        <Section title="18. Governing law and disputes">
          <p>
            These Terms are governed by the laws of India, without regard to
            conflict-of-law rules. Subject to mandatory consumer protections
            where you live, courts of competent jurisdiction in India have
            exclusive jurisdiction over disputes arising from these Terms or
            the Service.
          </p>
        </Section>

        <Section title="19. General">
          <p>
            These Terms and the Privacy Policy are the entire agreement for the
            Service. If a provision is unenforceable, the rest remains in
            effect. Our failure to enforce a provision is not a waiver. You may
            not assign these Terms without our consent; we may assign them in
            connection with a reorganization or sale of the Service. There are
            no third-party beneficiaries. Headings are for convenience only.
          </p>
        </Section>

        <Section title="20. Contact">
          <p>
            For these Terms: <MailLink />.
          </p>
        </Section>
      </div>

      <p className="mt-12 text-center text-sm text-white/40">
        <Link href="/login" className="underline underline-offset-2 hover:text-white/70">
          Back to log in
        </Link>
        <span className="mx-2 text-white/20">·</span>
        <Link href="/privacy" className="underline underline-offset-2 hover:text-white/70">
          Privacy Policy
        </Link>
      </p>
    </AuthShell>
  );
}
