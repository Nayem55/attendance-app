import { createBrowserRouter } from "react-router-dom";
import LoginForm from "../Component/Login";
import Main from "../Layout/Main";
import SignUpForm from "../Component/Signup";
import HomePage from "../Pages/Homepage/Homepage";
import CheckInPage from "../Pages/Checkin/Checkin";
import Profile from "../Component/Profile";
import AdminDashboard from "../Pages/AdminDashboard/AdminDashboard";
import TodaysReport from "../Pages/AdminDashboard/TodaysReport";
import ViewReport from "../Pages/AdminDashboard/ViewReport";

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
      {
        path: "/admin/today-report",
        element: <TodaysReport/>,
      },
      {
        path: "/admin/view-report/:userId",
        element: <ViewReport/>,
      },
    ],
  },

]);

export default router;
