'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/api/auth';
import { User, Mail, Calendar, Film } from 'lucide-react';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authApi.isAuthenticated()) {
      router.push('/auth/login');
      return;
    }

    const loadProfile = async () => {
      try {
        const token = authApi.getToken();
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setProfile({
            id: payload.sub,
            username: payload.username,
            email: payload.email || '',
            firstName: payload.firstName,
            lastName: payload.lastName,
            createdAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400">Failed to load profile</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">My Profile</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Info */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Username</div>
                      <div className="text-white font-medium">{profile.username}</div>
                    </div>
                  </div>

                  {profile.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-400">Email</div>
                        <div className="text-white font-medium">{profile.email}</div>
                      </div>
                    </div>
                  )}

                  {(profile.firstName || profile.lastName) && (
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-400">Full Name</div>
                        <div className="text-white font-medium">
                          {profile.firstName} {profile.lastName}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-400">Member Since</div>
                      <div className="text-white font-medium">
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Watch History */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Film className="h-5 w-5" />
                  Watch History
                </h2>
                <div className="text-gray-400">
                  No movies watched yet. Start watching to see your history here!
                </div>
              </div>
            </div>

            {/* Profile Stats */}
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Movies Watched</span>
                    <span className="text-white font-medium">0</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hours Watched</span>
                    <span className="text-white font-medium">0h</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-400">Downloads</span>
                    <span className="text-white font-medium">0</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                
                <div className="space-y-3">
                  <button 
                    onClick={() => router.push('/')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Browse Movies
                  </button>
                  
                  <button 
                    onClick={() => router.push('/downloads')}
                    className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    View Downloads
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}