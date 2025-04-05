import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000",
  withCredentials: true,
});

// Lock for refresh token requests
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
};

// Attach Authorization token to every request
api.interceptors.request.use((config) => {
  const userData = localStorage.getItem("user");
  const token = userData ? JSON.parse(userData).token : null;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Function to set up token refreshing with an external updateToken function
export const setupInterceptors = (updateToken: (token: string) => void) => {
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        // console.log("Access token expired, attempting refresh...");

        if (!isRefreshing) {
          isRefreshing = true;
          try {
            // console.log("Attempting refresh...");

            const refreshRequest = api.post("/auth/refresh");

            const refreshResponse = await Promise.race([
              refreshRequest,
              new Promise<null>((_, reject) =>
                setTimeout(() => reject(new Error("Refresh request timeout")), 2000)
              ),
            ]);

            if (!refreshResponse || typeof refreshResponse !== "object" || !("data" in refreshResponse)) {
              throw new Error("Invalid refresh response");
            }

            if (!refreshResponse.data.token) {
                throw new Error("No token received from refresh");
            }
            const newAccessToken = refreshResponse.data.token;

            // Update localStorage with new token
            const userData = localStorage.getItem("user");
            if (userData) {
              const parsedUser = JSON.parse(userData);
              parsedUser.token = newAccessToken;
              localStorage.setItem("user", JSON.stringify(parsedUser));
              updateToken(newAccessToken); // Update React state
            }

            // Notify all queued requests with the new token
            onRefreshed(newAccessToken);
            isRefreshing = false;

            return api(error.config);
          } catch (refreshError) {
            // console.log("Refresh failed, logging out...");
            localStorage.removeItem("user"); // Clear storage
            window.location.href = "/timeout"; // Redirect to timeout page
            return Promise.reject(refreshError);
          }
        } else {
          // console.log("Refresh in process, queing request...");

          return new Promise((resolve) => {
            refreshSubscribers.push((token) => {
              error.config.headers.Authorization = `Bearer ${token}`;
              resolve(api(error.config));
            });
          });
        }
      }
      return Promise.reject(error);
    }
  );
};

export default api;
