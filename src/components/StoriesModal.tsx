'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal, { ModalBody, ModalFooter } from './Modal';
import Button from './Button';
import { useToast } from '@/contexts/ToastContext';
import { serviceManagement } from '@/lib/serviceManagement';
import { BookOpenIcon, PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

interface Story {
  _id: string;
  title: string;
  content: string;
  author?: string;
  publishedAt?: string;
  isPublished: boolean;
  tags?: string[];
}

interface StoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
  permissions: {
    canManage: boolean;
    canCreateStories: boolean;
  };
}

export default function StoriesModal({ isOpen, onClose, serviceId, permissions }: StoriesModalProps) {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStory, setEditingStory] = useState<Story | null>(null);
  const [viewingStory, setViewingStory] = useState<Story | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: '',
    tags: '',
    isPublished: false
  });

  const { success: showSuccessToast, error: showErrorToast } = useToast();

  const fetchStories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await serviceManagement.getServiceStories(serviceId);
      setStories(response.stories || []);
    } catch (error) {
      console.error('Failed to fetch stories:', error);
      showErrorToast('Failed to load stories');
    } finally {
      setLoading(false);
    }
  }, [serviceId, showErrorToast]);

  useEffect(() => {
    if (isOpen) {
      fetchStories();
    }
  }, [isOpen, fetchStories]);

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      author: '',
      tags: '',
      isPublished: false
    });
    setShowAddForm(false);
    setEditingStory(null);
  };

  const handleEdit = (story: Story) => {
    setEditingStory(story);
    setFormData({
      title: story.title,
      content: story.content,
      author: story.author || '',
      tags: story.tags ? story.tags.join(', ') : '',
      isPublished: story.isPublished
    });
    setShowAddForm(true);
  };

  const handleView = (story: Story) => {
    setViewingStory(story);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      showErrorToast('Please fill in the required fields');
      return;
    }

    try {
      const storyData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        author: formData.author.trim(),
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        isPublished: formData.isPublished
      };

      if (editingStory) {
        await serviceManagement.updateServiceStory(serviceId, editingStory._id, storyData);
        showSuccessToast('Story updated successfully');
      } else {
        await serviceManagement.createServiceStory(serviceId, storyData);
        showSuccessToast('Story created successfully');
      }

      fetchStories();
      resetForm();
    } catch (error) {
      console.error('Failed to save story:', error);
      showErrorToast('Failed to save story');
    }
  };

  const handleDelete = async (storyId: string) => {
    if (!confirm('Are you sure you want to delete this story?')) {
      return;
    }

    try {
      await serviceManagement.deleteServiceStory(serviceId, storyId);
      showSuccessToast('Story deleted successfully');
      fetchStories();
    } catch (error) {
      console.error('Failed to delete story:', error);
      showErrorToast('Failed to delete story');
    }
  };

  const toggleStoryStatus = async (storyId: string, currentStatus: boolean) => {
    try {
      await serviceManagement.updateServiceStory(serviceId, storyId, {
        isPublished: !currentStatus
      });
      showSuccessToast(`Story ${!currentStatus ? 'published' : 'unpublished'} successfully`);
      fetchStories();
    } catch (error) {
      console.error('Failed to update story status:', error);
      showErrorToast('Failed to update story status');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  if (viewingStory) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="View Story" maxWidth="2xl">
        <ModalBody>
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{viewingStory.title}</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                  {viewingStory.author && <span>By {viewingStory.author}</span>}
                  {viewingStory.publishedAt && (
                    <span>Published {formatDate(viewingStory.publishedAt)}</span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    viewingStory.isPublished 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {viewingStory.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              {permissions.canManage && (
                <button
                  onClick={() => handleEdit(viewingStory)}
                  className="text-[#F5821F] hover:text-[#e0741c] text-sm font-medium"
                >
                  Edit Story
                </button>
              )}
            </div>
            
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-600">
                {viewingStory.content}
              </div>
            </div>
            
            {viewingStory.tags && viewingStory.tags.length > 0 && (
              <div className="border-t pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {viewingStory.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setViewingStory(null)}>
            Back to Stories
          </Button>
        </ModalFooter>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Success Stories" maxWidth="2xl">
      <ModalBody>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F5821F]"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Add Story Button */}
            {(permissions.canManage || permissions.canCreateStories) && !showAddForm && (
              <div className="flex justify-end">
                <Button
                  variant="primary"
                  leftIcon={PlusIcon}
                  onClick={() => setShowAddForm(true)}
                >
                  Add Story
                </Button>
              </div>
            )}

            {/* Add/Edit Story Form */}
            {showAddForm && (permissions.canManage || permissions.canCreateStories) && (
              <div className="bg-gray-50 rounded-lg p-6 border">
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  {editingStory ? 'Edit Story' : 'Add New Story'}
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5821F] focus:border-transparent"
                      placeholder="Enter story title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Author
                    </label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5821F] focus:border-transparent"
                      placeholder="Story author (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content *
                    </label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5821F] focus:border-transparent"
                      placeholder="Tell the success story..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tags
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#F5821F] focus:border-transparent"
                      placeholder="Enter tags separated by commas"
                    />
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isPublished}
                        onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                        className="rounded border-gray-300 text-[#F5821F] focus:ring-[#F5821F]"
                      />
                      <span className="ml-2 text-sm text-gray-700">Publish story immediately</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-4">
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleSave}>
                    {editingStory ? 'Update Story' : 'Add Story'}
                  </Button>
                </div>
              </div>
            )}

            {/* Stories List */}
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Stories ({stories.length})
              </h4>
              {stories.length > 0 ? (
                <div className="space-y-3">
                  {stories.map((story) => (
                    <div
                      key={story._id}
                      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        story.isPublished ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <BookOpenIcon className="h-5 w-5 text-gray-400" />
                            <h5 className="font-medium text-gray-900">{story.title}</h5>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              story.isPublished 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {story.isPublished ? 'Published' : 'Draft'}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {truncateContent(story.content)}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            {story.author && <span>By {story.author}</span>}
                            {story.publishedAt && (
                              <span>Published {formatDate(story.publishedAt)}</span>
                            )}
                          </div>
                          
                          {story.tags && story.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {story.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
                                >
                                  {tag}
                                </span>
                              ))}
                              {story.tags.length > 3 && (
                                <span className="text-xs text-gray-400">
                                  +{story.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleView(story)}
                            className="text-gray-400 hover:text-[#F5821F] p-1"
                            title="View story"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          
                          {permissions.canManage && (
                            <>
                              <button
                                onClick={() => toggleStoryStatus(story._id, story.isPublished)}
                                className={`p-1 rounded ${
                                  story.isPublished 
                                    ? 'text-yellow-600 hover:text-yellow-800' 
                                    : 'text-green-600 hover:text-green-800'
                                }`}
                                title={story.isPublished ? 'Unpublish story' : 'Publish story'}
                              >
                                {story.isPublished ? '👁️‍🗨️' : '👁️'}
                              </button>
                              <button
                                onClick={() => handleEdit(story)}
                                className="text-gray-400 hover:text-[#F5821F] p-1"
                                title="Edit story"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(story._id)}
                                className="text-gray-400 hover:text-red-600 p-1"
                                title="Delete story"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpenIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No success stories have been shared yet.</p>
                  {(permissions.canManage || permissions.canCreateStories) && (
                    <p className="text-sm text-gray-400 mt-1">
                      Click &quot;Add Story&quot; to share your first success story.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
}