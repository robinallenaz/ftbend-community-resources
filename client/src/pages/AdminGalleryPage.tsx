import { useEffect, useRef, useState } from 'react';
import { api } from '../admin/api';

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

      const uploadRes = await fetch('/api/admin/gallery/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
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
    } catch (e) {
      console.error('Failed to update caption', e);
      alert('Failed to update caption.');
    }
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
      <header className="grid gap-2">
        <h1 className="text-3xl font-extrabold text-vanillaCustard">Gallery</h1>
        <p className="text-base text-vanillaCustard/85">Manage photos displayed on the About Us page.</p>
      </header>

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
                  src={`/api/public/gallery/${item.filename}`}
                  alt={item.caption || item.originalName}
                  className="mb-3 h-40 w-full rounded-xl object-cover"
                />
                <input
                  type="text"
                  value={item.caption}
                  onChange={(e) => updateCaption(item._id, e.target.value)}
                  placeholder="Add a caption…"
                  className="mb-2 w-full rounded-lg border border-vanillaCustard/20 bg-graphite px-3 py-2 text-sm text-vanillaCustard placeholder:text-vanillaCustard/60"
                />
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
    </div>
  );
}
