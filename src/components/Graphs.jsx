import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Graphs() {
  // Manually defined datasets
  const typeChartData = {
    labels: ['Food', 'Transport', 'Entertainment', 'Utilities', 'Health'],
    datasets: [
      {
        label: 'Total Spent by Category',
        data: [500, 300, 200, 400, 150],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const yearlyChartData = {
    labels: ['2018', '2019', '2020', '2021', '2022'],
    datasets: [
      {
        label: 'Food',
        data: [1000, 1200, 1100, 1300, 1250],
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
      {
        label: 'Transport',
        data: [800, 900, 850, 950, 900],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
      {
        label: 'Entertainment',
        data: [600, 700, 650, 750, 700],
        backgroundColor: 'rgba(255, 206, 86, 0.5)',
      },
      {
        label: 'Utilities',
        data: [400, 450, 420, 480, 460],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Health',
        data: [300, 350, 320, 380, 360],
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
      },
    ],
  };

  const chartOptions = (title, xLabel, yLabel) => ({
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 18,
          weight: 'bold',
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: xLabel,
          color: 'black',
          font: { size: 14 },
        },
        ticks: {
          color: 'black',
        },
      },
      y: {
        title: {
          display: true,
          text: yLabel,
          color: 'black',
          font: { size: 14 },
        },
        ticks: {
          color: 'black',
        },
      },
    },
  });

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 mt-8">
      <div className="space-y-8">
        {/* Top Row: Two Charts Side by Side */}
        <div className="flex flex-wrap justify-between gap-4">
          <div className="flex-1 bg-white p-6 rounded-lg shadow-lg w-full">
            <h2 className="text-xl font-semibold text-center mb-4">Total Spending by Type</h2>
            <Bar
              data={typeChartData}
              options={chartOptions(
                'Total Spending by Type',
                'Spending Categories',
                'Amount Spent ($)'
              )}
            />
          </div>
          <div className="flex-1 bg-white p-6 rounded-lg shadow-lg w-full">
            <h2 className="text-xl font-semibold text-center mb-4">Yearly Spending by Category</h2>
            <Bar
              data={yearlyChartData}
              options={chartOptions(
                'Yearly Spending by Category',
                'Years',
                'Amount Spent ($)'
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Graphs;