import { NextResponse } from "next/server";

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    {
      error:
        "Username registration is signed by the connected Solana wallet.",
    },
    { status: 400 }
  );
}
