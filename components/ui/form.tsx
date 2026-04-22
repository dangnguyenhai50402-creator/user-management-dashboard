"use client"

import * as React from "react"
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

// ─────────────────────────────────────────────────────────
// Form root (wrap toàn bộ form)
// ─────────────────────────────────────────────────────────
export const Form = FormProvider

// ─────────────────────────────────────────────────────────
// Context để FormField biết mình đang handle field nào
// ─────────────────────────────────────────────────────────
type FormFieldContextValue = {
  name: string
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

// ─────────────────────────────────────────────────────────
// FormField (wrapper cho Controller)
// ─────────────────────────────────────────────────────────
export function FormField<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>
>({ ...props }: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

// ─────────────────────────────────────────────────────────
// Hook lấy state của field (error, touched, v.v.)
// ─────────────────────────────────────────────────────────
export function useFormField() {
  const fieldContext = React.useContext(FormFieldContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  return {
    name: fieldContext.name,
    ...fieldState,
  }
}

// ─────────────────────────────────────────────────────────
// UI components
// ─────────────────────────────────────────────────────────

export function FormItem({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />
}

export function FormLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={className ?? "text-sm font-medium"}
      {...props}
    />
  )
}

export function FormControl({
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />
}

export function FormMessage() {
  const { error } = useFormField()

  if (!error) return null

  return (
    <p className="text-sm font-medium text-destructive">
      {error.message}
    </p>
  )
}

export function FormDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { name } = useFormField()

  return (
    <p
      id={`${name}-description`}
      className={className ?? "text-sm text-muted-foreground"}
      {...props}
    />
  )
}