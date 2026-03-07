// Copyright (c) Said Borna. All rights reserved.
"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectOption {
    label: string;
    value: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
    triggerClassName?: string;
    "aria-label"?: string;
}

const ANIMATION_DURATION_MS = 180;

/**
 * Premium custom dropdown select with smooth animations.
 * Replaces native <select> for a consistent dark-themed UI.
 */
export function CustomSelect({
    value,
    onChange,
    options,
    placeholder = "Select…",
    className,
    triggerClassName,
    "aria-label": ariaLabel,
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selected = options.find((opt) => opt.value === value);

    /**
     * Close the dropdown with a smooth exit animation.
     */
    function closeDropdown(): void {
        setIsClosing(true);
        setTimeout(() => {
            setIsOpen(false);
            setIsClosing(false);
        }, ANIMATION_DURATION_MS);
    }

    /**
     * Handle selecting an option.
     */
    function handleSelect(optionValue: string): void {
        onChange(optionValue);
        closeDropdown();
    }

    /** Close on click outside */
    useEffect(() => {
        function onClickOutside(event: MouseEvent): void {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                if (isOpen && !isClosing) {
                    closeDropdown();
                }
            }
        }

        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [isOpen, isClosing]);

    /** Close on Escape */
    useEffect(() => {
        function onKeyDown(event: KeyboardEvent): void {
            if (event.key === "Escape" && isOpen && !isClosing) {
                closeDropdown();
            }
        }

        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [isOpen, isClosing]);

    return (
        <div ref={containerRef} className={cn("relative", className)}>
            <button
                type="button"
                onClick={() => {
                    if (isOpen) {
                        closeDropdown();
                    } else {
                        setIsOpen(true);
                    }
                }}
                aria-label={ariaLabel}
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-[var(--bg-input)] px-3 py-2.5 text-sm text-[var(--text-primary)] transition-all duration-200",
                    "hover:border-white/20",
                    isOpen
                        ? "border-purple-500/50 ring-1 ring-purple-500/20 shadow-lg shadow-purple-500/5"
                        : "focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20",
                    triggerClassName,
                )}
            >
                <span className={cn(!selected && "text-[var(--text-muted)]")}>
                    {selected?.label ?? placeholder}
                </span>
                <ChevronDown
                    className={cn(
                        "h-4 w-4 shrink-0 text-[var(--text-muted)] transition-transform duration-200",
                        isOpen && "rotate-180 text-purple-400",
                    )}
                />
            </button>

            {isOpen && (
                <div
                    role="listbox"
                    className={cn(
                        "absolute left-0 right-0 z-50 mt-1.5 overflow-hidden rounded-xl border border-white/10 bg-[var(--bg-card)] shadow-2xl shadow-black/40 backdrop-blur-xl",
                        isClosing
                            ? "animate-dropdown-exit"
                            : "animate-dropdown-enter",
                    )}
                >
                    <div className="p-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                role="option"
                                aria-selected={option.value === value}
                                onClick={() => handleSelect(option.value)}
                                className={cn(
                                    "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors duration-100",
                                    option.value === value
                                        ? "bg-purple-500/10 text-purple-300"
                                        : "text-[var(--text-secondary)] hover:bg-white/[0.06] hover:text-[var(--text-primary)]",
                                )}
                            >
                                <span>{option.label}</span>
                                {option.value === value && (
                                    <Check className="h-3.5 w-3.5 text-purple-400" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
