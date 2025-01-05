"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

export default function Home() {
  const [minTime, setMinTime] = useState("");
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableTimes(selectedDate);
    }
  }, [selectedDate]);

  const fetchAvailableTimes = async (date) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL; // Use the environment variable
      const response = await axios.get(`${apiUrl}/api/available-times?date=${date}`);

      const today = new Date();
      const isToday = new Date(date).toDateString() === today.toDateString();

      let filteredTimes = response.data.availableSlots;

      if (isToday) {
        const currentTimeInMinutes = today.getHours() * 60 + today.getMinutes();

        filteredTimes = filteredTimes.filter((time) => {
          const [hourMinute, period] = time.split(" ");
          const [hour, minute] = hourMinute.split(":").map(Number);

          let hour24 = hour;
          if (period === "PM" && hour !== 12) hour24 += 12;
          if (period === "AM" && hour === 12) hour24 = 0;

          const timeInMinutes = hour24 * 60 + minute;
          return timeInMinutes > currentTimeInMinutes;
        });
      }

      setAvailableTimes(filteredTimes);
    } catch (error) {
      console.error("Failed to fetch available times", error);
      toast.error("Failed to fetch available times.");
    }
  };

  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    setSelectedDate(selectedDate);
    const today = new Date();
    if (new Date(selectedDate).toDateString() === today.toDateString()) {
      const hours = today.getHours().toString().padStart(2, "0");
      const minutes = today.getMinutes().toString().padStart(2, "0");
      setMinTime(`${hours}:${minutes}`);
    } else {
      setMinTime("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;

    if (form.checkValidity()) {
      const formData = new FormData(form);
      const data = Object.fromEntries(formData.entries());

      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL; // Use the environment variable
        await axios.post(`${apiUrl}/api/bookings`, data);

        toast.success(
          `Booking confirmed for ${data.guests} guests on ${data.date} at ${data.time}.`,
          { duration: 5000 }
        );

        form.reset();
        setMinTime("");
        fetchAvailableTimes(data.date);
      } catch (error) {
        toast.error(
          error.response?.data?.error || "Failed to book the table. Please try again."
        );
      }
    } else {
      form.reportValidity();
      toast.error("Please correct the highlighted fields.", { duration: 5000 });
    }
  };

  return (
    <div className="container">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="title">Restaurant Table Booking</div>
      <div className="content">
        <form onSubmit={handleSubmit}>
          <div className="user-details">
            <div className="input-box">
              <span className="details">Date</span>
              <input
                type="date"
                name="date"
                required
                onChange={handleDateChange}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="input-box">
              <span className="details">Time</span>
              <select
                name="time"
                required
                min={minTime}
                defaultValue=""
              >
                <option value="" disabled>
                  Select Time
                </option>
                {availableTimes.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <div className="input-box">
              <span className="details">Guests</span>
              <input
                type="number"
                name="guests"
                required
                min="1"
                max="10"
              />
            </div>
            <div className="input-box">
              <span className="details">Name</span>
              <input
                type="text"
                name="name"
                required
                minLength="2"
                maxLength="50"
                pattern="^[a-zA-Z\s]+$"
              />
            </div>
            <div className="input-box">
              <span className="details">Phone Number</span>
              <input
                type="text"
                name="contact"
                required
                pattern="^[0-9]{10}$"
              />
            </div>
          </div>
          <div className="button">
            <input type="submit" value="Book Table" />
          </div>
        </form>
      </div>
    </div>
  );
}
