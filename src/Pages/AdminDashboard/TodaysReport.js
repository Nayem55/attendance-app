import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import axios from "axios";
import { Link } from "react-router-dom";

const TodaysReport = () => {
  const [todaysReports, setTodaysReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null); // For handling selected image

  useEffect(() => {
    fetchTodaysReports();
  }, []);

  const fetchTodaysReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const today = dayjs().format("YYYY-MM-DD"); // Format to match date in check-in/check-out records
      const usersResponse = await axios.get(
        "https://attendance-app-server-blue.vercel.app/getAllUser"
      );
      const users = usersResponse.data;

      const reportsData = await Promise.all(
        users.map(async (user) => {
          const checkInsResponse = await axios.get(
            `https://attendance-app-server-blue.vercel.app/api/checkins/${user._id}`,
            {
              params: { date: today }, // Filter for today's date
            }
          );

          const checkOutsResponse = await axios.get(
            `https://attendance-app-server-blue.vercel.app/api/checkouts/${user._id}`,
            {
              params: { date: today }, // Filter for today's date
            }
          );

          const checkIns = checkInsResponse.data;
          const checkOuts = checkOutsResponse.data;

          if (checkIns.length === 0) {
            return null; // No check-ins for this user today
          }

          // Get the latest check-in time for the user
          const latestCheckIn = checkIns.find((checkin) =>
            dayjs(checkin.time).isBefore(dayjs().endOf("day"))
          );

          // Get the latest check-out time for the user (if exists)
          const latestCheckOut = checkOuts.find((checkout) =>
            dayjs(checkout.time).isAfter(dayjs(latestCheckIn.time)) // Ensure checkout is after check-in
          );

          // Calculate total work time (if both check-in and check-out exist)
          let totalWorkTime = "N/A";
          if (latestCheckIn && latestCheckOut) {
            const checkInTime = dayjs(latestCheckIn.time);
            const checkOutTime = dayjs(latestCheckOut.time);
            const duration = dayjs.duration(checkOutTime.diff(checkInTime));
            totalWorkTime = `${duration.hours()}h ${duration.minutes()}m`;
          }

          return {
            username: user.name,
            checkInTime: latestCheckIn ? dayjs(latestCheckIn.time).format("hh:mm A") : "N/A",
            checkOutTime: latestCheckOut ? dayjs(latestCheckOut.time).format("hh:mm A") : "N/A",
            totalWorkTime,
            checkInNote: latestCheckIn?.note || "N/A",
            checkInLocation: latestCheckIn?.location || "N/A",
            checkInImage: latestCheckIn?.image || null,
            checkOutNote: latestCheckOut?.note || "N/A",
            checkOutLocation: latestCheckOut?.location || "N/A",
            checkOutImage: latestCheckOut?.image || null,
          };
        })
      );

      // Filter out users who have no check-ins (if no check-in, do not display)
      setTodaysReports(reportsData.filter((report) => report !== null));
    } catch (error) {
      console.error("Error fetching today's reports:", error);
      setError("Failed to load today's reports. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (imageUrl) => {
    setSelectedImage(imageUrl);
  };

  const closeImageModal = () => {
    setSelectedImage(null);
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
          <Link to="/admin/todays-report" className="px-4 py-2 rounded hover:bg-gray-700 focus:bg-gray-700">
            Today's Report
          </Link>
          <Link to="/admin/users" className="px-4 py-2 rounded hover:bg-gray-700 focus:bg-gray-700">
            Users
          </Link>
          <Link to="/admin/settings" className="px-4 py-2 rounded hover:bg-gray-700 focus:bg-gray-700">
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

        <h1 className="text-xl font-bold mb-4">Today's Report</h1>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : todaysReports.length > 0 ? (
          <div className="overflow-x-scroll w-[90vw] sm:w-[80vw]">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-4 py-2">Username</th>
                  <th className="border border-gray-300 px-4 py-2">Check-in Time</th>
                  <th className="border border-gray-300 px-4 py-2">Check-out Time</th>
                  <th className="border border-gray-300 px-4 py-2">Total Work Time</th>
                  <th className="border border-gray-300 px-4 py-2">Check-in Note</th>
                  <th className="border border-gray-300 px-4 py-2">Check-in Location</th>
                  <th className="border border-gray-300 px-4 py-2">Check-in Image</th>
                  <th className="border border-gray-300 px-4 py-2">Check-out Note</th>
                  <th className="border border-gray-300 px-4 py-2">Check-out Location</th>
                  <th className="border border-gray-300 px-4 py-2">Check-out Image</th>
                </tr>
              </thead>
              <tbody>
                {todaysReports.map((report, index) => (
                  <tr key={index} className="text-center">
                    <td className="border border-gray-300 px-4 py-2">{report.username}</td>
                    <td className="border border-gray-300 px-4 py-2">{report.checkInTime}</td>
                    <td className="border border-gray-300 px-4 py-2">{report.checkOutTime}</td>
                    <td className="border border-gray-300 px-4 py-2">{report.totalWorkTime}</td>
                    <td className="border border-gray-300 px-4 py-2">{report.checkInNote}</td>
                    <td className="border border-gray-300 px-4 py-2">{report.checkInLocation}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      {report.checkInImage ? (
                        <img
                          src={report.checkInImage}
                          alt="Check-in"
                          className="cursor-pointer w-12 h-12 object-cover"
                          onClick={() => handleImageClick(report.checkInImage)}
                        />
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">{report.checkOutNote}</td>
                    <td className="border border-gray-300 px-4 py-2">{report.checkOutLocation}</td>
                    <td className="border border-gray-300 px-4 py-2">
                      {report.checkOutImage ? (
                        <img
                          src={report.checkOutImage}
                          alt="Check-out"
                          className="cursor-pointer w-12 h-12 object-cover"
                          onClick={() => handleImageClick(report.checkOutImage)}
                        />
                      ) : (
                        "N/A"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No check-ins or check-outs today.</p>
        )}
      </div>

      {/* Modal for Image */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={closeImageModal}
        >
          <img src={selectedImage} alt="Selected" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
};

export default TodaysReport;
