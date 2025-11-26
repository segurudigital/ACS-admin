'use client';

import React from 'react';
import Modal, { ModalBody, ModalFooter } from './Modal';

interface SystemRoleConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  roleName: string;
  action: 'edit' | 'delete';
  affectedUsersCount?: number;
}

export default function SystemRoleConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  roleName,
  action,
  affectedUsersCount = 0
}: SystemRoleConfirmationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Confirm System Role ${action === 'edit' ? 'Modification' : 'Deletion'}`}
      maxWidth="md"
      theme="orange"
    >
      <ModalBody className="space-y-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-800">
              {action === 'edit' ? 'Modify System Role' : 'Delete System Role'}
            </h3>
            <div className="mt-2 text-sm text-gray-800 space-y-2">
              <p>
                You are about to {action} the system role <strong>&quot;{roleName}&quot;</strong>.
              </p>
              <p>
                This action will affect <strong>{affectedUsersCount > 0 ? `${affectedUsersCount} users` : 'all users with this role'}</strong> across the entire system.
              </p>
              {action === 'edit' && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> System roles are critical for application security. 
                    Modifying permissions may impact system functionality or security.
                  </p>
                </div>
              )}
              {action === 'delete' && (
                <div className="bg-red-50 border-l-4 border-red-400 p-3 mt-3">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> Deleting a system role cannot be easily undone. 
                    All users with this role will lose their current permissions.
                  </p>
                </div>
              )}
              <p className="font-medium">
                Are you sure you want to proceed?
              </p>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-800 hover:text-gray-500"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`px-4 py-2 text-sm font-medium rounded-md text-gray-800 ${
            action === 'delete' 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-orange-600 hover:bg-orange-700'
          }`}
        >
          {action === 'edit' ? 'Yes, Modify Role' : 'Yes, Delete Role'}
        </button>
      </ModalFooter>
    </Modal>
  );
}