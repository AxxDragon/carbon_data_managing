import axios from "axios";

// Create an Axios instance with base URL and credentials configuration
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8000", // Base URL for API requests
  withCredentials: true, // Ensure cookies (like session cookies) are sent with requests
});

// Lock for refresh token requests to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

// Function to notify all the subscribers with the new token after it is refreshed
const onRefreshed = (token: string) => {
  // Notify all queued requests with the new token
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = []; // Clear the list of subscribers after notifying them
};

// Attach Authorization token to every request if it exists in localStorage
api.interceptors.request.use((config) => {
  const userData = localStorage.getItem("user"); // Get user data from localStorage
  const token = userData ? JSON.parse(userData).token : null; // Extract token from user data

  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // Add token to request headers if available
  }
  return config;
});

// Function to set up token refreshing logic and handle expired tokens
export const setupInterceptors = (updateToken: (token: string) => void) => {
  api.interceptors.response.use(
    (response) => response, // Return the response directly if the request was successful
    async (error) => {
      // Check if the error response is due to unauthorized access (token expired)
      if (error.response?.status === 401) {
        // console.log("Access token expired, attempting refresh...");

        if (!isRefreshing) {
          isRefreshing = true; // Lock the refresh process to prevent multiple refresh requests

          try {
            // console.log("Attempting refresh...");

            // Make a request to the backend to refresh the access token
            const refreshRequest = api.post("/auth/refresh");

            const refreshResponse = await Promise.race([
              // Use Promise.race to handle timeout
              refreshRequest,
              new Promise<null>(
                (_, reject) =>
                  setTimeout(
                    () => reject(new Error("Refresh request timeout")),
                    2000
                  ) // Timeout after 2 seconds
              ),
            ]);

            // Ensure the response is valid and contains a new access token
            if (
              !refreshResponse ||
              typeof refreshResponse !== "object" ||
              !("data" in refreshResponse)
            ) {
              throw new Error("Invalid refresh response");
            }

            if (!refreshResponse.data.token) {
              throw new Error("No token received from refresh"); // Error handling if no token is returned
            }

            const newAccessToken = refreshResponse.data.token;

            // Update localStorage with the new token
            const userData = localStorage.getItem("user");
            if (userData) {
              const parsedUser = JSON.parse(userData);
              parsedUser.token = newAccessToken; // Set the new token in user data
              localStorage.setItem("user", JSON.stringify(parsedUser)); // Save updated user data
              updateToken(newAccessToken); // Update React state with new token
            }

            // Notify all queued requests with the new token
            onRefreshed(newAccessToken);
            isRefreshing = false; // Unlock the refresh process

            return api(error.config); // Retry the failed request with the new token
          } catch (refreshError) {
            // console.log("Refresh failed, logging out...");

            // If refresh failed, log the user out
            localStorage.removeItem("user"); // Remove user data from localStorage
            window.location.href = "/timeout"; // Redirect to timeout page (e.g., logout page)
            return Promise.reject(refreshError); // Reject the refresh error
          }
        } else {
          // console.log("Refresh in process, queuing request...");

          // If a refresh is already in progress, queue the request to retry after token is refreshed
          return new Promise((resolve) => {
            refreshSubscribers.push((token) => {
              error.config.headers.Authorization = `Bearer ${token}`; // Add the refreshed token to the failed request
              resolve(api(error.config)); // Retry the request with the new token
            });
          });
        }
      }
      return Promise.reject(error); // If the error is not related to expired token, reject the error
    }
  );
};

export default api; // Export the Axios instance with interceptors configured
