import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import axios from "axios";
import { Link } from "react-router-dom";

const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUserReports(selectedMonth);
  }, [selectedMonth]);

  const fetchUserReports = async (month) => {
    setLoading(true);
    setError(null);
    try {
      const [year, monthNumber] = month.split("-");
      const usersResponse = await axios.get(
        "https://attendance-app-server-blue.vercel.app/getAllUser"
      );
      const users = usersResponse.data;

      const reportsData = await Promise.all(
        users.map(async (user) => {
          const checkInsResponse = await axios.get(
            `https://attendance-app-server-blue.vercel.app/api/checkins/${user._id}`,
            {
              params: { month: monthNumber, year: year },
            }
          );

          const checkIns = checkInsResponse.data;
          const totalCheckIns = checkIns.length;

          // Late check-ins calculation (after 10:15 AM)
          const lateCheckInsCount = checkIns.filter((checkin) => checkin.status === "Late").length;

          return {
            username: user.name,
            userId:user._id,
            totalCheckIns,
            lateCheckIns: lateCheckInsCount,
            month: monthNumber,
            year: year,
          };
        })
      );
      setReports(reportsData);
    } catch (error) {
      console.error("Error fetching reports:", error);
      setError("Failed to load reports. Please try again.");
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
        className={`fixed md:relative z-20 bg-gray-800 text-white w-64 h-screen transform ${
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
          <Link to="/admin" className="px-4 py-2 rounded hover:bg-gray-700 focus:bg-gray-700">
            Attendance Report
          </Link>
          <Link to="/admin/today-report" className="px-4 py-2 rounded hover:bg-gray-700 focus:bg-gray-700">
            Today's Report
          </Link>
          <Link to="/admin" className="px-4 py-2 rounded hover:bg-gray-700 focus:bg-gray-700">
            Users
          </Link>
          <Link to="/admin" className="px-4 py-2 rounded hover:bg-gray-700 focus:bg-gray-700">
            Settings
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

        <h1 className="text-xl font-bold mb-4">Monthly Report</h1>
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
        ) : reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-4 py-2">Username</th>
                  <th className="border border-gray-300 px-4 py-2">Total Check-Ins</th>
                  <th className="border border-gray-300 px-4 py-2">Late Check-Ins</th>
                  <th className="border border-gray-300 px-4 py-2">Month</th>
                  <th className="border border-gray-300 px-4 py-2">Daily Report</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, index) => (
                  <tr key={index} className="text-center">
                    <td className="border border-gray-300 px-4 py-2">{report.username}</td>
                    <td className="border border-gray-300 px-4 py-2">{report.totalCheckIns}</td>
                    <td className="border border-gray-300 px-4 py-2">{report.lateCheckIns}</td>
                    <td className="border border-gray-300 px-4 py-2">{dayjs(report.month).format("MMMM")}, {dayjs(report.year).format("YYYY")}</td>
                    <td className="border border-gray-300 px-4 py-2"><Link to={`/admin/view-report/${report.userId}`}>View Report</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No reports found for this month.</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
