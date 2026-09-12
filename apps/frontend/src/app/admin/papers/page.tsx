import { redirect } from 'next/navigation';
export default function PapersRedirectPage() {
  redirect('/dashboard/admin');
}
