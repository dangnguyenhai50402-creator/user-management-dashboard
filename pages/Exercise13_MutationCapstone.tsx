/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  BÀI 13 — Kết hợp RHF + useMutation (Capstone)             ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * MỤC TIÊU: Form submit → useMutation → toast + loading + reset
 *
 * ─── LÝ THUYẾT: isSubmitting vs mutation.isPending ────────────
 *
 * formState.isSubmitting:
 *   - true khi handleSubmit đang chạy (synchronous + async)
 *   - reset về false ngay sau khi onSubmit() resolve/reject
 *   - Không biết gì về mutation.isPending
 *
 * mutation.isPending:
 *   - true khi mutationFn đang chạy (network request)
 *   - Chính xác hơn cho việc disable button
 *
 * Ví dụ:
 *   onSubmit = handleSubmit(async (values) => {
 *     mutation.mutate(values)  // mutate() là void, không await
 *     // handleSubmit resolve ngay → isSubmitting = false
 *     // nhưng mutation vẫn đang pending!
 *   })
 *   → Phải dùng mutation.isPending để disable button
 *
 * ─── NHIỆM VỤ ─────────────────────────────────────────────────
 *
 * Form đầy đủ với:
 *   - Validation Zod + superRefine
 *   - useMutation với optimistic update
 *   - toast.promise cho UX
 *   - Button disable chính xác với mutation.isPending
 *   - form.reset() sau success
 *   - form.setError() map server error → field
 */

'use client'

