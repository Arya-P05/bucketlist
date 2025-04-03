"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { isLoggedIn, getToken } from "../../utils/auth";

interface BucketListItem {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  created_at: string;
}

interface BucketList {
  bucket_list_id: string;
  user_id: string;
  bucket_list_title: string;
  bucket_list_description: string | null;
  bucket_list_created_at: string;
  items: BucketListItem[] | null;
}

export default function BucketListDetail({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [bucketList, setBucketList] = useState<BucketList | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const [showAddItemModal, setShowAddItemModal] = useState<boolean>(false);
  const [newItemTitle, setNewItemTitle] = useState<string>("");
  const [newItemDescription, setNewItemDescription] = useState<string>("");
  const [newItemImageUrl, setNewItemImageUrl] = useState<string>("");
  const [newItemLinkUrl, setNewItemLinkUrl] = useState<string>("");
  const [formError, setFormError] = useState<string>("");

  useEffect(() => {
    // Check if user is logged in
    if (!isLoggedIn()) {
      router.push("/login");
      return;
    }

    fetchBucketList();
  }, [params.id, router]);

  const fetchBucketList = async () => {
    try {
      // First, get all bucket lists
      const response = await fetch("http://localhost:3001/bucket-lists", {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bucket lists");
      }

      const data = await response.json();

      // Find the specific bucket list by ID
      const list = data.find(
        (list: BucketList) => String(list.bucket_list_id) === params.id
      );

      if (!list) {
        throw new Error("Bucket list not found");
      }

      setBucketList(list);
    } catch (err: any) {
      console.error("Error fetching bucket list:", err);
      setError(err.message || "Failed to load bucket list");
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newItemTitle.trim() || !bucketList) {
      return;
    }

    try {
      const newItem = {
        bucket_list_id: bucketList.bucket_list_id,
        title: newItemTitle,
        description: newItemDescription || null,
        image_url: newItemImageUrl || null,
        link_url: newItemLinkUrl || null,
      };

      const response = await fetch("http://localhost:3001/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(newItem),
      });

      if (!response.ok) {
        throw new Error("Failed to add item");
      }

      // Refresh the bucket list
      fetchBucketList();

      // Close the modal and reset form
      setShowAddItemModal(false);
      setNewItemTitle("");
      setNewItemDescription("");
      setNewItemImageUrl("");
      setNewItemLinkUrl("");
    } catch (err) {
      console.error("Error adding item:", err);
      setError("Failed to add item");
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this item?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/items/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      // Refresh the bucket list
      fetchBucketList();
    } catch (err) {
      console.error("Error deleting item:", err);
      setError("Failed to delete item");
    }
  };

  const handleEditBucketList = () => {
    // This would be implemented to edit the bucket list name/description
    // For now, just a placeholder
    alert("Edit functionality would be here");
  };

  if (loading) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="spinner"></div>
          <p className="ml-3 text-muted">Loading bucket list...</p>
        </div>
      </main>
    );
  }

  if (error || !bucketList) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-foreground mb-4">
              Bucket list not found
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="bg-primary hover:bg-primary-hover text-primary-fg px-4 py-2 rounded-md"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground flex-1 mb-2">
            {bucketList.bucket_list_title}
          </h1>

          <p className="text-muted mb-2">
            {bucketList.bucket_list_description || "No description provided"}
          </p>
          <p className="text-xs text-muted">
            Created:{" "}
            {new Date(bucketList.bucket_list_created_at).toLocaleDateString(
              "en-US",
              {
                year: "numeric",
                month: "short",
                day: "numeric",
              }
            )}
          </p>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-foreground">List Items</h2>
          <button
            onClick={() => setShowAddItemModal(true)}
            className="bg-primary hover:bg-primary-hover text-primary-fg px-4 py-2 rounded-md"
          >
            Add New Item
          </button>
        </div>

        {/* Add Item Modal */}
        {showAddItemModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 ">
            <div className="bg-card-bg border border-card-border text-card-fg rounded-lg p-6 w-full max-w-md dark:bg-black bg-white">
              <h2 className="text-xl font-semibold mb-4">Add New Item</h2>

              <form onSubmit={handleAddItem} className="space-y-4">
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
                    value={newItemTitle}
                    onChange={(e) => setNewItemTitle(e.target.value)}
                    className="dark:text-black w-full px-3 py-2 bg-input-bg border border-input-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                    placeholder="Enter a title for your item"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-card-fg mb-1"
                  >
                    Description (optional)
                  </label>
                  <textarea
                    id="description"
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    className="dark:text-black w-full px-3 py-2 bg-input-bg border border-input-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                    placeholder="Enter a description"
                    rows={3}
                  />
                </div>

                <div>
                  <label
                    htmlFor="imageUrl"
                    className="block text-sm font-medium text-card-fg mb-1"
                  >
                    Image URL (optional)
                  </label>
                  <input
                    id="imageUrl"
                    type="url"
                    value={newItemImageUrl}
                    onChange={(e) => setNewItemImageUrl(e.target.value)}
                    className="dark:text-black w-full px-3 py-2 bg-input-bg border border-input-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label
                    htmlFor="linkUrl"
                    className="block text-sm font-medium text-card-fg mb-1"
                  >
                    Related Link (optional)
                  </label>
                  <input
                    id="linkUrl"
                    type="url"
                    value={newItemLinkUrl}
                    onChange={(e) => setNewItemLinkUrl(e.target.value)}
                    className="dark:text-black w-full px-3 py-2 bg-input-bg border border-input-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary/70"
                    placeholder="https://example.com"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddItemModal(false)}
                    className="px-4 py-2 bg-secondary hover:bg-secondary-hover text-secondary-fg rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-fg rounded-md"
                  >
                    Add Item
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {!bucketList.items ||
        bucketList.items.length === 0 ||
        !bucketList.items.some(
          (item) =>
            item !== null &&
            typeof item === "object" &&
            (item.title || item.description || item.image_url || item.link_url)
        ) ? (
          <div className="bg-card-bg border border-card-border text-card-fg rounded-lg p-8 text-center">
            <p className="text-lg mb-4">No items in this bucket list yet.</p>
            <button
              onClick={() => setShowAddItemModal(true)}
              className="bg-primary hover:bg-primary-hover text-primary-fg px-4 py-2 rounded-md"
            >
              Add Your First Item
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bucketList.items
              .filter(
                (item) =>
                  item !== null &&
                  typeof item === "object" &&
                  (item.title ||
                    item.description ||
                    item.image_url ||
                    item.link_url)
              )
              .map((item) => (
                <div
                  key={item.id}
                  className="bg-card-bg border border-card-border text-card-fg rounded-lg shadow overflow-hidden"
                >
                  {item.image_url && (
                    <div className="h-48 overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="p-6">
                    <h3 className="text-xl font-medium">{item.title}</h3>

                    {item.description && (
                      <p className="text-muted mt-2 mb-4">{item.description}</p>
                    )}

                    {item.link_url && (
                      <a
                        href={item.link_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline block mb-4"
                      >
                        Related Link
                      </a>
                    )}

                    <div className="flex justify-end mt-4">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-danger hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </main>
  );
}
