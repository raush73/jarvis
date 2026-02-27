import { NextRequest } from "next/server";

const BACKEND = "http://127.0.0.1:3000";

function passHeaders(res: Response) {
  const ct = res.headers.get("content-type") || "application/json";
  return { "content-type": ct };
}

function authHeader(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth ? { Authorization: auth } : {};
}

// Next 16: params is a Promise in route handlers
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const res = await fetch(`${BACKEND}/trades/${id}/tool-types`, {
    cache: "no-store",
    headers: {
      ...authHeader(req),
    },
  });

  const text = await res.text();
  return new Response(text, { status: res.status, headers: passHeaders(res) });
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;

  const body = await req.text();

  const res = await fetch(`${BACKEND}/trades/${id}/tool-types`, {
    method: "PUT",
    cache: "no-store",
    headers: {
      "content-type": req.headers.get("content-type") || "application/json",
      ...authHeader(req),
    },
    body,
  });

  const text = await res.text();
  return new Response(text, { status: res.status, headers: passHeaders(res) });
}
