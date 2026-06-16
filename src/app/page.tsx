import { getSession } from "@/lib/session";
import LogoutButton from "./LogoutButton";
import Link from "next/link";

export default async function Home() {
  const session = await getSession();

  return (
    <main style={{ padding: "2rem" }}>
      <h1>Welcome{session ? `, ${session.fullName}` : ""}</h1>

      {session ? (
        <>
          <p style={{ color: "#6b7280", marginTop: "0.25rem" }}>
            {session.email} &mdash; <strong>{session.role}</strong>
          </p>
          <div style={{ marginTop: "1.5rem" }}>
            <LogoutButton />
          </div>
        </>
      ) : (
        <p style={{ marginTop: "1rem", color: "#6b7280" }}>
          <Link href="/login" style={{ color: "#111", fontWeight: 600 }}>Sign in</Link>
          {" "}or{" "}
          <Link href="/signup" style={{ color: "#111", fontWeight: 600 }}>create an account</Link>.
        </p>
      )}
    </main>
  );
}
