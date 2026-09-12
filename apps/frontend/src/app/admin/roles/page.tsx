import { redirect } from 'next/navigation';
export default function RolesRedirectPage() {
  redirect('/dashboard/admin');
}
