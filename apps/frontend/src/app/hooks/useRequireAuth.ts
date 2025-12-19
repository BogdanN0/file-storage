"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiHooks } from "../api/hooks";

type RequireAuthMode = "protected" | "guest";

type UseRequireAuthOptions = {
  // * - "protected": pages that require auth (redirect to login if not authenticated)
  // * - "guest": pages that should NOT be visible for authenticated users (login/register)
  mode?: RequireAuthMode;

  // Where to redirect a guest user if they try to open a protected page
  loginPath?: string;

  // Where to redirect an authenticated user if they try to open a guest page (login/register)
  appPath?: string;
};

export function useRequireAuth(options: UseRequireAuthOptions = {}) {
  const {
    mode = "protected",
    loginPath = "/login",
    appPath = "/library",
  } = options;

  const router = useRouter();

  // Requests current user (session-based) from backend
  const { data, isLoading, isError } = apiHooks.auth.useMe();

  // Prevent redirect loops / repeated redirects during rerenders
  const hasRedirected = useRef(false);

  // Adjust this path if your API response shape differs
  const user = data?.data?.user ?? null;

  // Consider authenticated only if user exists and request isn't in error state
  const isAuthenticated = useMemo(() => {
    return !!user && !isError;
  }, [user, isError]);

  useEffect(() => {
    // Wait until the "me" request is resolved
    if (isLoading || hasRedirected.current) return;

    // 1) Protected pages: if not authenticated -> redirect to login
    if (mode === "protected" && !isAuthenticated) {
      hasRedirected.current = true;
      router.replace(loginPath);
      return;
    }

    // 2) Guest pages (login/register): if authenticated -> redirect to app
    if (mode === "guest" && isAuthenticated) {
      hasRedirected.current = true;
      router.replace(appPath);
      return;
    }
  }, [mode, isLoading, isAuthenticated, router, loginPath, appPath]);

  return {
    user,
    isLoading,
    isAuthenticated,
    isError,
  };
}
