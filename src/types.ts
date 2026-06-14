export interface ExamResult {
    id: string;
    examId: string;
    examTitle: string;
    studentId: string;
    studentName: string;
    studentPhoto?: string;
    stage: string;
    year: string;
    date: string;
    time: string;
    score: number;
    percentage: number;
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    durationMinutes: number;
    grade: string;
    wrongQuestions: {
        question: string;
        userAnswer: string;
        correctAnswer: string;
    }[];
    examType?: 'NORMAL' | 'MIXED';
}

export interface Rating {
    id: string;
    studentId: string;
    studentName: string;
    studentAvatar?: string;
    studentLocation?: string;
    stars: number;
    feedbackWord: string;
    date: string;
    time: string;
}

export interface Student {
    id: string;
    username: string;
    gender: string;
    level: string;
    year: string;
    semester: string;
    specialization?: string;
    password: string;
    regDate: string;
    regTime: string;
    location: string;
    ip: string;
    isBlocked: boolean;
    isDeleted?: boolean;
    coins: number;
    messageQuota?: number;
    quotaResetTime?: number;
    completedExams: string[]; // IDs of completed exams
    achievements: ExamResult[];
    email?: string;
    universityEmail?: string;
    universityId?: string;
    englishName?: string;
    department?: string;
    isEmailVerified?: boolean;
    points: number;
    activity: string;
    pendingPurchaseBookletId?: string | null;
    pendingPurchaseCourseId?: string | null;
    pendingPurchaseLessonId?: string | null;
    purchasedBooklets?: string[];
    purchasedCourses?: string[];
    purchasedLessons?: string[];
    unlockedCoursesWithCoins?: string[];
    unlockedLessonsWithCoins?: string[];
    unlockedBookletsWithCoins?: string[];
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    deviceName?: string;
    loginCount?: number;
    lastLogin?: string;
    phoneNumber?: string;
    violationCount?: number;
    surveyQuota?: number;
    surveyResetTime?: number;
    extraQuotaPoints?: number;
    usedExtraPoints?: number;
    isChatFree?: boolean;
    nicknames?: { [studentId: string]: string };

    securitySettings?: {
        pin?: string;
        isPinEnabled: boolean;
        isBiometricEnabled: boolean;
        biometricCredentialId?: string;
        lockoutUntil?: string | null;
        failedPinAttempts: number;
    };

    examAttempts?: { [examId: string]: number };
    examLastAttemptTime?: { [examId: string]: number };
    examUnlockTimes?: { [examId: string]: number };
    avatarUrl?: string;
    profilePictureUrl?: string;
    role?: 'student' | 'admin';
    blockedUsers?: string[];
    hiddenReadReceipts?: boolean;
    packagePoints?: number;
    plan?: string;

    // Referral System
    referral_code?: string;
    referred_by?: string;
    referred_by_id?: string;
    referral_count?: number;
    referral_earnings?: number;
    referral_status?: 'pending' | 'completed' | 'rejected';

    // Premium System
    isPremiumUnlocked?: boolean;
    lastPremiumDeduction?: string; // ISO Date string (YYYY-MM-DD)
    isVerified?: boolean;

    // Golden Membership
    goldenMembershipActive?: boolean;
    goldenMembershipExpiry?: string;       // ISO date string YYYY-MM-DD
    goldenMembershipPackageId?: string;
    goldenMembershipPendingPackageId?: string; // Pending admin approval
}

export interface Parent {
    id: string;
    username: string;
    password: string;
    location: string;
    phoneNumber: string;
    studentId: string;
    regDate: string;
    regTime: string;
    lastLogin?: string;
    ip?: string;
    national_id?: string;
    governorate?: string;
    verification_status?: string;
    attempts?: number;
    avatarUrl?: string;
    profilePictureUrl?: string;
}

