"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { loginSchema, LoginInput } from "@/lib/validations";
import { LOGIN } from "@/lib/graphql/mutations";
import { useAuthStore } from "@/store/authStore";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { showToast } from "@/components/ui/Toast";

const LoginForm = () => {
  const router = useRouter();
  const loginSuccess = useAuthStore((state) => state.login);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const [login, { loading }] = useMutation<{ login: { token: string; user: any } }>(LOGIN);

  const onSubmit = async (data: LoginInput) => {
    try {
      const response = await login({
        variables: data,
      });

      if (response.data?.login) {
        loginSuccess(response.data.login.token, response.data.login.user);
        showToast.success("Successfully logged in!");
        router.push("/browse");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const message = err.message.toLowerCase();
      if (message.includes("invalid") || message.includes("credentials")) {
        setError("root", { message: "Invalid email or password" });
      } else if (message.includes("not found")) {
        setError("root", { message: "No account found with this email" });
      } else {
        setError("root", { message: "Something went wrong. Please try again." });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {errors.root && (
        <Alert variant="error" message={errors.root.message || ""} />
      )}
      
      <Input
        label="Email"
        type="email"
        placeholder="Enter your email"
        register={register("email")}
        error={errors.email?.message}
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        register={register("password")}
        error={errors.password?.message}
      />

      <Button
        type="submit"
        className="w-full"
        loading={loading}
      >
        Sign In
      </Button>
    </form>
  );
};

export default LoginForm;
