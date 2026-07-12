import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiLogIn } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/Button";
import { Field, inputClass } from "../components/Input";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required")
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "admin@assetflow.local", password: "Password@123" }
  });

  const onSubmit = async (values) => {
    try {
      setError("");
      await login(values);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-soft">
        <div className="mb-6">
          <p className="text-sm font-semibold text-primary">AssetFlow ERP</p>
          <h1 className="text-2xl font-bold text-slate-950">Login</h1>
          <p className="mt-1 text-sm text-slate-500">Access assets, allocations, audits, and reports.</p>
        </div>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Field label="Email" error={errors.email?.message}>
            <input className={inputClass} {...register("email")} />
          </Field>
          <Field label="Password" error={errors.password?.message}>
            <input type="password" className={inputClass} {...register("password")} />
          </Field>
          {error ? <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-danger">{error}</div> : null}
          <Button disabled={isSubmitting}>
            <FiLogIn /> Login
          </Button>
        </form>
        <p className="mt-4 text-sm text-slate-500">
          New employee?{" "}
          <Link className="font-semibold text-primary" to="/signup">
            Create an account
          </Link>
        </p>
      </section>
    </main>
  );
}
