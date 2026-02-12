import { useState, useEffect, useRef, useCallback } from 'react';
import type { TaxonomyItem, TaxonomyType } from '../types';
import { api } from '../admin/api';
import { useNavigate } from 'react-router-dom';
import { sanitizeText, sanitizeCode } from '../utils/sanitize';
import { useAuth } from '../admin/auth';

interface TaxonomyFormData {
  type: TaxonomyType;
  value: string;
  label: string;
  description: string;
  sortOrder: number;
}

export default function AdminTaxonomyPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeType, setActiveType] = useState<TaxonomyType>('location');
  const [items, setItems] = useState<TaxonomyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<TaxonomyItem | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formData, setFormData] = useState<TaxonomyFormData>({
    type: 'location',
    value: '',
    label: '',
    description: '',
    sortOrder: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  // Cleanup refs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      isSubmittingRef.current = false;
    };
  }, []);

  // Redirect if not authenticated
  if (loading) {
    return (
      <div className="min-h-screen bg-pitchBlack flex items-center justify-center">
        <div className="text-vanillaCustard/90">Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate('/admin/login');
    return null;
  }

  // Client-side validation matching server-side regex exactly
  const validateValueField = useCallback((value: string): string | null => {
    // Exact match with server regex: /^[a-zA-Z0-9]+(?:[\s\-][a-zA-Z0-9]+)*$/
    const valueRegex = /^[a-zA-Z0-9]+(?:[\s\-][a-zA-Z0-9]+)*$/;
    if (!valueRegex.test(value)) {
      return 'Value can only contain letters, numbers, spaces, and hyphens, and cannot start/end with spaces or hyphens';
    }
    return null;
  }, []);

  const validateSortOrder = useCallback((sortOrder: number): string | null => {
    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      return 'Sort order must be a non-negative integer';
    }
    return null;
  }, []);

  const validateLabel = useCallback((label: string): string | null => {
    if (typeof label !== 'string' || label.trim().length === 0) {
      return 'Label must be a non-empty string';
    }
    return null;
  }, []);

  const validateDescription = useCallback((description: string): string | null => {
    if (typeof description !== 'string') {
      return 'Description must be a string';
    }
    return null;
  }, []);

  const validateForm = useCallback((): string | null => {
    if (!formData.value || !formData.label) {
      return 'Value and label are required';
    }

    const valueError = validateValueField(formData.value);
    if (valueError) return valueError;

    const labelError = validateLabel(formData.label);
    if (labelError) return labelError;

    const descriptionError = validateDescription(formData.description);
    if (descriptionError) return descriptionError;

    const sortOrderError = validateSortOrder(formData.sortOrder);
    if (sortOrderError) return sortOrderError;

    return null;
  }, [formData.value, formData.label, formData.description, formData.sortOrder, validateValueField, validateLabel, validateDescription, validateSortOrder]);

  const handleLabelChange = (label: string) => {
    setFormData({ ...formData, label: sanitizeText(label) });
  };

  const handleDescriptionChange = (description: string) => {
    setFormData({ ...formData, description: sanitizeText(description) });
  };

  const handleValueChange = (value: string) => {
    // Use the exact same regex as server-side validation
    const serverRegex = /^[a-zA-Z0-9]+(?:[\s\-][a-zA-Z0-9]+)*$/;
    // Only allow characters that match the server regex pattern structure
    const sanitizedValue = value.replace(/[^a-zA-Z0-9\s\-]/g, '');
    setFormData({ ...formData, value: sanitizedValue });
    if (!editingItem && sanitizedValue.length > 0) {
      const validationError = serverRegex.test(sanitizedValue) ? null : 'Value can only contain letters, numbers, spaces, and hyphens, and cannot start/end with spaces or hyphens';
      setFieldError(validationError);
    } else {
      setFieldError(null);
    }
  };

  const taxonomyTypes: { value: TaxonomyType; label: string; description: string }[] = [
    { value: 'location', label: 'Service Areas', description: 'Manage geographic locations where resources are available' },
    { value: 'resourceType', label: 'Resource Categories', description: 'Manage types of resources like healthcare, legal support, housing' },
    { value: 'audience', label: 'Audiences', description: 'Manage specific groups resources serve, like youth, seniors, families' },
  ];

  useEffect(() => {
    const controller = new AbortController();
    
    fetchItems(controller.signal).catch(error => {
      if (error.name !== 'AbortError') {
        console.error('Error fetching items:', error);
      }
    });
    
    return () => {
      controller.abort();
    };
  }, [activeType]);

  const fetchItems = async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await api.get<TaxonomyItem[]>(`/api/taxonomy/all/${activeType}`, { signal });
      setItems(data);
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return; // Request was cancelled
      }
      if (err?.status === 401) {
        navigate('/admin/login');
        return;
      }
      setError(err?.message || 'Failed to fetch taxonomy items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions with atomic ref-based lock
    if (isSubmittingRef.current) {
      return;
    }
    
    // Set both state and ref immediately to prevent race condition
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      const validationError = validateForm();
      if (validationError) {
        setError(validationError);
        setIsSubmitting(false);
        isSubmittingRef.current = false;
        return;
      }

      if (editingItem) {
        // Update existing item
        await api.put(`/api/taxonomy/${editingItem._id}`, {
          label: formData.label.trim(),
          description: formData.description.trim(),
          isActive: true,
          sortOrder: formData.sortOrder,
        });
      } else {
        // Create new item
        await api.post('/api/taxonomy', {
          type: formData.type,
          value: formData.value.trim(),
          label: formData.label.trim(),
          description: formData.description.trim(),
          sortOrder: formData.sortOrder,
        });
      }

      // Reset form and refresh list
        setFormData({
          type: activeType,
          value: '',
          label: '',
          description: '',
          sortOrder: 0,
        });
        setShowForm(false);
        setEditingItem(null);
        setFieldError(null);
        await fetchItems();
    } catch (err: any) {
      if (err?.status === 401) {
          navigate('/admin/login');
        return;
      }
      setError(err?.message || 'Failed to save taxonomy item');
    } finally {
      // Reset submitting state
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const handleEdit = (item: TaxonomyItem) => {
    setEditingItem(item);
    setFormData({
      type: item.type,
      value: item.value,
      label: item.label,
      description: item.description || '',
      sortOrder: item.sortOrder || 0,
    });
    setShowForm(true);
  };

  const handleDelete = async (item: TaxonomyItem) => {
    if (!confirm(`Are you sure you want to delete "${item.label}"? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.delete(`/api/taxonomy/${item._id}`);
      await fetchItems();
    } catch (err: any) {
      if (err?.status === 401) {
        navigate('/admin/login');
        return;
      }
      setError(err?.message || 'Failed to delete taxonomy item');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleActive = async (item: TaxonomyItem) => {
    setIsLoading(true);
    setError(null);

    try {
      await api.put(`/api/taxonomy/${item._id}`, { isActive: !item.isActive });
      await fetchItems();
    } catch (err: any) {
      if (err?.status === 401) {
        navigate('/admin/login');
        return;
      }
      setError(err?.message || 'Failed to update taxonomy item');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      type: activeType,
      value: '',
      label: '',
      description: '',
      sortOrder: 0,
    });
    setEditingItem(null);
    setShowForm(false);
    setFieldError(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-vanillaCustard mb-2">Categories & Tags Management</h1>
        <p className="text-vanillaCustard/80">
          Manage the categories, locations, and audience tags that organize community resources. 
          These help people find exactly what they need through filters and search.
        </p>
      </div>

      {/* Type Selector */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2">
          {taxonomyTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => {
                setActiveType(type.value);
                resetForm();
              }}
              className={`px-4 py-2 rounded-xl font-semibold transition ${
                activeType === type.value
                  ? 'bg-paleAmber text-pitchBlack'
                  : 'bg-graphite border border-vanillaCustard/20 text-vanillaCustard hover:bg-pitchBlack/60'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-vanillaCustard/60 mt-2">
          {taxonomyTypes.find(t => t.value === activeType)?.description}
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mb-8 p-6 bg-graphite border border-vanillaCustard/15 rounded-xl">
          <h2 className="text-xl font-bold text-vanillaCustard mb-4">
            {editingItem ? 'Edit Item' : 'Add New Item'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingItem && (
              <div>
                <label className="block text-sm font-medium text-vanillaCustard mb-2">
                  Value (Internal Identifier)
                </label>
                <input
                  type="text"
                  value={formData.value}
                  onChange={(e) => handleValueChange(e.target.value)}
                  className={`w-full px-4 py-2 bg-pitchBlack border rounded-lg text-vanillaCustard ${
                    fieldError ? 'border-red-500/50' : 'border-vanillaCustard/20'
                  }`}
                  placeholder="e.g., 'Austin', 'Financial-Assistance'"
                  required
                />
                {fieldError && (
                  <p className="text-xs text-red-400 mt-1">
                    {fieldError}
                  </p>
                )}
                <p className="text-xs text-vanillaCustard/60 mt-1">
                  Used internally. Use letters, numbers, spaces, and hyphens only.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-vanillaCustard mb-2">
                Label (Display Name)
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => handleLabelChange(e.target.value)}
                className="w-full px-4 py-2 bg-pitchBlack border border-vanillaCustard/20 rounded-lg text-vanillaCustard"
                placeholder="e.g., 'Austin', 'Financial Assistance'"
                required
              />
              <p className="text-xs text-vanillaCustard/60 mt-1">
                This is what users will see in the filters.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-vanillaCustard mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                className="w-full px-4 py-2 bg-pitchBlack border border-vanillaCustard/20 rounded-lg text-vanillaCustard"
                rows={3}
                placeholder="Optional description for admin reference"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-vanillaCustard mb-2">
                Display Order
              </label>
              <input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow empty input or valid non-negative integers
                  if (value === '') {
                    setFormData({ ...formData, sortOrder: 0 });
                  } else if (/^\d+$/.test(value)) {
                    const numValue = parseInt(value, 10);
                    // Validate that it's a non-negative integer and not NaN
                    if (!isNaN(numValue) && numValue >= 0 && Number.isInteger(numValue)) {
                      setFormData({ ...formData, sortOrder: numValue });
                    }
                  }
                }}
                className="w-full px-4 py-2 bg-pitchBlack border border-vanillaCustard/20 rounded-lg text-vanillaCustard"
                min="0"
                step="1"
              />
              <p className="text-xs text-vanillaCustard/60 mt-1">
                Lower numbers appear first in the list.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="px-4 py-2 bg-paleAmber text-pitchBlack font-semibold rounded-xl hover:bg-paleAmber/90 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : (editingItem ? 'Update' : 'Add')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-graphite border border-vanillaCustard/20 text-vanillaCustard font-semibold rounded-xl hover:bg-pitchBlack/60"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      <div className="bg-graphite border border-vanillaCustard/15 rounded-xl">
        <div className="p-6 border-b border-vanillaCustard/15">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-vanillaCustard">
              {taxonomyTypes.find(t => t.value === activeType)?.label} ({items.length})
            </h2>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-paleAmber text-pitchBlack font-semibold rounded-xl hover:bg-paleAmber/90"
            >
              Add New
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 text-center text-vanillaCustard/60">
            Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="p-6 text-center text-vanillaCustard/60">
            No items found. Add your first {activeType} above.
          </div>
        ) : (
          <div className="divide-y divide-vanillaCustard/15">
            {items.map((item) => (
              <div key={item._id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-vanillaCustard">{sanitizeText(item.label)}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        item.isActive 
                          ? 'bg-green-500/20 text-green-300' 
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-vanillaCustard/60 mb-2">
                      Value: <code className="bg-pitchBlack/50 px-2 py-1 rounded">{sanitizeCode(item.value)}</code>
                    </p>
                    {item.description && (
                      <p className="text-sm text-vanillaCustard/70 mb-2">{sanitizeText(item.description)}</p>
                    )}
                    <p className="text-xs text-vanillaCustard/50">
                      Display order: {item.sortOrder || 0}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => toggleActive(item)}
                      className={`px-3 py-1 text-sm font-medium rounded-lg transition ${
                        item.isActive
                          ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                          : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                      }`}
                    >
                      {item.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-3 py-1 text-sm font-medium bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="px-3 py-1 text-sm font-medium bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition"
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
    </div>
  );
}
