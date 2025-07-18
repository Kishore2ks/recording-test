import { useEffect, useRef, useState } from "react";

const RecorderPOC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [videoURL, setVideoURL] = useState<string | null>(null);

  const mobileResolution = [
    { width: 1080, height: 1920 }, // 1080p FHD, 9:16
    { width: 720, height: 1280 }, // 720p HD, 9:16
  ];
  const laptopResolution = [
    { width: 1920, height: 1080 }, // 1080p FHD, 16:9
    { width: 1280, height: 720 }, // 720p HD, 16:9
  ];

  const getVideoConstraints = () => {
    const isMobile = detectMobile();
    const resolutions = isMobile ? mobileResolution : laptopResolution;

    return {
      facingMode: "user",
      frameRate: { ideal: 30 },
      width: { ideal: resolutions[0].width },
      height: { ideal: resolutions[0].height },
    };
  };

  const detectMobile = () => {
    const userAgent =
      navigator.userAgent || navigator.vendor || (window as any)?.opera;
    const isUserAgentMobile =
      /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(userAgent);
    const isSmallScreen = window.innerWidth <= 768; // Adjust if needed
    return isUserAgentMobile || isSmallScreen;
  };

  useEffect(() => {
    async function setupStream() {
      try {
        const constraints = {
          video: getVideoConstraints(),
          audio: true,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = 1280; // 16:9 aspect ratio
        canvas.height = 720;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const video = videoRef.current;
        if (!video) return;
        video.play();

        const draw = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const sourceWidth = video.videoWidth;
          const sourceHeight = video.videoHeight;

          // Target dimensions (crop to fill 16:9)
          const targetAspect = 16 / 9;
          const sourceAspect = sourceWidth / sourceHeight;

          let drawWidth = canvas.width;
          let drawHeight = canvas.height;
          let offsetX = 0;
          let offsetY = 0;

          if (sourceAspect < targetAspect) {
            drawHeight = canvas.height;
            drawWidth = sourceHeight * targetAspect;
            offsetX = (sourceWidth - drawWidth) / 2;
          } else {
            drawWidth = canvas.width;
            drawHeight = sourceWidth / targetAspect;
            offsetY = (sourceHeight - drawHeight) / 2;
          }

          ctx.drawImage(
            video,
            offsetX,
            offsetY,
            sourceWidth - 2 * offsetX,
            sourceHeight - 2 * offsetY,
            0,
            0,
            canvas.width,
            canvas.height
          );

          requestAnimationFrame(draw);
        };
        draw();

        const canvasStream = canvas.captureStream(30);
        const audioTrack = stream.getAudioTracks()[0];
        canvasStream.addTrack(audioTrack);

        const mediaRecorder = new MediaRecorder(canvasStream, {
          mimeType: "video/webm;codecs=vp9,opus",
        });

        const chunks: Blob[] = [];

        mediaRecorder.ondataavailable = (e: BlobEvent) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          setVideoURL(url);
        };

        setRecorder(mediaRecorder);
      } catch (err) {
        console.error("Error accessing camera:", err);
      }
    }

    setupStream();
  }, []);

  const startRecording = () => {
    if (recorder && recorder.state === "inactive") {
      recorder.start();
      setRecording(true);
    }
  };

  const stopRecording = () => {
    if (recorder && recorder.state === "recording") {
      recorder.stop();
      setRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <video ref={videoRef} className="" playsInline muted autoPlay />
      <canvas ref={canvasRef} className="border rounded shadow hidden" />
      <div className="flex gap-4">
        {!recording && !videoURL && (
          <button
            onClick={startRecording}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Start
          </button>
        )}
        {recording && (
          <button
            onClick={stopRecording}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Stop
          </button>
        )}
        {videoURL && (
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded"
          >
            Record Again
          </button>
        )}
        {videoURL && (
          <a
            href={videoURL}
            download="recorded-video.webm"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Download Video
          </a>
        )}
      </div>
      {videoURL && (
        <div>
          <h3 className="mt-4 font-semibold">Recorded Video:</h3>
          <video
            src={videoURL}
            controls
            className="mt-2 border"
            width="640"
            height="360"
            playsInline
          />
        </div>
      )}
    </div>
  );
};

export default RecorderPOC;
