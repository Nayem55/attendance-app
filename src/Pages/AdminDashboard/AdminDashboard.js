import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx"; // Import the xlsx library

const AdminDashboard = () => {
  const [reports, setReports] = useState([]);
  const [group, setGroup] = useState("NMT");
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [selectedRole, setSelectedRole] = useState("MR");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [error, setError] = useState(null);
  const [totalWorkingDays, setTotalWorkingDays] = useState(null);
  const [pendingReq, setPendingReq] = useState(0);
  const [zone, setZone] = useState("");
  const navigate = useNavigate();
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const dayCount = dayjs(selectedMonth).daysInMonth();

  useEffect(() => {
    if (!storedUser) {
      navigate("/login");
    }
  }, []);

  useEffect(() => {
    fetchWorkingDays(selectedMonth);
    fetchUserReports(
      selectedMonth,
      selectedRole,
      storedUser.group || (selectedRole === "super admin" ? "" : group),
      storedUser.zone || (selectedRole === "super admin" ? "" : zone)
    );
    fetchPendingRequest();
  }, [selectedMonth, selectedRole, group, zone]);

  const fetchPendingRequest = async () => {
    try {
      const response = await axios.get(
        `https://attendance-app-server-blue.vercel.app/api/pending-requests`
      );
      setPendingReq(response.data.pendingCount);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      setPendingReq(0);
    }
  };

  const fetchWorkingDays = async (month) => {
    try {
      const response = await axios.get(
        `https://attendance-app-server-blue.vercel.app/api/workingdays`,
        {
          params: { month },
        }
      );
      const { workingDays } = response.data;
      setTotalWorkingDays(workingDays);
    } catch (error) {
      console.error("Error fetching working days:", error);
      setTotalWorkingDays(null);
    }
  };

  const fetchApprovedLeaves = async (userId, month, year) => {
    try {
      const response = await axios.get(
        `https://attendance-app-server-blue.vercel.app/api/leave-requests/user/${userId}/monthly`,
        {
          params: { month, year },
        }
      );
      const { leaveDays } = response.data;
      return leaveDays || 0;
    } catch (error) {
      console.error(
        `Error fetching approved leaves for user ${userId}:`,
        error
      );
      return 0;
    }
  };

  const fetchUserReports = async (month, role, group, zone) => {
    setLoading(true);
    setError(null);
    try {
      const [year, monthNumber] = month.split("-");
      const usersResponse = await axios.get(
        `https://attendance-app-server-blue.vercel.app/getAllUser`,
        {
          params: { role, group, zone },
        }
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
          const checkOutsResponse = await axios.get(
            `https://attendance-app-server-blue.vercel.app/api/checkouts/${user._id}`,
            {
              params: { month: monthNumber, year: year },
            }
          );

          const checkIns = checkInsResponse.data;
          const checkOuts = checkOutsResponse.data;
          const totalCheckIns = checkIns.length;

          const lateCheckInsCount = checkIns.filter(
            (checkin) => checkin.status === "Late"
          ).length;
          const lateCheckOutsCount = checkOuts.filter(
            (checkin) => checkin.status === "Overtime"
          ).length;

          const approvedLeaveDays = await fetchApprovedLeaves(
            user._id,
            monthNumber,
            year
          );

          return {
            username: user.name,
            number: user.number,
            role: user.role,
            userId: user._id,
            totalCheckIns,
            lateCheckIns: lateCheckInsCount,
            lateCheckOuts: lateCheckOutsCount,
            approvedLeaves: approvedLeaveDays,
            month: monthNumber,
            year: year,
            zone: user.zone,
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

  const handleRoleChange = (event) => {
    setSelectedRole(event.target.value);
  };

  // Function to export the report to Excel
  const exportToExcel = () => {
    const worksheetData = reports.map((report) => ({
      Name: report.username,
      Number: report.number,
      Role: report.role,
      Zone: report.zone,
      "Total Working Days": totalWorkingDays,
      Holidays:
        dayCount -
        totalWorkingDays -
        (report.totalCheckIns - totalWorkingDays > 0
          ? report.totalCheckIns - totalWorkingDays
          : 0),
      "Approved Leave": report.approvedLeaves,
      Absent:
        totalWorkingDays - report.totalCheckIns - report.approvedLeaves > 0
          ? totalWorkingDays - report.totalCheckIns - report.approvedLeaves
          : 0,
      "Extra Day":
        report.totalCheckIns - totalWorkingDays > 0
          ? report.totalCheckIns - totalWorkingDays
          : 0,
      "Total Check-Ins": report.totalCheckIns,
      "Late Check-Ins (10.15 AM)": report.lateCheckIns,
      "Late Check-Outs (8.00 PM)": report.lateCheckOuts,
      "Late Adjustment": report.lateCheckIns - report.lateCheckOuts,
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Monthly Report");

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `Monthly_Report_${selectedMonth}.xlsx`);
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
          <Link
            to="/admin/today-report"
            className="px-4 py-2 rounded hover:bg-gray-700 focus:bg-gray-700"
          >
            Today's Report
          </Link>
          <Link
            to="/admin/monthly-summary"
            className="px-4 py-2 rounded hover:bg-gray-700 focus:bg-gray-700"
          >
            Monthly Summary
          </Link>
          <Link
            to="/admin/monthly-details"
            className="px-4 py-2 rounded hover:bg-gray-700 focus:bg-gray-700"
          >
            Monthly Details
          </Link>
          {storedUser.role !== "inspect" && (
            <Link
              to="/admin/applications"
              className="px-4 py-2 rounded hover:bg-gray-700 focus:bg-gray-700"
            >
              Leave Requests
            </Link>
          )}
          {storedUser?.role === "super admin" && (
            <Link
              to="/admin/user"
              className="px-4 py-2 rounded hover:bg-gray-700 focus:bg-gray-700 flex items-center"
            >
              Users
            </Link>
          )}
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

        <h1 className="text-xl font-bold mb-4">Monthly Attendance Report</h1>

        {/* Export Button */}
        <button
          onClick={exportToExcel}
          className="mb-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Export Report
        </button>

        <div className="mb-4 flex items-center space-x-4">
          <div>
            <label className="mr-2 font-semibold">Select Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={handleMonthChange}
              className="border rounded px-2 py-1"
            />
          </div>
          {(storedUser?.role === "super admin" || storedUser?.role === "inspect" ) && (
            <div>
              <label className="mr-2 font-semibold">Filter by Group:</label>
              <select
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="NMT">NMT</option>
                <option value="AMD">AMD</option>
                <option value="GVI">GVI</option>
              </select>
            </div>
          )}

          <div>
            <label className="mr-2 font-semibold">Filter by User Role:</label>
            <select
              value={selectedRole}
              onChange={handleRoleChange}
              className="border rounded px-2 py-1"
            >
              {storedUser?.role === "super admin" && (
                <option value="office">Office</option>
              )}
              {storedUser?.role === "super admin" && (
                <option value="super admin">Super Admin</option>
              )}
              {(storedUser?.role === "super admin" ||
                storedUser?.role === "RSM") && <option value="RSM">RSM</option>}

              {(storedUser?.role === "super admin" ||
                storedUser?.role === "RSM" ||
                storedUser?.role === "TSO") && <option value="TSO">TSO</option>}

              {(storedUser?.role === "super admin" ||
                storedUser?.role === "RSM" ||
                storedUser?.role === "ASM") && <option value="ASM">ASM</option>}

              <option value="MR">MR</option>
            </select>
          </div>

          {(storedUser?.role === "super admin" || storedUser?.role === "inspect"  ||
            storedUser?.role === "RSM") && (
            <div className="mb-4 w-[100%]">
              <label className="block text-gray-700 font-bold mb-2">
                Filter by Zone:
              </label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="border rounded px-2 py-1"
              >
                <option value="">Select Zone</option>
                <option value="Gulshan">Gulshan</option>
                <option value="Mirpur">Mirpur</option>
                <option value="Dhanmondi">Dhanmondi</option>
                <option value="Uttara">Uttara</option>
                <option value="Chittagong">Chittagong</option>
                <option value="Sylhet">Sylhet</option>
                <option value="Old Town">Old Town</option>
              </select>
            </div>
          )}
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : reports.length > 0 ? (
          <div className="overflow-x-auto w-[95vw] sm:w-[auto]">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 px-4 py-2">Username</th>
                  <th className="border border-gray-300 px-4 py-2">Role</th>
                  <th className="border border-gray-300 px-4 py-2">Zone</th>
                  <th className="border border-gray-300 px-4 py-2">
                    Total Working Days
                  </th>
                  <th className="border border-gray-300 px-4 py-2">Holidays</th>
                  <th className="border border-gray-300 px-4 py-2">
                    Approved Leave
                  </th>
                  <th className="border border-gray-300 px-4 py-2 bg-red-500 text-white">
                    Absent
                  </th>
                  <th className="border border-gray-300 px-4 py-2 bg-[#0B6222] text-white">
                    Extra Day
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Total Check-Ins
                  </th>
                  <th className="border border-gray-300 px-4 py-2 bg-red-500 text-white">
                    Late Check-Ins (10.15 AM)
                  </th>
                  <th className="border border-gray-300 px-4 py-2 bg-[#0B6222] text-white">
                    Late Check-Outs (8.00 PM)
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Late Adjustment
                  </th>
                  <th className="border border-gray-300 px-4 py-2">
                    Daily Report
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, index) => (
                  <tr key={index} className="text-center">
                    <td className="border border-gray-300 px-4 py-2">
                      {report.username}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {report?.role}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {report?.zone}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {totalWorkingDays}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {dayCount -
                        totalWorkingDays -
                        (report.totalCheckIns - totalWorkingDays > 0
                          ? report.totalCheckIns - totalWorkingDays
                          : 0)}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {report.approvedLeaves}
                    </td>
                    <td className="border border-gray-300  bg-red-300 px-4 py-2">
                      {totalWorkingDays -
                        report.totalCheckIns -
                        report.approvedLeaves >
                      0
                        ? totalWorkingDays -
                          report.totalCheckIns -
                          report.approvedLeaves
                        : 0}
                    </td>
                    <td className="border border-gray-300 bg-[#9BB97F] px-4 py-2">
                      {report.totalCheckIns - totalWorkingDays > 0
                        ? report.totalCheckIns - totalWorkingDays
                        : 0}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {report.totalCheckIns}
                    </td>
                    <td className="border border-gray-300 bg-red-300 px-4 py-2">
                      {report.lateCheckIns}
                    </td>
                    <td className="border border-gray-300 bg-[#9BB97F]  px-4 py-2">
                      {report.lateCheckOuts}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {report.lateCheckIns - report.lateCheckOuts}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <Link to={`/admin/view-report/${report.userId}`}>
                        View Report
                      </Link>
                    </td>
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
