import { jsonSuccess } from "@/lib/api";
import { getEnabledOAuthProviders } from "@/lib/auth";
import { getEmailProviderStatus } from "@/lib/email";

export async function GET() {
  const providers = getEnabledOAuthProviders();
  const email = getEmailProviderStatus();

  return jsonSuccess({
    google: providers.google,
    emailOtp: email.configured,
    emailSetup: {
      domainReady: email.domainReady,
      usingSharedSender: email.usingSharedSender,
      from: email.from,
      recommendedFrom: email.recommendedFrom,
      testRecipient: email.testRecipient,
      dailyLimit: email.dailyLimit,
    },
  });
}
