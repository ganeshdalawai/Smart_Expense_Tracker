import axios, {
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";

const API =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000";

const instance = axios.create({
  baseURL: `${API}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================
// REQUEST INTERCEPTOR
// ============================================================

instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {

    /*
     * Check the common token names.
     *
     * Your application may store the JWT as:
     * token
     * accessToken
     * jwt
     */
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("jwt");

    if (token) {

      config.headers.Authorization =
        `Bearer ${token}`;

      console.log(
        "API request authenticated:",
        config.url
      );

    } else {

      console.warn(
        "No authentication token found for:",
        config.url
      );

    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);


// ============================================================
// RESPONSE INTERCEPTOR
// ============================================================

instance.interceptors.response.use(

  (response) => {
    return response;
  },

  (error: AxiosError) => {

    const status =
      error.response?.status;

    const message =
      error.response?.data ||
      error.message;

    console.error(
      "API Error:",
      status,
      message
    );


    /*
     * If the backend returns 401,
     * the JWT is missing, invalid,
     * or expired.
     */
    if (status === 401) {

      console.warn(
        "Authentication failed. Token may be expired or invalid."
      );

    }

    return Promise.reject(error);
  }
);


export default instance;