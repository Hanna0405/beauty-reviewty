import type { Metadata } from 'next';
import { DeleteAccountContent } from './DeleteAccountContent';

export const metadata: Metadata = {
  title: 'Delete Account | BeautyReviewty',
  description:
    'Instructions for deleting a BeautyReviewty account and associated data.',
};

export default function DeleteAccountPage() {
  return <DeleteAccountContent />;
}
