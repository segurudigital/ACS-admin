'use client';

import { useEffect, useState, useCallback, useMemo, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const initialState = useMemo(() => {
    if (!token) {
      return { status: 'error' as const, message: 'Invalid verification link. No token provided.' };
    }
    return { status: 'loading' as const, message: '' };
  }, [token]);
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(initialState.status);
  const [message, setMessage] = useState(initialState.message);
  const hasVerifiedRef = useRef(false);

  const verifyEmail = useCallback(async (verificationToken: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/auth/verify-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage(data.message || 'Email verified successfully!');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setStatus('error');
        setMessage(data.message || 'Failed to verify email. The link may be expired or invalid.');
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      setStatus('error');
      setMessage('An error occurred while verifying your email. Please try again later.');
    }
  }, [router]);

  // Auto-verify when component mounts if token exists and not already verified
  useEffect(() => {
    if (token && !hasVerifiedRef.current && initialState.status === 'loading') {
      hasVerifiedRef.current = true;
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => verifyEmail(token), 0);
    }
  }, [token, initialState.status, verifyEmail]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900">
          ADVENTIST COMMUNITY SERVICES AUSTRALIA
        </h1>
        <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
          EMAIL VERIFICATION
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {status === 'loading' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-600">Verifying your email address...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg
                  className="h-6 w-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">VERIFICATION SUCCESSFUL</h3>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
              <p className="mt-4 text-sm text-gray-600">
                Redirecting to login page in 3 seconds...
              </p>
              <Link
                href="/"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Go to Login Now
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">VERIFICATION FAILED</h3>
              <p className="mt-2 text-sm text-gray-600">{message}</p>
              <div className="mt-6 space-y-2">
                <p className="text-sm text-gray-600">
                  Please contact your administrator to resend the verification email.
                </p>
                <Link
                  href="/"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help? Contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-4 text-sm text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}