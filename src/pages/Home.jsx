import React from 'react';
import Financial from '../components/Financials';
import Graphs from '../components/Graphs';

function Home() {
  return (
    <div className="container mx-auto mt-16 p-4 text-center">
      <h1 className="text-4xl font-bold text-white-600 mb-2">
        Welcome to <span className="text-indigo-600">ReceiptPal</span>
      </h1>
      <p className="text-lg text-white-700 mb-8">
        Your one-stop solution for managing and organizing your receipts.
      </p>
      <div className="flex justify-center space-x-4">
        <Financial />
      </div>
      <h2 className="text-center text-2xl font-bold tracking-tight text-white-900 mt-6">
        Beautiful graphs and charts to help you understand <span className='text-indigo-600'>your</span> spending habits.
      </h2>
      <div className="flex justify-center space-x-4 ">
        <Graphs />
      </div>
    </div>
  );
}

export default Home;