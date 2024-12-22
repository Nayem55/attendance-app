import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import axios from "axios";

dayjs.extend(duration);

const HomePage = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [totalWorkingHours, setTotalWorkingHours] = useState("00:00:00");
  const [totalCheckIns, setTotalCheckIns] = useState(0); 
  const [lateCheckIns, setLateCheckIns] = useState(0);  // Store the count of late check-ins
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

  // Check the user's check-in status
  useEffect(() => {
    if (user?.checkIn && user?.checkInTime) {
      setIsCheckedIn(true);
    }
  }, [user]);

  // Fetch total check-ins and late check-ins for the current month
  useEffect(() => {
    if (user) {
      const fetchCheckIns = async () => {
        try {
          const response = await axios.get(`https://attendance-app-server-blue.vercel.app/api/checkins/current-month/${user.id}`);
          const checkins = response.data;

          setTotalCheckIns(checkins.length); // Set the total check-ins

          // Calculate late check-ins (after 10:15 AM)
          const lateCheckInsCount = checkins.filter(checkin => {
            const checkInTime = dayjs(checkin.time); // Convert check-in time to dayjs
            const lateThreshold = dayjs(checkInTime.format('YYYY-MM-DD') + " 10:15:00"); // 10:15 AM on the same day
            return checkInTime.isAfter(lateThreshold); // Check if check-in time is after 10:15 AM
          }).length;

          setLateCheckIns(lateCheckInsCount); // Set the late check-ins count
        } catch (error) {
          console.error("Error fetching check-ins:", error);
        }
      };

      fetchCheckIns();
    }
  }, [user]);

  // Calculate active working hours after check-in
  useEffect(() => {
    let intervalId;

    if (isCheckedIn && user?.checkInTime) {
      const calculateActiveTime = () => {
        const checkInTime = dayjs(user.checkInTime);
        const currentTime = dayjs();
        const difference = dayjs.duration(currentTime.diff(checkInTime));

        const hours = difference.hours().toString().padStart(2, "0");
        const minutes = difference.minutes().toString().padStart(2, "0");
        const seconds = difference.seconds().toString().padStart(2, "0");

        setTotalWorkingHours(`${hours}:${minutes}:${seconds}`);
      };

      calculateActiveTime(); // Calculate immediately
      intervalId = setInterval(calculateActiveTime, 1000); // Update every second
    }

    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [isCheckedIn, user]);

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
          to="/check-in"
          className="sm:w-auto bg-[#e57e38] text-white py-2 px-4 rounded-lg mt-2 block text-center"
        >
          {user?.checkIn ? "Go to Checkout" : "Complete your Check-in"}
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-4 bg-white shadow-md rounded-md">
          <h4 className="font-semibold">December Check-ins</h4>
          <p className="text-xl">{totalCheckIns} Days</p>
        </div>
        <div className="p-4 bg-white shadow-md rounded-md">
          <h4 className="font-semibold">December Late Check-ins</h4>
          <p className="text-xl">{lateCheckIns} Days</p>
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
