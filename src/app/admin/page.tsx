import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerCurrentAdmin } from '@/lib/auth';
import {
  getCategoriesWithDefaults,
  getQuestionTypesWithDefaults,
  getTotalQuestionsCount,
} from '@/lib/db-questions';
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

  const [categories, types, admins, totalQuestions] = await Promise.all([
    getCategoriesWithDefaults(),
    getQuestionTypesWithDefaults(),
    getAllAdmins(),
    getTotalQuestionsCount(),
  ]);

  return (
    <Suspense fallback={null}>
      <AdminDashboard
        currentAdmin={currentAdmin}
        initialCategories={categories}
        initialTypes={types}
        initialAdmins={admins}
        initialTotalQuestions={totalQuestions}
      />
    </Suspense>
  );
}
