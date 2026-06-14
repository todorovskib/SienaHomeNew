import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Save, X } from 'lucide-react';
import { useContent } from '../../contexts/ContentContext';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useAdmin } from '../../contexts/AdminContext';
import { useTranslation } from 'react-i18next';

interface EditableTextProps {
  section: string;
  contentKey: string;
  fallback?: string;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
}

const EditableText: React.FC<EditableTextProps> = ({
  section,
  contentKey,
  fallback = '',
  className = '',
  multiline = false,
  placeholder = 'Enter text...',
}) => {
  const { getContent, updateContent } = useContent();
  const { isAdmin, loading } = useAuth();
  const { editMode } = useAdmin();
  const { i18n } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Get current content with proper fallback handling
  const currentContent = (() => {
    try {
      // Always prioritize fallback for initial display, then override with DB content if available
      const dbContent = getContent(section, contentKey, i18n.language);
      return dbContent && dbContent.trim() !== '' ? dbContent : fallback;
    } catch (error) {
      console.warn('Error getting content:', error);
      return fallback;
    }
  })();

  // Update edit value when content changes
  useEffect(() => {
    setEditValue(currentContent);
  }, [currentContent]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (!multiline) {
        (inputRef.current as HTMLInputElement).select();
      }
    }
  }, [isEditing, multiline]);

  const handleSave = async () => {
    if (!isAdmin) return;
    
    // Validate required fields
    if (!section || !contentKey || editValue.trim() === '') {
      console.error('Missing required fields for content update');
      alert('Error: Missing required information for saving content.');
      return;
    }
    
    setSaving(true);
    try {
      await updateContent(section, contentKey, editValue.trim(), i18n.language);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving content:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error saving content: ${errorMessage}. Please try again.`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditValue(currentContent);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Use current content for display
  const displayValue = currentContent || placeholder;

  // Only show edit controls if admin and edit mode is enabled
  const showEditControls = isAdmin && editMode;

  if (loading) {
    return <span className={className}>{displayValue}</span>;
  }

  if (isEditing) {
    return (
      <div className="relative inline-block w-full">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`${className} border-2 border-siena-300 rounded px-2 py-1 bg-white resize-none`}
            placeholder={placeholder}
            rows={3}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={`${className} border-2 border-siena-300 rounded px-2 py-1 bg-white`}
            placeholder={placeholder}
          />
        )}
        <div className="absolute -right-16 top-0 flex space-x-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="p-1 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {saving ? '...' : <Save className="h-3 w-3" />}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${showEditControls ? 'group' : ''}`}>
      <span 
        className={`${className} ${showEditControls ? 'hover:bg-yellow-100 cursor-pointer rounded px-1' : ''}`}
        onClick={showEditControls ? () => setIsEditing(true) : undefined}
      >
        {displayValue}
      </span>
      {showEditControls && (
        <button
          onClick={() => setIsEditing(true)}
          className="absolute -right-6 top-0 opacity-0 group-hover:opacity-100 p-1 bg-siena-500 text-white rounded hover:bg-siena-600 transition-opacity duration-200"
        >
          <Edit2 className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};

export default EditableText;
