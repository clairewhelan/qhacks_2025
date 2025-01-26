import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function Dashboard() {
  const [receiptData, setReceiptData] = useState([]);
  const [idToken, setIdToken] = useState(null);

  useEffect(() => {
    const fetchReceipts = async (token) => {
      try {
        const response = await fetch('/api/user-data', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idToken: token }),
        });
        const data = await response.json();
        if (data.status === 'success') {
          setReceiptData(data.data.receipts || []);
        } else {
          console.error('Error fetching receipts:', data.message);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        setIdToken(token);
        fetchReceipts(token);
      }
    });

    return () => unsubscribe();
  }, []);

  const processChartData = () => {
    const amountsByType = {};
    const yearlySpending = {};
    const monthlySpending = {};

    receiptData.forEach((receipt) => {
      const { type, total, date } = receipt;
      const year = new Date(date).getFullYear();
      const month = new Date(date).getMonth() + 1;

      if (!amountsByType[type]) amountsByType[type] = [];
      amountsByType[type].push(parseFloat(total));

      if (!yearlySpending[year]) yearlySpending[year] = {};
      if (!yearlySpending[year][type]) yearlySpending[year][type] = 0;
      yearlySpending[year][type] += parseFloat(total);

      if (!monthlySpending[year]) monthlySpending[year] = {};
      if (!monthlySpending[year][month]) monthlySpending[year][month] = 0;
      monthlySpending[year][month] += parseFloat(total);
    });

    return { amountsByType, yearlySpending, monthlySpending };
  };

  const { amountsByType, yearlySpending, monthlySpending } = processChartData();

  const boxPlotData = {
    labels: Object.keys(amountsByType),
    datasets: [
      {
        label: 'Total Amount Spent',
        data: Object.keys(amountsByType).map((type) =>
          amountsByType[type].reduce((a, b) => a + b, 0)
        ),
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const yearlyChartData = {
    labels: Object.keys(yearlySpending),
    datasets: Object.keys(yearlySpending[Object.keys(yearlySpending)[0]] || {}).map((type) => ({
      label: type,
      data: Object.keys(yearlySpending).map((year) => yearlySpending[year][type] || 0),
      backgroundColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`,
    })),
  };

  const monthlyChartData = {
    labels: Array.from({ length: 12 }, (_, i) => i + 1),
    datasets: Object.keys(monthlySpending).map((year) => ({
      label: `Year ${year}`,
      data: Array.from({ length: 12 }, (_, i) => monthlySpending[year][i + 1] || 0),
      backgroundColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`,
    })),
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
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 mt-16">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="text-center text-2xl font-bold tracking-tight text-white-900 mb-12">
          The following <span className='text-indigo-600'>charts</span> are based on your receipt data.
        </h2>
      </div>

      {receiptData.length > 0 ? (
        <div className="space-y-8">
          {/* Top Row: Two Charts Side by Side */}
          <div className="flex flex-wrap justify-between gap-4 ">
            <div className="flex-1 bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-semibold text-center mb-4">Total Spending by Type</h2>
              <Bar
                data={boxPlotData}
                options={chartOptions(
                  'Total Spending by Type',
                  'Spending Categories',
                  'Amount Spent ($)'
                )}
              />
            </div>
            <div className="flex-1 bg-white p-6 rounded-lg shadow-lg">
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

          {/* Bottom Row: Single Chart Centered */}
          <div className="w-full bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-semibold text-center mb-4">Monthly Spending by Year</h2>
            <Bar
              data={monthlyChartData}
              options={chartOptions(
                'Monthly Spending by Year',
                'Months (1-12)',
                'Amount Spent ($)'
              )}
            />
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500">Loading data or no receipts available...</p>
      )}
    </div>
  );
}

export default Dashboard;



