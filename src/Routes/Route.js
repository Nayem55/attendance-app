import { createBrowserRouter } from "react-router-dom";
import LoginForm from "../Component/Login";
import Main from "../Layout/Main";
import SignUpForm from "../Component/Signup";
import HomePage from "../Pages/Homepage/Homepage";
import CheckInPage from "../Pages/Checkin/Checkin";
import Profile from "../Component/Profile";
import AdminDashboard from "../Pages/AdminDashboard/AdminDashboard";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Main></Main>,
    children: [
      {
        path: "/",
        element: <HomePage/>,
      },
      {
        path: "/home",
        element: <HomePage />,
      },
      {
        path: "/check-in",
        element: <CheckInPage />,
      },
      {
        path: "/attendance",
        element: <CheckInPage />,
      },
      {
        path: "/login",
        element: <LoginForm />,
      },
      {
        path: "/signup",
        element: <SignUpForm/>,
      },
      {
        path: "/profile",
        element: <Profile/>,
      },
      {
        path: "/admin",
        element: <AdminDashboard/>,
      },
    ],
  },

]);

export default router;
