// components/VideoPlayer.tsx
"use client";

import { useEffect, useRef } from "react";

interface YouTubePlayerProps {
  videoId: string;
  isPlaying: boolean;
  currentTime: number;
  onStateChange: (playing: boolean, time: number) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export default function YouTubePlayer({
  videoId,
  isPlaying,
  currentTime,
  onStateChange,
}: YouTubePlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSeekingRef = useRef(false);

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          controls: 1, // Show controls (includes fullscreen button)
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
        },
      });
    };
  }, [videoId]);

  const onPlayerReady = (event: any) => {
    event.target.seekTo(currentTime);
    if (isPlaying) {
      event.target.playVideo();
    }
  };

  const onPlayerStateChange = (event: any) => {
    if (isSeekingRef.current) return;

    const isPlayingState = event.data === window.YT.PlayerState.PLAYING;
    const currentTime = event.target.getCurrentTime();
    onStateChange(isPlayingState, currentTime);
  };

  // Handle play/pause changes
  useEffect(() => {
    if (playerRef.current && playerRef.current.getPlayerState) {
      const playerState = playerRef.current.getPlayerState();
      const isCurrentlyPlaying = playerState === window.YT.PlayerState.PLAYING;

      if (isPlaying && !isCurrentlyPlaying) {
        playerRef.current.playVideo();
      } else if (!isPlaying && isCurrentlyPlaying) {
        playerRef.current.pauseVideo();
      }
    }
  }, [isPlaying]);

  // Handle time seeking
  useEffect(() => {
    if (playerRef.current && playerRef.current.getCurrentTime) {
      const currentPlayerTime = playerRef.current.getCurrentTime();
      const timeDiff = Math.abs(currentPlayerTime - currentTime);

      if (timeDiff > 1) {
        isSeekingRef.current = true;
        playerRef.current.seekTo(currentTime, true);
        setTimeout(() => {
          isSeekingRef.current = false;
        }, 500);
      }
    }
  }, [currentTime]);

  return (
    <div
      ref={containerRef}
      className="w-full aspect-video" // This ensures proper aspect ratio
    />
  );
}
