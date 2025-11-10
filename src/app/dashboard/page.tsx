import AdminLayout from '../../components/AdminLayout';

export default function Dashboard() {
  return (
    <AdminLayout 
      title="Dashboard" 
      description="Overview of your Adventist Community Services admin panel"
    >
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-lg text-gray-600">
            This will be the dashboard area
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}