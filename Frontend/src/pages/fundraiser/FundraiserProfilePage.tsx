import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PaymentMethodsSection } from '../../components/profile/PaymentMethodsSection';
import { isFirebaseConfigured, isPushSupported, registerPushAndGetToken } from '../../services/firebase';
import api from '../../api/axios';

export function FundraiserProfilePage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [filePreview, setFilePreview] = useState<string>(user?.avatar || ''); // Display - no fallback
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Store file for upload
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushConfigReady, setPushConfigReady] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const justUploadedRef = useRef(false); // Track if we just uploaded

  useEffect(() => {
    isPushSupported().then(setPushSupported);
    setPushConfigReady(isFirebaseConfigured());

    // Keep preview in sync with the authenticated user's current picture.
    if (user) {
      setName(user.name || '');
      setFilePreview(user.avatar || '');
    }

    // Reset selected file when component mounts or user changes
    setSelectedFile(null);
  }, [user]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('Please upload a valid image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image size should be less than 5MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      setFilePreview(preview);
      setMessage('');
      console.log('Image selected for upload:', file.name, 'Size:', file.size);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      setMessage('Name is required');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      // Step 1: Upload image to Cloudinary if selected
      let uploadedImageUrl: string | undefined;
      if (selectedFile) {
        setUploadingImage(true);
        const formData = new FormData();
        formData.append('profilePicture', selectedFile);

        console.log('Uploading image to Cloudinary...');
        const uploadResponse = await api.post('/users/profile-picture', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        console.log('Image upload response:', {
          success: uploadResponse.data.success,
          imageUrl: uploadResponse.data.imageUrl?.substring(0, 100),
        });

        uploadedImageUrl = uploadResponse.data.imageUrl;
        setUploadingImage(false);
      }

      // Step 2: Update name and get latest user data
      console.log('Updating profile name...');
      const response = await api.put('/users/profile', {
        name: name.trim(),
      });

      console.log('Profile update response:', {
        success: response.data.success,
        name: response.data.user?.name,
        avatar: response.data.user?.profilePicture?.substring(0, 100),
      });

      setMessage('Profile updated successfully!');
      
      if (response.data.user) {
        const updatedUser = {
          id: response.data.user.id || response.data.user._id,
          email: response.data.user.email,
          name: response.data.user.name,
          role: response.data.user.role,
          avatar: response.data.user.profilePicture || uploadedImageUrl || undefined,
        };

        // Update filePreview to keep the saved picture visible immediately.
        if (updatedUser.avatar) {
          setFilePreview(updatedUser.avatar);
        }

        justUploadedRef.current = true;
        updateUser(updatedUser);
        setSelectedFile(null);
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const errorMsg = error.response?.data?.message || 'Error updating profile. Please try again.';
      setMessage(errorMsg);
    } finally {
      setSaving(false);
      setUploadingImage(false);
    }
  }

  const handlePushToggle = async (checked: boolean) => {
    if (!checked) {
      setPushEnabled(false);
      return;
    }
    setPushLoading(true);
    try {
      const token = await registerPushAndGetToken();
      setPushEnabled(Boolean(token));
    } catch {
      setPushEnabled(false);
    } finally {
      setPushLoading(false);
    }
  };

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 md:px-8 max-w-2xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8">Profile Settings</h1>

      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              {filePreview ? (
                <>
                  <img
                    key={filePreview}
                    src={filePreview}
                    alt={name}
                    className="w-20 h-20 rounded-full border-2 border-slate-100 object-cover"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full transition-colors"
                    title="Change profile picture"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors"
                  title="Upload profile picture"
                >
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{name}</h3>
              <p className="text-slate-500">{user?.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                Fundraiser
              </span>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500"
              />
            </div>
          </div>
        </div>

        <PaymentMethodsSection />

        <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm">
          <h3 className="font-semibold text-slate-900 mb-4">Notification Preferences</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700">New donations</span>
              <input type="checkbox" defaultChecked className="rounded border-slate-300 text-emerald-600" />
            </label>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-slate-700">Messages</span>
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
          onClick={handleSaveProfile}
          disabled={saving || uploadingImage}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-colors"
        >
          {uploadingImage ? 'Uploading image...' : saving ? 'Saving...' : 'Save Changes'}
        </button>

        {message && (
          <div className={`p-4 rounded-lg text-sm font-medium ${
            message.includes('successfully') 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
