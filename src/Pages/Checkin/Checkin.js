import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

const CheckInPage = () => {
  const [note, setNote] = useState("");
  const [image, setImage] = useState(null);
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchCurrentTime = () => {
    const currentTime = dayjs().tz("Asia/Dhaka").format("hh:mm A");
    setTime(currentTime);
  };

  useEffect(() => {
    fetchCurrentTime();
  }, []);

  useEffect(() => {
    const fetchLocation = async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await response.json();
            const quarter = data.address.quarter || "";
            const suburb =
              data.address.suburb || data.address.neighborhood || "";
            const city = data.address.city || "Dhaka";
            setLocation(`${quarter}, ${suburb}, ${city}`);
          },
          (error) => {
            console.error(error);
            alert("Unable to fetch location: " + error.message);
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      } else {
        alert("Geolocation is not supported by this browser.");
      }
    };

    fetchLocation();
  }, []);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoRef.current.srcObject = stream;
      } catch (error) {
        console.error("Error accessing camera: ", error);
        alert("Could not access the camera.");
      }
    };

    startCamera();
  }, []);

  const handleCapture = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL("image/png");
    setImage(imageData);
  };

  const handleCheckIn = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const checkInTime = dayjs().tz("Asia/Dhaka").format("YYYY-MM-DD HH:mm:ss");

    try {
      const response = await axios.post(
        "https://attendance-app-server-blue.vercel.app/checkin",
        {
          userId: user.id,
          note,
          image,
          time: checkInTime,
          date: "",
          location,
        }
      );

      user.checkIn = true;
      user.checkInTime = checkInTime;
      localStorage.setItem("user", JSON.stringify(user));

      toast.success(response.data.message);
      navigate("/home");
    } catch (error) {
      toast.error(
        error.response ? error.response.data.message : "Error during check-in"
      );
    }
  };

  const handleCheckOut = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const checkOutTime = dayjs().tz("Asia/Dhaka").format("YYYY-MM-DD HH:mm:ss");

    try {
      const response = await axios.post(
        "https://attendance-app-server-blue.vercel.app/checkout",
        {
          userId: user.id,
          note,
          image,
          time: checkOutTime,
          date: "",
          location,
        }
      );

      user.checkIn = false;
      user.checkOutTime = checkOutTime;
      localStorage.setItem("user", JSON.stringify(user));

      toast.success(response.data.message);
      navigate("/home");
    } catch (error) {
      toast.error(
        error.response ? error.response.data.message : "Error during check-out"
      );
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-center mb-4">Check-In Page</h2>
      <div className="mb-6">
        <label className="block text-lg font-medium mb-2">Capture Image:</label>
        <video
          ref={videoRef}
          autoPlay
          className="w-full h-auto border border-gray-300 rounded"
        ></video>
        <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
        <button
          onClick={handleCapture}
          className="w-full mt-4 bg-blue-500 text-white py-2 rounded-lg"
        >
          Capture Image
        </button>
        {image && <img src={image} alt="Captured Check-In" className="mt-2" />}
      </div>
      <div className="mb-6">
        <label className="block text-lg font-medium mb-2">
          Note (Optional):
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add any note for your check-in..."
          className="w-full p-2 border border-gray-300 rounded-md"
          rows="4"
        />
      </div>
      <div className="mb-6">
        <table className="w-full table-auto">
          <tbody>
            <tr>
              <td className="p-2">Current Date</td>
              <td className="p-2">{dayjs().format("DD MMMM YYYY")}</td>
            </tr>
            <tr>
              <td className="p-2">Current Time</td>
              <td className="p-2">{time}</td>
            </tr>
            <tr>
              <td className="p-2">Location</td>
              <td className="p-2">{location || "Fetching location..."}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="text-center">
        {user && user.checkIn ? (
          <button
            className="w-full bg-blue-500 text-white py-2 px-4 rounded mt-2"
            onClick={handleCheckOut}
          >
            Check Out
          </button>
        ) : (
          <button
            className="w-full bg-blue-500 text-white py-2 px-4 rounded mt-2"
            onClick={handleCheckIn}
          >
            Check In
          </button>
        )}
      </div>
    </div>
  );
};

export default CheckInPage;
