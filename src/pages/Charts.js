import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";

import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Line } from "react-chartjs-2";
import "../style.css";

const API_URL = process.env.REACT_APP_API_URL || "/api";
const TIME_LABELS = ["9AM", "11AM", "1PM", "3PM", "5PM", "7PM"];
const LIVE_USAGE = [25, 45, 70, 60, 85, 40];
const REALTIME_ENABLED = !API_URL.startsWith("/api");
const socketHost = API_URL.startsWith("http") ? API_URL : window.location.origin;
const socket = REALTIME_ENABLED
  ? io(socketHost, {
      transports: ["websocket"]
    })
  : null;

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function buildSuggestion(stations) {
  if (!stations.length) {
    return null;
  }

  const ranked = [...stations].sort((left, right) => {
    const leftFree = left.totalSlots - left.occupiedSlots;
    const rightFree = right.totalSlots - right.occupiedSlots;
    const leftScore = leftFree * 2 - left.pricePerHour;
    const rightScore = rightFree * 2 - right.pricePerHour;
    return rightScore - leftScore;
  });

  const topChoices = ranked.slice(0, Math.min(3, ranked.length));
  const picked = topChoices[Math.floor(Math.random() * topChoices.length)];
  const freeSlots = picked.totalSlots - picked.occupiedSlots;

  let reason = "balanced availability and pricing";
  if (freeSlots >= 4) {
    reason = "more free slots, so charging is less likely to wait";
  } else if (picked.pricePerHour <= 20) {
    reason = "lower charging price for a budget-friendly stop";
  } else if (freeSlots >= 2) {
    reason = "good availability for a quick top-up";
  }

  return {
    name: picked.name,
    location: picked.location,
    pricePerHour: picked.pricePerHour,
    freeSlots,
    totalSlots: picked.totalSlots,
    reason
  };
}

function buildPredictionSeries(suggestion) {
  if (!suggestion) {
    return [];
  }

  const occupancyPressure = suggestion.totalSlots > 0
    ? suggestion.freeSlots / suggestion.totalSlots
    : 0.5;

  const peakBias = suggestion.pricePerHour <= 20 ? 3 : 8;

  return LIVE_USAGE.map((point, index) => {
    const wave = index < 3 ? 6 : 12;
    const randomShift = Math.round(Math.random() * 8) - 4;
    const predicted = point + peakBias + wave - Math.round(occupancyPressure * 10) + randomShift;
    return clamp(predicted, 10, 100);
  });
}

export default function Charts() {
  const [stations, setStations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [suggestion, setSuggestion] = useState(null);
  const [predictionMode, setPredictionMode] = useState(false);
  const [predictionSeries, setPredictionSeries] = useState([]);
  const clientEmail = localStorage.getItem("clientEmail");

  const loadBookings = useCallback(async () => {
    const res = await fetch(`${API_URL}/bookings`);
    if (res.ok) {
      const data = await res.json();
      setBookings(data.filter((booking) => booking.clientEmail === clientEmail));
    }
  }, [clientEmail]);

  useEffect(() => {
    fetch(`${API_URL}/stations`)
      .then((res) => res.json())
      .then(setStations);

    loadBookings();

    if (socket) {
      socket.on("update", (data) => {
        setStations(data);
      });

      socket.on("booking:update", () => {
        loadBookings();
      });
    }

    return () => {
      if (socket) {
        socket.off("update");
        socket.off("booking:update");
      }
    };
  }, [loadBookings]);

  useEffect(() => {
    const nextSuggestion = buildSuggestion(stations);
    setSuggestion(nextSuggestion);

    if (!predictionMode) {
      setPredictionSeries([]);
      return;
    }

    setPredictionSeries(buildPredictionSeries(nextSuggestion));
  }, [stations, predictionMode]);

  const data = {
    labels: TIME_LABELS,
    datasets: predictionMode
      ? [
          {
            label: "Live Usage %",
            data: LIVE_USAGE,
            borderColor: "#22c55e",
            backgroundColor: "rgba(34,197,94,.15)",
            tension: 0.4
          },
          {
            label: `Predicted Usage %${suggestion ? ` - ${suggestion.name}` : ""}`,
            data: predictionSeries.length ? predictionSeries : LIVE_USAGE,
            borderColor: "#f59e0b",
            backgroundColor: "rgba(245,158,11,.15)",
            borderDash: [8, 6],
            tension: 0.4,
            pointRadius: 3
          }
        ]
      : [
          {
            label: "Charging Usage %",
            data: LIVE_USAGE,
            borderColor: "#22c55e",
            backgroundColor: "rgba(34,197,94,.25)",
            tension: 0.4
          }
        ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom"
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value) => `${value}%`
        }
      }
    }
  };

  const bookingCount = bookings.length;
  const estimatedElectricityUsedKwh = bookingCount * 7.5;
  const activeBookings = bookings.filter((booking) => booking.status === "active").length;

  const handlePredict = () => {
    setPredictionMode((current) => !current);
    if (!predictionMode && suggestion) {
      setPredictionSeries(buildPredictionSeries(suggestion));
    }
  };

  return (
    <div className="charts-container">
      <div className="charts-hero">
        <p className="charts-kicker">User Dashboard</p>
        <h1>Charging Analytics</h1>
        <p>
          Live usage trends with a random AI pick for the charger station that looks best for your car right now. Turn on prediction to see the expected next peak on the graph.
        </p>
      </div>

      <div className="analytics-summary">
        <div className="summary-card">
          <span className="summary-label">Times Booked</span>
          <strong>{bookingCount}</strong>
          <p>Total charging sessions reserved by you.</p>
        </div>

        <div className="summary-card">
          <span className="summary-label">Electricity Used</span>
          <strong>{estimatedElectricityUsedKwh.toFixed(1)} kWh</strong>
          <p>Estimated from your booked sessions.</p>
        </div>

        <div className="summary-card">
          <span className="summary-label">Active Bookings</span>
          <strong>{activeBookings}</strong>
          <p>Bookings that are still marked active.</p>
        </div>
      </div>

      <div className="charts-layout">
        <div className="ai-suggestion-card">
          <span className="ai-badge">AI Suggestion</span>
          <div className="prediction-actions">
            <button type="button" className="predict-button" onClick={handlePredict}>
              {predictionMode ? "Show Live Graph" : "Predict Next Charger"}
            </button>
            <span className="prediction-chip">
              {predictionMode ? "Prediction enabled" : "Live mode"}
            </span>
          </div>
          {suggestion ? (
            <>
              <h2>{suggestion.name}</h2>
              <p className="ai-location">{suggestion.location} Zone</p>
              <p>
                Best fit for your car right now because it has {suggestion.freeSlots} free slots out of {suggestion.totalSlots} and a fair price of ₹{suggestion.pricePerHour}/hr.
              </p>
              <p className="ai-reason">Why this one: {suggestion.reason}.</p>
              {predictionMode && (
                <p className="prediction-note">
                  Graph is now showing a forecast line for this station, so you can compare live demand with the predicted rush.
                </p>
              )}
            </>
          ) : (
            <p>Loading live station recommendations...</p>
          )}
        </div>

        <div className="chart-card">
          <Line data={data} options={chartOptions} />
        </div>
      </div>
    </div>
  );
}
