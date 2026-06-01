"use client";

import { Mic, Square, Loader2, Copy, Check, Sparkles } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { RecordingStatus } from "@/types";

interface RecordingPanelProps {
  selectedTopic: string;
  status: RecordingStatus;
  transcribedText: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  error: string | null;
}

export function RecordingPanel({
  selectedTopic,
  status,
  transcribedText,
  onStartRecording,
  onStopRecording,
  error,
}: RecordingPanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!transcribedText) return;
    await navigator.clipboard.writeText(transcribedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      {/* Topic & Status Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Practice Session
          </h2>
          <p className="text-sm text-muted-foreground">
            Topic:{" "}
            <span className="font-medium text-foreground">{selectedTopic}</span>
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Recording Controls */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-card to-muted/30 shadow-xl shadow-black/5">
        {/* Animated gradient border effect when recording */}
        {status === "recording" && (
          <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20 animate-pulse" />
        )}

        <CardHeader className="relative pb-3">
          <CardTitle className="text-lg font-semibold">
            Voice Recorder
          </CardTitle>
          <CardDescription>
            {status === "idle" &&
              "Click the microphone to start recording your practice."}
            {status === "recording" &&
              "Speak clearly… Click stop when you're done."}
            {status === "processing" &&
              "Processing your audio through Whisper AI…"}
          </CardDescription>
        </CardHeader>

        <CardContent className="relative flex flex-col items-center gap-6 pb-8">
          {/* Animated Mic Visualizer */}
          <div className="relative flex items-center justify-center">
            {status === "recording" && (
              <>
                <div className="absolute size-32 animate-ping rounded-full bg-red-500/10" />
                <div
                  className="absolute size-24 animate-pulse rounded-full bg-red-500/15"
                  style={{ animationDelay: "150ms" }}
                />
              </>
            )}
            <div
              className={`relative flex size-20 items-center justify-center rounded-full transition-all duration-500 ${
                status === "recording"
                  ? "bg-gradient-to-br from-red-500 to-rose-600 shadow-2xl shadow-red-500/40 scale-110"
                  : status === "processing"
                    ? "bg-gradient-to-br from-amber-500 to-orange-600 shadow-2xl shadow-amber-500/30"
                    : "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/30"
              }`}
            >
              {status === "processing" ? (
                <Loader2 className="size-8 animate-spin text-white" />
              ) : (
                <Mic className="size-8 text-white" />
              )}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-4">
            <Button
              size="lg"
              onClick={onStartRecording}
              disabled={status !== "idle"}
              className="gap-2 bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-violet-700 hover:shadow-xl hover:shadow-indigo-500/30 transition-all duration-300 disabled:opacity-50"
            >
              <Mic data-icon="inline-start" />
              Start Recording
            </Button>
            <Button
              size="lg"
              variant="destructive"
              onClick={onStopRecording}
              disabled={status !== "recording"}
              className="gap-2 shadow-lg shadow-red-500/15 transition-all duration-300 disabled:opacity-50"
            >
              <Square data-icon="inline-start" />
              Stop Recording
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="w-full rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcription Result */}
      {transcribedText && (
        <Card className="border-0 bg-gradient-to-br from-card to-muted/20 shadow-xl shadow-black/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-teal-600">
                <Sparkles className="size-4 text-white" />
              </div>
              <CardTitle className="text-lg font-semibold">
                Transcription Result
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              {copied ? (
                <>
                  <Check className="size-3.5 text-emerald-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="size-3.5" />
                  Copy
                </>
              )}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl bg-muted/40 p-5">
              <p className="text-base leading-relaxed text-foreground/90">
                {transcribedText}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!transcribedText && status === "idle" && (
        <Card className="border border-dashed border-muted-foreground/20 bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted/50">
              <Sparkles className="size-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground/60">
              Your transcription will appear here
            </p>
            <p className="mt-1 text-xs text-muted-foreground/40">
              Record your voice to get started
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: RecordingStatus }) {
  if (status === "recording") {
    return (
      <Badge
        variant="destructive"
        className="gap-1.5 px-3 py-1 text-xs font-medium animate-pulse"
      >
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-red-300 opacity-75" />
          <span className="relative inline-flex size-2 rounded-full bg-red-100" />
        </span>
        Recording…
      </Badge>
    );
  }

  if (status === "processing") {
    return (
      <Badge
        variant="secondary"
        className="gap-1.5 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-400"
      >
        <Loader2 className="size-3 animate-spin" />
        Processing Audio…
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      className="gap-1.5 px-3 py-1 text-xs font-medium"
    >
      <span className="size-2 rounded-full bg-emerald-500" />
      Ready
    </Badge>
  );
}
