import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const auth = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });
      auth.login(res.data);
      navigate("/consumption-list");
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="flex flex-col items-center mt-10">
      <h2 className="text-2xl mb-4">Login</h2>
      <form onSubmit={handleLogin} className="flex flex-col items-center">
        <input
          className="border p-2 mb-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border p-2 mb-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4 py-2" type="submit">
          Login
        </button>
      </form>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default LoginPage;