import { render, screen, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../../context/AuthContext";
import api from "../../utils/api";

// A simple test component that uses the AuthContext hook.
const TestComponent = () => {
  const { user, login, logout, updateToken } = useAuth();

  return (
    <div>
      <div data-testid="user-email">{user ? user.email : "No user"}</div>
      <button
        onClick={() =>
          login({
            token: "new-token",
            user: {
              id: 2,
              email: "test@example.com",
              role: "user",
              companyId: 42,
              token: "",
            },
          })
        }
      >
        Login
      </button>
      <button onClick={logout}>Logout</button>
      <button onClick={() => updateToken("updated-token")}>Update Token</button>
    </div>
  );
};

describe("AuthContext", () => {
  beforeEach(() => {
    jest.spyOn(api, "post").mockResolvedValue({});
    localStorage.clear();
  });

  test("useAuth throws error when used outside of AuthProvider", () => {
    // Define a component that simply calls useAuth.
    const HookComponent = () => {
      useAuth();
      return <div>Hook Component</div>;
    };

    // Render without wrapping in AuthProvider should throw an error.
    expect(() => render(<HookComponent />)).toThrow(
      "useAuth must be used within an AuthProvider"
    );
  });

  test("AuthProvider provides context and handles login", async () => {
    // Wrap TestComponent in AuthProvider.
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initially, there is no user.
    expect(screen.getByTestId("user-email").textContent).toBe("No user");

    // Perform login (simulate click)
    await act(async () => {
      screen.getByText("Login").click();
    });

    // Now, the user email should be updated.
    expect(screen.getByTestId("user-email").textContent).toBe(
      "test@example.com"
    );

    // Also, localStorage should contain the user data.
    const storedUser = localStorage.getItem("user");
    expect(storedUser).toContain("test@example.com");
  });

  test("AuthProvider handles logout", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Log in first.
    await act(async () => {
      screen.getByText("Login").click();
    });
    expect(screen.getByTestId("user-email").textContent).toBe(
      "test@example.com"
    );

    // Use fake timers to deal with setTimeout in logout
    jest.useFakeTimers();

    screen.getByText("Logout").click();

    await act(async () => {
      await Promise.resolve();
    });

    await act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(screen.getByTestId("user-email").textContent).toBe("No user");
    expect(localStorage.getItem("user")).toBeNull();

    jest.useRealTimers();
  });

  test("AuthProvider handles updateToken", async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Log in first.
    await act(async () => {
      screen.getByText("Login").click();
    });
    // Click update token.
    await act(async () => {
      screen.getByText("Update Token").click();
    });
    // Check localStorage token was updated.
    const storedUser = localStorage.getItem("user");
    expect(storedUser).toContain("updated-token");
  });
});
