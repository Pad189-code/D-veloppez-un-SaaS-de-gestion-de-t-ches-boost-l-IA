'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CREATE_PROJECT_CTA_CLASSNAME } from '@/components/layout/createProjectCtaClassName';
import CreateProjectModal from './CreateProjectModal';

export default function CreateProjectButton() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className={CREATE_PROJECT_CTA_CLASSNAME}
      >
        <span className="text-base font-medium leading-none" aria-hidden>
          +
        </span>
        <span>Créer un projet</span>
      </button>

      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}
