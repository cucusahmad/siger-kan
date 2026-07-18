export interface RequestContext {
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
}

const MAX_IP_LENGTH = 64;
const MAX_USER_AGENT_LENGTH = 500;

export function getRequestContext(request: Request): RequestContext {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const rawIpAddress = forwardedFor?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")?.trim()
    ?? null;
  const rawUserAgent = request.headers.get("user-agent")?.trim() ?? null;

  return {
    ipAddress: rawIpAddress?.slice(0, MAX_IP_LENGTH) ?? null,
    userAgent: rawUserAgent?.slice(0, MAX_USER_AGENT_LENGTH) ?? null,
  };
}