export interface PrivateMessage {
    id: string;
    senderId: string;
    receiverId: string;
    text: string;
    timestamp: number;
    type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'call' | 'location' | 'system' | 'contact';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    isRead?: boolean;
    isDelivered?: boolean;
    isStarred?: boolean;
    isPinned?: boolean;
    pinnedAt?: number;
    isDeletedForMe?: boolean;
    isDeletedForEveryone?: boolean;
    isDeletedForSender?: boolean;
    isDeletedForReceiver?: boolean;
    is_edited?: boolean;
    reactions?: { [userId: string]: string }; // userId -> emoji
    replyTo?: string; // id of message being replied to
    replyToId?: string;
    replyToText?: string;
    replyToSender?: string;
    isCall?: boolean;
    isVideoCall?: boolean;
    callStatus?: 'missed' | 'completed' | 'declined' | 'started' | 'rejected';
    isHiddenFromLogForSender?: boolean | string[];
    isHiddenFromLogForReceiver?: boolean | string[];
    callDuration?: number;
    contactAvatar?: string;
    contactName?: string;
    contactId?: string;
    readBy?: { userId: string; timestamp: number }[];
    isForwarded?: boolean;
}

export interface GroupRoom {
    id: string;
    name: string;
    avatarUrl?: string;
    description?: string;
    createdBy: string;
    createdAt: number;
    members: string[]; // studentIds
    admins: string[]; // studentIds
    isLocked?: boolean;
    pinnedMessageIds?: string[];
    pendingRequests?: { userId: string; invitedBy: string; timestamp: number }[];
    lastMessage?: {
        text: string;
        senderName: string;
        timestamp: number;
    };
}

export interface Subject {
    id: string;
    year: string;
    stage: string; // الشعبة
    specialization: string; // التخصص
    name: string;
}

export interface Content {
    id: string;
    stage: string;
    year: string;
    semester: string;
    unit?: string;
    subject?: string;
    specialization?: string;
    title: string;
    text: string;
    files: string[]; // URLs or file names
    pdfUrl?: string; // External PDF link
    linkUrl?: string; // Additional link
    questions?: Question[]; // For sheets
    date: string;
    isVisible: boolean;
    isFree?: boolean; // Toggle for free access
    thumbnail?: string;
    showPremiumLock?: boolean;
    requiredCoins?: number;
    requiredPoints?: number;
    videoUrl?: string; // YouTube/Vimeo/etc.
    videoFile?: string; // name|||base64
    allowDownload?: boolean; // Allow direct download for files
}

export interface Question {
    id: string;
    text: string;
    type: 'MCQ' | 'TF' | 'essay';
    options?: string[]; // For MCQ
    correctAnswer: string | number; // For MCQ/TF
    essayChoices?: string[]; // Three model answers for essay
}

export interface Exam {
    id: string;
    stage: string;
    year: string;
    semester: string;
    subject?: string;
    specialization?: string;
    title: string;
    type: 'MCQ' | 'TF' | 'essay' | 'MIXED';
    questions: Question[];
    date: string;
    isVisible: boolean;
    thumbnail?: string;
    durationMinutes?: number;
}

export interface GameExam {
    id: string;
    stage: string;
    year: string;
    semester: string;
    title: string;
    type: 'MCQ' | 'TF';
    subject: string;
    questions: Question[];
    date: string;
    isVisible: boolean;
}



export interface SurveyReply {
    id: string;
    studentId: string;
    studentName: string;
    level: string;
    year: string;
    content: string;
    date: string;
    time: string;
}

export interface SurveyPost {
    id: string;
    studentId: string;
    studentName: string;
    level: string;
    year: string;
    content: string;
    date: string;
    time: string;
    avatarUrl?: string;
    replies: SurveyReply[];
    adminReply?: string;
    adminReplyDate?: string;
    adminReplyTime?: string;
    reactions?: { [key: string]: number };
    comments?: any[];
}


export interface Survey {
    id: string;
    studentName: string;
    content: string;
    date: string;
    time: string;
    responder: string;
}



export interface SemesterStatus {
    id: string; // stage-year-semester
    isLocked: boolean;
}



