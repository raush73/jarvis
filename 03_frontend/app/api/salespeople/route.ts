import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const qs = url.search ? url.search : "";
  const auth = req.headers.get("authorization") ?? "";

  const upstream = `http://127.0.0.1:3002/salespeople${qs}`;
  const res = await fetch(upstream, {
    method: "GET",
    headers: {
      Authorization: auth,
    },
    cache: "no-store",
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json",
    },
  });
}
