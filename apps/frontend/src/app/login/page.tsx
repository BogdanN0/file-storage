"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/app/components/AuthForm";
import { Navbar } from "@/app/components/Navbar";
import { loginSchema, type LoginInput } from "@/app/lib/schemas";
import { NavButton } from "../components/NavButton";
import { apiHooks } from "../api/hooks";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { Loading } from "../components/Loading";
import { AuthGuard } from "../components/AuthGuard";

export default function LoginPage() {
  const router = useRouter();
  const loginMutation = apiHooks.auth.useLogin();
  const { user, isLoading } = useRequireAuth({ mode: "guest" });
  const handleSubmit = async (data: LoginInput) => {
    await loginMutation.mutateAsync(data);
  };

  if (isLoading) {
    return <Loading />;
  }
  // if (user) {
  //   return null;
  // }

  return (
    <>
      <Navbar />
      <AuthForm
        title="Login"
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            placeholder: "user@example.com",
          },
          {
            name: "password",
            label: "Password",
            type: "password",
            placeholder: "Enter your password",
          },
        ]}
        schema={loginSchema}
        onSubmit={handleSubmit}
        submitButtonText="Login"
      />
    </>
  );
}
