"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../components/Navbar";
import { isLoggedIn, getToken } from "../utils/auth";
import FocusCardsDemo from "@/components/focus-cards-demo";

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
  const [showImageError, setShowImageError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [titleError, setTitleError] = useState<boolean>(false);
  const [descriptionError, setDescriptionError] = useState<boolean>(false);

  const fetchBucketLists = async () => {
    setIsLoading(true);
    setError("");

    try {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("http://localhost:3001/bucket-lists", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        // Token is invalid or expired, try to refresh
        try {
          const refreshResponse = await fetch(
            "http://localhost:3001/refresh-token",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (refreshResponse.ok) {
            const data = await refreshResponse.json();
            localStorage.setItem("token", data.token);
            // Retry the original request
            return fetchBucketLists();
          } else {
            throw new Error("Token refresh failed");
          }
        } catch (refreshError) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          localStorage.removeItem("rememberMe");
          router.push("/login");
          return;
        }
      }

      if (!response.ok) {
        throw new Error("Failed to fetch bucket lists");
      }

      const data = await response.json();
      setBucketLists(data);
    } catch (err: any) {
      console.error("Error fetching bucket lists:", err);
      if (err.message === "Failed to fetch") {
        setError("Unable to connect to the server. Please try again later.");
      } else {
        setError(err.message || "Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoggedIn()) {
        router.push("/login");
        return;
      }

      // Fetch bucket lists on mount and when router changes
      await fetchBucketLists();
    };

    checkAuth();
  }, [router]);

  // Add a periodic check for authentication
  useEffect(() => {
    const checkAuthInterval = setInterval(() => {
      if (!isLoggedIn()) {
        router.push("/login");
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(checkAuthInterval);
  }, [router]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      handleImageFile(file);
    }
  };

  const handleImageFile = (file: File) => {
    setCoverImage(file);
    setShowImageError(false);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsCreating(true);
    setTitleError(false);

    if (!coverImage) {
      setShowImageError(true);
      setIsCreating(false);
    }

    if (!newListTitle.trim()) {
      setTitleError(true);
      setIsCreating(false);
    }

    if (!isCreating) {
      return;
    }

    try {
      const token = getToken();
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        throw new Error("Authentication required");
      }

      const formData = new FormData();
      formData.append("user_id", userId);
      formData.append("title", newListTitle);
      formData.append("description", newListDescription || "");
      formData.append("cover_image", coverImage || "");

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
                  onChange={(e) => {
                    setNewListTitle(e.target.value);
                    setTitleError(false);
                  }}
                  className={`dark:text-black w-full px-3 py-2 bg-input-bg border ${
                    titleError ? "border-red-500" : "border-input-border"
                  } text-foreground rounded-md focus:outline-none focus:ring-2 ${
                    titleError ? "focus:ring-red-500" : "focus:ring-primary/70"
                  }`}
                  placeholder="Travel Bucket List"
                />
                {titleError && (
                  <div className="text-red-500 text-sm mt-1">
                    Please fill in all fields
                  </div>
                )}
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm text-card-fg mb-1"
                >
                  <span className="font-medium">Description</span> (optional)
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
                  className="block text-sm text-card-fg mb-1"
                >
                  <span className="font-medium">Cover Image</span> (less than
                  5MB)
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    showImageError
                      ? "border-red-500"
                      : isDragging
                      ? "border-primary bg-primary/5"
                      : "border-input-border hover:border-primary/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="cover_image"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  {previewUrl ? (
                    <div className="relative w-full h-48">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex flex-col items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 text-muted"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <p className="mt-2 text-sm text-muted">
                          Drag and drop an image here, or click to select
                        </p>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2 text-sm text-primary hover:text-primary-hover"
                        >
                          Browse files
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {showImageError && (
                  <div className="text-red-500 text-sm mt-1">
                    Please select a cover image
                  </div>
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
