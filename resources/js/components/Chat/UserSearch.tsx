import { useState } from 'react';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, X, AlertCircle } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  status?: string;
}

interface UserSearchProps {
  onSelectUser: (user: User) => void;
}

export default function UserSearch({ onSelectUser }: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [showNoResults, setShowNoResults] = useState(false);

  const handleSearch = async () => {
    if (searchTerm.length < 2) {
      setError('Please enter at least 2 characters');
      return;
    }

    setSearching(true);
    setError('');
    setShowNoResults(false);

    try {
      console.log('Searching for:', searchTerm);
      const response = await axios.get('/chat/search-users', {
        params: { name: searchTerm }
      });
      
      console.log('Search results:', response.data);
      setSearchResults(response.data);
      
      if (response.data.length === 0) {
        setShowNoResults(true);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.response?.data?.message || 'Error searching for users');
    } finally {
      setSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setError('');
    setShowNoResults(false);
  };

  return (
    <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
      <h2 className="text-sm font-semibold mb-2">Find a user to chat with</h2>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-8"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
          />
          {searchTerm && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={clearSearch}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <Button 
          size="sm" 
          onClick={handleSearch}
          disabled={searching || searchTerm.length < 2}
        >
          <Search size={16} className="mr-1" />
          {searching ? 'Searching...' : 'Search'}
        </Button>
      </div>
      
      {error && (
        <div className="flex items-center text-red-500 text-sm mt-2">
          <AlertCircle size={14} className="mr-1" />
          <span>{error}</span>
        </div>
      )}
      
      {showNoResults && !error && (
        <div className="text-gray-500 text-sm mt-2">
          No users found matching "{searchTerm}". Try another search term.
        </div>
      )}
      
      {searchResults.length > 0 && (
        <div className="mt-3">
          <h3 className="text-xs font-semibold text-gray-500 mb-1">RESULTS</h3>
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {searchResults.map(user => (
              <div
                key={user.id}
                className="flex items-center p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer"
                onClick={() => {
                  onSelectUser(user);
                  clearSearch();
                }}
              >
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                {user.status && (
                  <div className={`ml-auto w-2 h-2 rounded-full ${
                    user.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 