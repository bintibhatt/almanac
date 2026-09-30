import { NextResponse } from "next/server";

export async function GET() {
  // Never expose private VAPID keys; only provide the public key for client registration
  const publicKey =
    process.env.VAPID_PUBLIC_KEY ||
    "BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjZJuYtr3qhmwpKDYVOD2UVhkEOW8";

  return NextResponse.json({ publicKey });
}
