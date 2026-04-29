import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { SidebarSectionProps } from "@/lib/types/ui";



export default function SidebarSection({ icon, title, children, collapsed, onToggle }: SidebarSectionProps) {
    return (
        <section>
            <button
                onClick={onToggle}
                className="sticky top-0 z-10 -mx-2 mb-1.5 flex w-[calc(100%+16px)] items-center gap-2 border-y border-transparent bg-gradient-to-b from-sidebar to-sidebar/80 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground backdrop-blur-sm hover:text-foreground transition-premium"
                aria-expanded={!collapsed}
            >
                <span className="mr-0.5 text-muted-foreground/70" aria-hidden>
                    {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
                <span className="flex items-center gap-2">
                    <span className="text-primary/70" aria-hidden>
                        {icon}
                    </span>
                    {title}
                </span>
            </button>
            <AnimatePresence initial={false}>
                {!collapsed && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        className="space-y-1"
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
}
