import React, { useState } from 'react';

function Home( {initialData} ) {
  return (
    <div className="container mx-auto mt-16 p-4">
      <h1>{initialData.message}</h1>
      <h1>Vite + React</h1>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </div>
  );
}

export default Home;