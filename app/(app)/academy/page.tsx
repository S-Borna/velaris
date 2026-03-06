// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useState } from "react";
import {
    GraduationCap,
    Play,
    Clock,
    CheckCircle2,
    ChevronRight,
    BookOpen,
    Trophy,
    Star,
    Zap,
    Target,
    Shield,
    MessageSquare,
    TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/* ─── Constants ───────────────────────────────────────────── */

interface Course {
    id: string;
    title: string;
    description: string;
    lessons: number;
    completedLessons: number;
    duration: string;
    level: "beginner" | "intermediate" | "advanced";
    icon: typeof GraduationCap;
    category: string;
}

const MOCK_COURSES: Course[] = [
    {
        id: "c1",
        title: "Get Your First Reply",
        description: "Learn the fundamentals of LinkedIn outreach — from profile optimization to writing messages that get responses.",
        lessons: 8,
        completedLessons: 8,
        duration: "45 min",
        level: "beginner",
        icon: MessageSquare,
        category: "Getting Started",
    },
    {
        id: "c2",
        title: "Fix Low Reply Rates",
        description: "Diagnose why your outreach isn't working and apply proven strategies to boost engagement.",
        lessons: 6,
        completedLessons: 4,
        duration: "35 min",
        level: "intermediate",
        icon: TrendingUp,
        category: "Optimization",
    },
    {
        id: "c3",
        title: "Scale Without Getting Banned",
        description: "Master LinkedIn's limits, warm up accounts safely, and scale to 50+ daily connections.",
        lessons: 10,
        completedLessons: 2,
        duration: "1h 15min",
        level: "advanced",
        icon: Shield,
        category: "Safety & Scale",
    },
    {
        id: "c4",
        title: "ICP Scoring Mastery",
        description: "Use AI-powered lead scoring to target only the highest-quality prospects in your campaigns.",
        lessons: 5,
        completedLessons: 0,
        duration: "30 min",
        level: "intermediate",
        icon: Target,
        category: "AI Features",
    },
    {
        id: "c5",
        title: "Content That Converts",
        description: "Create LinkedIn posts that generate inbound leads — hooks, formats, and scheduling strategies.",
        lessons: 7,
        completedLessons: 0,
        duration: "50 min",
        level: "beginner",
        icon: BookOpen,
        category: "Content",
    },
    {
        id: "c6",
        title: "Inbound Automation Playbook",
        description: "Set up comment-triggered workflows that turn engagement into qualified leads automatically.",
        lessons: 4,
        completedLessons: 0,
        duration: "25 min",
        level: "intermediate",
        icon: Zap,
        category: "Automations",
    },
];

const LEVEL_STYLES: Record<string, string> = {
    beginner: "border-green-500/30 bg-green-500/15 text-green-300",
    intermediate: "border-blue-500/30 bg-blue-500/15 text-blue-300",
    advanced: "border-purple-500/30 bg-purple-500/15 text-purple-300",
};

const ACHIEVEMENTS = [
    { id: "a1", title: "First Campaign", description: "Launch your first outreach campaign", earned: true, icon: "🚀" },
    { id: "a2", title: "Reply Master", description: "Get 10 positive replies", earned: true, icon: "💬" },
    { id: "a3", title: "Content Creator", description: "Publish 5 AI-generated posts", earned: false, icon: "✍️" },
    { id: "a4", title: "Scale Pro", description: "Connect 5 LinkedIn accounts", earned: false, icon: "📈" },
    { id: "a5", title: "Automation Guru", description: "Create 3 inbound automations", earned: false, icon: "⚡" },
    { id: "a6", title: "ICP Expert", description: "Score 100 leads with AI", earned: false, icon: "🎯" },
];

/* ─── Component ───────────────────────────────────────────── */

/**
 * Academy page — interactive courses, video tutorials, and achievement badges.
 */
export default function AcademyPage() {
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

    const totalLessons = MOCK_COURSES.reduce((sum, c) => sum + c.lessons, 0);
    const completedLessons = MOCK_COURSES.reduce((sum, c) => sum + c.completedLessons, 0);
    const overallProgress = Math.round((completedLessons / totalLessons) * 100);
    const completedCourses = MOCK_COURSES.filter((c) => c.completedLessons === c.lessons).length;

    /* Course detail view */
    if (selectedCourse) {
        const course = selectedCourse;
        const progress = Math.round((course.completedLessons / course.lessons) * 100);
        const Icon = course.icon;

        return (
            <div className="space-y-6">
                {/* Back + Header */}
                <div>
                    <button
                        onClick={() => setSelectedCourse(null)}
                        className="mb-3 flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                        Back to Academy
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-500/15">
                            <Icon className="h-7 w-7 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-[var(--text-primary)]">{course.title}</h1>
                            <div className="mt-1 flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.duration}</span>
                                <span>{course.lessons} lessons</span>
                                <Badge variant="outline" className={`text-[10px] ${LEVEL_STYLES[course.level]}`}>{course.level}</Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress */}
                <div className="rounded-lg border border-white/6 bg-[var(--bg-card)] p-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">Progress</span>
                        <span className="font-medium text-[var(--text-primary)]">{progress}%</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/5">
                        <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                {/* Lessons */}
                <div className="rounded-xl border border-white/6 bg-[var(--bg-card)]">
                    <div className="divide-y divide-white/4">
                        {Array.from({ length: course.lessons }).map((_, i) => {
                            const isCompleted = i < course.completedLessons;
                            const isCurrent = i === course.completedLessons;
                            return (
                                <div
                                    key={`lesson-${course.id}-${i}`}
                                    className={`flex items-center gap-4 px-5 py-4 ${isCurrent ? "bg-purple-500/5" : ""}`}
                                >
                                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isCompleted
                                        ? "bg-green-500/15 text-green-400"
                                        : isCurrent
                                            ? "bg-purple-500/15 text-purple-400"
                                            : "bg-white/5 text-[var(--text-muted)]"
                                    }`}>
                                        {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <span className="text-xs font-medium">{i + 1}</span>}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-sm ${isCompleted ? "text-[var(--text-secondary)]" : "text-[var(--text-primary)]"} ${isCurrent ? "font-medium" : ""}`}>
                                            Lesson {i + 1}: {["Introduction", "Setup & Configuration", "Core Concepts", "Building Your Strategy", "Advanced Techniques", "Optimization", "Scaling Up", "Best Practices", "Case Studies", "Final Review"][i] || `Module ${i + 1}`}
                                        </p>
                                        <p className="text-xs text-[var(--text-muted)]">{isCompleted ? "Completed" : isCurrent ? "Up next" : "Locked"}</p>
                                    </div>
                                    {isCurrent && (
                                        <Button size="sm" className="gap-1 bg-purple-500/20 text-purple-300 hover:bg-purple-500/30">
                                            <Play className="h-3 w-3" />
                                            Start
                                        </Button>
                                    )}
                                    {isCompleted && (
                                        <Button variant="ghost" size="sm" className="text-xs text-[var(--text-muted)]">
                                            Replay
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    /* Main view */
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-[var(--text-primary)]">Academy</h1>
                    <p className="text-sm text-[var(--text-secondary)]">
                        Master LinkedIn outreach with interactive courses and tutorials.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1 border-amber-500/30 bg-amber-500/10 text-amber-300">
                        <Trophy className="h-3 w-3" />
                        {ACHIEVEMENTS.filter((a) => a.earned).length}/{ACHIEVEMENTS.length} Achievements
                    </Badge>
                </div>
            </div>

            {/* Overall Progress */}
            <div className="rounded-xl border border-white/6 bg-[var(--bg-card)] p-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-medium text-[var(--text-primary)]">Your Learning Progress</h3>
                        <p className="mt-1 text-xs text-[var(--text-secondary)]">
                            {completedCourses} of {MOCK_COURSES.length} courses completed · {completedLessons} of {totalLessons} lessons done
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-purple-400">{overallProgress}%</p>
                        <p className="text-xs text-[var(--text-muted)]">overall</p>
                    </div>
                </div>
                <div className="mt-3 h-2.5 rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all" style={{ width: `${overallProgress}%` }} />
                </div>
            </div>

            {/* Course Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {MOCK_COURSES.map((course) => {
                    const progress = Math.round((course.completedLessons / course.lessons) * 100);
                    const isComplete = progress === 100;
                    const Icon = course.icon;

                    return (
                        <button
                            key={course.id}
                            onClick={() => setSelectedCourse(course)}
                            className="group rounded-xl border border-white/6 bg-[var(--bg-card)] p-5 text-left transition hover:border-purple-500/20 hover:bg-[var(--bg-hover)]"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                                    <Icon className="h-5 w-5 text-purple-400" />
                                </div>
                                <Badge variant="outline" className={`text-[10px] ${LEVEL_STYLES[course.level]}`}>
                                    {course.level}
                                </Badge>
                            </div>

                            <h3 className="mt-3 text-sm font-semibold text-[var(--text-primary)] group-hover:text-purple-300 transition-colors">
                                {course.title}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">
                                {course.description}
                            </p>

                            <div className="mt-4 flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                                <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {course.lessons} lessons</span>
                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {course.duration}</span>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-3">
                                <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-[var(--text-muted)]">{course.completedLessons}/{course.lessons} lessons</span>
                                    <span className={isComplete ? "text-green-400" : "text-[var(--text-secondary)]"}>{progress}%</span>
                                </div>
                                <div className="mt-1 h-1.5 rounded-full bg-white/5">
                                    <div
                                        className={`h-full rounded-full transition-all ${isComplete ? "bg-green-500" : "bg-purple-500"}`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>

                            {isComplete && (
                                <div className="mt-3 flex items-center gap-1 text-[10px] text-green-400">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Completed
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Achievements */}
            <div>
                <h2 className="mb-4 text-sm font-semibold text-[var(--text-primary)]">Achievements</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                    {ACHIEVEMENTS.map((achievement) => (
                        <div
                            key={achievement.id}
                            className={`rounded-lg border p-4 text-center transition ${achievement.earned
                                ? "border-amber-500/20 bg-amber-500/5"
                                : "border-white/6 bg-[var(--bg-card)] opacity-50"
                            }`}
                        >
                            <div className="text-2xl">{achievement.icon}</div>
                            <p className="mt-2 text-xs font-medium text-[var(--text-primary)]">{achievement.title}</p>
                            <p className="mt-0.5 text-[10px] text-[var(--text-muted)]">{achievement.description}</p>
                            {achievement.earned && (
                                <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-amber-400">
                                    <Star className="h-2.5 w-2.5 fill-amber-400" />
                                    Earned
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Contextual tips */}
            <div className="rounded-lg border border-white/6 bg-white/[0.02] p-4 text-center">
                <p className="text-xs text-[var(--text-muted)]">
                    <strong className="text-[var(--text-secondary)]">Pro tip:</strong> Complete all courses to unlock the &quot;OutreachPilot Master&quot; achievement badge on your profile.
                </p>
            </div>
        </div>
    );
}
