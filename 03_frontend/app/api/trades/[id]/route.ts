import { NextRequest } from "next/server";

const BACKEND = "http://127.0.0.1:3000";

function passHeaders(res: Response) {
  const ct = res.headers.get("content-type") || "application/json";
  return { "content-type": ct };
}

function authHeader(req: NextRequest): HeadersInit | null {
  const auth = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!auth) return null;
  return { authorization: auth };
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const h = authHeader(req);
  if (!h) {
    return new Response(
      JSON.stringify({ ok: false, message: "Missing auth token" }),
      { status: 401, headers: { "content-type": "application/json" } }
    );
  }

  const { id } = await ctx.params;
  const res = await fetch(`${BACKEND}/trades/${id}`, {
    cache: "no-store",
    headers: { ...h },
  });

  const text = await res.text();
  return new Response(text, { status: res.status, headers: passHeaders(res) });
}
