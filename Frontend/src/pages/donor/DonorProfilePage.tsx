import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PaymentMethodsSection } from '../../components/profile/PaymentMethodsSection';
import { SaveSuccessModal } from '../../components/SaveSuccessModal';
import { isFirebaseConfigured, isPushSupported, registerPushAndGetToken } from '../../services/firebase';
import api from '../../api/axios';

export function DonorProfilePage() {
  const { user, updateUser } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushConfigReady, setPushConfigReady] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  
  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [profilePicture, setProfilePicture] = useState(user?.avatar || '');
  const [filePreview, setFilePreview] = useState(user?.avatar || 'https://i.pravatar.cc/150');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    isPushSupported().then(setPushSupported);
    setPushConfigReady(isFirebaseConfigured());
  }, []);

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setProfilePicture(user.avatar || '');
      setFilePreview(user.avatar || 'https://i.pravatar.cc/150');
    }
  }, [user]);

  const handlePushToggle = async (checked: boolean) => {
    if (!checked) {
      setPushEnabled(false);
      return;
    }
    setPushLoading(true);
    try {
      const token = await registerPushAndGetToken();
      setPushEnabled(Boolean(token));
      if (token) {
        // In production: send token to backend to associate with user
        console.debug('FCM token obtained');
      }
    } catch {
      setPushEnabled(false);
    } finally {
      setPushLoading(false);
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
        setProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage('');
    setSaveError('');

    try {
      // Validate name
      if (!name.trim()) {
        setSaveError('Name cannot be empty');
        setIsSaving(false);
        return;
      }

      // Call API to update profile
      const response = await api.put('/users/profile', {
        name: name.trim(),
        profilePicture: profilePicture || null,
      });

      if (response.data.success) {
        // Show success modal
        setShowSuccessModal(true);
        
        // Update auth context with new user data
        if (updateUser) {
          updateUser(response.data.user);
        }
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setSaveError(error.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-2xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Profile Settings</h1>

      <form onSubmit={handleSaveChanges} className="space-y-6">
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative">
                <img
                  src={filePreview}
                  alt={name}
                  className="w-20 h-20 rounded-full border-2 border-slate-100 object-cover"
                />
                <label className="absolute bottom-0 right-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full p-2 cursor-pointer transition-colors" title="Change profile picture">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                  </svg>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{name}</h3>
                <p className="text-slate-500">{user?.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                  Donor
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-500">Click the camera icon to change your profile picture</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
            </div>
          </div>

          {/* Status Messages */}
          {saveMessage && (
            <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-700">{saveMessage}</p>
            </div>
          )}
          {saveError && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{saveError}</p>
            </div>
          )}
        </div>

        <PaymentMethodsSection />

        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Notification Preferences</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700">Email notifications</span>
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-emerald-600" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700">Campaign updates</span>
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-emerald-600" />
            </label>
            {pushSupported && (
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-slate-700">Push notifications</span>
                <input
                  type="checkbox"
                  checked={pushEnabled}
                  disabled={!pushConfigReady || pushLoading}
                  onChange={(e) => handlePushToggle(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600"
                />
              </label>
            )}
            {pushSupported && !pushConfigReady && (
              <p className="text-xs text-slate-500 mt-1">Configure Firebase (VITE_FIREBASE_*) to enable push.</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </form>

      {/* Success Modal */}
      <SaveSuccessModal
        isOpen={showSuccessModal}
        message="Your profile changes have been saved successfully!"
        onClose={() => setShowSuccessModal(false)}
        autoCloseDuration={3000}
      />
    </div>
  );
}
