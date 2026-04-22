# React Hook Form + Zod + Shadcn/UI — Lý thuyết đầy đủ

> **Mục tiêu:** Thay thế hoàn toàn `plain <input>` + manual state → RHF + Zod + Shadcn/UI Form.

---

## Mục lục

1. [Tại sao cần React Hook Form?](#1-tại-sao-cần-react-hook-form)
2. [useForm — API cốt lõi](#2-useform--api-cốt-lõi)
3. [Controller — bridge giữa RHF và Shadcn](#3-controller--bridge-giữa-rhf-và-shadcn)
4. [watch, setValue, reset](#4-watch-setvalue-reset)
5. [Zod Schema Validation](#5-zod-schema-validation)
6. [zodResolver — kết nối Zod với RHF](#6-zodresolver--kết-nối-zod-với-rhf)
7. [Shadcn/UI Form components](#7-shadcnui-form-components)
8. [Edit form với reset(defaultValues)](#8-edit-form-với-resetdefaultvalues)
9. [Kết hợp với useMutation](#9-kết-hợp-với-usemutation)
10. [Phân tích bài test của bạn](#10-phân-tích-bài-test-của-bạn)

---

## 1. Tại sao cần React Hook Form?

### Cách cũ: manual useState

```tsx
function UserForm() {
  // Mỗi field = 1 state → n field = n state, n setState
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!name) errs.name = 'Tên là bắt buộc'
    if (!email.includes('@')) errs.email = 'Email không hợp lệ'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    await createUser({ name, email })
    setIsSubmitting(false)
  }
  // ... render
}
```

**Vấn đề:**
- 10 fields = 10+ state + 1 errors object + 1 isSubmitting = 12+ useState
- Mỗi `<input>` re-render cả component khi gõ (performance)
- Validation logic phân tán, không type-safe
- Reset form thủ công: `setName(''), setEmail(''), ...`

### Cách mới: React Hook Form

```tsx
function UserForm() {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: '', email: '' },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    await createUser(values) // values đã được validate và type-safe
  })

  return (
    <form onSubmit={onSubmit}>
      <input {...form.register('name')} />
      {form.formState.errors.name && <p>{form.formState.errors.name.message}</p>}
    </form>
  )
}
```

**Lợi ích:**
- Uncontrolled by default → KHÔNG re-render khi gõ (performance)
- Validation tập trung trong Zod schema
- `formState` nhất quán: `errors`, `isSubmitting`, `isDirty`, `isValid`
- `reset()` xóa tất cả field cùng lúc

---

## 2. useForm — API cốt lõi

```tsx
const {
  register,       // attach vào native input
  handleSubmit,   // wrap onSubmit, tự prevent default + validate
  formState,      // { errors, isSubmitting, isDirty, isValid, dirtyFields }
  watch,          // theo dõi giá trị field real-time
  setValue,       // set giá trị field programmatically
  reset,          // reset về defaultValues (hoặc giá trị mới)
  control,        // truyền cho <Controller> component
  getValues,      // lấy giá trị hiện tại (không trigger re-render)
} = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { name: '', email: '' },
  mode: 'onBlur',  // khi nào trigger validation: onChange | onBlur | onSubmit | all
})
```

### register

```tsx
// Attach vào native HTML input
<input {...register('name')} />
// Tương đương:
<input
  name="name"
  ref={...}        // RHF dùng ref để đọc value (uncontrolled)
  onChange={...}   // trigger validation
  onBlur={...}
/>
```

### handleSubmit

```tsx
// handleSubmit(successFn, errorFn?)
<form onSubmit={handleSubmit(
  (values) => { /* chỉ chạy khi validation pass */ },
  (errors) => { /* chạy khi validation fail */ }
)}>
```

### formState

```tsx
const { errors, isSubmitting, isDirty, isValid } = form.formState

// errors: object chứa lỗi theo field name
// errors.name.message = string lỗi từ Zod
errors.name?.message     // 'Tên là bắt buộc'
errors.email?.message    // 'Email không hợp lệ'

// isSubmitting: true trong lúc onSubmit đang chạy
// isDirty: true nếu user đã chỉnh sửa ít nhất 1 field
// isValid: true nếu tất cả field pass validation
```

---

## 3. Controller — bridge giữa RHF và Shadcn

RHF dùng **uncontrolled** (refs). Nhưng nhiều UI library (Shadcn, MUI, Mantine...) dùng **controlled** (value + onChange). `<Controller>` là cầu nối giữa 2 thế giới này.

```tsx
// ❌ KHÔNG làm vậy với Shadcn Input:
<Input {...register('name')} />
// Shadcn Input không forward ref đúng cách → RHF không đọc được value

// ✓ ĐÚNG: dùng Controller
<Controller
  name="name"
  control={form.control}
  render={({ field, fieldState }) => (
    <Input
      {...field}                    // value + onChange + onBlur + ref
      className={fieldState.error ? 'border-red-500' : ''}
    />
  )}
/>
```

### Hoặc dùng Form components của Shadcn (recommended):

```tsx
<FormField
  control={form.control}
  name="email"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Email</FormLabel>
      <FormControl>
        <Input placeholder="example@email.com" {...field} />
      </FormControl>
      <FormMessage /> {/* tự hiển thị errors.email.message */}
    </FormItem>
  )}
/>
```

`<FormMessage>` tự lấy error message từ context — không cần viết `{errors.email?.message}` thủ công.

---

## 4. watch, setValue, reset

### watch — theo dõi giá trị real-time

```tsx
// Watch một field
const role = watch('role')  // re-render khi role thay đổi

// Dùng để show/hide field có điều kiện:
{role === 'admin' && (
  <FormField name="adminCode" ... />
)}

// Watch toàn bộ form (cẩn thận performance):
const allValues = watch()

// Subscribe không re-render component:
useEffect(() => {
  const sub = form.watch((value, { name }) => {
    console.log('Changed:', name, value)
  })
  return () => sub.unsubscribe()
}, [])
```

### setValue — set giá trị programmatically

```tsx
// Khi cần set value từ bên ngoài form (select từ map, copy-paste...)
setValue('city', selectedCity.name)
setValue('coordinates', { lat: 10.7, lng: 106.7 })

// Options:
setValue('name', 'Alice', {
  shouldValidate: true,   // trigger validation ngay
  shouldDirty: true,      // đánh dấu field là dirty
})
```

### reset — reset form

```tsx
// Reset về defaultValues ban đầu
form.reset()

// Reset với giá trị mới (dùng cho edit form):
form.reset({
  name: user.name,
  email: user.email,
  phone: user.phone,
})
// Sau reset: isDirty = false, errors = {}, tất cả field về giá trị mới
```

---

## 5. Zod Schema Validation

### Cơ bản

```tsx
import { z } from 'zod'

const userSchema = z.object({
  name: z.string()
    .min(2, 'Tên ít nhất 2 ký tự')
    .max(50, 'Tên tối đa 50 ký tự'),

  email: z.string()
    .email('Email không hợp lệ'),

  age: z.number()
    .min(18, 'Phải từ 18 tuổi')
    .max(100, 'Tuổi không hợp lệ'),

  website: z.string()
    .url('URL không hợp lệ')
    .optional(),                     // không bắt buộc

  bio: z.string().nullable(),        // có thể là null

  role: z.enum(['admin', 'user', 'viewer']),

  phone: z.string()
    .regex(/^\+?[0-9]{10,15}$/, 'Số điện thoại không hợp lệ')
    .optional(),
})

// Infer TypeScript type từ schema (không cần viết type riêng!)
type UserFormValues = z.infer<typeof userSchema>
// Tương đương:
// type UserFormValues = {
//   name: string
//   email: string
//   age: number
//   website?: string
//   bio: string | null
//   role: 'admin' | 'user' | 'viewer'
//   phone?: string
// }
```

### .refine() — custom validation đơn giản

```tsx
const passwordSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],   // lỗi hiển thị ở field confirmPassword
  }
)
```

### .superRefine() — custom validation phức tạp

```tsx
// Dùng khi cần nhiều lỗi từ 1 validation, hoặc logic phức tạp
const contactSchema = z.object({
  phone: z.string().optional(),
  website: z.string().optional(),
  email: z.string().email().optional(),
}).superRefine((data, ctx) => {
  // "phone HOẶC website phải có ít nhất 1"
  if (!data.phone && !data.website) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Phải cung cấp ít nhất phone hoặc website',
      path: ['phone'],   // gắn lỗi vào field phone
    })
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Phải cung cấp ít nhất phone hoặc website',
      path: ['website'],  // gắn lỗi vào field website cùng lúc
    })
  }

  // Thêm validation khác trong cùng superRefine:
  if (data.website && !data.website.startsWith('https')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Website phải dùng HTTPS',
      path: ['website'],
    })
  }
})
```

### Phân tích điểm tốt và chỗ cải thiện trong bài test

Dựa trên cấu trúc repo (Next.js + Mantine + RHF + Zod), một số pattern thường gặp:

```tsx
// ⚠️ Điển hình: schema có nhưng dùng không hết
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),     // ← optional nhưng không có cross-field validation
  website: z.string().optional(),   // ← cùng vấn đề
})

// ✓ Cải thiện: thêm .superRefine() để require 1 trong 2
const schema = z.object({ ... }).superRefine((data, ctx) => {
  if (!data.phone?.trim() && !data.website?.trim()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: '...', path: ['phone'] })
  }
})

// ⚠️ Điển hình: dùng plain <input> thay Mantine/Shadcn Input
<input {...register('name')} className="border p-2" />

// ✓ Cải thiện: dùng UI library nhất quán
<Controller name="name" control={control} render={({ field }) =>
  <TextInput {...field} label="Tên" error={errors.name?.message} />
} />
```

---

## 6. zodResolver — kết nối Zod với RHF

```bash
npm install @hookform/resolvers zod
```

```tsx
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
})

const form = useForm({
  resolver: zodResolver(schema),
  // zodResolver tự động:
  // 1. Validate với Zod khi submit (hoặc onChange/onBlur tùy mode)
  // 2. Map Zod errors → RHF errors (với đúng path)
  // 3. Infer types nếu bạn dùng z.infer<typeof schema>
})
```

---

## 7. Shadcn/UI Form components

Shadcn cung cấp `<Form>`, `<FormField>`, `<FormItem>`, `<FormLabel>`, `<FormControl>`, `<FormMessage>` — tất cả dùng React Context để chia sẻ form state.

```tsx
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

function UserForm() {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: '', email: '' },
  })

  return (
    // Form nhận formContext từ useForm
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tên *</FormLabel>
              <FormControl>
                {/* field = { value, onChange, onBlur, ref, name } */}
                <Input placeholder="Nguyen Van A" {...field} />
              </FormControl>
              {/* Tự hiển thị errors.name.message từ context */}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vai trò</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn vai trò" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

      </form>
    </Form>
  )
}
```

**Tại sao không dùng plain `<input>`:**
- Shadcn Input có styling, focus ring, error state nhất quán với design system
- `<FormMessage>` tự lấy error từ context — không duplicate `{errors.name?.message}`
- `<FormLabel>` kết nối htmlFor tự động với input id

---

## 8. Edit form với reset(defaultValues)

Pattern phổ biến: form Create vs Edit dùng chung 1 component.

```tsx
function UserForm({ userId }: { userId?: number }) {
  const isEdit = !!userId

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {          // giá trị mặc định khi CREATE
      name: '',
      email: '',
      phone: '',
    },
  })

  // Fetch user khi EDIT
  const { data: user } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => api.getUser(userId!),
    enabled: isEdit,
  })

  // ════════════════════════════════════════════════════════
  // KEY PATTERN: reset() khi data fetch về
  //
  // KHÔNG được dùng defaultValues trực tiếp từ data vì:
  // 1. Data fetch sau khi useForm() chạy
  // 2. useForm() chỉ đọc defaultValues 1 lần (lúc init)
  //
  // GIẢI PHÁP: dùng reset() trong useEffect khi data sẵn sàng
  // ════════════════════════════════════════════════════════
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        phone: user.phone ?? '',
        website: user.website ?? '',
      })
      // Sau reset: isDirty=false (user chưa thay đổi gì)
    }
  }, [user, form])

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* ... fields ... */}
        {/* isDirty: chỉ enable Save khi user thực sự thay đổi */}
        <Button disabled={!form.formState.isDirty || form.formState.isSubmitting}>
          {isEdit ? 'Lưu thay đổi' : 'Tạo user'}
        </Button>
      </form>
    </Form>
  )
}
```

---

## 9. Kết hợp với useMutation

```tsx
function CreateUserForm() {
  const queryClient = useQueryClient()
  const form = useForm<UserFormValues>({ resolver: zodResolver(schema) })

  const createMutation = useMutation({
    mutationFn: api.createUser,
    onSuccess: (newUser) => {
      toast.success(`Đã tạo ${newUser.name}`)
      form.reset()  // reset form sau khi create thành công
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
    onError: (err) => {
      toast.error((err as Error).message)
      // Có thể set lỗi vào form:
      form.setError('email', { message: 'Email đã tồn tại' })
    },
  })

  // ════════════════════════════════════════════════════════
  // isSubmitting từ formState vs isPending từ mutation — khác nhau:
  //
  // formState.isSubmitting: true chỉ trong lúc handleSubmit đang chạy
  //   → reset về false sau khi onSubmit() resolve
  //
  // mutation.isPending: true trong lúc API call đang chạy
  //   → chuẩn hơn khi muốn disable button cho đến khi mutation xong
  // ════════════════════════════════════════════════════════
  const onSubmit = form.handleSubmit((values) => {
    createMutation.mutate(values)
    // KHÔNG await ở đây — mutate() là void, dùng onSuccess/onError callback
  })

  return (
    <Form {...form}>
      <form onSubmit={onSubmit}>
        {/* ... fields ... */}
        <Button
          type="submit"
          // Dùng mutation.isPending thay formState.isSubmitting
          // vì formState.isSubmitting reset trước khi API xong
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? (
            <><Loader2 className="animate-spin mr-2" size={16} /> Đang tạo...</>
          ) : 'Tạo user'}
        </Button>
      </form>
    </Form>
  )
}
```

---

## 10. Phân tích bài test của bạn

Dựa trên cấu trúc repo (Next.js + Mantine + RHF + Zod + Zustand), đây là các điểm cần cải thiện theo thứ tự quan trọng:

### Điểm cần sửa ngay

```tsx
// ❌ Bug đã phân tích: invalidateQueries sau setQueryData trong onSuccess
// File: hooks/use-create-user.ts
onSuccess: (newUser) => {
  queryClient.setQueryData(...)
  queryClient.invalidateQueries(...)  // ← vô nghĩa
}

// ✓ Fix: chỉ dùng 1 trong 2 (ưu tiên invalidate trong onSettled)
onSettled: () => {
  queryClient.invalidateQueries({ queryKey: ['users'] })
}
```

### Điểm nâng cấp (bài học hôm nay)

```tsx
// ❌ Trước: plain HTML input không nhất quán
<input
  {...register('name')}
  className="border rounded p-2 w-full"
/>
{errors.name && <p className="text-red-500">{errors.name.message}</p>}

// ✓ Sau: Mantine TextInput (design system nhất quán) hoặc Shadcn
<Controller
  name="name"
  control={control}
  render={({ field }) => (
    <TextInput
      {...field}
      label="Tên"
      placeholder="Nguyen Van A"
      error={errors.name?.message}
      required
    />
  )}
/>
```

### Gợi ý cải thiện ngoài bài học

1. **Thêm `superRefine`** cho cross-field validation (phone OR website required)
2. **Tách schema** ra file riêng `lib/validations/user.schema.ts`
3. **Dùng `isDirty`** để disable Save button khi không có thay đổi
4. **Thêm `setError`** trong `onError` để map server error vào đúng field
5. **Loading state** cho edit form: disable toàn bộ form khi đang fetch user data
6. **`form.reset()`** sau create success để clear form về trạng thái ban đầu
