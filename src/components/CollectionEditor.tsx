import { FC, useState } from 'react';
import { Collection } from '../hooks/useCollections';

interface CollectionEditorProps {
  collection?: Collection;
  onSave: (name: string, description: string, type: Collection['type']) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

const COLLECTION_TYPES = [
  { value: 'occasion', label: 'Occasion', description: 'Movies for specific events or celebrations', emoji: '🎉' },
  { value: 'mood', label: 'Mood', description: 'Movies that match a particular feeling', emoji: '🎭' },
  { value: 'project', label: 'Project', description: 'Movies for work or creative projects', emoji: '📋' },
  { value: 'archive', label: 'Archive', description: 'Movies for long-term storage', emoji: '📦' },
] as const;

const CollectionEditor: FC<CollectionEditorProps> = ({
  collection,
  onSave,
  onDelete,
  onCancel,
  isEditing = false,
}) => {
  const [name, setName] = useState(collection?.title || '');
  const [description, setDescription] = useState(collection?.description || '');
  const [type, setType] = useState<Collection['type']>(collection?.type || 'mood');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !description.trim()) {
      return;
    }

    setSaving(true);
    try {
      await onSave(name.trim(), description.trim(), type);
    } catch (error) {
      console.error('Failed to save collection:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!collection?.id || !onDelete) return;
    
    setDeleting(true);
    try {
      await onDelete(collection.id);
    } catch (error) {
      console.error('Failed to delete collection:', error);
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-6">
        {isEditing ? 'Edit Collection' : 'Create New Collection'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Collection Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Collection Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter collection name..."
            required
          />
        </div>

        {/* Collection Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your collection..."
            required
          />
        </div>

        {/* Collection Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Collection Type
          </label>
          <div className="grid grid-cols-1 gap-2">
            {COLLECTION_TYPES.map((typeOption) => (
              <label
                key={typeOption.value}
                className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                  type === typeOption.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={typeOption.value}
                  checked={type === typeOption.value}
                  onChange={(e) => setType(e.target.value as Collection['type'])}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{typeOption.emoji}</span>
                    <span className="font-medium">{typeOption.label}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{typeOption.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving || !name.trim() || !description.trim()}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : (isEditing ? 'Update Collection' : 'Create Collection')}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Delete Button (only when editing) */}
        {isEditing && collection && onDelete && (
          <div className="pt-4 border-t">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete Collection
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 text-center">
                  Are you sure you want to delete this collection? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
};

export default CollectionEditor; 