import "./App.css";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import router from "./Routes/Route";
import { ThemeContext } from "./Contexts/ThemeContext";
import { useEffect, useState, useMemo } from "react";
import axios from "axios";

function App() {
  const [user, setUser] = useState(null); // Initialize with `null` for better conditional handling
  const [loading, setLoading] = useState(true); // Start with `true` to show a loader initially

  // Safely parse stored user only once
  const storedUser = useMemo(() => {
    try {
      return localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null;
    } catch (error) {
      console.error("Error parsing stored user:", error);
      return null;
    }
  }, []);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      if (storedUser) {
        try {
          const response = await axios.get(
            `https://attendance-app-server-blue.vercel.app/getUser/${storedUser.id}`
          );
          setUser(response.data);
        } catch (error) {
          console.error("Error fetching user:", error);
        }
      }
      setLoading(false); // Stop loading whether the user is found or not
    };

    fetchUser();
  }, [storedUser]);

  // Render loading state
  // if (loading) {
  //   return (
  //     <div className="flex items-center justify-center h-screen">
  //       <p>Loading...</p>
  //     </div>
  //   );
  // }

  return (
    <ThemeContext.Provider value={{ user,setUser, loading, setLoading }}>
      <RouterProvider router={router} />
      <Toaster />
    </ThemeContext.Provider>
  );
}

export default App;
