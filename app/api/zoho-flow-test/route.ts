import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const zohoFlowUrl = process.env.ZOHO_FLOW_TEST_URL

    if (!zohoFlowUrl) {
      return NextResponse.json({ error: "ZOHO_FLOW_TEST_URL no está configurada" }, { status: 500 })
    }

    const body = await request.json()

    const response = await fetch(zohoFlowUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    return NextResponse.json(
      {
        success: true,
        status: response.status,
        data,
      },
      { status: response.status },
    )
  } catch (error) {
    console.error("[v0] Error calling Zoho Flow:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 },
    )
  }
}
