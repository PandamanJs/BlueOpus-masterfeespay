import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import ParentInformationPage, { type ParentData } from './registration/ParentInformationPage';
import StudentsPage from './registration/StudentsPage';
import ReviewPage from './registration/ReviewPage';
import { type StudentData, registerParent, linkStudentsToParent } from '../lib/supabase/api/registration';
import { getSchools } from '../lib/supabase/api/schools';
import type { School } from '../types';

interface RegistrationFormPageProps {
  onBack: () => void;
  onComplete: (data: { name: string; phone: string; schoolName: string }) => void;
}

type RegistrationStep = 'parent' | 'students' | 'review';

export default function RegistrationFormPage({ onBack, onComplete }: RegistrationFormPageProps) {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('parent');
  const [parentData, setParentData] = useState<ParentData | null>(null);
  const [studentsData, setStudentsData] = useState<StudentData[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchSchools() {
      const data = await getSchools();
      setSchools(data);
    }
    fetchSchools();
  }, []);

  const handleParentNext = (data: ParentData) => {
    setParentData(data);
    setCurrentStep('students');
  };

  const handleStudentsBack = () => {
    setCurrentStep('parent');
  };

  const handleStudentsNext = (students: StudentData[]) => {
    setStudentsData(students);
    setCurrentStep('review');
  };

  const handleReviewBack = () => {
    setCurrentStep('students');
  };

  const handleFinalConfirm = async () => {
    if (parentData && studentsData.length > 0) {
      setIsSubmitting(true);
      try {
        console.log('Starting registration...');

        // 1. Register Parent
        const parentId = await registerParent(parentData);

        if (!parentId) {
          throw new Error('Failed to register parent');
        }

        console.log('Parent registered:', parentId);

        // 2. Link Students
        await linkStudentsToParent(parentId, studentsData, parentData.schoolId);

        console.log('Students linked');

        // Success!
        toast.success("Registration completed successfully!");

        // Find school name for the store
        const schoolName = schools.find(s => s.id === parentData.schoolId)?.name || "";

        onComplete({
          name: parentData.fullName,
          phone: parentData.phone,
          schoolName: schoolName
        });

      } catch (error) {
        console.error('Registration failed:', error);
        toast.error("Registration failed. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isSubmitting) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <Loader2 className="size-16 text-[#95e36c] animate-spin mb-6" />
        <h2 className="text-[28px] font-['IBM_Plex_Sans_Devanagari:Bold',sans-serif] text-[#003630] tracking-[-0.6px]">Registering...</h2>
        <p className="text-[15px] text-[#003630]/60 mt-3 max-w-[280px] leading-relaxed">
          Verifying your secure connection and linking student records to your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white">
      {currentStep === 'parent' && (
        <div className="relative h-full">
          <ParentInformationPage
            onNext={handleParentNext}
            onBack={onBack}
          />
        </div>
      )}

      {currentStep === 'students' && parentData && (
        <div className="relative h-full">
          <StudentsPage
            parentData={parentData}
            onComplete={handleStudentsNext}
            onBack={handleStudentsBack}
          />
        </div>
      )}

      {currentStep === 'review' && parentData && studentsData.length > 0 && (
        <div className="relative h-full">
          <ReviewPage
            parentData={parentData}
            students={studentsData}
            onBack={handleReviewBack}
            onConfirm={handleFinalConfirm}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </div>
  );
}