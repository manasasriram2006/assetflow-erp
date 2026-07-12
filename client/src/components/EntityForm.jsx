import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "./Button";
import { Field, inputClass } from "./Input";

export function EntityForm({ schema, fields, defaultValues, submitLabel = "Save", onSubmit, onCancel, framed = true }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({ resolver: schema ? zodResolver(schema) : undefined, defaultValues });

  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  return (
    <form className={`grid gap-3 md:grid-cols-2 xl:grid-cols-3 ${framed ? "surface animate-enter p-4" : ""}`} onSubmit={handleSubmit(onSubmit)}>
      {fields.map((field) => (
        <Field key={field.name} label={field.label} error={errors[field.name]?.message}>
          {field.type === "select" ? (
            <select className={inputClass} {...register(field.name)}>
              {(field.options || []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : field.type === "textarea" ? (
            <textarea className={`${inputClass} min-h-20`} {...register(field.name)} />
          ) : (
            <input type={field.type || "text"} className={inputClass} {...register(field.name)} />
          )}
        </Field>
      ))}
      <div className="flex items-end gap-2">
        <Button disabled={isSubmitting}>{submitLabel}</Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}
