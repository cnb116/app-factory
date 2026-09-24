"use client";

import { useRef, useState } from "react";

interface VoiceRecorderProps {
  onTranscribed: (text: string) => void;
}

type RecorderState = "idle" | "recording" | "transcribing";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export default function VoiceRecorder({ onTranscribed }: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>("idle");
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "";
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });

        if (blob.size === 0) {
          setError("녹음된 소리가 없습니다. 다시 시도해주세요.");
          setState("idle");
          return;
        }

        setState("transcribing");
        try {
          const audioBase64 = await blobToBase64(blob);
          const res = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audioBase64, mimeType: recorder.mimeType || "audio/webm" }),
          });
          const data = await res.json();

          if (!res.ok || typeof data?.text !== "string") {
            setError(data?.error || "전사에 실패했습니다.");
            setState("idle");
            return;
          }

          onTranscribed(data.text);
          setState("idle");
        } catch (err) {
          console.error("[VoiceRecorder] 전사 요청 실패", err);
          setError("잠시 후 다시 시도해주세요.");
          setState("idle");
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setState("recording");
    } catch (err) {
      console.error("[VoiceRecorder] 마이크 접근 실패", err);
      setError("마이크를 사용할 수 없습니다. 브라우저 마이크 권한을 확인해주세요.");
      setState("idle");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {state === "idle" && (
        <button
          type="button"
          onClick={startRecording}
          className="w-full rounded-xl border-2 border-black bg-white py-5 text-lg font-black text-black shadow transition active:scale-95"
        >
          🎙️ 녹음 시작
        </button>
      )}
      {state === "recording" && (
        <button
          type="button"
          onClick={stopRecording}
          className="w-full animate-pulse rounded-xl bg-red-500 py-5 text-lg font-black text-white shadow transition active:scale-95"
        >
          ⏹ 녹음 중지 (누르면 전사 시작)
        </button>
      )}
      {state === "transcribing" && (
        <div className="w-full rounded-xl border-2 border-black bg-zinc-50 py-5 text-center text-lg font-black text-black">
          전사 중...
        </div>
      )}
      {error && <p className="text-sm font-bold text-red-600">{error}</p>}
    </div>
  );
}
