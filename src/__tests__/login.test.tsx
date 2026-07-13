import { render, screen } from "@testing-library/react"
import LoginForm from "@/components/auth/login-form"
import { describe, it, expect, vi } from "vitest"

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: () => ({
    auth: { signInWithPassword: vi.fn() },
  }),
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

describe("LoginForm", () => {
  it("renders email and password inputs with submit button", () => {
    render(<LoginForm />)
    expect(screen.getByLabelText(/email/i)).toBeDefined()
    expect(screen.getByLabelText(/password/i)).toBeDefined()
    expect(screen.getByRole("button", { name: /masuk/i })).toBeDefined()
  })
})
