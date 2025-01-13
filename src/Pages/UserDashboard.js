import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";

const UserDashboard = () => {
  const [userName, setUserName] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!storedUser) {
      navigate("/login");
    }
  }, []);

  useEffect(() => {
    fetchUserReport(selectedMonth);
  }, [selectedMonth]);

  const fetchUserReport = async (month) => {
    setLoading(true);
    setError(null);
    try {
      const [year, monthNumber] = month.split("-");
      const userResponse = await axios.get(
        `https://attendance-app-server-blue.vercel.app/getUser/${storedUser?._id}`
      );
      setUserName(userResponse.data.name);

      // Fetch check-ins
      const checkInsResponse = await axios.get(
        `https://attendance-app-server-blue.vercel.app/api/checkins/${storedUser?._id}`,
        {
          params: { month: monthNumber, year: year },
        }
      );
      const checkIns = checkInsResponse.data;

      // Fetch check-outs
      const checkOutsResponse = await axios.get(
        `https://attendance-app-server-blue.vercel.app/api/checkouts/${storedUser?._id}`,
        {
          params: { month: monthNumber, year: year },
        }
      );
      const checkOuts = checkOutsResponse.data;

      // Combine check-ins and check-outs based on date
      const combinedRecords = checkIns.map((checkIn) => {
        const checkOut = checkOuts.find((co) =>
          dayjs(co.time).isSame(checkIn.time, "day")
        );
        return {
          date: dayjs(checkIn?.time).format("DD MMMM YYYY"),
          checkInTime: dayjs(checkIn?.time).format("hh:mm A") || "N/A",
          checkOutTime: dayjs(checkOut?.time).format("hh:mm A") || "N/A",
          status: checkIn.status,
        };
      });

      setRecords(combinedRecords);
    } catch (error) {
      console.error("Error fetching user report:", error);
      setError("Failed to load report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMonthChange = (event) => {
    setSelectedMonth(event.target.value);
  };

  return (
    <div className="flex">
      <div className="flex-1 min-h-screen p-4 md:p-6 bg-gray-100">
        <h1 className="text-xl font-bold mb-4">
          Monthly Report
        </h1>
        <div className="mb-4">
          <label className="mr-2 font-semibold">Select Month:</label>
          <input
            type="month"
            value={selectedMonth}
            onChange={handleMonthChange}
            className="border rounded px-2 py-1"
          />
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : records.length > 0 ? (
          <div className="overflow-x-auto w-[95vw] my-10 mb-[80px]">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-4 py-2">Username</th>
                  <th className="border border-gray-300 px-4 py-2">Date</th>
                  <th className="border border-gray-300 px-4 py-2">
                    Check-In Time
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Check-Out Time
                  </th>
                  <th className="border border-gray-300 px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record, index) => (
                  <tr key={index} className="text-center">
                    <td className="border border-gray-300 px-4 py-2">
                      {userName}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {record.date}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {record.checkInTime}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {record.checkOutTime || "N/A"}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {record.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No records found for this month.</p>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
