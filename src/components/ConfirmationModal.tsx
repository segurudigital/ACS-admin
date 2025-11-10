'use client';

import React, { ReactNode } from 'react';
import Modal, { ModalBody, ModalFooter } from './Modal';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmButtonColor?: 'red' | 'blue' | 'green';
  icon?: ReactNode;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmButtonColor = 'red',
  icon
}: ConfirmationModalProps) {
  const colorClasses = {
    red: 'bg-red-600 hover:bg-red-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700'
  };

  const iconColorClasses = {
    red: 'bg-red-100',
    blue: 'bg-blue-100',
    green: 'bg-green-100'
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="md"
      showCloseButton={false}
    >
      <ModalBody className="text-center">
        {icon && (
          <div className={`flex items-center justify-center w-12 h-12 mx-auto ${iconColorClasses[confirmButtonColor]} rounded-full mb-4`}>
            {icon}
          </div>
        )}
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {title}
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          {message}
        </p>
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${colorClasses[confirmButtonColor]}`}
        >
          {confirmLabel}
        </button>
      </ModalFooter>
    </Modal>
  );
}