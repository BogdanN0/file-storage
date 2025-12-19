"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "./hooks/useRequireAuth";
import { Loading } from "./components/Loading";

export default function Home() {
  const router = useRouter();
  const { user, isLoading } = useRequireAuth();

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      router.replace("/library");
    } else {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  return <Loading />;
}