export interface SupportTicket {
    id: string;
    studentId: string;
    studentName: string;
    studentPhoto?: string;
    level: string; // This usually refers to the stage (Middle/High)
    stage?: string; // Adding explicit stage field
    year: string;
    content: string;
    date: string;
    time: string;
    status: 'pending' | 'responded';
    studentEmail?: string;
    studentPhone?: string;
    response?: string;
    responseDate?: string;
}

export interface Certificate {
    id: string;
    studentId: string;
    studentName: string;
    examId: string;
    examTitle: string;
    percentage: number;
    grade: string;
    date: string;
    isNamed?: boolean;
}

export interface Booklet {
    id: string;
    stage: string;
    year: string;
    semester: string;
    unit?: string;
    subject?: string;
    specialization?: string;
    title: string;
    text: string;
    files: string[]; // name|||base64
    date: string;
    isVisible: boolean;
    isFree?: boolean; // Toggle for free access
    price: number; // Price in EGP
    discountPercentage?: number; // Store discount percentage
    linkUrl?: string; // External link for booklet
    allowDownload?: boolean; // Toggle for direct download
    thumbnail?: string; // Thumbnail URL or base64
    showPremiumLock?: boolean;
    requiredCoins?: number;
    requiredPoints?: number;
}

export type PaymentStatus = 'pending_review' | 'approved' | 'rejected';

export interface PaymentOrder {
    id: string;
    studentId: string;
    studentName: string;
    studentLevel: string;
    studentYear: string;
    bookletId?: string;
    bookletTitle?: string;
    price: number;
    date: string;
    time: string;
    status: PaymentStatus;
    itemType: 'booklet' | 'course' | 'lesson' | 'exam' | 'chat' | 'recharge' | 'ads_package';
    adsPackageId?: string;
    rechargePackageId?: string;
    pointsToGained?: number;
    courseId?: string;
    courseTitle?: string;
    lessonId?: string;
    lessonTitle?: string;
    examId?: string;
    examTitle?: string;
    itemId?: string;
    studentEmail?: string;
    studentPhone?: string;
    discountedPrice?: number; // Final price after coupon
    appliedCoupon?: string; // Code of coupon used
    hybridMode?: boolean; // True if bought using points + cash
    usedCoins?: number; // Number of coins used
    requiredCash?: number; // Cash remaining to pay
    transferPhoneNumber?: string; // Phone number used for the transfer
    transactionId?: string; // Unique transaction ID for the receipt
}

export interface Course {
    id: string;
    stage: string;
    year: string;
    semester: string;
    subject?: string;
    specialization?: string;
    title: string;
    description: string;
    price: number;
    category?: string;
    allowDownload?: boolean;
    videoUrl?: string; // YouTube/Vimeo/etc. (single, kept for backward compat)
    videoUrls?: string[]; // Multiple video URLs (ordered playlist)
    videoFile?: string; // name|||base64
    date: string;
    isVisible: boolean;
    isFree?: boolean; // Toggle for free access
    requiredCoins?: number; // Coins required to unlock for free
    requiredPoints?: number; // Points required to unlock for free
    discountPercentage?: number; // Store discount percentage
    thumbnail?: string; // Thumbnail URL or base64
    showPremiumLock?: boolean;
    quizId?: string;
    unit?: string;
    videos?: VideoItem[]; // Enhanced video management
}

export interface VideoItem {
    id: string;
    title: string;
    description?: string;
    url?: string;
    file?: string; // name|||base64
    order: number;
}

export interface Lesson {
    id: string;
    stage: string;
    year: string;
    semester: string;
    subject?: string;
    specialization?: string;
    title: string;
    description: string;
    price: number;
    thumbnail?: string; // base64 or URL
    videos: VideoItem[];
    date: string;
    isVisible: boolean;
    isFree?: boolean;
    requiredCoins?: number;
    requiredPoints?: number;
    discountPercentage?: number;
    category?: string;
    allowDownload?: boolean;
    showPremiumLock?: boolean;
    quizId?: string;
    unit?: string;
}

