"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [message, setmessage] = useState<string>("Loading...");

  useEffect(() => {
    fetch("http://localhost:3001/")
      .then((res) => res.text())
      .then((resultText) => setmessage(resultText))
      .catch((error) => {
        if (error.status === 404) {
          setmessage("Backend is not running");
        } else {
          setmessage("Error connecting to backend");
        }
      });
  }, []);

  return (
    <div>
      <h1> Bucket List App</h1>
      <p>Backend Status: {message}</p>
    </div>
  );
}
