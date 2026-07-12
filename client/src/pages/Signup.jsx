import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/Button";
import { Alert } from "../components/Feedback";
import { Field, inputClass } from "../components/Input";

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z
    .string()
    .min(8, "Use at least 8 characters")
    .regex(/[A-Z]/, "Include an uppercase letter")
    .regex(/[a-z]/, "Include a lowercase letter")
    .regex(/[0-9]/, "Include a number")
});

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    try {
      setError("");
      await signup(values);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10">
      <section className="animate-enter w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary font-black text-white">AF</div>
        <p className="text-sm font-semibold text-primary">AssetFlow ERP</p>
        <h1 className="mb-6 text-2xl font-bold text-slate-950">Employee Signup</h1>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Field label="Name" error={errors.name?.message}>
            <input className={inputClass} {...register("name")} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <input className={inputClass} {...register("email")} />
          </Field>
          <Field label="Password" error={errors.password?.message}>
            <input type="password" className={inputClass} {...register("password")} />
          </Field>
          <Alert tone="error" className="mb-0">{error}</Alert>
          <Button disabled={isSubmitting}>Create Employee Account</Button>
        </form>
        <p className="mt-4 text-sm text-slate-500">
          Already registered?{" "}
          <Link className="font-semibold text-primary" to="/login">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}
