'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  School,
  BookOpen,
  Users,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ChevronRight,
  Rocket,
  ShieldCheck,
  Check,
  Compass,
  Award,
  Lightbulb,
  Building2,
  User,
  Hash,
  Layers,
  Search,
  X,
  CheckCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { getDashboardRoute } from '@/utils/navigation';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface StudentInput {
  name: string;
  rollNo: string;
  email: string;
}

const DEFAULT_COLLEGES = [
  'Maharishi Markandeshwar University (MMU)',
  'Mahatma Gandhi University (MGU)',
  'Maharashtra Institute of Technology (MIT World Peace University)',
  'Maharshi Dayanand University (MDU)',
  'Maharaja Sayajirao University of Baroda (MSU)',
  'Maharaja Agrasen Institute of Technology (MAIT)',
  'Mahatma Jyotirao Phoole University',
  'Stanford University',
  'Massachusetts Institute of Technology (MIT)',
  'Indian Institute of Technology Bombay (IIT Bombay)',
  'Indian Institute of Technology Delhi (IIT Delhi)',
  'Indian Institute of Technology Madras (IIT Madras)',
  'Indian Institute of Technology Kharagpur (IIT KGP)',
  'Birla Institute of Technology and Science (BITS Pilani)',
  'University of Oxford',
  'University of Cambridge',
  'Harvard University',
  'University of California, Berkeley (UC Berkeley)',
  'National Institute of Technology Trichy (NIT Trichy)',
  'Delhi Technological University (DTU)',
  'Vellore Institute of Technology (VIT)',
  'SRM Institute of Science and Technology',
  'Manipal Academy of Higher Education (MAHE)'
];

