import React, { useState } from 'react';
import { Settings, Edit, X, LogOut, User } from 'lucide-react';
import { useAdmin } from '../../contexts/AdminContext';
import { useAuth } from '../../contexts/SupabaseAuthContext';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';

const AdminToolbar: React.FC = () => {
  const { editMode, toggleEditMode } = useAdmin();
  const { isAdmin, signOut } = useAuth();
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();
  const currentLang = location.pathname.split('/')[1] || 'mk';

  // Only show toolbar if admin is authenticated
  if (!isAdmin) return null;

  const handleLogout = async () => {
    await signOut();
    setIsExpanded(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Main Toolbar */}
      <div className={`bg-siena-600 text-white rounded-lg shadow-lg transition-all duration-300 ${
        isExpanded ? 'p-4' : 'p-2'
      }`}>
        {isExpanded ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <h3 className="font-semibold text-sm">{t('admin.toolbar.panel')}</h3>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-siena-700 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              <Button
                variant={editMode ? "primary" : "outline"}
                size="sm"
                onClick={toggleEditMode}
                className={`w-full text-xs ${
                  editMode
                    ? 'bg-green-500 hover:bg-green-600 border-green-500' 
                    : 'bg-white text-siena-600 border-white hover:bg-gray-100'
                }`}
              >
                <Edit className="h-3 w-3 mr-1" />
                {editMode ? t('admin.toolbar.exitEdit') : t('admin.toolbar.editMode')}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/${currentLang}/admin/dashboard`, '_blank')}
                className="w-full text-xs bg-white text-siena-600 border-white hover:bg-gray-100"
              >
                <Settings className="h-3 w-3 mr-1" />
                {t('admin.toolbar.manage')}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full text-xs bg-red-500 text-white border-red-500 hover:bg-red-600"
              >
                <LogOut className="h-3 w-3 mr-1" />
                {t('account.logout')}
              </Button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsExpanded(true)}
            className="p-2 hover:bg-siena-700 rounded transition-colors duration-200"
          >
            <Settings className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Edit Mode Indicator */}
      {editMode && (
        <div className="absolute -top-12 right-0 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium animate-pulse">
          {t('admin.toolbar.editActive')}
        </div>
      )}
    </div>
  );
};

export default AdminToolbar;
