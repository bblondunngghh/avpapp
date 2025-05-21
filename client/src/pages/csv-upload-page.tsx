import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import CSVUploader from '@/components/csv-uploader';

export default function CSVUploadPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  // Simple admin check - can be replaced with proper authentication
  const isAdmin = localStorage.getItem('admin_authenticated') === 'true';

  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "You need admin permissions to access this page.",
        variant: "destructive"
      });
      navigate('/admin-login');
    }
  }, [isAdmin, navigate, toast]);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-8 text-center">Database CSV Upload</h1>
      <div className="max-w-3xl mx-auto">
        <p className="text-gray-600 mb-6 text-center">
          Use this page to upload CSV files to populate or update the database.
          Download the appropriate template, fill it with your data, then upload it.
        </p>
        
        <CSVUploader />
        
        <div className="mt-8 flex flex-col gap-4">
          <button
            onClick={() => navigate('/admin-panel')}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center justify-center w-full"
          >
            ← Back to Admin Panel
          </button>
        </div>
      </div>
    </div>
  );
}