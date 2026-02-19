import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  BubbleController,
} from 'chart.js';
import { Bubble } from 'react-chartjs-2';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend, BubbleController);

export default function FraudHeatmap({ selectedDateRange }) {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHeatmapData = async () => {
      try {
        const token = localStorage.getItem('token');

        // Build query parameters based on filters
        const daysMap = {
          "Last 7 days": 7,
          "Last 30 days": 30,
          "Last 90 days": 90
        };

        const days = daysMap[selectedDateRange] || 30;

        const response = await fetch(`http://localhost:5000/api/admin/fraud-hotspots?days=${days}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Heatmap API response:', data);
          console.log('Heatmap data:', data.data);
          setHeatmapData(data.data);
        } else {
          // Fallback to mock data if API fails
          const mockData = [
            { city: "Mumbai", state: "Maharashtra", lat: 19.0760, lon: 72.8777, fraudCount: 245, riskLevel: "High" },
            { city: "Delhi", state: "Delhi", lat: 28.7041, lon: 77.1025, fraudCount: 198, riskLevel: "High" },
            { city: "Bangalore", state: "Karnataka", lat: 12.9716, lon: 77.5946, fraudCount: 167, riskLevel: "Medium" },
            { city: "Chennai", state: "Tamil Nadu", lat: 13.0827, lon: 80.2707, fraudCount: 134, riskLevel: "Medium" },
            { city: "Pune", state: "Maharashtra", lat: 18.5204, lon: 73.8567, fraudCount: 98, riskLevel: "Low" },
            { city: "Kolkata", state: "West Bengal", lat: 22.5726, lon: 88.3639, fraudCount: 87, riskLevel: "Low" },
            { city: "Ahmedabad", state: "Gujarat", lat: 23.0225, lon: 72.5714, fraudCount: 76, riskLevel: "Low" },
            { city: "Hyderabad", state: "Telangana", lat: 17.3850, lon: 78.4867, fraudCount: 65, riskLevel: "Low" }
          ];
          setHeatmapData(mockData);
        }
      } catch (error) {
        console.error('Error fetching heatmap data:', error);
        // Fallback to mock data
        const mockData = [
          { city: "Mumbai", state: "Maharashtra", lat: 19.0760, lon: 72.8777, fraudCount: 245, riskLevel: "High" },
          { city: "Delhi", state: "Delhi", lat: 28.7041, lon: 77.1025, fraudCount: 198, riskLevel: "High" },
          { city: "Bangalore", state: "Karnataka", lat: 12.9716, lon: 77.5946, fraudCount: 167, riskLevel: "Medium" },
          { city: "Chennai", state: "Tamil Nadu", lat: 13.0827, lon: 80.2707, fraudCount: 134, riskLevel: "Medium" },
          { city: "Pune", state: "Maharashtra", lat: 18.5204, lon: 73.8567, fraudCount: 98, riskLevel: "Low" },
          { city: "Kolkata", state: "West Bengal", lat: 22.5726, lon: 88.3639, fraudCount: 87, riskLevel: "Low" },
          { city: "Ahmedabad", state: "Gujarat", lat: 23.0225, lon: 72.5714, fraudCount: 76, riskLevel: "Low" },
          { city: "Hyderabad", state: "Telangana", lat: 17.3850, lon: 78.4867, fraudCount: 65, riskLevel: "Low" }
        ];
        setHeatmapData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchHeatmapData();
  }, [selectedDateRange]);

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case "High": return 'rgba(220, 38, 38, 0.8)'; // dark red
      case "Medium": return 'rgba(251, 146, 60, 0.8)'; // orange
      case "Low": return 'rgba(59, 130, 246, 0.8)'; // blue
      default: return 'rgba(156, 163, 175, 0.8)'; // gray-500
    }
  };

  const chartData = {
    datasets: heatmapData.map((item) => ({
      label: item.city,
      data: [{
        x: item.lon,
        y: item.lat,
        r: Math.max(5, Math.min(30, item.fraudCount / 10)) // Scale bubble size
      }],
      backgroundColor: getRiskColor(item.riskLevel),
      borderColor: getRiskColor(item.riskLevel).replace('0.8', '1'),
      borderWidth: 2,
    }))
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: 'Longitude'
        },
        min: 68,
        max: 97,
      },
      y: {
        title: {
          display: true,
          text: 'Latitude'
        },
        min: 8,
        max: 37,
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const item = heatmapData[context.datasetIndex];
            return [
              `City: ${item.city}`,
              `State: ${item.state}`,
              `Fraud Cases: ${item.fraudCount}`,
              `Risk Level: ${item.riskLevel}`
            ];
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="w-full h-64 bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-gray-500">Loading fraud hotspots data...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 bg-white border rounded-lg p-4">
      <div className="h-full">
        <Bubble data={chartData} options={options} />
      </div>

      {/* Legend */}
      <div className="absolute top-3 right-3 bg-white bg-opacity-90 p-2 rounded text-xs z-10">
        <div className="font-semibold mb-1">Risk Level</div>
        <div className="flex items-center gap-1 mb-1">
          <div className="w-3 h-3 bg-red-600 rounded-full"></div>
          <span>High</span>
        </div>
        <div className="flex items-center gap-1 mb-1">
          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Low</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute bottom-2 left-2 bg-white bg-opacity-90 p-2 rounded text-xs text-gray-600">
        Hover over bubbles to see fraud details
      </div>
    </div>
  );
}
