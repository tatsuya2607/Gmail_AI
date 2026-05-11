import { redirect } from "next/navigation";
import { getAuthUrl } from "@/lib/google";

export function GET() {
  const url = getAuthUrl();
  redirect(url);
}
