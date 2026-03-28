const NEXT_REDIRECT_PREFIX = "NEXT_REDIRECT;";

type RedirectLikeError = {
  digest?: unknown;
};

export function isNextRedirectError(
  error: unknown,
): error is Error & { digest: string } {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const digest = (error as RedirectLikeError).digest;

  return typeof digest === "string" && digest.startsWith(NEXT_REDIRECT_PREFIX);
}
