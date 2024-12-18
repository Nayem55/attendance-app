import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import Link for navigation

const HomePage = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [totalWorkingHours, setTotalWorkingHours] = useState("00:00:00");
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  // Get today's date
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Check if the user is logged in and redirect if not
  useEffect(() => {
    if (!user) {
      navigate("/login"); // Redirect to login if not logged in
    }
  }, [user, navigate]);

  // Check the user's check-in status and time
  useEffect(() => {
    const checkStatus = () => {

      if (user?.checkIn === "true" && user?.checkInTime) {
        setIsCheckedIn(true);
        setCheckInTime(new Date(user?.checkInTime)); // Set check-in time
      }
    };

    checkStatus();
  }, []);

  // Calculate total working hours based on check-in time
  useEffect(() => {
    if (user?.checkIn && user?.checkInTime) {
      // Convert the 12-hour time (e.g., "6:10:05 PM") to a 24-hour time format
      const convertTo24HourFormat = (time) => {
        const [timeString, modifier] = time.split(" ");
        let [hours, minutes, seconds] = timeString.split(":");
        hours = parseInt(hours, 10);
  
        // Convert hour based on AM/PM
        if (modifier === "PM" && hours < 12) {
          hours += 12;
        } else if (modifier === "AM" && hours === 12) {
          hours = 0;
        }
  
        return `${hours.toString().padStart(2, "0")}:${minutes}:${seconds}`;
      };
  
      // Convert check-in time to 24-hour format
      const formattedCheckInTime = convertTo24HourFormat(user.checkInTime);
  
      // Create a valid Date object using the formatted time
      const timeString = `1970-01-01T${formattedCheckInTime}`; // Use a fixed date
      const checkInDate = new Date(timeString);
  
      // Check if the check-in date is valid
      if (isNaN(checkInDate)) {
        console.error("Invalid checkInTime format");
        return;
      }
  
      const currentTime = new Date(); // Current date and time
      const difference = currentTime - checkInDate; // Time difference in milliseconds
  
      // Calculate hours, minutes, and seconds
      const hours = Math.floor(difference / (1000 * 60 * 60)); // Convert milliseconds to hours
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)); // Minutes
      const seconds = Math.floor((difference % (1000 * 60)) / 1000); // Seconds
  
      // Set the total working hours without the 4818 prefix
      setTotalWorkingHours(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    }
  }, [user?.checkInTime]);
  
  


  
  return (
    <div className="p-6">
      {/* Display Today's Date */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold">Today's Date: {formattedDate}</h2>
      </div>

      <div className="bg-yellow-100 p-4 rounded-md mb-6">
        {user?.checkIn ? (
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
          className="sm:w-auto bg-blue-500 text-white py-2 px-4 rounded mt-2 block text-center"
        >
          {user?.checkIn ? "Go to Checkout" : "Complete your Check-in"}
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
            {user?.checkIn ? "Checked In" : "Not Checked In"}
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
