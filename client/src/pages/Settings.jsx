import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiSave } from "react-icons/fi";
import { PageHeader } from "../components/PageHeader";
import { Button } from "../components/Button";
import { Alert } from "../components/Feedback";
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
      <section className="surface animate-enter grid gap-4 p-4 md:grid-cols-2">
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
      <section className="surface animate-enter mt-4 p-4">
        <h2 className="text-base font-bold text-slate-950">Edit Profile</h2>
        <form className="mt-4 grid gap-4 md:max-w-md" onSubmit={handleSubmit(onSubmit)}>
          <Field label="Name" error={errors.name?.message}>
            <input className={inputClass} {...register("name")} />
          </Field>
          <Alert tone="success" className="mb-0">{message}</Alert>
          <Alert tone="error" className="mb-0">{error}</Alert>
          <Button disabled={isSubmitting}>
            <FiSave /> Save Profile
          </Button>
        </form>
      </section>
    </div>
  );
}
