import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import timezone from "dayjs/plugin/timezone";
import axios from "axios";

dayjs.extend(duration);
dayjs.extend(timezone);

const HomePage = () => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [totalWorkingHours, setTotalWorkingHours] = useState("00:00:00");
  const [totalCheckIns, setTotalCheckIns] = useState(0);
  const [lateCheckIns, setLateCheckIns] = useState(0);
  const [user, setUser] = useState({});
  const [dataLoading, setDataLoading] = useState(false);
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user"));

  const fetchUserData = useCallback(async () => {
    if (!storedUser) return;

    try {
      const [userResponse, checkInsResponse] = await Promise.all([
        axios.get(
          `https://attendance-app-server-blue.vercel.app/getUser/${storedUser?._id}`
        ),
        axios.get(
          `https://attendance-app-server-blue.vercel.app/api/checkins/current-month/${storedUser?._id}`
        ),
      ]);

      const userData = userResponse.data;
      const checkins = checkInsResponse.data;

      setUser(userData);
      localStorage.setItem("user",JSON.stringify(userData));
      setTotalCheckIns(checkins.length);

      // Calculate late check-ins (after 10:15 AM)
      const lateCheckInsCount = checkins.filter((checkin) => {
        const checkInTime = dayjs(checkin.time);
        const lateThreshold = dayjs(
          checkInTime.format("YYYY-MM-DD") + "10:15:00"
        );
        return checkInTime.isAfter(lateThreshold);
      }).length;

      setLateCheckIns(lateCheckInsCount);
      setIsCheckedIn(userData.checkIn && userData.lastCheckedIn);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setDataLoading(false);
    }
  }, [storedUser]);

  useEffect(() => {
    if (!storedUser) {
      navigate("/login");
    } else {
      fetchUserData();
    }
  }, []);

  useEffect(() => {
    let intervalId;

    if (isCheckedIn && user?.lastCheckedIn) {
      const calculateActiveTime = () => {
        const checkInTime = dayjs(user?.lastCheckedIn);
        const currentTime = dayjs();
        const duration = dayjs.duration(currentTime.diff(checkInTime));

        const hours = duration.hours().toString().padStart(2, "0");
        const minutes = duration.minutes().toString().padStart(2, "0");
        const seconds = duration.seconds().toString().padStart(2, "0");

        setTotalWorkingHours(`${hours}:${minutes}:${seconds}`);
      };

      calculateActiveTime();
      intervalId = setInterval(calculateActiveTime, 1000);
    }

    return () => clearInterval(intervalId);
  }, [isCheckedIn, user]);

  return (
    <div className="p-6 py-10 pb-16 bg-[#F2F2F2]">
      <div className="p-4 rounded-md mb-6 bg-white shadow-md">
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
          <SummaryCard
            title="December Attendance"
            value={dataLoading ? "Calculating..." : `${totalCheckIns} Days`}
          />
          <SummaryCard
            title="December Late"
            value={dataLoading ? "Calculating..." : `${lateCheckIns} Days`}
          />
          <SummaryCard
            title="Today's Status"
            value={user?.checkIn ? "Checked In" : "Not Checked In"}
          />
          <SummaryCard
            title="Today's In Time"
            value={
              user?.checkIn
                ? dayjs(user?.lastCheckedIn)
                    .tz("Asia/Dhaka")
                    .format("hh:mm A")
                : "00:00:00"
            }
          />
        </div>

        <div className="p-4 rounded-lg mt-6 bg-[#E57E38] text-white">
          <h4 className="font-bold">Total Working Hours</h4>
          <p className="text-xl mt-4 font-semibold">{totalWorkingHours}</p>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value }) => (
  <div className="p-4 bg-white border border-[#cfcfcf] rounded-lg flex flex-col justify-center items-center text-center mx-auto sm:w-full">
    <h4 className="font-semibold">{title}</h4>
    <p className="text-xl mt-4">{value}</p>
  </div>
);

export default HomePage;
