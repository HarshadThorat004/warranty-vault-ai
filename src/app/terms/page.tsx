import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import AuthShell, { AuthBrandMark } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Terms of Service — Warranty Vault AI",
  description: "Terms of Service for Warranty Vault AI",
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

export default function TermsPage() {
  return (
    <AuthShell wide>
      <div className="text-center">
        <AuthBrandMark />
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-white/40">
          Last updated: August 4, 2026
        </p>
      </div>

      <div className="mt-10 space-y-8">
        <p className="text-sm leading-7 text-white/55">
          These Terms of Service (&quot;Terms&quot;) govern your access to and
          use of Warranty Vault AI, including the website, application, and
          related services operated at warrantyvault.in (collectively, the
          &quot;Service&quot;). By creating an account or using the Service, you
          agree to these Terms. If you do not agree, do not use the Service.
        </p>
        <p className="text-sm leading-7 text-white/40">
          These pages are provided as a practical template for an early-stage
          product and are not a substitute for advice from a qualified attorney.
        </p>

        <Section title="1. Who we are">
          <p>
            Warranty Vault AI is a product tool that helps you store product
            warranty information, receipts, related documents, and expiry
            reminders. References to &quot;we,&quot; &quot;us,&quot; or
            &quot;Warranty Vault AI&quot; mean the operator of the Service at
            warrantyvault.in.
          </p>
          <p>
            Questions about these Terms:{" "}
            <a
              href="mailto:warrantyvault.in@gmail.com"
              className="text-white/80 underline decoration-white/25 underline-offset-2"
            >
              warrantyvault.in@gmail.com
            </a>
            .
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p>
            You must be at least 18 years old and capable of forming a binding
            contract to use the Service. By using the Service, you represent that
            you meet these requirements.
          </p>
        </Section>

        <Section title="3. Accounts and security">
          <p>
            You may sign up using Google OAuth, email and password, or email
            one-time passcodes (OTP). You are responsible for maintaining the
            confidentiality of your credentials and for all activity under your
            account. Notify us promptly if you suspect unauthorized access.
          </p>
          <p>
            Provide accurate account information and keep it up to date. We may
            suspend or terminate accounts that appear compromised, abusive, or
            in violation of these Terms.
          </p>
        </Section>

        <Section title="4. The Service — important limits">
          <p>
            Warranty Vault AI helps you organize warranty-related records and
            send reminders. It is <strong className="font-medium text-white/80">not</strong>{" "}
            legal advice, insurance, a warranty provider, or a claims agent.
          </p>
          <p>
            Any warranty, guarantee, or consumer-protection claim remains between
            you and the manufacturer, retailer, or other party that issued the
            warranty. We do not guarantee that stored details are complete,
            accurate, or sufficient for a claim, and we do not control third-party
            warranty outcomes.
          </p>
        </Section>

        <Section title="5. Your content">
          <p>
            You retain ownership of content you upload or enter into the Service,
            including product details, receipt images, warranty documents, notes,
            and related metadata (&quot;User Content&quot;).
          </p>
          <p>
            You grant us a limited license to host, process, display, and
            transmit User Content solely as needed to operate and improve the
            Service (for example, storing files, running OCR on invoices, and
            sending reminder emails you enable).
          </p>
          <p>
            You represent that you have the rights to upload User Content and
            that it does not infringe others&apos; rights or violate law.
          </p>
        </Section>

        <Section title="6. Acceptable use">
          <p>You agree not to:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Use the Service for unlawful, fraudulent, or harmful purposes</li>
            <li>Attempt to access other users&apos; accounts or data</li>
            <li>Upload malware, or content you have no right to share</li>
            <li>
              Probe, scan, or disrupt the Service, or reverse engineer it except
              where permitted by law
            </li>
            <li>
              Abuse email/OTP, reminder, or authentication features (including
              spam or automated abuse)
            </li>
            <li>
              Misrepresent the Service as a legal advisor, insurer, or warranty
              issuer
            </li>
          </ul>
        </Section>

        <Section title="7. Third-party services">
          <p>
            The Service relies on third-party providers, which may include Google
            (sign-in), Resend (transactional email such as OTP and reminders),
            UploadThing (file storage), hosting providers (for example Vercel),
            database hosting for Postgres, and AI/OCR providers (for example
            Google Gemini) for receipt or document text extraction. Their terms
            and privacy practices also apply to their processing.
          </p>
        </Section>

        <Section title="8. Intellectual property">
          <p>
            The Service, including its software, design, branding, and
            documentation (excluding User Content), is owned by Warranty Vault AI
            or its licensors. You may not copy, modify, or distribute our
            materials except as allowed by these Terms or with prior written
            permission.
          </p>
        </Section>

        <Section title="9. Disclaimers">
          <p>
            THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
            AVAILABLE.&quot; TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM
            ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY,
            FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. We do not
            warrant that the Service will be uninterrupted, error-free, or that
            OCR/extraction results will be accurate.
          </p>
        </Section>

        <Section title="10. Limitation of liability">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, WARRANTY VAULT AI
            AND ITS OPERATORS WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL,
            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS,
            DATA, OR BUSINESS OPPORTUNITIES, ARISING FROM YOUR USE OF THE
            SERVICE. OUR TOTAL LIABILITY FOR CLAIMS RELATING TO THE SERVICE WILL
            NOT EXCEED THE GREATER OF (A) THE AMOUNTS YOU PAID US FOR THE SERVICE
            IN THE TWELVE (12) MONTHS BEFORE THE CLAIM OR (B) INR 5,000.
          </p>
          <p>
            Some jurisdictions do not allow certain limitations; in those cases,
            our liability is limited to the fullest extent permitted by law.
          </p>
        </Section>

        <Section title="11. Termination">
          <p>
            You may stop using the Service at any time. We may suspend or
            terminate access if you violate these Terms, if required by law, or
            if we discontinue the Service. Upon termination, your right to use
            the Service ends. Provisions that by nature should survive
            (including disclaimers, limitations of liability, and governing law)
            will survive.
          </p>
        </Section>

        <Section title="12. Changes">
          <p>
            We may update these Terms from time to time. We will post the updated
            version with a revised &quot;Last updated&quot; date. Continued use
            after changes become effective constitutes acceptance of the updated
            Terms, except where applicable law requires additional notice or
            consent.
          </p>
        </Section>

        <Section title="13. Governing law">
          <p>
            These Terms are governed by the laws of India, without regard to
            conflict-of-law principles. Subject to mandatory consumer protections
            that may apply where you live, courts in India will have exclusive
            jurisdiction over disputes arising from these Terms or the Service.
          </p>
        </Section>

        <Section title="14. Contact">
          <p>
            For questions about these Terms, contact{" "}
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
        <Link href="/privacy" className="underline underline-offset-2 hover:text-white/70">
          Privacy Policy
        </Link>
      </p>
    </AuthShell>
  );
}
