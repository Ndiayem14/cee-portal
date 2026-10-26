import type { Metadata } from "next";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { SetupNotice } from "@/components/SetupNotice";
import { ApplyWizard } from "./ApplyWizard";

export const metadata: Metadata = { title: "Apply" };

export default function ApplyPage() {
  if (!isSupabaseConfigured) return <SetupNotice />;
  return <ApplyWizard />;
}
