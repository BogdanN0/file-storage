"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthForm } from "@/app/components/AuthForm";
import { Navbar } from "@/app/components/Navbar";
import { registerSchema, type RegisterInput } from "@/app/lib/schemas";
import { NavButton } from "../components/NavButton";
import { apiHooks } from "../api/hooks";
import { useRequireAuth } from "../hooks/useRequireAuth";
import { Loading } from "../components/Loading";

export default function RegisterPage() {
  const router = useRouter();
  const registerMutation = apiHooks.auth.useRegister();
  const { user, isLoading } = useRequireAuth({ mode: "guest" });
  const handleSubmit = async (data: RegisterInput) => {
    await registerMutation.mutateAsync(data);
  };

  if (user) {
    return null;
  }

  return (
    <>
      <Navbar />
      <AuthForm
        title="Register"
        fields={[
          {
            name: "name",
            label: "Full Name",
            type: "text",
            placeholder: "John Doe",
          },
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
            placeholder: "At least 8 characters",
          },
        ]}
        schema={registerSchema}
        onSubmit={handleSubmit}
        submitButtonText="Register"
      />
    </>
  );
}
