import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiMail } from "react-icons/fi";
import { Button } from "../components/Button";
import { Alert } from "../components/Feedback";
import { Field, inputClass } from "../components/Input";
import { authApi } from "../services/resources";

const schema = z.object({
  email: z.string().email("Invalid email")
});

export default function ForgotPassword() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const onSubmit = async (values) => {
    try {
      setError("");
      setMessage("");
      const result = await authApi.forgotPassword(values);
      setMessage(result.message);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10">
      <section className="animate-enter w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-900/10">
        <div className="mb-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-primary font-black text-white">AF</div>
          <p className="text-sm font-semibold text-primary">AssetFlow ERP</p>
          <h1 className="text-2xl font-bold text-slate-950">Forgot Password</h1>
          <p className="mt-1 text-sm text-slate-500">Enter your account email to request reset instructions.</p>
        </div>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Field label="Email" error={errors.email?.message}>
            <input className={inputClass} {...register("email")} />
          </Field>
          <Alert tone="success" className="mb-0">{message}</Alert>
          <Alert tone="error" className="mb-0">{error}</Alert>
          <Button disabled={isSubmitting}>
            <FiMail /> Send Reset Link
          </Button>
        </form>
        <p className="mt-4 text-sm text-slate-500">
          Remembered it?{" "}
          <Link className="font-semibold text-primary" to="/login">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}
