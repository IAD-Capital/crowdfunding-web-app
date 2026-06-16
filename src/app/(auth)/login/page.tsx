import { redirect } from "next/navigation";
import { DEFAULT_LOCALE } from "@/i18n";

export default function LegacyLogin() {
  redirect(`/${DEFAULT_LOCALE}/login`);
}