const POPULAR_INTERESTS = [
  'Artificial Intelligence',
  'Data Structures & Algorithms',
  'Web Development',
  'Machine Learning',
  'Database Management',
  'Cybersecurity',
  'Computer Networks',
  'Mathematics & Calculus',
  'Cloud Computing',
  'Software Engineering'
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user, completeOnboarding, isAuthenticated, isLoading } = useAuthStore();

  // Role resolution
  const userRole = useMemo(() => {
    const rawRole = (user?.role || '').toUpperCase();
    if (rawRole.includes('TEACHER') || rawRole.includes('FACULTY')) return 'TEACHER';
    if (rawRole.includes('ADMIN') || rawRole.includes('ORG_ADMIN')) return 'ADMIN';
    return 'STUDENT';
  }, [user?.role]);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [department, setDepartment] = useState('');
  const [className, setClassName] = useState('');
  const [subject, setSubject] = useState('');
  const [studentId, setStudentId] = useState('');
  const [academicYear, setAcademicYear] = useState('2nd Year');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Data Structures & Algorithms', 'Artificial Intelligence']);
  const [classCode, setClassCode] = useState('');

  // College search state
  const [collegeSearchQuery, setCollegeSearchQuery] = useState('');
  const [isNewOrgSelected, setIsNewOrgSelected] = useState(false);

  // Student roster state (for teachers)
  const [students, setStudents] = useState<StudentInput[]>([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentRoll, setNewStudentRoll] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');

  // UI state
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(new Set());
  const [activeStepId, setActiveStepId] = useState<string>('profile');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      if (user.organizationName) {
        setOrganizationName(user.organizationName);
        setCollegeSearchQuery(user.organizationName);
      }
      setDepartment(user.departmentName || '');
    }
  }, [user]);

  // Route protection
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Filtered colleges list based on search query
  const filteredColleges = useMemo(() => {
    const query = collegeSearchQuery.trim().toLowerCase();
    if (!query) return DEFAULT_COLLEGES;
    return DEFAULT_COLLEGES.filter((col) => col.toLowerCase().includes(query));
  }, [collegeSearchQuery]);

  // Define steps dynamically based on role
  const steps = useMemo(() => {
    if (userRole === 'STUDENT') {
      return [
        {
          id: 'profile',
          title: 'Complete your profile',
          description: 'Add your name and student registration details so your peers and faculty know who you are.',
          icon: User,
          actionLabel: 'Save Profile'
        },
        {
          id: 'institution',
          title: 'Select your university or college',
          description: 'Choose your campus from our database or register a new institution.',
          icon: School,
          actionLabel: 'Confirm Institution'
        },
        {
          id: 'academic',
          title: 'Set up department & major',
          description: 'Specify your academic department and current year of study.',
          icon: GraduationCap,
          actionLabel: 'Save Academic Info'
        },
        {
          id: 'interests',
          title: 'Choose learning preferences',
          description: 'Select subject areas for personalized AI study materials and recommendations.',
          icon: Lightbulb,
          actionLabel: 'Save Preferences'
        },
        {
          id: 'class_code',
          title: 'Enter class join code (Optional)',
          description: 'Link directly to your teacher’s class or explore public subject groups.',
          icon: Compass,
          actionLabel: 'Complete Setup'
        }
      ];
    }

    if (userRole === 'ADMIN') {
      return [
        {
          id: 'profile',
          title: 'Administrator profile',
          description: 'Confirm your official full name and administrative credentials.',
          icon: ShieldCheck,
          actionLabel: 'Save Profile'
        },
        {
          id: 'institution',
          title: 'Configure organization & campus',
          description: 'Select your institution or register a new campus domain.',
          icon: Building2,
          actionLabel: 'Configure Institution'
        },
        {
          id: 'academic',
          title: 'Set up academic departments',
          description: 'Define main academic divisions and faculty structures.',
          icon: Layers,
          actionLabel: 'Save Departments'
        },
        {
          id: 'roster',
          title: 'Faculty invites & permissions',
          description: 'Configure default access policies and invite initial faculty.',
          icon: Users,
          actionLabel: 'Complete Setup'
        }
      ];
    }

    // Default TEACHER / FACULTY steps
    return [
      {
        id: 'profile',
        title: 'Faculty profile details',
        description: 'Verify your name and official academic designation.',
        icon: GraduationCap,
        actionLabel: 'Save Profile'
      },
      {
        id: 'institution',
        title: 'Select university or teaching campus',
        description: 'Find your college in our registry or register a new campus.',
        icon: School,
        actionLabel: 'Confirm Institution'
      },
      {
        id: 'academic',
        title: 'Set up academic department',
        description: 'Specify your teaching division or department.',
        icon: BookOpen,
        actionLabel: 'Save Department'
      },
      {
        id: 'class_setup',
        title: 'Create your first class group',
        description: 'Set up your class section name and syllabus subject.',
        icon: Rocket,
        actionLabel: 'Create Class'
      },
      {
        id: 'roster',
        title: 'Invite student roster',
        description: 'Enroll teammates and students into your class group.',
        icon: Users,
        actionLabel: 'Complete Setup'
      }
    ];
  }, [userRole]);

  const completedCount = completedStepIds.size;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const allDone = completedCount === steps.length;

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const addStudent = () => {
    if (!newStudentName.trim()) {
      toast.error('Student name is required');
      return;
    }
    const roll = newStudentRoll.trim() || `R-${Date.now().toString().slice(-4)}`;
    const email = newStudentEmail.trim() || `${newStudentName.toLowerCase().replace(/\s+/g, '.')}@student.edu`;

    setStudents((prev) => [...prev, { name: newStudentName.trim(), rollNo: roll, email }]);
    setNewStudentName('');
    setNewStudentRoll('');
    setNewStudentEmail('');
    toast.success(`Added ${newStudentName} to roster`);
  };

  const removeStudent = (index: number) => {
    setStudents((prev) => prev.filter((_, i) => i !== index));
  };

  const addSampleRoster = () => {
    const samples: StudentInput[] = [
      { name: 'Alex Johnson', rollNo: 'CS-101', email: 'alex.j@student.edu' },
      { name: 'Sophia Chen', rollNo: 'CS-102', email: 'sophia.c@student.edu' },
      { name: 'Marcus Vance', rollNo: 'CS-103', email: 'marcus.v@student.edu' }
    ];
    setStudents(samples);
    toast.success('Added sample student roster');
  };

  const validateStep = (stepId: string): boolean => {
    if (stepId === 'profile') {
      if (!firstName.trim() || !lastName.trim()) {
        toast.error('Please enter your first and last name.');
        return false;
      }
    } else if (stepId === 'institution') {
      const selectedOrg = organizationName.trim() || collegeSearchQuery.trim();
      if (!selectedOrg) {
        toast.error('Please search and select a college or register a new one.');
        return false;
      }
    } else if (stepId === 'academic') {
      if (!department.trim()) {
        toast.error('Please enter your department name.');
        return false;
      }
    } else if (stepId === 'class_setup') {
      if (!className.trim() || !subject.trim()) {
        toast.error('Please enter class name and subject.');
        return false;
      }
    }
    return true;
  };

  const handleStepComplete = (stepId: string) => {
    if (!validateStep(stepId)) return;

    if (stepId === 'institution' && !organizationName.trim()) {
      setOrganizationName(collegeSearchQuery.trim());
    }

    const nextCompleted = new Set(completedStepIds);
    nextCompleted.add(stepId);
    setCompletedStepIds(nextCompleted);

    const currentIndex = steps.findIndex((s) => s.id === stepId);
    if (currentIndex < steps.length - 1) {
      setActiveStepId(steps[currentIndex + 1].id);
    } else {
      handleFinalSubmit(nextCompleted);
    }
  };

  const handleFinalSubmit = async (finalCompletedSet?: Set<string>) => {
    setIsSubmitting(true);
    const finalOrgName = organizationName.trim() || collegeSearchQuery.trim() || 'VidyaAI Academy';

    const logs = [
      'Saving user profile preferences...',
      'Mapping institution & department structure...',
      userRole === 'STUDENT' ? 'Enrolling into study tracks...' : 'Provisioning class group & student roster...',
      'Finalizing workspace dashboard...'
    ];

    for (let i = 0; i < logs.length; i++) {
      setProgressText(logs[i]);
      await new Promise((resolve) => setTimeout(resolve, 400));
    }

    try {
      const result = await completeOnboarding({
        firstName,
        lastName,
        organizationName: finalOrgName,
        department: department || 'General Studies',
        className: className || (userRole === 'STUDENT' ? 'General Student Track' : 'Class 1A'),
        subject: subject || (userRole === 'STUDENT' ? selectedInterests[0] || 'Core Track' : 'Core Syllabus'),
        students
      });

      if (result.success) {
        if (finalCompletedSet) {
          setCompletedStepIds(finalCompletedSet);
        } else {
          setCompletedStepIds(new Set(steps.map((s) => s.id)));
        }
        setIsFinished(true);
        toast.success('Onboarding complete!');
      } else {
        toast.error(result.error || 'Failed to complete onboarding.');
      }
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during onboarding.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishRedirect = () => {
    const route = getDashboardRoute(user?.role || userRole);
    router.push(route);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (dismissed) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="text-muted-foreground text-sm">Onboarding setup dismissed</p>
          <button
            className="mt-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold hover:underline"
            onClick={() => setDismissed(false)}
          >
            Show setup wizard again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4 sm:p-6 md:p-10 font-sans">
      <div className="w-full max-w-2xl">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Sparkles className="size-3.5" />
                {userRole === 'STUDENT'
                  ? 'Student Onboarding'
                  : userRole === 'TEACHER'
                  ? 'Educator Onboarding'
                  : 'Admin Onboarding'}
              </span>
              <h3 className="mt-2 font-bold text-foreground text-2xl sm:text-3xl tracking-tight">
                Set up your workspace
              </h3>
              <p className="mt-1 text-muted-foreground text-sm">
                Complete these steps to get your workspace and team up and running
              </p>
            </div>
          </div>

          {/* Progress Bar & Status Counter */}
          <div className="mt-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {allDone ? (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    All done 🎉
                  </span>
                ) : (
                  <>
                    <span className="font-bold text-foreground">
                      {completedCount}
                    </span>{' '}
                    of {steps.length} completed
                  </>
                )}
              </span>
              <span className="font-semibold text-xs text-muted-foreground">
                {progressPercent}%
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Dynamic State Views */}
        <AnimatePresence mode="wait">
          {isSubmitting ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-border bg-card p-10 text-center shadow-lg"
            >
              <div className="relative mx-auto mb-5 flex size-16 items-center justify-center">
                <Loader2 className="size-12 animate-spin text-emerald-500" />
                <Sparkles className="absolute size-6 text-emerald-400 animate-pulse" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Setting Up Your Workspace</h3>
              <p className="mt-2 text-sm text-muted-foreground">{progressText}</p>
            </motion.div>
          ) : isFinished ? (
            <motion.div
              key="completion"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-border bg-card p-8 text-center shadow-xl"
            >
              <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 shadow-inner">
                <Check className="size-8 stroke-[3]" />
              </div>
              <h3 className="text-2xl font-black text-foreground sm:text-3xl">
                You&apos;re All Set! 🎉
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
                Welcome aboard, <strong className="text-foreground">{firstName} {lastName}</strong>! Your workspace at{' '}
                <strong className="text-foreground">{organizationName || collegeSearchQuery || 'VidyaAI Academy'}</strong> has been initialized.
              </p>

              <div className="my-6 rounded-xl border border-border bg-muted/40 p-4 text-left">
                <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Workspace Summary
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Role:</span>{' '}
                    <span className="font-semibold text-foreground">{userRole}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Institution:</span>{' '}
                    <span className="font-semibold text-foreground">
                      {organizationName || collegeSearchQuery || 'VidyaAI Academy'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Department:</span>{' '}
                    <span className="font-semibold text-foreground">{department || 'General'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Primary Group:</span>{' '}
                    <span className="font-semibold text-foreground">
                      {className || (userRole === 'STUDENT' ? selectedInterests[0] || 'Core Track' : 'Class 1A')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleFinishRedirect}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-3.5 font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:bg-emerald-600 active:scale-[0.98]"
              >
                Go to Workspace Dashboard
                <ArrowRight className="size-4" />
              </button>
            </motion.div>
          ) : (
            /* Interactive Step Cards List */
            <div className="space-y-3">
              {steps.map((stepItem, index) => {
                const isCompleted = completedStepIds.has(stepItem.id);
                const isActive = activeStepId === stepItem.id;
                const StepIcon = stepItem.icon;

                return (
                  <div
                    key={stepItem.id}
                    className={cn(
                      'rounded-xl border p-4 transition-all duration-200',
                      isActive && 'border-emerald-500/40 bg-muted/40 shadow-sm ring-1 ring-emerald-500/20',
                      !isActive && 'border-border bg-card hover:border-border/80'
                    )}
                  >
                    {/* Header Row */}
                    <div
                      className="flex cursor-pointer gap-3"
                      onClick={() => setActiveStepId(isActive ? '' : stepItem.id)}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isCompleted ? (
                          <div className="flex size-7 items-center justify-center">
                            <CheckCircle2 className="size-7 text-emerald-500" />
                          </div>
                        ) : (
                          <div
                            className={cn(
                              'flex size-7 items-center justify-center rounded-full font-bold text-xs transition-colors',
                              isActive
                                ? 'bg-emerald-500 text-white shadow-sm'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {index + 1}
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                'font-medium leading-6 text-base',
                                isCompleted && 'text-muted-foreground/50 line-through',
                                isActive && 'font-bold text-foreground',
                                !isActive && !isCompleted && 'text-foreground'
                              )}
                            >
                              {stepItem.title}
                            </p>
                            <p
                              className={cn(
                                'mt-0.5 text-xs leading-5',
                                isActive ? 'text-muted-foreground' : 'text-muted-foreground/70'
                              )}
                            >
                              {stepItem.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <StepIcon
                              className={cn(
                                'size-5 shrink-0 transition-colors',
                                isCompleted
                                  ? 'text-emerald-500/60'
                                  : isActive
                                  ? 'text-emerald-500'
                                  : 'text-muted-foreground/40'
                              )}
                            />
                            <ChevronRight
                              className={cn(
                                'size-4 text-muted-foreground/60 transition-transform duration-200',
                                isActive && 'rotate-90 text-emerald-500'
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step Form Body (when active) */}
                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="mt-4 border-t border-border/50 pt-4 pl-10"
                        >
                          {/* STEP 1: PROFILE */}
                          {stepItem.id === 'profile' && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                  <label className="text-xs font-semibold text-foreground">First Name *</label>
                                  <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    placeholder="Alex"
                                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-foreground">Last Name *</label>
                                  <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    placeholder="Johnson"
                                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                  />
                                </div>
                              </div>

                              {userRole === 'STUDENT' ? (
                                <div>
                                  <label className="text-xs font-semibold text-foreground">
                                    Student ID / Roll Number (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={studentId}
                                    onChange={(e) => setStudentId(e.target.value)}
                                    placeholder="e.g. 2026-CS-042"
                                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                  />
                                </div>
                              ) : (
                                <div>
                                  <label className="text-xs font-semibold text-foreground">
                                    Academic Designation / Title
                                  </label>
                                  <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Assistant Professor, Senior Faculty"
                                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                  />
                                </div>
                              )}
                            </div>
                          )}

                          {/* STEP 2: INSTITUTION SEARCH & CREATION */}
                          {stepItem.id === 'institution' && (
                            <div className="space-y-3">
                              <div>
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-semibold text-foreground">
                                    College / University Name *
                                  </label>
                                  {organizationName && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                      <Check className="size-3" /> Selected: {organizationName}
                                    </span>
                                  )}
                                </div>

                                <div className="relative mt-1">
                                  <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                                  <input
                                    type="text"
                                    value={collegeSearchQuery}
                                    onChange={(e) => {
                                      setCollegeSearchQuery(e.target.value);
                                      setOrganizationName(e.target.value);
                                      setIsNewOrgSelected(false);
                                    }}
                                    placeholder="Search college (e.g. Maha, Stanford, IIT...)"
                                    className="w-full rounded-lg border border-input bg-background py-2 pr-8 pl-9 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                  />
                                  {collegeSearchQuery && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCollegeSearchQuery('');
                                        setOrganizationName('');
                                        setIsNewOrgSelected(false);
                                      }}
                                      className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                                    >
                                      <X className="size-4" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Search & Suggestions Panel */}
                              <div className="space-y-2 rounded-xl border border-border/80 bg-muted/30 p-3">
                                {collegeSearchQuery.trim().length > 0 && (
                                  <div
                                    onClick={() => {
                                      setOrganizationName(collegeSearchQuery.trim());
                                      setIsNewOrgSelected(true);
                                      toast.success(`Selected "${collegeSearchQuery.trim()}" as institution`);
                                    }}
                                    className={cn(
                                      'flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-all',
                                      isNewOrgSelected || organizationName === collegeSearchQuery.trim()
                                        ? 'border-emerald-500 bg-emerald-500/15 font-semibold text-emerald-600 dark:text-emerald-400'
                                        : 'border-emerald-500/30 bg-emerald-500/10 hover:border-emerald-500/50 hover:bg-emerald-500/20'
                                    )}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500 font-bold text-white text-xs">
                                        +
                                      </div>
                                      <div>
                                        <div className="text-xs font-bold text-foreground">
                                          Register &quot;<span className="text-emerald-600 dark:text-emerald-400">{collegeSearchQuery.trim()}</span>&quot; as a new college
                                        </div>
                                        <div className="text-[11px] text-muted-foreground">
                                          Add campus to VidyaAI workspace
                                        </div>
                                      </div>
                                    </div>
                                    <span className="rounded bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                      + NEW
                                    </span>
                                  </div>
                                )}

                                <div>
                                  <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Available Institutions ({filteredColleges.length})
                                  </div>
                                  <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1 sm:grid-cols-2">
                                    {filteredColleges.map((college) => {
                                      const isSelected = organizationName === college;
                                      return (
                                        <button
                                          key={college}
                                          type="button"
                                          onClick={() => {
                                            setOrganizationName(college);
                                            setCollegeSearchQuery(college);
                                            setIsNewOrgSelected(false);
                                            toast.success(`Selected ${college}`);
                                          }}
                                          className={cn(
                                            'flex items-center justify-between rounded-lg p-2 text-left text-xs transition-all border',
                                            isSelected
                                              ? 'border-emerald-500 bg-emerald-500/15 font-bold text-emerald-600 dark:text-emerald-400'
                                              : 'border-border/40 bg-card hover:border-emerald-500/40 hover:bg-muted text-foreground'
                                          )}
                                        >
                                          <div className="flex items-center gap-2 truncate">
                                            <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                                            <span className="truncate">{college}</span>
                                          </div>
                                          {isSelected && <Check className="size-3.5 text-emerald-500 shrink-0" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* STEP 3: ACADEMIC DEPARTMENT */}
                          {stepItem.id === 'academic' && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                  <label className="text-xs font-semibold text-foreground">Department Name *</label>
                                  <input
                                    type="text"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    placeholder="e.g. Computer Science"
                                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                  />
                                </div>

                                {userRole === 'STUDENT' && (
                                  <div>
                                    <label className="text-xs font-semibold text-foreground">Current Year / Grade</label>
                                    <select
                                      value={academicYear}
                                      onChange={(e) => setAcademicYear(e.target.value)}
                                      className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    >
                                      <option value="1st Year">1st Year (Freshman)</option>
                                      <option value="2nd Year">2nd Year (Sophomore)</option>
                                      <option value="3rd Year">3rd Year (Junior)</option>
                                      <option value="4th Year">4th Year (Senior)</option>
                                      <option value="Postgraduate">Postgraduate / Masters</option>
                                    </select>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* STEP 4: INTERESTS (STUDENT) */}
                          {stepItem.id === 'interests' && (
                            <div className="space-y-2.5">
                              <label className="text-xs font-semibold text-foreground">
                                Select subject areas for AI assistance:
                              </label>
                              <div className="flex flex-wrap gap-2">
                                {POPULAR_INTERESTS.map((tag) => {
                                  const selected = selectedInterests.includes(tag);
                                  return (
                                    <button
                                      key={tag}
                                      type="button"
                                      onClick={() => toggleInterest(tag)}
                                      className={cn(
                                        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all border',
                                        selected
                                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-xs'
                                          : 'bg-muted/60 border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                                      )}
                                    >
                                      {selected && <Check className="size-3.5" />}
                                      {tag}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* STEP 5: CLASS JOIN CODE (STUDENT) */}
                          {stepItem.id === 'class_code' && (
                            <div className="space-y-2">
                              <label className="text-xs font-semibold text-foreground">
                                Class Invitation Code (Optional)
                              </label>
                              <input
                                type="text"
                                value={classCode}
                                onChange={(e) => setClassCode(e.target.value)}
                                placeholder="e.g. CS-101-JOIN"
                                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                              />
                              <p className="text-xs text-muted-foreground">
                                Link to your teacher&apos;s class room or explore public study groups.
                              </p>
                            </div>
                          )}

                          {/* TEACHER CLASS SETUP */}
                          {stepItem.id === 'class_setup' && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div>
                                  <label className="text-xs font-semibold text-foreground">Class / Section Name *</label>
                                  <input
                                    type="text"
                                    value={className}
                                    onChange={(e) => setClassName(e.target.value)}
                                    placeholder="e.g. B.Tech CSE 2A"
                                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-semibold text-foreground">Subject *</label>
                                  <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="e.g. Data Structures & Algorithms"
                                    className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* ROSTER STEP */}
                          {stepItem.id === 'roster' && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <label className="text-xs font-semibold text-foreground">Add Student Roster</label>
                                <button
                                  type="button"
                                  onClick={addSampleRoster}
                                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                                >
                                  + Insert Sample Roster
                                </button>
                              </div>

                              <div className="rounded-xl border border-border bg-background p-3">
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                  <input
                                    type="text"
                                    placeholder="Student Name"
                                    value={newStudentName}
                                    onChange={(e) => setNewStudentName(e.target.value)}
                                    className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Roll Number"
                                    value={newStudentRoll}
                                    onChange={(e) => setNewStudentRoll(e.target.value)}
                                    className="rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                  <div className="flex gap-1.5">
                                    <input
                                      type="email"
                                      placeholder="Email"
                                      value={newStudentEmail}
                                      onChange={(e) => setNewStudentEmail(e.target.value)}
                                      className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                    />
                                    <button
                                      type="button"
                                      onClick={addStudent}
                                      className="inline-flex shrink-0 items-center justify-center rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600"
                                    >
                                      <Plus className="size-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Student Items List */}
                              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                                {students.map((st, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 text-xs"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div className="flex size-6 items-center justify-center rounded-full bg-emerald-500/15 font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                                        {st.name.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <span className="font-semibold text-foreground">{st.name}</span>
                                        <span className="ml-2 text-muted-foreground">({st.rollNo})</span>
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeStudent(idx)}
                                      className="text-muted-foreground hover:text-red-500"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>
                                ))}
                                {students.length === 0 && (
                                  <div className="py-3 text-center text-xs text-muted-foreground">
                                    No students added yet. You can complete setup and add roster later.
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Action Button */}
                          <div className="mt-4 flex items-center justify-between pt-1">
                            {index > 0 ? (
                              <button
                                type="button"
                                onClick={() => setActiveStepId(steps[index - 1].id)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground"
                              >
                                <ArrowLeft className="size-3.5" /> Back
                              </button>
                            ) : (
                              <div />
                            )}

                            <button
                              type="button"
                              onClick={() => handleStepComplete(stepItem.id)}
                              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-600 active:scale-[0.98]"
                            >
                              <StepIcon className="size-4" />
                              {stepItem.actionLabel}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Footer Links */}
        {!isSubmitting && !isFinished && (
          <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4 text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => handleFinalSubmit()}
              className="font-medium hover:text-foreground hover:underline"
            >
              Skip setup & proceed to dashboard →
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="hover:text-foreground hover:underline"
            >
              Dismiss checklist
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
