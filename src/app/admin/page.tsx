import { redirect } from 'next/navigation';
import { isServerAdminAuthenticated } from '@/lib/auth';
import { getCategoriesWithDefaults, getQuestionTypesWithDefaults } from '@/lib/db-questions';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Control Center | Icebreaker Questions',
  description: 'Manage questions, categories, and formats in MongoDB Atlas',
};

export default async function AdminPage() {
  const authenticated = await isServerAdminAuthenticated();
  if (!authenticated) {
    redirect('/admin/login');
  }

  const [categories, types] = await Promise.all([
    getCategoriesWithDefaults(),
    getQuestionTypesWithDefaults(),
  ]);

  return <AdminDashboard initialCategories={categories} initialTypes={types} />;
}
