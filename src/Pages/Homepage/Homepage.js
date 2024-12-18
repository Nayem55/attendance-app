import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import Link for navigation

const HomePage = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [totalWorkingHours, setTotalWorkingHours] = useState("00:00:00");
  const navigate = useNavigate();

  
  // Get today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      navigate("/login"); // Redirect to login if not logged in
    }
  }, []);

  useEffect(() => {
    // Simulating check-in status check. You can fetch real data from an API here
    const checkStatus = () => {
      const checkInStatus = localStorage.getItem("checkedIn"); // Check if the user is checked in
      const checkInTime = localStorage.getItem("checkInTime");

      if (checkInStatus === "true" && checkInTime) {
        setIsCheckedIn(true);
        setCheckInTime(new Date(checkInTime));
      }
    };

    checkStatus();
  }, []);

  useEffect(() => {
    if (isCheckedIn && checkInTime) {
      // Calculate total working hours if checked in
      const currentTime = new Date();
      const difference = currentTime - new Date(checkInTime);
      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTotalWorkingHours(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }
  }, [isCheckedIn, checkInTime]);

  return (
    <div className="p-6">
      {/* Display Today's Date */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold">Today's Date: {formattedDate}</h2>
      </div>

      <div className="bg-yellow-100 p-4 rounded-md mb-6">
        {isCheckedIn ? (
          <p className="text-xl text-green-600 font-semibold">
            Complete your Checkout
          </p>
        ) : (
          <p className="text-xl text-red-600 font-semibold">
            Complete your Check-in
          </p>
        )}
        <Link
          to="/check-in" // Replace this with your actual check-in page route
          className="w-full sm:w-auto bg-blue-500 text-white py-2 px-4 rounded mt-2 block text-center"
        >
          {isCheckedIn ? "Go to Checkout" : "Complete your Check-in"}
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-4 bg-white shadow-md rounded-md">
          <h4 className="font-semibold">December Check-ins</h4>
          <p className="text-xl">13 Days</p>
        </div>
        <div className="p-4 bg-white shadow-md rounded-md">
          <h4 className="font-semibold">December Late Check-ins</h4>
          <p className="text-xl">2 Days</p>
        </div>
        <div className="p-4 bg-white shadow-md rounded-md">
          <h4 className="font-semibold">Today's Check-in Status</h4>
          <p className="text-xl">
            {isCheckedIn ? "Checked In" : "Not Checked In"}
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-white shadow-md rounded-md">
        <h4 className="font-semibold">Total Working Hours</h4>
        <p className="text-2xl">{totalWorkingHours}</p>
      </div>
    </div>
  );
};

export default HomePage;
