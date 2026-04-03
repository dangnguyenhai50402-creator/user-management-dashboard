"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { userSchema, UserFormValues } from "@/lib/validators";
import { useEffect } from "react";

type Props = {
  defaultValues?: UserFormValues;
  onSubmit: (data: UserFormValues) => void;
  isLoading?: boolean;
};

export default function UserForm({
  defaultValues,
  onSubmit,
  isLoading,
}: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    mode: "onChange",
    defaultValues: defaultValues || {
      name: "",
      email: "",
      phone: "",
      website: "",
      company: { name: "" },
    },
  });
  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);
  // format website
  const formatWebsite = (value: string) => {
    if (!value) return "";

    let url = value.trim();

    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    return url;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-md">
      {/* NAME */}
      <div>
        <input
          {...register("name")}
          placeholder="Tên"
          className="w-full border p-2 rounded"
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{errors.name.message}</p>
        )}
      </div>

      {/* EMAIL */}
      <div>
        <input
          {...register("email")}
          placeholder="Email"
          className="w-full border p-2 rounded"
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}
      </div>

      {/* PHONE */}
      <div>
        <input
          {...register("phone")}
          placeholder="Số điện thoại"
          className="w-full border p-2 rounded"
        />
        {errors.phone && (
          <p className="text-red-500 text-sm">{errors.phone.message}</p>
        )}
      </div>

      {/* WEBSITE */}
      <div>
        <input
          {...register("website")}
          placeholder="Website"
          className="w-full border p-2 rounded"
          onBlur={(e) => {
            const formatted = formatWebsite(e.target.value);
            setValue("website", formatted, { shouldValidate: true });
          }}
        />
        {errors.website && (
          <p className="text-red-500 text-sm">{errors.website.message}</p>
        )}

        {/* Preview link */}
        {watch("website") && (
          <a
            href={watch("website")}
            target="_blank"
            className="text-blue-500 text-sm underline"
          >
            {watch("website")}
          </a>
        )}
      </div>

      {/* COMPANY NAME */}
      <div>
        <input
          {...register("company.name")}
          placeholder="Tên công ty"
          className="w-full border p-2 rounded"
        />
        {errors.company?.name && (
          <p className="text-red-500 text-sm">{errors.company.name.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!isValid || isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isLoading ? "Đang xử lý..." : "Submit"}
      </button>
    </form>
  );
}