export interface Coupon {
    id: string;
    code: string;
    discountPercentage: number;
    daysValid: number; // Duration of code validity
    createdAt: string; // ISO date string
    expiryDate: string; // ISO date string (calculated)
    usageCount: number;
    usageLimit: number;
    isActive: boolean;
}

export interface AITool {
    id: string;
    name: string;
    desc: string;
    icon: string;
    url: string;
}

export interface SiteTexts {
    welcomeTitle: string;
    welcomeSubtitle: string;
    homeTitle: string;
    homeSubtitle: string;
    marqueeText: string;
    teacherName: string;
    teacherTitle1: string;
    teacherTitle2: string;
    teacherExperience: string;

    bookingModalTitle: string;
    bookingModalSubtitle: string;
    bookingContactTitle: string;
    bookingContactSubtitle: string;
    paymentMethodText1: string;
    paymentMethodText2: string;
    premiumLockMessage: string;

    loginModalTitle: string;
    loginModalSubtitle: string;
    registerModalTitle: string;
    registerModalSubtitle: string;

    examRetakeModalTitle: string;
    examRetakeModalSubtitle: string;
    examRetakePricingText: string;

    unitsSectionTitle: string;
    unitsSectionSubtitle: string;
    unitsEmptyMessage: string;

    examsSectionTitle: string;
    examsSectionSubtitle: string;
    examsEmptyMessage: string;

    bookletsSectionTitle: string;
    bookletsSectionSubtitle: string;
    bookletsEmptyMessage: string;

    coursesSectionTitle: string;
    coursesSectionSubtitle: string;
    coursesEmptyMessage: string;

    lessonsSectionTitle: string;
    lessonsSectionSubtitle: string;
    lessonsEmptyMessage: string;

    coinsInsufficientMessage: string;
    unlockWithCoinsButtonText: string;
    earnMoreCoinsMessage: string;
    examEarnCoinsMessage: string;
    platformLockedMessage: string;

    // Additional fields for full coverage
    paymentSuccessTitle: string;
    paymentSuccessMessage: string;
    paymentPendingTitle: string;
    paymentPendingMessage: string;
    paymentErrorTitle: string;
    paymentErrorMessage: string;

    loginWelcomeBack: string;
    registerCreateAccount: string;

    coursePricePrefix: string;
    bookletPricePrefix: string;
    buyNowButton: string;
    pendingReviewButton: string;
    unlockedButton: string;

    supportSectionTitle: string;
    supportSectionSubtitle: string;
    supportSendButton: string;

    chatWelcomeMessage: string;
    chatRulesTitle: string;
    chatRulesText: string;

    confirmDeleteTitle: string;
    confirmDeleteButton: string;
    cancelButton: string;
    examRetakeTimerTitle?: string;

    // Authentication Screen Texts
    loginButtonLabel?: string;
    registerButtonLabel?: string;
    noAccountText?: string;
    alreadyHaveAccountText?: string;
    usernameLabel?: string;
    passwordLabel?: string;
    genderLabel?: string;
    stageLabel?: string;
    yearLabel?: string;
    semesterLabel?: string;
    locationLabel?: string;
    captchaSliderText?: string;
    captchaVerifiedText?: string;

    // Platform & Loading Texts
    platformMaintenanceTitle?: string;
    adminLoginButton?: string;
    preparingPlatformText?: string;
    loadingSystemText?: string;
    syncingText?: string;
    blessingText?: string;

    headerGreetingAr?: string;
    headerGreetingEn?: string;
}


export interface MeetingConfig {
    isActive: boolean;
    url: string;
}

export interface Rating {
    id: string;
    studentId: string;
    studentName: string;
    studentAvatar?: string;
    studentLocation?: string;
    stars: number;
    feedbackWord: string;
    date: string;
    time: string;
}

export interface PushNotification {
    id: string;
    title: string;
    body: string;
    targetSection?: string;
    targetYear?: string;
    targetLevel?: string;
    targetSemester?: string;
    targetSpecialization?: string;
    image?: string;
    date: string;
    time: string;
}
