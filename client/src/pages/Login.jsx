import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiLogIn } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/Button";
import { Alert } from "../components/Feedback";
import { Field, inputClass } from "../components/Input";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required")
});

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
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
      navigate(location.state?.from?.pathname || "/");
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
          <div className="-mt-2 text-right">
            <Link className="text-sm font-semibold text-primary" to="/forgot-password">
              Forgot password?
            </Link>
          </div>
          <Alert tone="error" className="mb-0">{error}</Alert>
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
