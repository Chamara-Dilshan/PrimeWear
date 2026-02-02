"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";

const emailSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const otpSchema = z.object({
  code: z.string().length(6, "OTP must be 6 digits"),
});

type EmailFormData = z.infer<typeof emailSchema>;
type OTPFormData = z.infer<typeof otpSchema>;

interface OTPFormProps {
  redirectUrl?: string;
}

export function OTPForm({ redirectUrl }: OTPFormProps) {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const otpForm = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  });

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const onSendOTP = async (data: EmailFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || "Failed to send OTP");
        return;
      }

      setEmail(data.email);
      setStep("otp");
      setResendTimer(60); // 60 seconds cooldown
      toast.success("OTP sent to your email!");
    } catch (error) {
      console.error("Send OTP error:", error);
      toast.error("An error occurred while sending OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOTP = async (data: OTPFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code: data.code,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || "Invalid OTP");
        return;
      }

      // Store auth data
      setAuth(
        result.data.user,
        result.data.accessToken,
        result.data.refreshToken
      );

      toast.success("Login successful!");

      // Redirect
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push("/");
      }
    } catch (error) {
      console.error("Verify OTP error:", error);
      toast.error("An error occurred while verifying OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    await onSendOTP({ email });
  };

  const handleChangeEmail = () => {
    setStep("email");
    otpForm.reset();
  };

  if (step === "email") {
    return (
      <form
        onSubmit={emailForm.handleSubmit(onSendOTP)}
        className="space-y-4"
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...emailForm.register("email")}
              disabled={isLoading}
              className="pl-10"
            />
          </div>
          {emailForm.formState.errors.email && (
            <p className="text-sm text-red-500">
              {emailForm.formState.errors.email.message}
            </p>
          )}
          <p className="text-sm text-gray-500">
            We'll send you a 6-digit code to verify your email
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending code...
            </>
          ) : (
            "Send OTP"
          )}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={otpForm.handleSubmit(onVerifyOTP)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Verification Code</Label>
        <Input
          id="code"
          type="text"
          placeholder="000000"
          maxLength={6}
          {...otpForm.register("code")}
          disabled={isLoading}
          className="text-center text-2xl font-mono tracking-widest"
        />
        {otpForm.formState.errors.code && (
          <p className="text-sm text-red-500">
            {otpForm.formState.errors.code.message}
          </p>
        )}
        <p className="text-sm text-gray-500">
          Enter the 6-digit code sent to{" "}
          <span className="font-medium">{email}</span>
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          "Verify & Sign In"
        )}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={handleChangeEmail}
          className="text-blue-600 hover:text-blue-700 hover:underline"
          disabled={isLoading}
        >
          Change email
        </button>

        <button
          type="button"
          onClick={handleResendOTP}
          disabled={isLoading || resendTimer > 0}
          className="text-blue-600 hover:text-blue-700 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
        </button>
      </div>
    </form>
  );
}
