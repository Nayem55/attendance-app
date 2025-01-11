import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import axios from "axios";
import { Link, useParams } from "react-router-dom";

const ViewReport = () => {
  const { userId } = useParams(); // Fetch userId from route params
  const [userName, setUserName] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserReport(selectedMonth);
  }, [selectedMonth]);

  const fetchUserReport = async (month) => {
    setLoading(true);
    setError(null);
    try {
      const [year, monthNumber] = month.split("-");
      const userResponse = await axios.get(
        `https://attendance-app-server-blue.vercel.app/getUser/${userId}`
      );
      setUserName(userResponse.data.name);

      // Fetch check-ins
      const checkInsResponse = await axios.get(
        `https://attendance-app-server-blue.vercel.app/api/checkins/${userId}`,
        {
          params: { month: monthNumber, year: year },
        }
      );
      const checkIns = checkInsResponse.data;

      // Fetch check-outs
      const checkOutsResponse = await axios.get(
        `https://attendance-app-server-blue.vercel.app/api/checkouts/${userId}`,
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
      {/* Side Drawer */}
      <div
        className={`fixed md:relative z-20 bg-gray-800 text-white w-64 h-screen transform  ${
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300`}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-bold">Admin Panel</h2>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="text-white md:hidden focus:outline-none"
          >
            ✕
          </button>
        </div>
        <nav className="flex flex-col p-4 space-y-2">
          <Link
            to="/admin"
            className="px-4 py-2 rounded hover:bg-gray-700 focus:bg-gray-700"
          >
            Attendance Report
          </Link>
          <Link
            to="/admin/today-report"
            className="px-4 py-2 rounded hover:bg-gray-700 focus:bg-gray-700"
          >
            Today's Report
          </Link>
          <Link
            to="/admin/holiday-management"
            className="px-4 py-2 rounded hover:bg-gray-700 focus:bg-gray-700"
          >
            Holiday
          </Link>
          <Link
            to="/admin/applications"
            className="px-4 py-2 rounded hover:bg-gray-700 focus:bg-gray-700"
          >
            Leave Requests
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-screen p-4 md:p-6 bg-gray-100">
        <button
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className="md:hidden mb-4 px-4 py-2 bg-gray-800 text-white rounded"
        >
          {isDrawerOpen ? "Close Menu" : "Open Menu"}
        </button>

        <h1 className="text-xl font-bold mb-4">
          Monthly Report for {userName}
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
          <div className="overflow-x-auto">
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

export default ViewReport;