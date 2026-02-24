import { NextRequest, NextResponse } from "next/server";

const UPSTREAM_BASE = "http://127.0.0.1:3000";

function passthrough(res: Response, text: string) {
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const auth = req.headers.get("authorization") ?? "";
  const upstream = `${UPSTREAM_BASE}/salespeople/${encodeURIComponent(id)}`;

  const res = await fetch(upstream, {
    method: "GET",
    headers: { Authorization: auth },
    cache: "no-store",
  });

  const text = await res.text();
  return passthrough(res, text);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const auth = req.headers.get("authorization") ?? "";
    const contentType = req.headers.get("content-type") ?? "application/json";
    const bodyText = await req.text();

    const upstream = `${UPSTREAM_BASE}/salespeople/${encodeURIComponent(id)}`;
    const res = await fetch(upstream, {
      method: "PATCH",
      headers: {
        Authorization: auth,
        "Content-Type": contentType,
      },
      body: bodyText,
      cache: "no-store",
    });

    const text = await res.text();
    return passthrough(res, text);
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        errorId: "JP-SALESPEOPLE-PROXY-PATCH",
        message: err?.message ?? "Proxy PATCH failed",
      },
      { status: 502 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await ctx.params;
    const auth = req.headers.get("authorization") ?? "";
    const upstream = `${UPSTREAM_BASE}/salespeople/${encodeURIComponent(id)}`;

    const res = await fetch(upstream, {
      method: "DELETE",
      headers: { Authorization: auth },
      cache: "no-store",
    });

    const text = await res.text();
    return passthrough(res, text);
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        errorId: "JP-SALESPEOPLE-PROXY-DELETE",
        message: err?.message ?? "Proxy DELETE failed",
      },
      { status: 502 }
    );
  }
}
