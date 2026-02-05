import { useEffect, useRef, useState } from 'react';
import { api } from '../admin/api';
import { safeGetItem } from '../utils/storageUtils';

type GalleryItem = {
  _id: string;
  filename: string;
  originalName: string;
  caption: string;
  order: number;
  status: 'active' | 'archived';
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
};

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [editingCaptions, setEditingCaptions] = useState<Record<string, string>>({});
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    const res = await api.get<{ items: GalleryItem[] }>('/api/admin/gallery');
    setItems(res.items);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caption', '');

      const token = await safeGetItem('authToken', '');
      const uploadRes = await fetch('/api/admin/gallery/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploaded = await uploadRes.json();
      setItems(prev => [...prev, uploaded]);
    } catch (e) {
      console.error('Upload error', e);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  async function handleDragDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    handleUpload(e.dataTransfer.files);
  }

  async function updateCaption(id: string, caption: string) {
    try {
      await api.patch(`/api/admin/gallery/${id}/caption`, { caption });
      setItems(prev => prev.map(item => item._id === id ? { ...item, caption } : item));
      setEditingCaptions(prev => ({ ...prev, [id]: '' }));
      
      // Show success message
      setSaveMessage('Caption saved successfully!');
      setTimeout(() => setSaveMessage(null), 2000);
    } catch (e) {
      console.error('Failed to update caption', e);
      alert('Failed to update caption.');
    }
  }

  function handleCaptionChange(id: string, value: string) {
    setEditingCaptions(prev => ({ ...prev, [id]: value }));
  }

  function handleCaptionSave(id: string) {
    const newCaption = editingCaptions[id] || '';
    updateCaption(id, newCaption);
  }

  async function deleteItem(id: string) {
    if (!confirm('Are you sure you want to remove this image?')) return;
    try {
      await api.delete(`/api/admin/gallery/${id}`);
      setItems(prev => prev.filter(item => item._id !== id));
    } catch (e) {
      console.error('Failed to delete', e);
      alert('Failed to delete image.');
    }
  }

  async function reorder(fromIndex: number, toIndex: number) {
    const reordered = [...items];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    // Update order numbers
    reordered.forEach((item, idx) => { item.order = idx; });
    setItems(reordered);
    // Persist order changes
    try {
      await Promise.all(reordered.map(item => api.patch(`/api/admin/gallery/${item._id}/order`, { order: item.order })));
    } catch (e) {
      console.error('Failed to reorder', e);
      alert('Failed to reorder images. Please refresh.');
      load(); // fallback
    }
  }

  if (loading) return <div className="p-6 text-vanillaCustard/80">Loading gallery…</div>;

  return (
    <div className="grid gap-6 p-6">
      <header className="rounded-2xl border border-vanillaCustard/10 bg-gradient-to-br from-pitchBlack/60 via-pitchBlack/40 to-pitchBlack/30 backdrop-blur-sm p-8 shadow-soft">
        <div className="grid gap-3">
          <h1 className="text-3xl font-extrabold text-vanillaCustard">Gallery Management</h1>
          <p className="text-base text-vanillaCustard/90">Upload and manage community photos for the website.</p>
        </div>
      </header>

      {/* Success Message */}
      {saveMessage && (
        <div className="rounded-lg bg-green-500/20 border border-green-500/30 p-3 text-center">
          <p className="text-sm font-medium text-green-300">{saveMessage}</p>
        </div>
      )}

      {/* Upload area */}
      <section
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${
          dragActive
            ? 'border-paleAmber bg-paleAmber/10'
            : 'border-vanillaCustard/30 bg-pitchBlack/50'
        }`}
        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={handleDragDrop}
      >
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
        />
        <div className="space-y-2">
          <p className="text-lg font-semibold text-vanillaCustard">
            {uploading ? 'Uploading…' : 'Drop images here or click to browse'}
          </p>
          <p className="text-sm text-vanillaCustard/70">
            JPG, PNG, WebP up to 5MB
          </p>
          {!uploading && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl bg-paleAmber px-4 py-2 text-sm font-bold text-pitchBlack transition hover:bg-paleAmber/90"
            >
              Choose Files
            </button>
          )}
        </div>
      </section>

      {/* Gallery grid */}
      <section className="grid gap-4">
        <h2 className="text-xl font-extrabold text-vanillaCustard">Images ({items.length})</h2>
        {items.length === 0 ? (
          <p className="text-vanillaCustard/70">No images yet. Upload some above!</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, idx) => (
              <div key={item._id} className="group relative rounded-2xl border border-vanillaCustard/15 bg-pitchBlack p-4 shadow-soft">
                <img
                  src={item.filename}
                  alt={item.caption || item.originalName}
                  className="mb-3 h-40 w-full rounded-xl object-cover cursor-pointer"
                  onClick={() => setSelectedImage(item)}
                />
                <div className="mb-2">
                  <textarea
                    value={editingCaptions[item._id] ?? item.caption}
                    onChange={(e) => handleCaptionChange(item._id, e.target.value)}
                    placeholder="Add a caption…"
                    rows={3}
                    className="mb-1 w-full rounded-lg border border-vanillaCustard/20 bg-graphite px-3 py-2 text-sm text-vanillaCustard placeholder:text-vanillaCustard/60 resize-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleCaptionSave(item._id)}
                    className="w-full rounded bg-paleAmber px-2 py-1 text-xs font-bold text-pitchBlack transition hover:bg-paleAmber/90"
                  >
                    Save Caption
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-vanillaCustard/60">{item.originalName}</span>
                  <div className="flex gap-1">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => reorder(idx, idx - 1)}
                        className="rounded px-2 py-1 text-xs text-vanillaCustard/80 hover:bg-graphite"
                      >
                        ↑
                      </button>
                    )}
                    {idx < items.length - 1 && (
                      <button
                        type="button"
                        onClick={() => reorder(idx, idx + 1)}
                        className="rounded px-2 py-1 text-xs text-vanillaCustard/80 hover:bg-graphite"
                      >
                        ↓
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteItem(item._id)}
                      className="rounded px-2 py-1 text-xs text-red-400 hover:bg-red-900/20"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pitchBlack/90 via-pitchBlack/85 to-pitchBlack/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-h-full max-w-full">
            <img
              src={selectedImage.filename}
              alt={selectedImage.caption || selectedImage.originalName}
              className="max-h-[80vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            />
            {selectedImage.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-pitchBlack/95 via-pitchBlack/80 to-transparent p-6 rounded-b-2xl">
                <p className="text-center text-vanillaCustard/95 text-base">
                  {selectedImage.caption}
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 rounded-full bg-pitchBlack/60 backdrop-blur-sm p-3 text-vanillaCustard/90 hover:bg-pitchBlack/80 transition-all duration-200"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
