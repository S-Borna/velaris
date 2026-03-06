// Copyright (c) Said Borna. All rights reserved.
"use client";

import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

/** Standard easing curve — smooth deceleration. */
const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Default viewport trigger threshold. */
const VIEWPORT_THRESHOLD = 0.2;

/** Reusable animation variants per CLAUDE.md Animation Directives. */
export const fadeInUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: EASE_OUT },
    },
};

export const fadeInUpCard: Variants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.6, ease: EASE_OUT },
    },
};

export const slideInLeft: Variants = {
    hidden: { opacity: 0, x: -60 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.8, ease: EASE_OUT },
    },
};

export const slideInRight: Variants = {
    hidden: { opacity: 0, x: 60 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.8, ease: EASE_OUT },
    },
};

export const staggerContainer: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.15,
        },
    },
};

export const staggerContainerFast: Variants = {
    hidden: {},
    visible: {
        transition: {
            staggerChildren: 0.1,
        },
    },
};

interface AnimatedSectionProps {
    children: ReactNode;
    className?: string;
    /** Custom variants — defaults to fadeInUp. */
    variants?: Variants;
    /** Viewport trigger amount (0-1). */
    threshold?: number;
}

/**
 * Wrapper that animates children when they enter the viewport.
 * Uses Framer Motion's whileInView with IntersectionObserver internally.
 * Respects prefers-reduced-motion via Framer Motion's built-in support.
 */
export function AnimatedSection({
    children,
    className,
    variants = fadeInUp,
    threshold = VIEWPORT_THRESHOLD,
}: AnimatedSectionProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: threshold }}
            variants={variants}
            className={className}
        >
            {children}
        </motion.div>
    );
}

interface AnimatedGroupProps {
    children: ReactNode;
    className?: string;
    /** Stagger delay variant — defaults to staggerContainer (150ms). */
    stagger?: Variants;
    /** Viewport trigger amount (0-1). */
    threshold?: number;
}

/**
 * Container for staggered child animations.
 * Each direct child should use motion.div with fadeInUpCard or similar variants.
 */
export function AnimatedGroup({
    children,
    className,
    stagger = staggerContainer,
    threshold = VIEWPORT_THRESHOLD,
}: AnimatedGroupProps) {
    return (
        <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: threshold }}
            variants={stagger}
            className={className}
        >
            {children}
        </motion.div>
    );
}
