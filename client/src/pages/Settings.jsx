import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiSave } from "react-icons/fi";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { Field, inputClass } from "../components/Input";
import { useAuth } from "../context/AuthContext";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters")
});

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: zodResolver(schema), defaultValues: { name: user?.name || "" } });

  useEffect(() => {
    reset({ name: user?.name || "" });
  }, [reset, user?.name]);

  const onSubmit = async (values) => {
    try {
      setMessage("");
      setError("");
      await updateProfile(values);
      setMessage("Profile updated.");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <PageHeader title="Profile & Settings" description="Account profile and workspace preferences." />
      <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">Name</p>
          <p className="mt-1 font-semibold text-slate-950">{user?.name}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">Email</p>
          <p className="mt-1 font-semibold text-slate-950">{user?.email}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">Role</p>
          <p className="mt-1 font-semibold text-slate-950">{String(user?.role || "").replaceAll("_", " ")}</p>
        </div>
      </section>
      <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4 shadow-soft">
        <h2 className="text-base font-bold text-slate-950">Edit Profile</h2>
        <form className="mt-4 grid gap-4 md:max-w-md" onSubmit={handleSubmit(onSubmit)}>
          <Field label="Name" error={errors.name?.message}>
            <input className={inputClass} {...register("name")} />
          </Field>
          {message ? <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div> : null}
          {error ? <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-danger">{error}</div> : null}
          <Button disabled={isSubmitting}>
            <FiSave /> Save Profile
          </Button>
        </form>
      </section>
    </div>
  );
}
