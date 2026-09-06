# Frontend coding conventions

Rules for `frontend/`. Every rule includes why it exists, because a rule whose reason is
unknown gets worked around rather than followed.

ESLint and Prettier already enforce formatting and a long list of correctness rules. This
document covers the decisions they cannot.

---

## Where code goes

```
src/
├── app/                    # shell: providers, router, layout, shared pages
├── components/ui/          # shadcn/ui primitives — vendored, edit sparingly
├── features/<feature>/     # everything about one feature
│   ├── api/                # request functions + TanStack Query hooks
│   ├── components/         # components used only by this feature
│   └── pages/              # route entry points
├── lib/                    # api client, env, small shared utilities
└── test/                   # test helpers
```

**`features/<feature>/` mirrors `backend/.../Features/<Feature>/`.** One feature request
maps to two predictable folders. Keep the names in step.

**A component used by one feature lives in that feature.** Promote it to
`src/components/` only when a second feature imports it — and if that happens twice,
question whether the features are really separate.

**Never import across features.** `features/leave` must not import from
`features/employees`. If it needs something, that thing belongs in `lib/` or
`components/`. Cross-feature imports are how a modular frontend quietly becomes one
tangled unit.

**Two personas, one tenant.** `src/lib/demo-session.ts` is Acme Consulting + Akram
Hossain. Continue picks Employee or Admin. Employee nav is Home / Time off / Inbox —
`useCurrentEmployee` (`GET /api/employees/me`), not a list page. Admin nav is Dashboard /
Employees / Approvals / Organization (`docs/ux-admin`). Do not mix those shells. Do not
read `new Date()` for the demo clock. The mushroom avatar is the only photo; no upload.

### File and symbol naming

| Thing                    | Convention        | Example                     |
| ------------------------ | ----------------- | --------------------------- |
| Files and directories    | `kebab-case`      | `department-form.tsx`        |
| Components               | `PascalCase`      | `DepartmentForm`             |
| Hooks                    | `useCamelCase`    | `useDepartments`             |
| Everything else          | `camelCase`       | `listDepartments`            |
| Types and interfaces     | `PascalCase`      | `CreateDepartmentInput`      |

One exported component per file, named after the file.

---

## Server state

**TanStack Query owns everything that comes from the API. `useState` owns nothing that
does.** Server data in `useState` means writing caching, deduplication, refetching, and
loading state by hand — and getting one of them subtly wrong.

**Router loaders are not used.** Two caches with different staleness rules is one cache too
many.

### The three layers

```
departments-api.ts      → fetch functions and their types. Knows URLs. No React.
departments-queries.ts  → query keys, useQuery, useMutation. Knows the cache.
components / pages      → call hooks. Know neither URLs nor cache keys.
```

A component must never call `apiFetch` directly. When the endpoint changes, exactly one
file should change.

### Query keys come from a factory

```typescript
export const departmentKeys = {
  all: ['departments'] as const,
  list: (params: ListDepartmentsParams) => [...departmentKeys.all, 'list', params] as const,
};
```

Hand-written key arrays scattered across files drift apart, and then invalidation silently
stops matching and the UI shows stale data with no error anywhere. `all` is the prefix that
invalidates everything the feature cached.

### Mutations invalidate; they do not patch the cache

```typescript
onSuccess: async () => {
  await queryClient.invalidateQueries({ queryKey: departmentKeys.all });
},
```

The server decides sort order, pagination, and computed fields. Guessing where a new row
lands gets it wrong, and the bug only shows on page two.

Optimistic updates are worth the extra code for a toggle the user expects to feel instant.
They are not worth it for a create, where the server assigns the id.

### Wrap the mutation function

```typescript
// ✅ TanStack Query calls mutationFn with (variables, context).
mutationFn: (input) => createDepartment(input),

// ❌ Passes the query context into whatever optional second parameter exists next.
mutationFn: createDepartment,
```

### Pass the abort signal through

```typescript
queryFn: ({ signal }) => listDepartments(params, signal),
```

Navigating away should cancel the request, not wait for it.

---

## The API client

