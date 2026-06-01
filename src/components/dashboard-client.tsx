"use client";

import { useState, useEffect, useCallback } from "react";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/app-sidebar";
import { RecordingPanel } from "@/components/recording-panel";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
import { useHistory } from "@/hooks/use-history";
import type { RecordingStatus, Session } from "@/types";

export function DashboardClient() {
  const [selectedTopic, setSelectedTopic] = useState("My morning routine");
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [transcribedText, setTranscribedText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const { isRecording, audioBlob, startRecording, stopRecording } =
    useAudioRecorder();
  const { sessions, addSession, clearHistory } = useHistory();

  // When audioBlob changes (recording stopped), trigger transcription
  useEffect(() => {
    if (audioBlob && !isRecording) {
      transcribeAudio(audioBlob);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob, isRecording]);

  const transcribeAudio = useCallback(
    async (blob: Blob) => {
      setStatus("processing");
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", blob, "recording.webm");

        const response = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(
            data.error || `Transcription failed (${response.status})`
          );
        }

        const data = await response.json();
        const text = data.text?.trim();

        if (text) {
          setTranscribedText(text);
          addSession(selectedTopic, text);
        } else {
          setError("No speech detected. Please try again.");
        }
      } catch (err) {
        console.error("Transcription error:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred."
        );
      } finally {
        setStatus("idle");
      }
    },
    [selectedTopic, addSession]
  );

  const handleStartRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscribedText("");
      await startRecording();
      setStatus("recording");
    } catch {
      setError(
        "Microphone access denied. Please allow microphone permissions and try again."
      );
    }
  }, [startRecording]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    // Status will change to 'processing' in the useEffect when audioBlob updates
  }, [stopRecording]);

  const handleSelectTopic = useCallback((topic: string) => {
    setSelectedTopic(topic);
  }, []);

  const handleSelectSession = useCallback((session: Session) => {
    setSelectedTopic(session.topic);
    setTranscribedText(session.text);
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar
        selectedTopic={selectedTopic}
        onSelectTopic={handleSelectTopic}
        sessions={sessions}
        onSelectSession={handleSelectSession}
        onClearHistory={clearHistory}
      />
      <SidebarInset>
        {/* Top Bar */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-xl">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-5" />
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-foreground">Dashboard</h1>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 p-6 md:p-8 lg:p-10">
          <RecordingPanel
            selectedTopic={selectedTopic}
            status={status}
            transcribedText={transcribedText}
            onStartRecording={handleStartRecording}
            onStopRecording={handleStopRecording}
            error={error}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
