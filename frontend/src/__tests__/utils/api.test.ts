import type { AxiosInstance } from "axios";
import MockAdapter from "axios-mock-adapter";

describe("utils/api", () => {
  let api: AxiosInstance;
  let setupInterceptors: (updateToken: (token: string) => void) => void;
  let mock: MockAdapter;
  const TEST_URL = "/test-endpoint";
  const REFRESH_URL = "/auth/refresh";
  const initialToken = "initial-token";
  const newToken = "new-access-token";
  let updateTokenMock: jest.Mock;

  beforeEach(() => {
    // 1) Fully reset the module registry so that api.ts re‑initializes its state:
    jest.resetModules();

    // 2) Re‑import *after* resetModules:
    //    - `api` is the default export (the axios.create instance)
    //    - `setupInterceptors` is the named export
    const apiModule = require("../../utils/api");
    api = apiModule.default;
    setupInterceptors = apiModule.setupInterceptors;

    // 3) Clear storage & location
    localStorage.clear();
    delete (window as any).location;
    (window as any).location = { href: "" };

    // 4) Wire up the interceptors with a fresh mock callback
    updateTokenMock = jest.fn();
    setupInterceptors(updateTokenMock);

    // 5) Attach MockAdapter to *your* axios instance (not the root axios)
    mock = new MockAdapter(api);

    // 6) Seed localStorage with a user holding `initialToken`
    localStorage.setItem(
      "user",
      JSON.stringify({
        id: 1,
        email: "",
        role: "user",
        companyId: 1,
        token: initialToken,
      })
    );
  });

  afterEach(() => {
    mock.restore();
  });

  it("attaches Authorization header when token exists", async () => {
    mock.onGet(TEST_URL).reply((config) => {
      expect(config.headers?.Authorization).toBe(`Bearer ${initialToken}`);
      return [200, { ok: true }];
    });

    const resp = await api.get(TEST_URL);
    expect(resp.data).toEqual({ ok: true });
  });

  it("does not set Authorization header when no token", async () => {
    localStorage.removeItem("user");

    mock.onGet(TEST_URL).reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined();
      return [200, {}];
    });

    await api.get(TEST_URL);
  });

  it("passes through non-401 errors without refresh", async () => {
    mock.onGet(TEST_URL).reply(403, { message: "Forbidden" });

    await expect(api.get(TEST_URL)).rejects.toMatchObject({
      response: { status: 403, data: { message: "Forbidden" } },
    });
  });

  it("refreshes once on 401, updates localStorage & retries original request", async () => {
    // Original GET → 401
    mock.onGet(TEST_URL).replyOnce(401);
    // Refresh endpoint → 200 + new token
    mock.onPost(REFRESH_URL).reply(200, { token: newToken });
    // Retried GET → success
    mock.onGet(TEST_URL).replyOnce(200, { hello: "world" });

    const resp = await api.get(TEST_URL);
    expect(resp.data).toEqual({ hello: "world" });

    // localStorage must have been updated
    const stored = JSON.parse(localStorage.getItem("user")!);
    expect(stored.token).toBe(newToken);

    // And our callback ran
    expect(updateTokenMock).toHaveBeenCalledWith(newToken);
  });

  it("queues concurrent 401s during refresh and retries them all", async () => {
    // Two back‑to‑back GETs → both 401
    mock.onGet(TEST_URL).replyOnce(401);
    mock.onGet(TEST_URL).replyOnce(401);

    // One refresh → new token
    mock.onPost(REFRESH_URL).reply(200, { token: newToken });

    // Both retries succeed
    mock.onGet(TEST_URL).reply(200, { a: 1 });

    const [r1, r2] = await Promise.all([api.get(TEST_URL), api.get(TEST_URL)]);
    expect(r1.data).toEqual({ a: 1 });
    expect(r2.data).toEqual({ a: 1 });

    // Only one actual refresh call was made
    const refreshCalls = mock.history.post.filter((r) => r.url === REFRESH_URL);
    expect(refreshCalls).toHaveLength(1);

    // And updateToken only ran once
    expect(updateTokenMock).toHaveBeenCalledTimes(1);
  });

  it("on refresh failure removes user & redirects to /timeout", async () => {
    // Initial GET → 401
    mock.onGet(TEST_URL).replyOnce(401);
    // Refresh endpoint blows up
    mock.onPost(REFRESH_URL).networkError();

    await expect(api.get(TEST_URL)).rejects.toThrow("Network Error");

    // user should be removed
    expect(localStorage.getItem("user")).toBeNull();
    // redirect should have happened
    expect(window.location.href).toBe("/timeout");
  });
});