`lib/api-client.ts` is the only place that calls `fetch`. It attaches the tenant header,
serialises bodies, and turns every failure into an `ApiError`.

```typescript
try {
  await createMutation.mutateAsync(values);
} catch (error) {
  if (error instanceof ApiError && error.status === 409) {
    // ...
  }
}
```

- **`ApiError` is the only error type the API layer throws.** Components never touch
  `Response` or guess at a body shape.
- **`error.fieldErrors`** holds server-side validation messages keyed by field. Show them
  on the field that caused them; a form-level "validation failed" makes the user hunt.
- **`error.isNetworkError`** distinguishes "the server said no" from "there was no server",
  which need different messages.
- **Server field names are PascalCase** (`Name`) and form fields are camelCase (`name`).
  Compare case-insensitively.

---

## Components

- **Function declarations, not `const` arrows.** `function Foo() {}` hoists, stack traces
  name it, and it reads as a declaration rather than an assignment.
- **No `React.FC`.** It adds nothing and historically got children typing wrong. Type the
  props parameter.
- **Props inline for one or two, an `interface` beyond that.**
- **Keep components under roughly 150 lines.** Past that, there is more than one thing in
  the file. Extract the inner piece, not a wrapper around the whole.
- **Every list item needs a stable `key`** — the entity id, never the array index. Index
  keys make React reuse the wrong DOM node when the list reorders, which shows up as input
  values jumping between rows.

### `useEffect` is a last resort

Almost every `useEffect` in a new component is a mistake. Before writing one:

- Fetching data? `useQuery`.
- Deriving a value from props or state? Compute it during render.
- Responding to a user action? Do it in the event handler.
- Resetting state when a prop changes? Give the component a `key`.

A legitimate `useEffect` synchronises with something outside React: a subscription, a
timer, a browser API, an imperative library. If it does not, delete it.

### Pages own loading, error, and empty states

```tsx
const { data, isPending, isError, error } = useDepartments();

if (isPending) return <LoadingState />;
if (isError) return <p role="alert">{error.message}</p>;
if (data.items.length === 0) return <EmptyState />;
```

All four states, every time. A page that renders nothing while loading looks broken, and an
empty list that looks identical to a failed request is worse than an error message.

Skeletons over spinners: they preserve layout, so the page does not jump when data lands.

---

## Forms

`react-hook-form` with a `zod` schema through `zodResolver`.

```tsx
const schema = z.object({
  name: z.string().trim().min(2, 'Use at least 2 characters.').max(200, '...'),
});
```

- **Client validation mirrors the server's data annotations** and is for instant feedback
  only. The server's copy is the one that is trusted. Keep the two in step; when they
  disagree, the server wins.
- **`onSubmit` must return `void`.** Wrap the async handler: `onSubmit={(e) => void handler(e)}`.
- **Show server errors on the field that caused them** via `setError`, falling back to a
  toast only for errors that belong to no field.
- **Disable the submit button while in flight** and show that something is happening.
  Otherwise the user clicks twice and creates two records.
- **Error messages tell the user what to do.** "Use at least 2 characters", not "Invalid".

---

## Styling

Tailwind utilities with the semantic tokens defined in `src/index.css`.

- **Semantic colours only:** `bg-background`, `text-muted-foreground`, `border-border`,
  `bg-primary`, `bg-success`, `bg-warning`. Never `bg-white`, `text-gray-500`, or a hex
  value. Hard-coded colours break dark mode and cannot be rethemed. Primary is electric
  blue (see `docs/ux-employee/00-design-system.html`), not the stock shadcn near-black.
- **Merge classes with `cn()`**, never string concatenation. `"p-2 " + className` leaves
  both `p-2` and an incoming `p-4` in the markup, and which wins depends on stylesheet
  order.
- **Arbitrary values (`w-[347px]`) need a reason.** They are usually a sign the design
  should use a scale value.
- **No CSS modules, no styled-components, no inline `style`.** One styling mechanism.
  Inline `style` is acceptable only for a genuinely computed value such as a progress
  width.

### shadcn/ui primitives

