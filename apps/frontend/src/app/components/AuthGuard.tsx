"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { Loading } from "./Loading";

type AuthGuardProps = {
  children: React.ReactNode;
  mode?: "protected" | "guest";
  loginPath?: string;
  appPath?: string;
};

export function AuthGuard({
  children,
  mode = "protected",
  loginPath = "/login",
  appPath = "/library",
}: AuthGuardProps) {
  const router = useRouter();
  const { user, isLoading } = useRequireAuth({ mode, loginPath, appPath });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // На сервере всегда показываем Loading
  if (!isMounted || isLoading) {
    return <Loading />;
  }

  // На клиенте после загрузки
  if (mode === "protected" && !user) {
    return <Loading text="Redirecting to login..." />;
  }

  if (mode === "guest" && user) {
    return <Loading text="Redirecting..." />;
  }

  return <>{children}</>;
}
