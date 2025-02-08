import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderPlus, Trash2, Pencil } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Folder, Question } from '../types';
import { CreateFolderDialog } from './CreateFolderDialog';
import { DeleteConfirmDialog } from './DeleteConfirmDialog';
import PDFDownloadButton from './PDFDownloadButton';
import toast from 'react-hot-toast';

export default function FolderList() {
  const navigate = useNavigate();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [folderQuestions, setFolderQuestions] = useState<{ [key: string]: Question[] }>({});

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    folders.forEach(folder => {
      fetchFolderQuestions(folder.id);
    });
  }, [folders]);

  const fetchFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      toast.error('Error loading folders');
    }
  };

  const fetchFolderQuestions = async (folderId: string) => {
    try {
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .select('id')
        .eq('folder_id', folderId);

      if (categoriesError) throw categoriesError;

      const categoryIds = categories.map(cat => cat.id);
      
      if (categoryIds.length === 0) {
        setFolderQuestions(prev => ({ ...prev, [folderId]: [] }));
        return;
      }

      const { data: questions, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .in('category_id', categoryIds)
        .eq('is_active', true);

      if (questionsError) throw questionsError;
      setFolderQuestions(prev => ({ ...prev, [folderId]: questions || [] }));
    } catch (error) {
      console.error('Error fetching folder questions:', error);
      setFolderQuestions(prev => ({ ...prev, [folderId]: [] }));
    }
  };

  const handleCreateFolder = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert([{ name }])
        .select()
        .single();

      if (error) throw error;
      setFolders([...folders, data]);
      toast.success('Folder created successfully');
    } catch (error) {
      toast.error('Error creating folder');
    }
  };

  const handleDeleteFolder = async () => {
    if (!selectedFolder) return;

    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', selectedFolder.id);

      if (error) throw error;
      setFolders(folders.filter((f) => f.id !== selectedFolder.id));
      setIsDeleteDialogOpen(false);
      setSelectedFolder(null);
      toast.success('Folder deleted successfully');
    } catch (error) {
      toast.error('Error deleting folder');
    }
  };

  const startEditing = (folder: Folder) => {
    setEditingFolderId(folder.id);
    setEditingName(folder.name);
  };

  const handleUpdateFolderName = async (folderId: string) => {
    if (!editingName.trim()) {
      setEditingFolderId(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('folders')
        .update({ name: editingName.trim() })
        .eq('id', folderId);

      if (error) throw error;

      setFolders(folders.map(f => 
        f.id === folderId ? { ...f, name: editingName.trim() } : f
      ));
      toast.success('Folder name updated successfully');
    } catch (error) {
      toast.error('Error updating folder name');
    } finally {
      setEditingFolderId(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, folderId: string) => {
    if (e.key === 'Enter') {
      handleUpdateFolderName(folderId);
    } else if (e.key === 'Escape') {
      setEditingFolderId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Folders</h2>
        <button
          onClick={() => setIsCreateDialogOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FolderPlus className="h-4 w-4 mr-2" />
          New Folder
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="relative group bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start">
              <div 
                className="flex items-start space-x-3 flex-1 cursor-pointer"
                onClick={() => editingFolderId !== folder.id && navigate(`/admin/folders/${folder.id}`)}
              >
                <FolderPlus className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div className="min-w-0 flex-1">
                  {editingFolderId === folder.id ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleUpdateFolderName(folder.id)}
                      onKeyDown={(e) => handleKeyPress(e, folder.id)}
                      className="w-full px-2 py-1 text-lg font-medium text-gray-900 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {folder.name}
                    </h3>
                  )}
                  <p className="text-sm text-gray-500">
                    {new Date(folder.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(folder);
                  }}
                  className="p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded-full transition-opacity"
                >
                  <Pencil className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                </button>
                {folderQuestions[folder.id]?.length > 0 && (
                  <PDFDownloadButton
                    title={`${folder.name} Questions`}
                    questions={folderQuestions[folder.id]}
                  />
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFolder(folder);
                    setIsDeleteDialogOpen(true);
                  }}
                  className="p-2 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded-full transition-opacity"
                >
                  <Trash2 className="h-5 w-5 text-gray-500 hover:text-red-600" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {folders.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            No folders found. Click "New Folder" to create one.
          </div>
        )}
      </div>

      <CreateFolderDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreateFolder={handleCreateFolder}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setSelectedFolder(null);
        }}
        onConfirm={handleDeleteFolder}
        title="Delete Folder"
        message="Are you sure you want to delete this folder? All categories and questions within this folder will be permanently removed. This action cannot be undone."
      />
    </div>
  );
}
