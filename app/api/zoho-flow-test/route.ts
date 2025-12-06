// app/api/zoho-flow-test/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const url = process.env.ZOHO_FLOW_TEST_URL;
    if (!url) {
      return NextResponse.json(
        { success: false, error: "Falta ZOHO_FLOW_TEST_URL en las variables de entorno" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Zoho Flow normalmente responde JSON, pero por si acaso:
    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return NextResponse.json(
      {
        success: res.ok,
        status: res.status,
        data,
      },
      { status: res.status }
    );
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message ?? "Error desconocido en el proxy" },
      { status: 500 }
    );
  }
}