import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  createUserSchemaStrict,
  createUserDefaultValues,
  type CreateUserStrictFormValues,
} from '@/lib/user.schema'
import {
  Form, FormControl, FormField, FormItem,
  FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// ─── API ──────────────────────────────────────────────────────────────────────
interface User {
  id: number
  name: string
  email: string
  phone: string
  website: string
}

async function fetchUsers(): Promise<User[]> {
  const res = await fetch('https://jsonplaceholder.typicode.com/users')
  return res.json()
}

async function createUser(data: CreateUserStrictFormValues): Promise<User> {
  await new Promise(r => setTimeout(r, 1000))
  // Simulate server error cho email đặc biệt
  if (data.email.includes('taken')) {
    throw new Error('EMAIL_TAKEN')
  }
  const res = await fetch('https://jsonplaceholder.typicode.com/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

async function deleteUser(id: number): Promise<void> {
  await new Promise(r => setTimeout(r, 600))
  await fetch(`https://jsonplaceholder.typicode.com/users/${id}`, { method: 'DELETE' })
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Exercise13() {
  const queryClient = useQueryClient()

  const { data: users, isPending: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    staleTime: 30_000,
  })

  // ════════════════════════════════════════════════════════
  // useForm với createUserSchemaStrict (có superRefine)
  // ════════════════════════════════════════════════════════
  const form = useForm<CreateUserStrictFormValues>({
    resolver: zodResolver(createUserSchemaStrict),
    defaultValues: createUserDefaultValues,
    mode: 'onBlur',
  })

  // ════════════════════════════════════════════════════════
  // useMutation: Create user
  // Dùng toast.promise để tự handle loading/success/error toast
  // ════════════════════════════════════════════════════════
  const createMutation = useMutation({
    mutationFn: createUser,

    onMutate: async (newUser) => {
      await queryClient.cancelQueries({ queryKey: ['users'] })
      const snapshot = queryClient.getQueryData<User[]>(['users'])
      // Optimistic: thêm placeholder
      queryClient.setQueryData<User[]>(['users'], old => [
        {
          id: Date.now() * -1,
          name: `⏳ ${newUser.name}`,
          email: newUser.email,
          phone: newUser.phone ?? '',
          website: newUser.website ?? '',
        },
        ...(old ?? []),
      ])
      return { snapshot }
    },

    onSuccess: () => {
      form.reset() // clear form sau create thành công
    },

    onError: (err, _vars, context) => {
      // Rollback optimistic update
      if (context?.snapshot) {
        queryClient.setQueryData(['users'], context.snapshot)
      }

      // Map server error vào đúng field
      const message = (err as Error).message
      if (message === 'EMAIL_TAKEN') {
        form.setError('email', {
          message: 'Email này đã được sử dụng (thử email không chứa "taken")',
        })
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['users'] })
      const snapshot = queryClient.getQueryData<User[]>(['users'])
      queryClient.setQueryData<User[]>(['users'], old =>
        old?.filter(u => u.id !== id) ?? []
      )
      return { snapshot }
    },
    onError: (_err, _id, context) => {
      if (context?.snapshot) {
        queryClient.setQueryData(['users'], context.snapshot)
      }
      toast.error('Xóa thất bại')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  // ════════════════════════════════════════════════════════
  // onSubmit: handleSubmit validate → gọi mutation
  //
  // QUAN TRỌNG: KHÔNG await mutation.mutate()
  //   - mutate() trả về void
  //   - Dùng onSuccess/onError callbacks thay thế
  //
  // Dùng toast.promise với mutateAsync để tự handle toast
  // ════════════════════════════════════════════════════════
  const onSubmit = form.handleSubmit((values) => {
    toast.promise(
      createMutation.mutateAsync(values),
      {
        loading: `Đang tạo ${values.name}...`,
        success: (u) => `Tạo thành công: ${u.name}`,
        error: (e) => {
          const msg = (e as Error).message
          return msg === 'EMAIL_TAKEN' ? 'Email đã tồn tại' : `Lỗi: ${msg}`
        },
      }
    )
  })

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <div className="text-xs font-mono text-violet-500 mb-1">Bài 13</div>
        <h1 className="text-xl font-semibold">RHF + useMutation — Capstone</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Form submit → optimistic update → toast.promise + server error mapping
        </p>
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* ── Form ─────────────────────────────────────────────────────────── */}
        <div className="col-span-2">
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-3">
              <FormField control={form.control} name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tên *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nguyen Van A"
                        {...field}
                        disabled={createMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField control={form.control} name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder='thử "taken@x.com" để test error'
                        {...field}
                        disabled={createMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-2">
                <FormField control={form.control} name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0901234567"
                          {...field}
                          disabled={createMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://..."
                          {...field}
                          disabled={createMutation.isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Note về cross-field rule */}
              <p className="text-xs text-muted-foreground">
                * Phone hoặc Website phải có ít nhất 1
              </p>

              {/*
               * DISABLE LOGIC:
               *   - createMutation.isPending: đang có API call
               *     (isSubmitting không đủ vì reset trước khi API xong)
               */}
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="w-full"
              >
                {createMutation.isPending ? (
                  <><Loader2 size={14} className="animate-spin mr-2" /> Đang tạo...</>
                ) : (
                  <><Plus size={14} className="mr-2" /> Thêm user</>
                )}
              </Button>
            </form>
          </Form>

          {/* isSubmitting vs isPending explanation */}
          <div className="mt-4 rounded-lg border p-3 bg-muted/20 text-xs font-mono space-y-1">
            <p className="text-muted-foreground">{"// isSubmitting vs isPending:"}</p>
            <p>isSubmitting: <span className="text-amber-500">{String(form.formState.isSubmitting)}</span></p>
            <p>mutation.isPending: <span className="text-amber-500">{String(createMutation.isPending)}</span></p>
            <p className="text-muted-foreground pt-1">{"// isSubmitting reset sớm hơn isPending"}</p>
            <p className="text-muted-foreground">{"// → dùng isPending để disable button"}</p>
          </div>
        </div>

        {/* ── User list ─────────────────────────────────────────────────────── */}
        <div className="col-span-3">
          <p className="text-sm font-medium mb-2">
            Users ({users?.length ?? 0})
          </p>
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
            {usersLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải...</p>
            ) : (
              users?.map(u => (
                <div
                  key={u.id}
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                  style={{
                    opacity: u.id < 0 ? 0.5 : 1,
                    borderColor: u.id < 0 ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">
                    {u.id < 0 ? 'pending' : `#${u.id}`}
                  </span>
                  {u.id > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => {
                        toast.promise(
                          deleteMutation.mutateAsync(u.id),
                          {
                            loading: 'Đang xóa...',
                            success: 'Đã xóa',
                            error: 'Xóa thất bại',
                          }
                        )
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 size={12} />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
