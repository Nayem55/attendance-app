/* eslint-disable default-case */
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
  const [preview, setPreview] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [imgLoading, setImgLoading] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [isLocationEnabled, setIsLocationEnabled] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const fetchCurrentTime = () => {
    const currentTime = dayjs().tz("Asia/Dhaka").format("hh:mm A");
    setTime(currentTime);
  };

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, []);

  const fetchUserLocation = async () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const errorMessage = "Geolocation is not supported by your browser.";
        setLocationError(errorMessage);
        reject(errorMessage);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // setIsLocationEnabled(true);
          resolve({ latitude, longitude });
        },
        async (error) => {
          let errorMessage = "An unknown error occurred.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                "Location access denied. Please allow location permissions.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "Request timed out. Please try again.";
              break;
          }

          setLocationError(errorMessage);
          console.warn(errorMessage);

          // **Fallback: Fetch location using IP-based Geolocation (ipinfo.io)**
          try {
            console.log("Fetching location from IPInfo.io...");
            const res = await axios.get(
              "https://ipinfo.io/json?token=6cc3a1d32d5129"
            );
            const [latitude, longitude] = res.data.loc.split(",");
            resolve({ latitude, longitude });
            // setIsLocationEnabled(true);
          } catch (ipError) {
            const fallbackError =
              "Failed to retrieve location from both GPS and IP.";
            // setIsLocationEnabled(false)
            setLocationError(fallbackError);
            reject(fallbackError);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0,
        }
      );
    });
  };

  useEffect(() => {
    fetchCurrentTime();
    // fetchUserLocation();
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

  // const handleCapture = async (key) => {
  //   const canvas = canvasRef.current;
  //   const context = canvas.getContext("2d");
  //   const video = videoRef.current;

  //   canvas.width = video.videoWidth;
  //   canvas.height = video.videoHeight;
  //   context.drawImage(video, 0, 0, canvas.width, canvas.height);

  //   canvas.toBlob(async (blob) => {
  //     const formData = new FormData();
  //     formData.append("image", blob, "capture.png");
  //     setImgLoading(true);
  //     let previewUrl = null;
  //     // Automatically show preview if image upload takes more than 8 seconds
  //     const timeout = setTimeout(() => {
  //       previewUrl = URL.createObjectURL(blob); // Generate a preview URL
  //       setPreview(previewUrl); // Set preview image
  //       setCaptured(true);
  //       setShowPreview(true);
  //       setImgLoading(false);
  //       toast.success("Upload successful!");
  //     }, 15000);

  //     try {
  //       const response = await axios.post(
  //         `https://api.imgbb.com/1/upload?expiration=172800&key=${key}`,
  //         formData
  //       );
  //       const imageUrl = response.data.data.url;
  //       setImage(imageUrl);
  //       setCaptured(true);
  //       !previewUrl && toast.success("Image uploaded successfully!");
  //       clearTimeout(timeout); // Clear timeout if upload completes early
  //     } catch (error) {
  //       !previewUrl && toast.error("Failed to upload image.");
  //     } finally {
  //       setImgLoading(false);
  //     }
  //   }, "image/png");
  // };

  const handleCapture = async (key) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const video = videoRef.current;
  
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
  
    // Resize only if the image is too large
    const maxWidth = 240; // Set max width
    const maxHeight = 320; // Set max height
    let width = canvas.width;
    let height = canvas.height;
  
    // Resize if the image is too large
    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;
      if (width > height) {
        width = maxWidth;
        height = Math.round(width / aspectRatio);
      } else {
        height = maxHeight;
        width = Math.round(height * aspectRatio);
      }
    }
  
    // Create a new canvas for resizing
    const resizedCanvas = document.createElement("canvas");
    const resizedContext = resizedCanvas.getContext("2d");
    resizedCanvas.width = width;
    resizedCanvas.height = height;
    resizedContext.drawImage(canvas, 0, 0, width, height);
  
    // Convert resized image to Blob
    resizedCanvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append("file", blob, "capture.png");
      formData.append("upload_preset", "flormar"); // Replace with your Cloudinary upload preset
      formData.append("expires", 172800); // Set expiration time (in seconds)
  
      setImgLoading(true);
      let previewUrl = null;
  
      // Automatically show preview if image upload takes more than 8 seconds
      const timeout = setTimeout(() => {
        previewUrl = URL.createObjectURL(blob); // Generate a preview URL
        setPreview(previewUrl); // Set preview image
        setCaptured(true);
        setShowPreview(true);
        setImgLoading(false);
        toast.success("Upload successful!");
      }, 10000);
  
      try {
        const response = await axios.post(
          `https://api.cloudinary.com/v1_1/dkozpbeg3/image/upload`, // Replace with your Cloudinary cloud name
          formData
        );
        const imageUrl = response.data.secure_url; // Cloudinary returns image URL under 'secure_url'
        setImage(imageUrl);
        setCaptured(true);
        !previewUrl && toast.success("Image uploaded successfully!");
        clearTimeout(timeout); // Clear timeout if upload completes early
      } catch (error) {
        !previewUrl && toast.error("Failed to upload image.");
      } finally {
        setImgLoading(false);
      }
    }, "image/png");
  };
  

  const handleRetake = () => {
    setImage(null);
    setCaptured(false);
    canvasRef.current.style.display = "none";
  };

  const handleCheckIn = async () => {
    if (!isLocationEnabled) {
      toast.error("Location is required. Please enable location to check-in.");
      return;
    }

    setLoading(true);
    const user = JSON.parse(localStorage.getItem("user"));
    const checkInTime = dayjs().tz("Asia/Dhaka").format("YYYY-MM-DD HH:mm:ss");
    const checkInHour = dayjs(checkInTime).hour();
    const checkInMinute = dayjs(checkInTime).minute();

    const location = await fetchUserLocation();

    const inTime = user?.role === "office" ? 10 : 11 ;

    const status =
      checkInHour > inTime || (checkInHour === inTime && checkInMinute > 15)
        ? "Late"
        : "Success";

    try {
      const response = await axios.post(
        "https://attendance-app-server-blue.vercel.app/checkin",
        {
          userId: user?._id,
          note,
          image,
          time: checkInTime,
          date: dayjs().tz("Asia/Dhaka").format("YYYY-MM-DD"),
          status,
          location,
        }
      );

      user.checkIn = true;
      localStorage.setItem("user", JSON.stringify(user));

      toast.success(response.data.message);
      navigate("/home");
    } catch (error) {
      toast.error(
        error.response ? error.response.data.message : "Error during check-in"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);

    const user = JSON.parse(localStorage.getItem("user"));
    const checkOutTime = dayjs().tz("Asia/Dhaka").format("YYYY-MM-DD HH:mm:ss");
    const checkOutHour = dayjs(checkOutTime).hour();
    const checkOutMinute = dayjs(checkOutTime).minute();

    const location = await fetchUserLocation();

    const outTime = user?.role === "office" ? 20 : 22 ;

    const status =
      checkOutHour > outTime || (checkOutHour === outTime && checkOutMinute >= 0)
        ? "Overtime"
        : "Success";

    try {
      const response = await axios.post(
        "https://attendance-app-server-blue.vercel.app/checkout",
        {
          userId: user?._id,
          note,
          image,
          time: checkOutTime,
          date: dayjs().tz("Asia/Dhaka").format("YYYY-MM-DD"),
          status,
          location,
        }
      );

      user.checkIn = false;
      localStorage.setItem("user", JSON.stringify(user));

      toast.success(response.data.message);
      navigate("/home");
    } catch (error) {
      toast.error(
        error.response ? error.response.data.message : "Error during check-out"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 py-10 px-10 pb-16 mb-10">
      <h2 className="text-2xl font-semibold text-center mb-4">Attendance</h2>
      <label className="block text-lg font-medium mb-2">Capture Image:</label>
      <div className="mb-6 flex flex-col items-center">
        {!captured && (
          <>
            <video
              ref={videoRef}
              autoPlay
              className={`w-full h-auto border border-gray-300 rounded-lg`}
            ></video>
          </>
        )}
        <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
        <button
          onClick={() =>
            handleCapture(
              user && user?.checkIn
                ? "a48ea9753d1150f0bb5440cd689a3cad"
                : "fb274b0d7da059d99ab6c68fea7b73d0"
            )
          }
          className="w-full mt-4 bg-[#002B54] text-white py-2 rounded-lg"
          disabled={imgLoading} // Disable button while loading
        >
          {imgLoading ? "Please wait..." : "Capture Image"}
        </button>

        {image && !showPreview ? (
          <img src={image} alt="Captured Check-In" className="mt-2" />
        ) : (
          showPreview && <img src={preview} alt="Preview" className="mt-2" />
        )}
      </div>
      <div className="mb-6">
        <label className="block text-lg font-medium mb-2">
          Note (Optional):
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add any note for your check-in..."
          className="w-full p-2 border border-gray-300 rounded-lg"
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
          </tbody>
        </table>
      </div>
      <div className="text-center">
        {user && user?.checkIn ? (
          <button
            className={`w-full text-white py-2 px-4 rounded-lg mt-2 bg-[#002B54]`}
            onClick={handleCheckOut}
            disabled={loading}
          >
            {loading ? "Please wait..." : "Check Out"}
          </button>
        ) : (
          <button
            className={`w-full text-white py-2 px-4 rounded-lg mt-2 bg-[#002B54]`}
            onClick={handleCheckIn}
            disabled={loading}
          >
            {loading ? "Please wait..." : "Check In"}
          </button>
        )}
        {/* {!isLocationEnabled && (
          <button
            onClick={() => {
              fetchUserLocation(); // Re-fetch user location
            }}
            className="mt-2 font-bold py-1 px-2 bg-[#002B54] rounded"
          >
            <svg
              className="w-7 h-7 p-1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
            >
              <path
                fill="#ffffff"
                d="M463.5 224l8.5 0c13.3 0 24-10.7 24-24l0-128c0-9.7-5.8-18.5-14.8-22.2s-19.3-1.7-26.2 5.2L413.4 96.6c-87.6-86.5-228.7-86.2-315.8 1c-87.5 87.5-87.5 229.3 0 316.8s229.3 87.5 316.8 0c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0c-62.5 62.5-163.8 62.5-226.3 0s-62.5-163.8 0-226.3c62.2-62.2 162.7-62.5 225.3-1L327 183c-6.9 6.9-8.9 17.2-5.2 26.2s12.5 14.8 22.2 14.8l119.5 0z"
              />
            </svg>
          </button>
        )} */}
      </div>
    </div>
  );
};

export default CheckInPage;

// luvitbd
// ebay
