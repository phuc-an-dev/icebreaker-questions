import { redirect } from 'next/navigation';
import { getServerCurrentAdmin } from '@/lib/auth';
import { getCategoriesWithDefaults, getQuestionTypesWithDefaults } from '@/lib/db-questions';
import { getAllAdmins } from '@/lib/db-admins';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Control Center | Icebreaker Questions',
  description: 'Manage questions, categories, and formats in MongoDB Atlas',
};

export default async function AdminPage() {
  const currentAdmin = await getServerCurrentAdmin();
  if (!currentAdmin) {
    redirect('/admin/login');
  }

  const [categories, types, admins] = await Promise.all([
    getCategoriesWithDefaults(),
    getQuestionTypesWithDefaults(),
    getAllAdmins(),
  ]);

  return (
    <AdminDashboard
      currentAdmin={currentAdmin}
      initialCategories={categories}
      initialTypes={types}
      initialAdmins={admins}
    />
  );
}
