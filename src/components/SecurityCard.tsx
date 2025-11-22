'use client';

import { useState } from 'react';
import { usePermissions } from '../contexts/HierarchicalPermissionContext';
import { useToast } from '../contexts/ToastContext';
import Button from './Button';
import Card from './Card';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  bgColor: string;
}

export default function SecurityCard() {
  const { user } = usePermissions();
  const { success, error } = useToast();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  if (!user) return null;

  const calculatePasswordStrength = (password: string): PasswordStrength => {
    let score = 0;
    
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    if (score <= 2) {
      return { score, label: 'Weak', color: 'text-red-600', bgColor: 'bg-red-500' };
    } else if (score <= 4) {
      return { score, label: 'Fair', color: 'text-yellow-600', bgColor: 'bg-yellow-500' };
    } else if (score <= 5) {
      return { score, label: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-500' };
    } else {
      return { score, label: 'Strong', color: 'text-green-600', bgColor: 'bg-green-500' };
    }
  };

  const passwordStrength = calculatePasswordStrength(formData.newPassword);

  const handleInputChange = (field: keyof PasswordFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStartPasswordChange = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsChangingPassword(true);
  };

  const handleCancelPasswordChange = () => {
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setIsChangingPassword(false);
  };

  const handleSavePassword = async () => {
    // Validation
    if (!formData.currentPassword) {
      error('Current password is required');
      return;
    }

    if (formData.newPassword.length < 8) {
      error('New password must be at least 8 characters long');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      error('New passwords do not match');
      return;
    }

    if (passwordStrength.score < 3) {
      error('Please choose a stronger password');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implement API call to change password
      // const response = await AuthService.changePassword(formData);
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setIsChangingPassword(false);
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      success('Password changed successfully');
    } catch (passwordError) {
      console.error('Password change error:', passwordError);
      error('Failed to change password. Please check your current password.');
    } finally {
      setIsLoading(false);
    }
  };

  const getLastPasswordChange = () => {
    // TODO: Get actual last password change date from user data
    return 'Unknown';
  };

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Security Settings</h2>
        {!isChangingPassword && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleStartPasswordChange}
            leftIcon={({ className }) => (
              <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
          >
            Change Password
          </Button>
        )}
      </div>

      {!isChangingPassword ? (
        <div className="space-y-6">
          {/* Password Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">Password Protection</h3>
                <p className="text-sm text-gray-600">
                  Your account is protected with a secure password
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                Last changed: {getLastPasswordChange()}
              </p>
            </div>
          </div>

          {/* Security Recommendations */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Security Recommendations</h3>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-900 font-medium">Strong Password</p>
                  <p className="text-sm text-gray-600">Use at least 12 characters with mixed case, numbers, and symbols</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-green-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-900 font-medium">Unique Password</p>
                  <p className="text-sm text-gray-600">Don&apos;t reuse passwords from other accounts</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-900 font-medium">Regular Updates</p>
                  <p className="text-sm text-gray-600">Change your password every 90 days for maximum security</p>
                </div>
              </div>
            </div>
          </div>

          {/* Future Security Features */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Coming Soon</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Two-factor authentication (2FA)</li>
              <li>• Login activity monitoring</li>
              <li>• Device management</li>
              <li>• Security notifications</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Password Change Form */}
          <div className="space-y-4">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your current password"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange('newPassword', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your new password"
                  disabled={isLoading}
                />
              </div>
              
              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Password strength:</span>
                    <span className={`text-xs font-medium ${passwordStrength.color}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.bgColor}`}
                      style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showPasswords ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm your new password"
                  disabled={isLoading}
                />
              </div>
              {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
              )}
            </div>

            {/* Show Passwords Toggle */}
            <div className="flex items-center">
              <input
                id="showPasswords"
                type="checkbox"
                checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <label htmlFor="showPasswords" className="ml-2 text-sm text-gray-700">
                Show passwords
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button 
              variant="ghost" 
              onClick={handleCancelPasswordChange}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSavePassword}
              loading={isLoading}
              disabled={
                !formData.currentPassword || 
                !formData.newPassword || 
                !formData.confirmPassword ||
                formData.newPassword !== formData.confirmPassword ||
                passwordStrength.score < 3
              }
            >
              Change Password
            </Button>
          </div>

          {/* Security Tips */}
          <div className="p-4 bg-yellow-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Security Tip:</strong> Choose a password that includes uppercase letters, lowercase letters, 
                  numbers, and special characters. Avoid using personal information or common words.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}