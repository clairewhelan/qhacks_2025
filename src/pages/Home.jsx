import React from 'react';

function Home() {
  return (
    <>
      <div className="container mx-auto mt-16 p-4">
        <h1>ReceiptPal</h1>
        <h2>Expense tracking made simple</h2>
        </div>
      
      <div className='mt-10 sm:mx-auto sm:w-full sm:max-w-sm'>
        <p>Upload your receipts and let us do the work for you. </p>
      </div>

      <div className='mt-10 sm:mx-auto sm:w-full sm:max-w-sm'>
        <p>ReceiptPal scans your receipts, storing information about your purchases and allowing you to visualize your expenses over time.</p>
      </div>

      <div className='mt-10 sm:mx-auto sm:w-full sm:max-w-sm'>
        <p>Create a free account today. </p>
      </div>
    </>

  );
}

export default Home;