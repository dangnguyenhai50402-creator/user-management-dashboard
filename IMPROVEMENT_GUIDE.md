# Hướng dẫn cải thiện dự án user-management-dashboard

Dựa trên cấu trúc repo (Next.js + Mantine + RHF + Zod + Zustand), đây là plan cụ thể.

---

## 1. Bug cần sửa ngay (từ bài test)

### Bug: `setQueryData` + `invalidateQueries` trong `onSuccess`

```ts
// hooks/use-create-user.ts — TRƯỚC (có bug)
onSuccess: (newUser) => {
  queryClient.setQueryData(['users'], old => [...old, newUser])  // Bước 1
  queryClient.invalidateQueries({ queryKey: ['users'] })         // Bước 2 overwrite Bước 1
},

// SAU (fix)
onMutate: async (variables) => {
  await queryClient.cancelQueries({ queryKey: ['users'] })
  const snapshot = queryClient.getQueryData(['users'])
  queryClient.setQueryData(['users'], old => [
    { id: Date.now() * -1, ...variables }, // placeholder ID âm, không phải Math.random()
    ...(old ?? []),
  ])
  return { snapshot }
},
onError: (_err, _vars, context) => {
  queryClient.setQueryData(['users'], context?.snapshot)
},
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: ['users'] })
},
```

---

## 2. Nâng cấp Form (bài học hôm nay)

### Trước: Plain input + manual state
```tsx
// components/user-form.tsx — CŨ (giả định từ cấu trúc dự án)
const [name, setName] = useState('')
const [errors, setErrors] = useState({})

<input
  value={name}
  onChange={e => setName(e.target.value)}
  className="border rounded p-2"
/>
{errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
```

### Sau: RHF + Zod + Mantine (nhất quán với tech stack hiện có)

Dự án đang dùng **Mantine** (không phải Shadcn). Pattern với Mantine:

```tsx
// components/user-form.tsx — MỚI
import { TextInput, Button } from '@mantine/core'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Controller } from 'react-hook-form'

// Schema tập trung trong lib/validations/user.schema.ts
const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
  resolver: zodResolver(createUserSchemaStrict),
  defaultValues: { name: '', email: '', phone: '', website: '' },
})

// Mantine dùng Controller (không phải register trực tiếp)
<Controller
  name="name"
  control={control}
  render={({ field }) => (
    <TextInput
      {...field}
      label="Tên"
      placeholder="Nguyen Van A"
      error={errors.name?.message}  // Mantine nhận error string trực tiếp
      required
    />
  )}
/>

<Controller
  name="email"
  control={control}
  render={({ field }) => (
    <TextInput
      {...field}
      type="email"
      label="Email"
      placeholder="a@example.com"
      error={errors.email?.message}
      required
    />
  )}
/>

<Button
  type="submit"
  loading={isSubmitting}  // Mantine Button có prop loading built-in
  disabled={isSubmitting}
>
  Tạo user
</Button>
```

---

## 3. Tách schema ra file riêng

```
lib/
  validations/
    user.schema.ts    ← tất cả Zod schema liên quan đến User
    auth.schema.ts    ← nếu có auth form
```

```ts
// lib/validations/user.schema.ts
import { z } from 'zod'

export const userSchema = z.object({
  name: z.string().min(2, 'Tên ít nhất 2 ký tự').max(50),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().optional().or(z.literal('')),
  website: z.string().url().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  if (!data.phone?.trim() && !data.website?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Phải có ít nhất Phone hoặc Website',
      path: ['phone'],
    })
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Phải có ít nhất Phone hoặc Website',
      path: ['website'],
    })
  }
})

export type UserFormValues = z.infer<typeof userSchema>
```

---

## 4. Edit form — thêm reset() pattern

```tsx
// components/edit-user-form.tsx
const { data: user } = useQuery({
  queryKey: ['users', userId],
  queryFn: () => fetchUser(userId),
})

useEffect(() => {
  if (user) {
    reset({
      name: user.name,
      email: user.email,
      phone: user.phone ?? '',
      website: user.website ?? '',
    })
  }
}, [user, reset])

// Disable Save khi không có thay đổi
<Button disabled={!isDirty || isSubmitting}>
  Lưu thay đổi
</Button>
```

---

## 5. Gợi ý cải thiện thêm ngoài bài học

### Thay Zustand bằng React Query cho server state

Zustand hợp lý cho UI state (modal open/close, theme...). Nhưng nếu đang dùng Zustand để lưu users list từ server, hãy chuyển sang React Query cache:

```tsx
// ❌ Zustand cho server state (antipattern)
const useUserStore = create(set => ({
  users: [],
  setUsers: (users) => set({ users }),
}))

// ✓ React Query cache (single source of truth)
const { data: users } = useQuery({ queryKey: ['users'], queryFn: fetchUsers })
```

### Thêm `isDirty` UX

```tsx
// Chỉ enable Save khi có thay đổi thật sự
<Button disabled={!isDirty}>Lưu</Button>

// Hỏi confirm khi navigate away với unsaved changes
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isDirty) e.preventDefault()
  }
  window.addEventListener('beforeunload', handleBeforeUnload)
  return () => window.removeEventListener('beforeunload', handleBeforeUnload)
}, [isDirty])
```

### Map server errors vào form fields

```tsx
// Khi server trả về lỗi field-specific
onError: (err) => {
  const serverErrors = (err as ApiError).fields
  // { email: 'Email đã tồn tại', phone: 'Số điện thoại không hợp lệ' }
  Object.entries(serverErrors).forEach(([field, message]) => {
    form.setError(field as keyof UserFormValues, { message })
  })
}
```

### Skeleton loading cho edit form

```tsx
// Khi đang fetch user để edit, disable toàn bộ form
{isLoading ? (
  <Skeleton height={36} mb="sm" />  // Mantine Skeleton
) : (
  <Controller name="name" render={...} />
)}
```

---

## 6. Commit plan

```bash
git checkout -b feat/rhf-zod-form-improvement

# Bước 1: Sửa bug mutation
git add hooks/use-create-user.ts
git commit -m "fix: remove setQueryData+invalidate antipattern in use-create-user"

# Bước 2: Tách schema
git add lib/validations/user.schema.ts
git commit -m "feat: extract user Zod schema with superRefine cross-field validation"

# Bước 3: Nâng cấp form
git add components/user-form.tsx
git commit -m "feat: replace plain inputs with Mantine Controller + FormField pattern"

# Bước 4: Edit form
git add components/edit-user-form.tsx
git commit -m "feat: add edit form with reset(defaultValues) + isDirty UX"

# Bước 5: Kết hợp mutation
git commit -m "feat: integrate form submit with useMutation + toast.promise + setError"

git push origin feat/rhf-zod-form-improvement
```
