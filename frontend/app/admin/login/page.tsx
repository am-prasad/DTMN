"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraduationCap, Eye, EyeOff, Lock, Mail, ShieldCheck, KeyRound } from "lucide-react";
import { api } from "@/lib/api";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});
const totpSchema = z.object({
  code: z.string().length(6, "Enter the 6-digit code"),
});
const recoverySchema = z.object({
  recovery_code: z.string().min(8, "Enter your recovery code"),
});

type LoginData = z.infer<typeof loginSchema>;
type TotpData = z.infer<typeof totpSchema>;
type RecoveryData = z.infer<typeof recoverySchema>;
type Step = "login" | "mfa" | "recovery";

export default function AdminLoginPage() {
  const [step, setStep] = useState<Step>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Step 1: Email + Password
  const loginForm = useForm<LoginData>({ resolver: zodResolver(loginSchema) });
  const onLogin = async (data: LoginData) => {
    setServerError(null);
    try {
      const result: any = await api.auth.login(data.email, data.password);
      if (result?.requires_mfa) { setStep("mfa"); return; }
      if (result?.must_change_password) {
        window.location.href = "/admin/settings";
        return;
      }
      window.location.href = "/admin/dashboard";
    } catch (e: any) {
      setServerError(e?.detail ?? "Invalid email or password.");
    }
  };

  // Step 2a: TOTP — C1: actually calls verifyMfa (was re-posting password)
  const totpForm = useForm<TotpData>({ resolver: zodResolver(totpSchema) });
  const onVerifyTotp = async (data: TotpData) => {
    setServerError(null);
    try {
      const result: any = await api.auth.verifyMfa(data.code);
      if (result?.must_change_password) {
        window.location.href = "/admin/settings";
        return;
      }
      window.location.href = "/admin/dashboard";
    } catch (e: any) {
      setServerError(e?.detail ?? "Invalid code. Please try again.");
    }
  };

  // Step 2b: Recovery code — C1: new endpoint
  const recoveryForm = useForm<RecoveryData>({ resolver: zodResolver(recoverySchema) });
  const onRecoverMfa = async (data: RecoveryData) => {
    setServerError(null);
    try {
      const result: any = await api.auth.recoverMfa(data.recovery_code);
      if (result?.must_change_password) {
        window.location.href = "/admin/settings";
        return;
      }
      window.location.href = "/admin/dashboard";
    } catch (e: any) {
      setServerError(e?.detail ?? "Invalid recovery code.");
    }
  };

  const ErrorBanner = ({ msg }: { msg: string }) => (
    <div className="p-3 rounded bg-red-50 border border-red-200 text-sm text-red-700" role="alert">{msg}</div>
  );

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
            {step === "login" ? "Sign In" : step === "mfa" ? "Two-Factor Verification" : "Recovery Code"}
          </h2>

          {/* STEP 1: Login */}
          {step === "login" && (
            <form onSubmit={loginForm.handleSubmit(onLogin)} noValidate className="space-y-4">
              <div>
                <label htmlFor="login-email" className="form-label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" aria-hidden="true" />
                  <input id="login-email" type="email" {...loginForm.register("email")} className="form-input pl-9" autoComplete="username email" aria-required="true" />
                </div>
                {loginForm.formState.errors.email && <p className="form-error" role="alert">{loginForm.formState.errors.email.message}</p>}
              </div>
              <div>
                <label htmlFor="login-password" className="form-label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" aria-hidden="true" />
                  <input id="login-password" type={showPassword ? "text" : "password"} {...loginForm.register("password")} className="form-input pl-9 pr-10" autoComplete="current-password" aria-required="true" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600" aria-label={showPassword ? "Hide password" : "Show password"}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && <p className="form-error" role="alert">{loginForm.formState.errors.password.message}</p>}
              </div>
              {serverError && <ErrorBanner msg={serverError} />}
              <button type="submit" disabled={loginForm.formState.isSubmitting} className="btn-primary w-full justify-center mt-2">
                {loginForm.formState.isSubmitting ? "Please wait…" : "Sign In"}
              </button>
            </form>
          )}

          {/* STEP 2a: TOTP */}
          {step === "mfa" && (
            <form onSubmit={totpForm.handleSubmit(onVerifyTotp)} noValidate className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <ShieldCheck className="h-4 w-4 text-primary flex-shrink-0" />
                Enter the 6-digit code from your authenticator app.
              </div>
              <div>
                <label htmlFor="login-totp" className="form-label">Authenticator Code</label>
                <input id="login-totp" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} {...totpForm.register("code")} className="form-input text-center tracking-[0.5em] text-lg font-mono" autoComplete="one-time-code" placeholder="000000" autoFocus />
                {totpForm.formState.errors.code && <p className="form-error" role="alert">{totpForm.formState.errors.code.message}</p>}
              </div>
              {serverError && <ErrorBanner msg={serverError} />}
              <button type="submit" disabled={totpForm.formState.isSubmitting} className="btn-primary w-full justify-center mt-2">
                {totpForm.formState.isSubmitting ? "Verifying…" : "Verify"}
              </button>
              <div className="flex flex-col gap-2 pt-1">
                <button type="button" className="text-center text-sm text-primary hover:text-primary-700 transition-colors" onClick={() => { setStep("recovery"); setServerError(null); }}>
                  <KeyRound className="inline h-3.5 w-3.5 mr-1" />Use a recovery code instead
                </button>
                <button type="button" className="text-center text-sm text-neutral-500 hover:text-primary transition-colors" onClick={() => { setStep("login"); setServerError(null); }}>
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* STEP 2b: Recovery code */}
          {step === "recovery" && (
            <form onSubmit={recoveryForm.handleSubmit(onRecoverMfa)} noValidate className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <KeyRound className="h-4 w-4 text-primary flex-shrink-0" />
                Enter one of your one-time recovery codes. It will be removed after use.
              </div>
              <div>
                <label htmlFor="login-recovery" className="form-label">Recovery Code</label>
                <input id="login-recovery" type="text" {...recoveryForm.register("recovery_code")} className="form-input font-mono tracking-widest uppercase" autoComplete="off" placeholder="XXXXXXXXXXXX" autoFocus />
                {recoveryForm.formState.errors.recovery_code && <p className="form-error" role="alert">{recoveryForm.formState.errors.recovery_code.message}</p>}
              </div>
              {serverError && <ErrorBanner msg={serverError} />}
              <button type="submit" disabled={recoveryForm.formState.isSubmitting} className="btn-primary w-full justify-center mt-2">
                {recoveryForm.formState.isSubmitting ? "Verifying…" : "Use Recovery Code"}
              </button>
              <button type="button" className="w-full text-center text-sm text-neutral-500 hover:text-primary transition-colors" onClick={() => { setStep("mfa"); setServerError(null); }}>
                ← Back to Authenticator
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-neutral-400 mt-5">Authorised personnel only. All access is logged.</p>
      </div>
    </div>
  );
}
