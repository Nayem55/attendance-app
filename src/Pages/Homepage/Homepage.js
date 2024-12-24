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
  const [user, setUser] = useState({});
  const [lateCheckIns, setLateCheckIns] = useState(0); 
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user"));

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
    if (!storedUser) {
      navigate("/login"); // Redirect to login if not logged in
    }
  }, [storedUser, navigate]);

  // Check the user's check-in status
  useEffect(() => {
    if (user?.checkIn && user?.lastCheckedIn) {
      setIsCheckedIn(true);
    }
  }, [user]);

  // Fetch total check-ins and late check-ins for the current month
  useEffect(() => {
    if (storedUser) {
      const fetchCheckIns = async () => {
        try {
          const response = await axios.get(
            `https://attendance-app-server-blue.vercel.app/api/checkins/current-month/${storedUser.id}`
          );
          const checkins = response.data;

          setTotalCheckIns(checkins.length);

          // Calculate late check-ins (after 10:15 AM)
          const lateCheckInsCount = checkins.filter((checkin) => {
            const checkInTime = dayjs(checkin.time); 
            const lateThreshold = dayjs(
              checkInTime.format("YYYY-MM-DD") + " 10:15:00"
            ); // 10:15 AM on the same day
            return checkInTime.isAfter(lateThreshold); // Check if check-in time is after 10:15 AM
          }).length;

          setLateCheckIns(lateCheckInsCount); // Set the late check-ins count
        } catch (error) {
          console.error("Error fetching check-ins:", error);
        }
      };
      const fetchUser = async () => {
        try {
          const response = await axios.get(
            `https://attendance-app-server-blue.vercel.app/getUser/${storedUser.id}`
          );
          const user = response.data;

          setUser(user);
        } catch (error) {
          console.error("Error fetching user", error);
        }
      };

      fetchCheckIns();
      fetchUser()
    }
  }, [storedUser]);
 

  useEffect(() => {
    let intervalId;

    if (isCheckedIn && user?.lastCheckedIn) {
      const calculateActiveTime = () => {
        const checkInTime = dayjs(user?.lastCheckedIn);
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
    <div className="p-6 py-10 pb-16 bg-[#F2F2F2]">
      {/* Display Today's Date */}
      {/* <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold">
          Today's Date: {formattedDate}
        </h2>
      </div> */}

      <div className=" p-4 rounded-md mb-6 bg-white shadow-md">
        {/* {user?.checkIn ? (
          <p className="text-xl text-green-600 font-semibold">
            Complete your Checkout
          </p>
        ) : (
          <p className="text-xl text-red-600 font-semibold">
            Complete your Check-in
          </p>
        )} */}
        <p className="text-xl text-[#000] font-semibold">Reminder</p>

        <Link
          to="/check-in"
          className="sm:w-auto bg-[#e57e38] text-white py-2 px-4 rounded-lg mt-2 block text-center font-bold"
        >
          {user?.checkIn ? "Complete Your Checkout" : "Complete Your Check-in"}
        </Link>
      </div>

      <div className="bg-[#ffffff] p-4 rounded-lg shadow-md pb-10">
        <p className="text-xl text-[#000] font-semibold mb-4">Summary</p>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-4 bg-white border border-[#cfcfcf] rounded-lg flex flex-col justify-center items-center text-center mx-auto sm:w-full">
            <h4 className="font-semibold">December Attendance</h4>
            <p className="text-xl mt-4">{totalCheckIns} Days</p>
          </div>
          <div className="p-4 bg-white border border-[#cfcfcf] rounded-lg flex flex-col justify-center items-center text-center mx-auto sm:w-full">
            <h4 className="font-semibold">December Late</h4>
            <p className="text-xl mt-4">{lateCheckIns} Days</p>
          </div>
          <div className="p-4 bg-white border border-[#cfcfcf] rounded-lg flex flex-col justify-center items-center text-center mx-auto sm:w-full">
            <h4 className="font-semibold">Today's Status</h4>
            <p className="text-xl mt-4">
              {user?.checkIn ? "Checked In" : "Not Checked In"}
            </p>
          </div>
          <div className="p-4 bg-white border border-[#cfcfcf] rounded-lg flex flex-col justify-center items-center text-center mx-auto sm:w-full">
            <h4 className="font-semibold">Today's In Time</h4>
            <p className="text-xl mt-4">
              {user?.checkIn
              
                ? dayjs(user?.lastCheckedIn).tz("Asia/Dhaka").format("hh:mm A")
                : "00.00.00"}
            </p>
          </div>
        </div>
        <div className="p-4 rounded-lg mt-6 bg-[#E57E38] text-white">
          <h4 className="font-bold">Total Working Hours</h4>
          <p className="text-xl mt-4 font-semibold">{totalWorkingHours}</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
