"use client";

import { useState } from "react";
import { ZodSchema, ZodError } from "zod";

interface AuthFormProps {
  title: string;
  fields: {
    name: string;
    label: string;
    type: string;
    placeholder: string;
  }[];
  schema: ZodSchema;
  onSubmit: (data: any) => Promise<void>;
  submitButtonText: string;
}

export function AuthForm({
  title,
  fields,
  schema,
  onSubmit,
  submitButtonText,
}: AuthFormProps) {
  const [formData, setFormData] = useState<Record<string, string>>(
    fields.reduce((acc, field) => ({ ...acc, [field.name]: "" }), {})
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if (serverError) {
      setServerError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setServerError("");

    try {
      const validatedData = schema.parse(formData);
      await onSubmit(validatedData);
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: Record<string, string> = {};

        // @ts-ignore
        JSON.parse(error).forEach((err) => {
          const fieldName = err.path[0] as string;
          newErrors[fieldName] = err.message;
        });
        setErrors(newErrors);
      } else if (error instanceof Error) {
        setServerError(error.message);
      } else {
        setServerError("An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>{title}</h1>

      {serverError && (
        <div
          style={{
            padding: "0.75rem",
            backgroundColor: "#ffebee",
            color: "#c62828",
            borderRadius: "4px",
            marginBottom: "1rem",
          }}
        >
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {fields.map((field) => (
          <div key={field.name} style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                marginBottom: "0.5rem",
                fontWeight: "500",
              }}
              htmlFor={field.name}
            >
              {field.label}
            </label>
            <input
              id={field.name}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={formData[field.name]}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "0.75rem",
                border: errors[field.name]
                  ? "2px solid #d32f2f"
                  : "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />
            {errors[field.name] && (
              <p
                style={{
                  color: "#d32f2f",
                  fontSize: "0.875rem",
                  marginTop: "0.25rem",
                  margin: "0.25rem 0 0 0",
                }}
              >
                {errors[field.name]}
              </p>
            )}
          </div>
        ))}
        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: isLoading ? "#ccc" : "#000",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            fontSize: "1rem",
            cursor: isLoading ? "not-allowed" : "pointer",
            marginTop: "1rem",
          }}
        >
          {isLoading ? "Loading..." : submitButtonText}
        </button>
      </form>
    </div>
  );
}
