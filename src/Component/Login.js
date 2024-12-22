import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast"; // Import react-hot-toast
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(
        "https://attendance-app-server-blue.vercel.app/login",
        formData
      );

      // Save user information in localStorage
      const user = response.data.user;
      localStorage.setItem("user", JSON.stringify(user));

      // Show success toast
      toast.success(response.data.message, {
        duration: 3000,
      });

      setIsLoading(false);

      // Redirect to home page if logged in
      navigate("/home");
    } catch (error) {
      toast.error(
        error.response ? error.response.data.message : "Something went wrong!",
        {
          duration: 3000,
        }
      );

      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-md shadow-lg mx-6">
        <h2 className="text-2xl font-bold mb-6 text-center text-[#e57e38]">
          Attendance System
        </h2>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e57e38]"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#e57e38]"
              placeholder="Enter your password"
              required
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-3 bg-[#e57e38] text-white font-semibold rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-[#e57e38]"
              disabled={isLoading}
            >
              {isLoading ? "Logging In..." : "Login"}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <span className="text-sm text-gray-500">Don't have an account? </span>
          <a
            href="/signup"
            className="text-sm text-[#e57e38] hover:text-blue-600"
          >
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
