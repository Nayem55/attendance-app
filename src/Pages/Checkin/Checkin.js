import axios from "axios";
import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom"; // For navigation after submit

const CheckInPage = () => {
  const [note, setNote] = useState("");
  const [image, setImage] = useState(null);
  const [time, setTime] = useState("");
  const [location, setLocation] = useState(""); // Store location data
  const videoRef = useRef(null); // Video element for camera preview
  const canvasRef = useRef(null); // Canvas to capture the image
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const date = new Date().toLocaleDateString()


  // Fetch current time for display
  useEffect(() => {
    const currentTime = new Date().toLocaleTimeString();
    setTime(currentTime);
  }, []);

  // Fetch the current location using Geolocation API
  useEffect(() => {
    const fetchLocation = async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;

            // Use reverse geocoding service to get the location details
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
            );
            const data = await response.json();

            // Extract relevant parts of the address (quarter, suburb, city)
            const quarter = data.address.quarter || "";
            const suburb = data.address.suburb || data.address.neighborhood || "";
            const city = data.address.city || "Dhaka"; // Default to Dhaka if not found

            // Format location as "Quarter, Suburb, City"
            setLocation(`${quarter}, ${suburb}, ${city}`);
          },
          (error) => {
            console.error(error);
            alert("Unable to fetch location: " + error.message);
          },
          {
            enableHighAccuracy: true, // Request high accuracy
            timeout: 10000, // Timeout after 10 seconds
            maximumAge: 0, // Don't use cached location
          }
        );
      } else {
        alert("Geolocation is not supported by this browser.");
      }
    };

    fetchLocation();
  }, []);

  // Start camera function
  useEffect(() => {
    const startCamera = async () => {
      try {
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        // Set the video source to the stream
        videoRef.current.srcObject = stream;
      } catch (error) {
        console.error("Error accessing camera: ", error);
        alert("Could not access the camera.");
      }
    };

    startCamera();
  }, []);

  // Handle capturing the image
  const handleCapture = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const video = videoRef.current;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current frame from video to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get the image data from canvas and set it in state
    const imageData = canvas.toDataURL("image/png");
    setImage(imageData); // Set captured image to state
  };

// Handle form submission
const handleSubmit = async (event) => {
    event.preventDefault();
  
    const checkInData = {
      note,
      image,
      time,
      date: new Date().toLocaleDateString(),
      location,
    };
  
    try {
      const response = await fetch("http://localhost:5000/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(checkInData),
      });
  
      const data = await response.json();
  
      if (response.ok) {
        // Update the user's checked-in status in localStorage
        const user = JSON.parse(localStorage.getItem("user"));
        if (user) {
          user.checkedIn = true; // Update the checked-in status
          localStorage.setItem("user", JSON.stringify(user));
        }
  
        alert("Check-in completed successfully!");
        navigate("/home"); // Redirect to home page
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("Error during check-in:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleCheckIn = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
  
    try {
      const response = await axios.post("http://localhost:5000/checkin", {
        userId: user.id,
        note,image,time,date,location
      });
  
      // Update the user's checked-in status locally
      user.checkIn = true;
      localStorage.setItem("user", JSON.stringify(user));
  
      toast.success(response.data.message);
      navigate("/home"); // Redirect after check-in
    } catch (error) {
      toast.error(error.response ? error.response.data.message : "Error during check-in");
    }
  };
  
  const handleCheckOut = async () => {
    const user = JSON.parse(localStorage.getItem("user"));
  
    try {
      const response = await axios.post("http://localhost:5000/checkout", {
        userId: user.id,
        note,image,time,date,location
      });
  
      // Update the user's checked-in status locally
      user.checkIn = false;
      localStorage.setItem("user", JSON.stringify(user));
  
      toast.success(response.data.message);
      navigate("/home"); // Redirect after check-out
    } catch (error) {
      toast.error(error.response ? error.response.data.message : "Error during check-out");
    }
  };
  
  

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold text-center mb-4">Check-In Page</h2>

      {/* Camera Section */}
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
        {image && <img src={image} alt="Captured Check-In" className="w-full h-auto mt-2" />}
      </div>

      {/* Note Input Section */}
      <div className="mb-6">
        <label className="block text-lg font-medium mb-2">Note (Optional):</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add any note for your check-in..."
          className="w-full p-2 border border-gray-300 rounded-md"
          rows="4"
        />
      </div>

      {/* Table with current date, time, and location */}
      <div className="mb-6">
        <table className="w-full table-auto">
          <thead>
            <tr>
              <th className="text-left p-2">Current Date</th>
              <th className="text-left p-2">{new Date().toLocaleDateString()}</th>
            </tr>
          </thead>
          <tbody>
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

      {/* Submit Button */}
      <div className="text-center">
      {user && user.checkIn ? (
      <button className="sm:w-full bg-blue-500 text-white py-2 px-4 rounded mt-2 block text-center" onClick={handleCheckOut}>Check Out</button>
    ) : (
      <button className="sm:w-full bg-blue-500 text-white py-2 px-4 rounded mt-2 block text-center" onClick={handleCheckIn}>Check In</button>
    )}
      </div>
    </div>
  );
};

export default CheckInPage;
