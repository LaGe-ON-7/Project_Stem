import React, { useRef, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as posenet from "@tensorflow-models/posenet";

import alertSoundFile from "./sound/sound_Waring.mp3";

const connectedKeypoints = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 4], // Vẽ cột sống
  [5, 6],
  [5, 7],
  [7, 9],
  [6, 8], // Vẽ cánh tay phải
  [8, 10],
  [5, 11],
  [6, 12],
  [11, 12], // Vẽ cánh tay trái
  [11, 13],
  [12, 14],
  [13, 15],
  [14, 16], // Vẽ chân
];

const PoseNetComponent = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const inCircleRef = useRef(false); // Biến để theo dõi trạng thái người trong vùng vòng tròn
  const alertSoundRef = useRef(null);

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;
  let squareSize = 100; // Kích thước hình vuông

  useEffect(() => {
    const runPoseNet = async () => {
      try {
        await tf.setBackend("webgl");
        await tf.ready();

        const net = await posenet.load();

        if (videoRef.current) {
          const video = videoRef.current;

          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          video.srcObject = stream;

          video.onloadeddata = async () => {
            const { videoWidth, videoHeight } = video;

            if (videoWidth && videoHeight) {
              video.width = videoWidth;
              video.height = videoHeight;

              const canvas = canvasRef.current;
              canvas.width = videoWidth;
              canvas.height = videoHeight;

              // Vẽ vòng tròn hoặc hình vuông
              let centerX = videoWidth / 2;
              let centerY = videoHeight / 2;
              let radius = Math.min(videoWidth, videoHeight) / 4;

              const poseDetectionFrame = async () => {
                const pose = await net.estimateSinglePose(video);
                drawPose(pose, canvas, centerX, centerY, radius);
                checkIfInCircle(pose.keypoints, centerX, centerY, radius);
                requestAnimationFrame(poseDetectionFrame);
              };

              poseDetectionFrame();

              // const handleMouseEvents = () => {
              //   let isResizing = false;

              //   const handleMouseDownCircle = (e) => {
              //     const mouseX = parseInt(e.clientX - canvas.offsetLeft);
              //     const mouseY = parseInt(e.clientY - canvas.offsetTop);

              //     // Kiểm tra xem chuột có đang ở gần vòng tròn không
              //     const distanceFromCenter = Math.sqrt(
              //       (mouseX - centerX) ** 2 + (mouseY - centerY) ** 2
              //     );

              //     if (distanceFromCenter < radius) {
              //       isResizing = true;
              //     }
              //   };

              //   const handleMouseMoveCircle = (e) => {
              //     if (isResizing) {
              //       const mouseX = parseInt(e.clientX - canvas.offsetLeft);
              //       const mouseY = parseInt(e.clientY - canvas.offsetTop);

              //       // Tính khoảng cách giữa tâm và điểm chuột mới để xác định bán kính mới
              //       radius = Math.sqrt(
              //         (mouseX - centerX) ** 2 + (mouseY - centerY) ** 2
              //       );
              //       // Vẽ vòng tròn mới với bán kính đã thay đổi
              //       drawPose(
              //         { keypoints: [] },
              //         canvas,
              //         centerX,
              //         centerY,
              //         radius
              //       );
              //     }
              //   };

              //   const handleMouseUpCircle = () => {
              //     isResizing = false;
              //   };

              //   canvas.addEventListener("mousedown", handleMouseDownCircle);
              //   canvas.addEventListener("mousemove", handleMouseMoveCircle);
              //   canvas.addEventListener("mouseup", handleMouseUpCircle);

              //   return () => {
              //     canvas.removeEventListener(
              //       "mousedown",
              //       handleMouseDownCircle
              //     );
              //     canvas.removeEventListener(
              //       "mousemove",
              //       handleMouseMoveCircle
              //     );
              //     canvas.removeEventListener("mouseup", handleMouseUpCircle);
              //   };
              // };

              // handleMouseEvents();

              const handleMouseDown = (e) => {
                const mouseX = parseInt(e.clientX - canvas.offsetLeft);
                const mouseY = parseInt(e.clientY - canvas.offsetTop);

                // Kiểm tra xem chuột có đang ở trong hình vuông không
                if (
                  mouseX > centerX - squareSize / 2 &&
                  mouseX < centerX + squareSize / 2 &&
                  mouseY > centerY - squareSize / 2 &&
                  mouseY < centerY + squareSize / 2
                ) {
                  offsetX = mouseX - centerX;
                  offsetY = mouseY - centerY;
                  isDragging = true;
                }
              };

              const handleMouseMove = (e) => {
                if (isDragging) {
                  centerX = parseInt(e.clientX - canvas.offsetLeft - offsetX);
                  centerY = parseInt(e.clientY - canvas.offsetTop - offsetY);

                  const ctx = canvas.getContext("2d");
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  ctx.beginPath();
                  ctx.rect(
                    centerX - squareSize / 2,
                    centerY - squareSize / 2,
                    squareSize,
                    squareSize
                  ); // Vẽ hình vuông
                  ctx.strokeStyle = "blue";
                  ctx.stroke();
                  ctx.fillStyle = "#FF0000";
                  ctx.fill();
                }
              };

              const handleMouseUp = () => {
                isDragging = false;
              };

              canvas.addEventListener("mousedown", handleMouseDown);
              canvas.addEventListener("mousemove", handleMouseMove);
              canvas.addEventListener("mouseup", handleMouseUp);

              return () => {
                canvas.removeEventListener("mousedown", handleMouseDown);
                canvas.removeEventListener("mousemove", handleMouseMove);
                canvas.removeEventListener("mouseup", handleMouseUp);
              };
            }
          };
        }
      } catch (error) {
        console.error("Error using PoseNet:", error);
      }
    };

    const drawPose = (pose, canvas, centerX, centerY, radius) => {
      //Vòng tròn
      // if (canvas) {
      //   const ctx = canvas.getContext("2d");
      //   ctx.clearRect(0, 0, canvas.width, canvas.height);
      //   ctx.beginPath();
      //   ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      //   ctx.strokeStyle = "blue";
      //   ctx.stroke();

      //   drawKeypoints(pose.keypoints, ctx);
      //   drawSkeleton(pose.keypoints, ctx);
      // }

      //Hình vuông
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.rect(centerX - radius / 2, centerY - radius / 2, radius, radius); // Vẽ hình vuông
        ctx.strokeStyle = "blue";
        ctx.stroke();

        drawKeypoints(pose.keypoints, ctx);
        drawSkeleton(pose.keypoints, ctx);
      }
    };

    const drawKeypoints = (keypoints, ctx) => {
      for (let i = 0; i < keypoints.length; i++) {
        const keypoint = keypoints[i];
        if (keypoint.score > 0.5) {
          const { y, x } = keypoint.position;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = "#FF0000";
          ctx.fill();
        }
      }
    };

    const drawSkeleton = (keypoints, ctx) => {
      connectedKeypoints.forEach((pair) => {
        const [from, to] = pair;
        const fromKey = keypoints[from];
        const toKey = keypoints[to];

        if (fromKey && toKey && fromKey.score > 0.5 && toKey.score > 0.5) {
          ctx.beginPath();
          ctx.moveTo(fromKey.position.x, fromKey.position.y);
          ctx.lineTo(toKey.position.x, toKey.position.y);
          ctx.strokeStyle = "#00FF00";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      });
    };

    const playAlertSound = () => {
      const alertSound = new Audio(alertSoundFile); // Đặt đường dẫn đến file âm thanh của bạn ở đây
      alertSound.play();
      alertSoundRef.current = alertSound;
    };

    const checkIfBodyInSquare = (keypoints, centerX, centerY, squareSize) => {
      const threshold = 0.5; // Ngưỡng phát hiện điểm chính

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      keypoints.forEach((keypoint) => {
        if (keypoint.score > threshold) {
          const { x, y } = keypoint.position;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      });

      // Kiểm tra giao điểm của phần thân với hình vuông
      const intersectsX =
        minX < centerX + squareSize / 2 && maxX > centerX - squareSize / 2;
      const intersectsY =
        minY < centerY + squareSize / 2 && maxY > centerY - squareSize / 2;

      // Cảnh báo nếu bất kỳ phần nào của cơ thể giao với hình vuông
      return intersectsX && intersectsY;
    };

    const checkIfInCircle = (keypoints, centerX, centerY, radius) => {
      const isBodyInSquare = checkIfBodyInSquare(
        keypoints,
        centerX,
        centerY,
        squareSize
      );

      if (isBodyInSquare && !inCircleRef.current) {
        inCircleRef.current = true;
        playAlertSound();
      } else if (!isBodyInSquare && inCircleRef.current) {
        inCircleRef.current = false;
        if (alertSoundRef.current) {
          alertSoundRef.current.pause(); // Tắt âm thanh nếu không còn cơ thể con người nằm trong vùng hình vuông
        }
      }
    };

    runPoseNet();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{ position: "absolute" }}
      />
      <canvas ref={canvasRef} style={{ position: "absolute" }} />
    </div>
  );
};

export default PoseNetComponent;
