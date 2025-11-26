'use client';

import React, { ReactNode } from 'react';
import Modal, { ModalBody, ModalFooter, useModalTheme } from './Modal';
import { ModalThemeName } from '../lib/modalThemes';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmButtonColor?: 'red' | 'blue' | 'green' | 'orange';
  icon?: ReactNode;
  children?: ReactNode;
  theme?: ModalThemeName;
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
  icon,
  children,
  theme = 'default'
}: ConfirmationModalProps) {
  const colorClasses = {
    red: 'bg-red-600 hover:bg-red-700',
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    orange: 'bg-[#F25F29] hover:bg-[#F23E16]'
  };

  const iconColorClasses = {
    red: 'bg-red-100',
    blue: 'bg-blue-100',
    green: 'bg-green-100',
    orange: 'bg-orange-100'
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      maxWidth="md"
      showCloseButton={false}
      theme={theme}
    >
      <ConfirmationContent
        icon={icon}
        iconColorClass={iconColorClasses[confirmButtonColor]}
        title={title}
        message={message}
        onClose={onClose}
        onConfirm={onConfirm}
        cancelLabel={cancelLabel}
        confirmLabel={confirmLabel}
        confirmButtonClass={colorClasses[confirmButtonColor]}
      >
        {children}
      </ConfirmationContent>
    </Modal>
  );
}

// Component that runs inside Modal context and can access theme
function ConfirmationContent({
  icon,
  iconColorClass,
  title,
  message,
  onClose,
  onConfirm,
  cancelLabel,
  confirmLabel,
  confirmButtonClass,
  children
}: {
  icon?: ReactNode;
  iconColorClass: string;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  cancelLabel: string;
  confirmLabel: string;
  confirmButtonClass: string;
  children?: ReactNode;
}) {
  const theme = useModalTheme();
  
  return (
    <>
      <ModalBody className="text-center">
        {icon && (
          <div className={`flex items-center justify-center w-12 h-12 mx-auto ${iconColorClass} rounded-full mb-4`}>
            {icon}
          </div>
        )}
        <h3 className={`text-lg font-medium ${theme?.textColor || 'text-gray-900'} mb-2`}>
          {title}
        </h3>
        <p className={`text-sm ${theme?.messageColor || 'text-gray-500'} mb-6`}>
          {message}
        </p>
        {children}
      </ModalBody>

      <ModalFooter>
        <button
          onClick={onClose}
          className={`px-4 py-2 text-sm font-medium ${theme?.cancelButtonColor || 'text-gray-700 hover:text-gray-500'}`}
        >
          {cancelLabel}
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${confirmButtonClass}`}
        >
          {confirmLabel}
        </button>
      </ModalFooter>
    </>
  );
}