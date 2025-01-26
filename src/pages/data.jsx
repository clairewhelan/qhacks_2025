import React, { useState } from 'react';

const sendDataToBackend = (url) => {
  fetch('/api/photo', {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
    },
    body: url,  // Send the URL as plain text
  })
  .then(response => response.json())
  .then(data => {
    console.log('Success:', data);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
}

function Data() {
  const [url, setUrl] = useState('');

  return (
    <div className="container mx-auto mt-16 p-4">
      <h1>Upload a photo URL</h1>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          sendDataToBackend(url);
        }}
      >
        <input
          type="text"
          name="photoUrl"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter image URL"
        />
        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default Data;