import React from "react";
import { render, RenderResult } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import * as AuthCtx from "../src/context/AuthContext";

// Explicit type-only import
import type { AuthContextType, User } from "../src/context/AuthContext";

// Pull in the actual context value (not a namespace!)
import { AuthContext } from "../src/context/AuthContext";

// Default mock user (can be overridden per test)
export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 1,
  email: "mock@example.com",
  role: "user",
  companyId: 1,
  token: "mock-token",
  ...overrides,
});

// Default AuthContext mock (can also be overridden per test)
export const createMockAuthContext = (
  userOverrides: Partial<User> = {}
): AuthContextType => {
  const user = createMockUser(userOverrides);
  return {
    user,
    login: jest.fn(),
    logout: jest.fn(),
    updateToken: jest.fn(),
  };
};

// Render using real AuthContext.Provider (useful for component-level tests)
export const renderWithAuth = (
  ui: React.ReactElement,
  {
    userOverrides = {},
    route = "/",
  }: { userOverrides?: Partial<User>; route?: string } = {}
): RenderResult => {
  const mockAuth = createMockAuthContext(userOverrides);

  return render(
    <AuthContext.Provider value={mockAuth}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AuthContext.Provider>
  );
};

/**
 * Render with AuthContext ONLY (no router).
 * Use this for components (like AppRoutes) that already contain their own Router.
 */
export const renderWithAuthOnly = (
  ui: React.ReactElement,
  { userOverrides = {} }: { userOverrides?: Partial<User> } = {}
): RenderResult => {
  const mockAuth = createMockAuthContext(userOverrides);

  return render(
    <AuthContext.Provider value={mockAuth}>
      {ui}
    </AuthContext.Provider>
  );
};

// Mock useAuth() hook directly (useful for route-level or App-wide tests)
export const mockUseAuth = (
  role: "user" | "companyadmin" | "admin" | null
): void => {
  const user = role
    ? {
        id: 1,
        email: `${role}@example.com`,
        role,
        companyId: 123,
        token: "fake-token",
      }
    : null;

  jest.spyOn(AuthCtx, "useAuth").mockReturnValue({
    user,
    login: jest.fn(),
    logout: jest.fn(),
    updateToken: jest.fn(),
  });
};
