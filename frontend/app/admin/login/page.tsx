"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraduationCap, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { api } from "@/lib/api";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  totp: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [needsMfa, setNeedsMfa] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const result: any = await api.auth.login(data.email, data.password);
      if (result?.mfa_required) {
        setNeedsMfa(true);
        return;
      }
      router.replace("/admin/dashboard");
    } catch (e: any) {
      // 1. Capture the raw detail error property
      const rawDetail = e?.detail || "Invalid email or password.";
      
      // 2. Safely parse it into a single clean string string format
      let cleanDetailString = "";
      if (typeof rawDetail === "string") {
        cleanDetailString = rawDetail;
      } else if (Array.isArray(rawDetail)) {
        cleanDetailString = rawDetail.join(" ");
      } else if (typeof rawDetail === "object") {
        cleanDetailString = rawDetail.message || JSON.stringify(rawDetail);
      } else {
        cleanDetailString = String(rawDetail);
      }

      // 3. Lowercase comparison is now perfectly safe
      const lowerDetail = cleanDetailString.toLowerCase();
      if (lowerDetail.includes("mfa") || lowerDetail.includes("totp")) {
        setNeedsMfa(true);
      } else {
        // Safe to set standard string to state without breaking JSX rendering
        setServerError(cleanDetailString);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-7 w-7 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-neutral-900">D T M N</h1>
          <p className="text-sm text-neutral-500 mt-1">Staff Administration Portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-card shadow-elevated border border-neutral-200 p-7">
          <h2 className="text-base font-semibold text-neutral-900 mb-5">
            {needsMfa ? "Two-Factor Verification" : "Sign In"}
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            {!needsMfa ? (
              <>
                <div>
                  <label htmlFor="login-email" className="form-label">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400"
                      aria-hidden="true"
                    />
                    <input
                      id="login-email"
                      type="email"
                      {...register("email")}
                      className="form-input pl-9"
                      autoComplete="username email"
                      aria-required="true"
                      aria-describedby={errors.email ? "email-err" : undefined}
                    />
                  </div>
                  {errors.email && (
                    <p id="email-err" className="form-error" role="alert">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="login-password" className="form-label">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400"
                      aria-hidden="true"
                    />
                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      className="form-input pl-9 pr-10"
                      autoComplete="current-password"
                      aria-required="true"
                      aria-describedby={errors.password ? "pw-err" : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p id="pw-err" className="form-error" role="alert">
                      {errors.password.message}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div>
                <p className="text-sm text-neutral-600 mb-4">
                  Enter the 6-digit code from your authenticator app.
                </p>
                <label htmlFor="login-totp" className="form-label">
                  Authenticator Code
                </label>
                <input
                  id="login-totp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  {...register("totp")}
                  className="form-input text-center tracking-[0.5em] text-lg font-mono"
                  autoComplete="one-time-code"
                  aria-required="true"
                  placeholder="000000"
                  autoFocus
                />
              </div>
            )}

            {serverError && (
              <div
                className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700"
                role="alert"
              >
                {serverError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full justify-center mt-2"
            >
              {isSubmitting
                ? "Please wait…"
                : needsMfa
                ? "Verify"
                : "Sign In"}
            </button>

            {needsMfa && (
              <button
                type="button"
                className="w-full text-center text-sm text-neutral-500 hover:text-primary transition-colors"
                onClick={() => {
                  setNeedsMfa(false);
                  setServerError(null);
                }}
              >
                ← Back to Sign In
              </button>
            )}
          </form>
        </div>

        <p className="text-center text-xs text-neutral-400 mt-5">
          Authorised personnel only. All access is logged.
        </p>
      </div>
    </div>
  );
}
