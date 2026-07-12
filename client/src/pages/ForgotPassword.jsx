import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiMail } from "react-icons/fi";
import { Button } from "../components/Button";
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
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-6">
          <p className="text-sm font-semibold text-primary">AssetFlow ERP</p>
          <h1 className="text-2xl font-bold text-slate-950">Forgot Password</h1>
          <p className="mt-1 text-sm text-slate-500">Enter your account email to request reset instructions.</p>
        </div>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Field label="Email" error={errors.email?.message}>
            <input className={inputClass} {...register("email")} />
          </Field>
          {message ? <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div> : null}
          {error ? <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-danger">{error}</div> : null}
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
