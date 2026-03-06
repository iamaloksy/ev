import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";

import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function Charts() {

  const data = {
    labels: ["9AM","11AM","1PM","3PM","5PM","7PM"],
    datasets: [
      {
        label: "Charging Usage %",
        data: [25, 45, 70, 60, 85, 40],
        borderColor: "#22c55e",
        backgroundColor: "rgba(34,197,94,.25)",
        tension: 0.4
      }
    ]
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Charging Analytics</h1>
      <Line data={data} />
    </div>
  );
}
