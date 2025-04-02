"use client";

import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<string>("Loading...");

  useEffect(() => {
    fetch("http://localhost:3001/")
      .then((res) => res.json())
      .then((data) => setBackendStatus(data.message))
      .catch((error) => {
        console.error("Error connecting to backend:", error);
        setBackendStatus("Error connecting to backend");
      });
  }, []);

  console.log(backendStatus);

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 container mx-auto px-4 py-8">
        <section className="text-center my-12">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Welcome to Bucket List App
          </h1>
          <p className="text-xl mb-8 text-foreground/80">
            Create, share, and track your bucket list adventures!
          </p>

          <div className="bg-secondary/30 p-4 inline-block rounded">
            <span className="text-foreground/80">Backend Status: </span>
            <span
              className={
                backendStatus.includes("running")
                  ? "text-green-500"
                  : "text-danger"
              }
            >
              {backendStatus}
            </span>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-6 my-12">
          <div className="bg-card-bg border border-card-border text-card-fg p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-2">Create Lists</h2>
            <p>
              Create bucket lists for travel, food, activities, or anything else
              you want to experience!
            </p>
          </div>

          <div className="bg-card-bg border border-card-border text-card-fg p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-2">Add Media</h2>
            <p>
              Add images, links, and descriptions to your bucket list items.
            </p>
          </div>

          <div className="bg-card-bg border border-card-border text-card-fg p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold mb-2">Share with Friends</h2>
            <p>
              Share your bucket lists with friends and collaborate together!
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
