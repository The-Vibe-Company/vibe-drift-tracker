import { auth } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

// Wrap handlers in functions so auth.handler() is called at request time,
// not at build time (which would crash without env vars in CI).
export function GET(req: Request, ctx: any) {
  return auth.handler().GET(req, ctx);
}

export function POST(req: Request, ctx: any) {
  return auth.handler().POST(req, ctx);
}
