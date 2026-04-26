import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = await createClient();

  const { data: instruments, error } = await supabase
    .from("instruments")
    .select("*");

  return NextResponse.json({ instruments });
}
