import { jsonSuccess } from "@/lib/api";
import { getEnabledOAuthProviders } from "@/lib/auth";

export async function GET() {
  const providers = getEnabledOAuthProviders();

  return jsonSuccess({
    google: providers.google,
    emailOtp: Boolean(process.env.RESEND_API_KEY),
  });
}
