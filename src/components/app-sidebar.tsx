"use client";

import {
  Coffee,
  Briefcase,
  Plane,
  Laptop,
  Heart,
  GraduationCap,
  Clock,
  Trash2,
  MessageSquareText,
  History,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarSeparator,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { topicCategories } from "@/lib/topics";
import type { Session } from "@/types";

const iconMap: Record<string, React.ElementType> = {
  coffee: Coffee,
  briefcase: Briefcase,
  plane: Plane,
  laptop: Laptop,
  heart: Heart,
  "graduation-cap": GraduationCap,
};

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
}

interface AppSidebarProps {
  selectedTopic: string;
  onSelectTopic: (topic: string) => void;
  sessions: Session[];
  onSelectSession: (session: Session) => void;
  onClearHistory: () => void;
}

export function AppSidebar({
  selectedTopic,
  onSelectTopic,
  sessions,
  onSelectSession,
  onClearHistory,
}: AppSidebarProps) {
  return (
    <Sidebar variant="inset" className="border-r-0">
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/25">
            <MessageSquareText className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-foreground">
              SpeakFlow
            </h1>
            <p className="text-[11px] font-medium text-muted-foreground">
              English Practice Tool
            </p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <ScrollArea className="flex-1">
          {/* Topics Section */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              Practice Topics
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {topicCategories.map((category) => {
                  const Icon = iconMap[category.icon] || Coffee;
                  return (
                    <SidebarMenuItem key={category.name}>
                      <SidebarMenuButton className="font-medium">
                        <Icon className="text-muted-foreground" />
                        <span>{category.name}</span>
                      </SidebarMenuButton>
                      <SidebarMenuSub>
                        {category.topics.map((topic) => (
                          <SidebarMenuSubItem key={topic}>
                            <SidebarMenuSubButton
                              isActive={selectedTopic === topic}
                              onClick={() => onSelectTopic(topic)}
                              className="cursor-pointer"
                            >
                              <span>{topic}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarSeparator />

          {/* History Section */}
          <SidebarGroup>
            <SidebarGroupLabel className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
              <History className="mr-1.5 size-3.5" />
              Recent Sessions
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {sessions.length === 0 ? (
                  <div className="px-3 py-6 text-center">
                    <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-muted/50">
                      <Clock className="size-4 text-muted-foreground/50" />
                    </div>
                    <p className="text-xs text-muted-foreground/60">
                      No sessions yet.
                      <br />
                      Start practicing!
                    </p>
                  </div>
                ) : (
                  sessions.slice(0, 20).map((session) => (
                    <SidebarMenuItem key={session.id}>
                      <SidebarMenuButton
                        onClick={() => onSelectSession(session)}
                        className="h-auto min-h-10 cursor-pointer py-2"
                      >
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="truncate text-xs font-medium">
                            {session.topic}
                          </span>
                          <span className="truncate text-[11px] text-muted-foreground/70">
                            {session.text.slice(0, 50)}
                            {session.text.length > 50 ? "…" : ""}
                          </span>
                          <span className="text-[10px] text-muted-foreground/50">
                            {formatRelativeTime(session.timestamp)}
                          </span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </ScrollArea>
      </SidebarContent>

      {sessions.length > 0 && (
        <SidebarFooter className="p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearHistory}
            className="w-full justify-start text-xs text-muted-foreground/60 hover:text-destructive"
          >
            <Trash2 className="mr-1.5" />
            Clear History
          </Button>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
