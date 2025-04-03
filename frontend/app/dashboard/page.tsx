"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { isLoggedIn, getToken } from "../utils/auth";
import Link from "next/link";
import FocusCardsDemo from "@/components/focus-cards-demo";
import Image from "next/image";

// Updated to match the backend structure
interface BucketList {
  bucket_list_id: string;
  user_id: string;
  bucket_list_title: string;
  bucket_list_description: string | null;
  bucket_list_created_at: string;
  cover_image: string | null;
  items: any[] | null;
}

export default function Dashboard() {
  const router = useRouter();
  const [bucketLists, setBucketLists] = useState<BucketList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [newListTitle, setNewListTitle] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if user is logged in
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    // Fetch user's bucket lists
    fetchBucketLists();
  }, [router]);

  const fetchBucketLists = async () => {
    setIsLoading(true);
    setError("");

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
      setBucketLists(data);
    } catch (err: any) {
      console.error("Error fetching bucket lists:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsCreating(true);

    try {
      const token = getToken();
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        throw new Error("Authentication required");
      }

      if (!coverImage) {
        throw new Error("Please select a cover image for your bucket list");
      }

      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("title", newListTitle);
      formData.append("description", newListDescription || "");
      formData.append("cover_image", coverImage);

      const response = await fetch("http://localhost:3001/bucket-lists", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create bucket list");
      }

      // Refresh the list
      await fetchBucketLists();

      // Reset form
      setNewListTitle("");
      setNewListDescription("");
      setCoverImage(null);
      setPreviewUrl(null);
      setShowCreateForm(false);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      console.error("Error creating bucket list:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteList = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bucket list?")) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`http://localhost:3001/bucket-lists/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete bucket list");
      }

      // Refresh the list
      await fetchBucketLists();
    } catch (err: any) {
      setError(err.message || "Failed to delete bucket list");
      console.error("Error deleting bucket list:", err);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">
            My Bucket Lists
          </h1>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-primary hover:bg-primary-hover text-primary-fg px-4 py-2 rounded-md"
          >
            {showCreateForm ? "Cancel" : "Create New List"}
          </button>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded mb-4">
            Apologies, something went wrong. Please try again in a few minutes
            or contact support. Thank you for understanding.
          </div>
        )}

        {showCreateForm && (
          <div className="bg-card-bg border border-card-border text-card-fg rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Create New Bucket List
            </h2>
            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-card-fg mb-1"
                >
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  className=" dark:text-black w-full px-3 py-2 bg-input-bg border border-input-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                  placeholder="My Bucket List"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-card-fg mb-1"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  className=" dark:text-black w-full px-3 py-2 bg-input-bg border border-input-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                  rows={3}
                  placeholder="What's this bucket list about?"
                ></textarea>
              </div>
              <div>
                <label
                  htmlFor="cover_image"
                  className="block text-sm font-medium text-card-fg mb-1"
                >
                  Cover Image <span className="text-danger">*</span>
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    id="cover_image"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-secondary hover:bg-secondary-hover text-secondary-fg px-4 py-2 rounded-md"
                  >
                    Choose Image
                  </button>
                  {previewUrl ? (
                    <div className="relative w-20 h-20">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted">No image selected</p>
                  )}
                </div>
                {!coverImage && (
                  <p className="text-sm text-danger mt-1">
                    Please select a cover image
                  </p>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="bg-primary hover:bg-primary-hover text-primary-fg px-4 py-2 rounded-md disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Create Bucket List"}
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <div className="spinner"></div>
            <p className="mt-2 text-muted">Loading your bucket lists...</p>
          </div>
        ) : bucketLists.length === 0 ? (
          <div className="bg-card-bg border border-card-border text-card-fg rounded-lg p-8 text-center">
            <p className="text-lg mb-4">You don't have any bucket lists yet.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-primary hover:bg-primary-hover text-primary-fg px-4 py-2 rounded-md"
            >
              Create Your First Bucket List
            </button>
          </div>
        ) : (
          <FocusCardsDemo />
        )}
      </div>
    </main>
  );
}
