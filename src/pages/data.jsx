import React, { useState, useEffect, useCallback } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

const sendDataToBackend = async (url, idToken) => {
  try {
    const response = await fetch('/api/save-receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ photoUrl: url, idToken }),
    });
    const data = await response.json();
    console.log('Success:', data);
    return data;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
};

const deleteReceiptFromBackend = async (receipt, idToken) => {
  try {
    const response = await fetch('/api/delete-receipt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ receipt, idToken }),
    });
    const data = await response.json();
    console.log('Deleted:', data);
    return data.status === 'success';
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
};

function Data() {
  const [url, setUrl] = useState('');
  const [receipts, setReceipts] = useState([]);
  const [idToken, setIdToken] = useState(null);

  useEffect(() => {
    const fetchUserData = async (token) => {
      const response = await fetch('/api/user-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken: token }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setReceipts(data.data.receipts || []);
      } else {
        console.error('Error fetching user data:', data.message);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken();
        setIdToken(token);
        fetchUserData(token);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = useCallback(async (receipt) => {
    if (!idToken) return;
    const success = await deleteReceiptFromBackend(receipt, idToken);
    if (success) {
      setReceipts((prevReceipts) => prevReceipts.filter((r) => r !== receipt));
    }
  }, [idToken]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (idToken) {
      const result = await sendDataToBackend(url, idToken);
      if (result && result.status === 'success') {
        setReceipts((prevReceipts) => [...prevReceipts, result.data]);
      }
      setUrl('');
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8 mt-16">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h2 className="text-center text-2xl font-bold tracking-tight text-white-900 mb-4">
          Enter the image <span className='text-indigo-600'>URL</span> of your receipt.
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-left">
            <div className="mt-2">
              <input
                id="photoUrl"
                name="photoUrl"
                type="text"
                required
                placeholder="Enter image URL"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-black outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Submit
            </button>
          </div>
        </form>
      </div>

      {receipts.length > 0 && (
        <div className="mt-10 sm:mx-auto sm:w-full space-y-4">
          <h2 className="text-center text-xl font-bold tracking-tight text-white-900">
            Your Receipts
          </h2>
          <div className="flex flex-wrap gap-4">
            {receipts.map((receipt, index) => (
              <div key={index} className="relative p-25 bg-gray-100 rounded-lg shadow-lg text-gray-800 hover:shadow-xl hover:scale-105 transform transition-all duration-300">
                <button
                  onClick={() => handleDelete(receipt)}
                  className="absolute top-2 right-2 text-white bg-white border border-black p-1 text-xs"
                >
                  X
                </button>
                <p className="text-lg"><strong>Date:</strong> {receipt.date}</p>
                <p className="text-lg"><strong>Total:</strong> ${receipt.total}</p>
                <p className="text-lg"><strong>Type:</strong> {receipt.type}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Data;