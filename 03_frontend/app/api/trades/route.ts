import { NextRequest } from "next/server";

const BACKEND = "http://127.0.0.1:3000";

function passHeaders(res: Response) {
  const ct = res.headers.get("content-type") || "application/json";
  return { "content-type": ct };
}

function authHeader(req: NextRequest): HeadersInit {
  const auth = req.headers.get("authorization");
  return auth ? { authorization: auth } : {};
}

export async function GET(req: NextRequest) {
  // preserve querystring (e.g. ?activeOnly=true)
  const url = new URL(req.url);
  const qs = url.search || "";

  const res = await fetch(`${BACKEND}/trades${qs}`, {
    cache: "no-store",
    headers: {
      ...authHeader(req),
    },
  });

  const text = await res.text();
  return new Response(text, { status: res.status, headers: passHeaders(res) });
}
