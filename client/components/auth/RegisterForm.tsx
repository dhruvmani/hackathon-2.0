"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { registerSchema, RegisterInput } from "@/lib/validations";
import { REGISTER } from "@/lib/graphql/mutations";
import { useAuthStore } from "@/store/authStore";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Alert from "@/components/ui/Alert";
import { showToast } from "@/components/ui/Toast";

const RegisterForm = () => {
  const router = useRouter();
  const loginSuccess = useAuthStore((state) => state.login);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const [registerMutation, { loading }] = useMutation<{ register: { token: string; user: any } }>(REGISTER, {
    onCompleted: (data) => {
      loginSuccess(data.register.token, data.register.user);
      showToast.success("Account created successfully!");
      router.push("/browse");
    },
    onError: (error) => {
      if (error.message.includes("exists")) {
        setError("root", { message: "An account with this email already exists" });
      } else {
        setError("root", { message: "Something went wrong. Please try again." });
      }
    },
  });

  const onSubmit = (data: RegisterInput) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, ...variables } = data;
    registerMutation({ variables });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {errors.root && (
        <Alert variant="error" message={errors.root.message || ""} />
      )}
      
      <Input
        label="Full Name"
        placeholder="Enter your name"
        register={register("name")}
        error={errors.name?.message}
      />

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
        placeholder="min 6 characters"
        register={register("password")}
        error={errors.password?.message}
      />

      <Input
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        register={register("confirmPassword")}
        error={errors.confirmPassword?.message}
      />

      <Button
        type="submit"
        className="w-full mt-6"
        loading={loading}
      >
        Sign Up
      </Button>
    </form>
  );
};

export default RegisterForm;