`src/components/ui/` is vendored from the shadcn registry. Prefer `npx shadcn@latest add
<component>` over hand-writing one. Editing a primitive is allowed — that is the point of
copy-in components — but keep changes minimal so the CLI can update them later without a
painful merge.

---

## TypeScript

`strict` plus `noUncheckedIndexedAccess`, `verbatimModuleSyntax`, and
`erasableSyntaxOnly`.

- **No `any`, ever.** Use `unknown` and narrow. ESLint fails the build on `any`.
- **No non-null assertions (`!`).** Narrow with a check that throws or returns a message a
  human can act on. `!` is a promise to the compiler you cannot keep.
- **`import type` for type-only imports.** The bundler strips imports without reading
  types, so a value import of a type survives into the output.
- **No `enum` and no `namespace`** — `erasableSyntaxOnly` forbids them. Use a union of
  string literals, which is also narrower and serialises directly.
- **Discriminated unions over optional-field soup.** `{ status: 'loading' } | { status:
  'ready'; data: T }` makes the impossible state unrepresentable; `{ loading?: boolean;
  data?: T }` invites it.
- **Array access is `T | undefined`.** Handle it rather than asserting it away.

---

## Accessibility

Not optional. This is an HR tool: it will be used by people with screen readers, and in
several jurisdictions inaccessibility is a legal problem.

- Every input has a `<Label>` with a matching `htmlFor`. Use `sr-only` when the design has
  no room for visible text.
- Invalid inputs get `aria-invalid` and `aria-describedby` pointing at the message.
- Error messages carry `role="alert"` so they are announced.
- Interactive elements are `<button>` or `<a>`. A `<div onClick>` is not focusable and does
  not respond to the keyboard.
- Icons are `aria-hidden="true"` unless they are the only content, in which case the
  element needs an accessible name.
- Never remove focus outlines. Restyle them if they clash.

---

## Tests

Vitest, React Testing Library, and `@testing-library/user-event`.

- **Render through `renderWithProviders`** from `src/test/`, which gives each test a fresh
  `QueryClient` with retries off.
- **Mock the feature's `*-api` module, never the query hooks.** Mocking at the network
  boundary means the test exercises the real hooks, the real cache invalidation, and the
  real component tree — the parts that actually break. Mocking the hooks tests the mock.
- **Query the way a user would:** `getByRole`, `getByLabelText`, `getByText`. Reach for
  `data-testid` only when nothing else identifies the element, which is rare and usually a
  hint the markup needs a label.
- **`userEvent`, not `fireEvent`.** `userEvent` produces the full event sequence a real
  interaction does — focus, keydown, input, change — which is what the component actually
  responds to.
- **Assert what the user sees.** That a mock was called is weak evidence; that the new row
  appears on screen is the behaviour.
- **`await` every query that follows an interaction** (`findBy*`, `waitFor`). React 19
  batches updates, so a synchronous assertion runs before the re-render.

---

## Forbidden patterns

| Never                                                    | Instead                                                  |
| -------------------------------------------------------- | -------------------------------------------------------- |
| `any`                                                    | `unknown` and narrow                                     |
| `!` non-null assertion                                   | A check that throws with a real message                   |
| `useEffect` to fetch data                                | `useQuery`                                               |
| `useState` holding server data                           | `useQuery`                                               |
| `fetch` outside `lib/api-client.ts`                      | `api.get` / `api.post` via a feature `*-api.ts`           |
| Inline query key arrays                                  | The feature's key factory                                 |
| Importing from another feature                           | Move the shared thing to `lib/` or `components/`          |
| `bg-white`, `text-gray-500`, hex colours                  | Semantic tokens from `index.css`                          |
| String-concatenated `className`                          | `cn()`                                                   |
| Array index as `key`                                     | A stable entity id                                        |
| `React.FC`                                               | A typed props parameter                                   |
| `enum` or `namespace`                                    | A union of string literals                                |
| `fireEvent` in tests                                     | `userEvent`                                              |
| Mocking query hooks in tests                             | Mock the `*-api` module                                   |
| `console.log` left in committed code                     | Delete it, or log deliberately through a real logger      |
| A secret or API key in `VITE_*`                          | Nothing — `VITE_*` is inlined into the public bundle       |
