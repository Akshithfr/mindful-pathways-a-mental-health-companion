import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MoodChart = ({ entries }) => {
  const moodValues = {
    'Very Happy': 5,
    'Happy': 4,
    'Neutral': 3,
    'Sad': 2,
    'Very Sad': 1
  };

  const chartData = entries.map(entry => ({
    timestamp: new Date(entry.timestamp).toLocaleDateString(),
    value: moodValues[entry.mood],
    mood: entry.mood
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timestamp" />
          <YAxis domain={[1, 5]} />
          <Tooltip
            content={({ payload, label }) => {
              if (payload && payload[0]) {
                return (
                  <div className="bg-white p-2 border rounded shadow">
                    <p className="font-semibold">{label}</p>
                    <p>{payload[0].payload.mood}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#4F46E5"
            strokeWidth={2}
            dot={{ fill: '#4F46E5' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MoodChart;