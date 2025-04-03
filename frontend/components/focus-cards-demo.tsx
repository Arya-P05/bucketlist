"use client";

import { FocusCards } from "@/components/ui/focus-cards";
import { useEffect, useState } from "react";
import { getToken } from "@/app/utils/auth";

interface BucketList {
  bucket_list_id: string;
  user_id: string;
  bucket_list_title: string;
  bucket_list_description: string | null;
  bucket_list_created_at: string;
  cover_image: string | null;
  items: any[] | null;
}

export default function FocusCardsDemo() {
  const [bucketLists, setBucketLists] = useState<BucketList[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBucketLists();
  }, []);

  const fetchBucketLists = async () => {
    try {
      const token = getToken();
      const response = await fetch("http://localhost:3001/bucket-lists", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bucket lists");
      }

      const data = await response.json();
      console.log("Raw API response:", data);
      setBucketLists(data);
    } catch (err) {
      console.error("Error fetching bucket lists:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="spinner"></span>
      </div>
    );
  }

  const cards = bucketLists.map((list) => {
    const card = {
      title: list.bucket_list_title,
      src:
        list.cover_image ||
        "https://images.unsplash.com/photo-1518710843675-2540dd79065c?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      id: list.bucket_list_id,
    };
    console.log("Created card:", card);
    return card;
  });

  return <FocusCards cards={cards} />;
}
