import { UserManagement } from '@/components/UserManagement';

export default function EquipePage() {
  return (
    <div className="space-y-6">
      <UserManagement clinicId={1} />
    </div>
  );
}