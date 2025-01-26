import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from '../firebase';

const sendLoginDataToBackend = (formData, setError) => {
  fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(formData),  // Send the form data as JSON
  })
  .then(response => response.json())
  .then(data => {
    if (data.status === 'error') {
      setError(data.message);
    } else {
      console.log('Success:', data);
      setError('');
    }
  })
  .catch((error) => {
    console.error('Error:', error);
    setError('An unexpected error occurred');
  });
}

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData);
    signInWithEmailAndPassword(auth, formData.email, formData.password)
      .then((userCredential) => {
        // Signed in
        const user = userCredential.user;
        console.log('Logged in:', user);
        setError('');
        setMessage('Logged in successfully.');
        sendLoginDataToBackend(formData, setError);  // Send the form data to the backend
        navigate('/dashboard');  // Redirect to the dashboard
      })
      .catch((error) => {
        console.error('Error:', error);
        setError('Invalid email or password entered. Please try again.');
        setMessage('');
      });
  };

  const handleForgotPassword = () => {
    sendPasswordResetEmail(auth, formData.email)
      .then(() => {
        setMessage('Password reset email sent. Check your inbox.');
        setError('');
      })
      .catch((error) => {
        console.error('Error:', error);
        setError('Email is required to reset password.');
        setMessage('');
      });
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm size-15">
        <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white-900">
          Sign in to your account.
        </h2>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        {error && <div className="mb-4 text-red-500">{error}</div>}
        {message && <div className="mb-4 text-green-500">{message}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-left">
            <label htmlFor="email" className="block text-sm/6 font-medium text-white-900">
              Email address
            </label>
            <div className="mt-2">
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-black outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm/6 font-medium text-white-900">
                Password
              </label>
              <div className="text-sm">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="font-semibold text-blue-600 hover:text-white-500"
                >
                  Forgot password?
                </button>
              </div>
            </div>
            <div className="mt-2">
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Sign in
            </button>
          </div>

          <div className="text-sm">
            <p>
              Don't Have an Account?
              <a href="/sign-up" className="font-semibold text-blue-600 hover:text-white-500">
                &nbsp;Sign up.
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;