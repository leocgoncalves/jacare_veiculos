"use client";

import { useRouter } from "next/navigation";

export function LogoutButton({
  className,
  fullWidth = false,
}: {
  className?: string;
  fullWidth?: boolean;
}) {
  const router = useRouter();

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onLogout}
      className={`${fullWidth ? "w-full " : ""}rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 transition hover:bg-red-500/20 ${className ?? ""}`}
    >
      Sair
    </button>
  );
}
