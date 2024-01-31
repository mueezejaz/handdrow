import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
  const canvasvd = document.getElementById("canvasvd");
  const canvasdr = document.getElementById("canvasdr");
  const contextvd = canvasvd.getContext("2d");
  const loading = document.getElementById("loading");
  const contextdr = canvasdr.getContext("2d");
  let drawPoints = {
    x: undefined,
    y: undefined,
    prevX: undefined,
    prevY: undefined,
  };
  let handLandmarker = undefined;
  let runningMode = "VIDEO";
  let results;
  let video;
  navigator.mediaDevices
    .getUserMedia({
      video: {
        // width: { ideal: window.innerWidth },
        // height: { ideal: window.innerHeight },
      },
      audio: false,
    })
    .then((stream) => {
      video = document.createElement("video");
      video.srcObject = stream;
  
      // Flip the video horizontally using CSS
      video.style.transform = "scaleX(-1)";
  
      video.onloadedmetadata = () => {
        video.style.transform = "scaleX(-1)";
        canvasvd.width = video.videoWidth;
        canvasvd.height = video.videoHeight;
        canvasdr.width = video.videoWidth;
        canvasdr.height = video.videoHeight;
        video.play();
        video.addEventListener("loadeddata", async () => {
          video.style.transform = "scaleX(-1)";
          createHandLandmarker();
          renderVideo();
        });
      };
    })
    .catch(function (err) {
      window.alert("Access to the camera is required for this application.", err);
    });
  
  //loading model
  const createHandLandmarker = async () => {
    // Show loading
    loading.style.display = "block";
  
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm",
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU",
      },
      runningMode: runningMode,
      numHands: 1,
      minHandDetectionConfidence: 0.7,
      minHandPresenceConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });
    console.log("Model is loaded");
    detectFunction();
  
    // Hide loading
    loading.style.display = "none";
  };
  
  async function detectFunction() {
    let startTimeMs = performance.now();
    results = await handLandmarker.detectForVideo(video, startTimeMs);
    mindpointfinder(results.landmarks[0]);
    renderOnCanvas(results.landmarks[0]);
    requestAnimationFrame(detectFunction);
  }
  // drowing video canvas
  function renderVideo() {
    // Flip the video horizontally
    contextvd.save();
    contextvd.scale(-1, 1);
    contextvd.drawImage(
      video,
      -canvasvd.width,
      0,
      canvasvd.width,
      canvasvd.height,
    );
    contextvd.restore();
  
    requestAnimationFrame(renderVideo);
  }
  
  function renderOnCanvas(landmarks) {
    if (landmarks) {
      const radius = 5;
      const color = "red";
  
      landmarks.forEach((landmark, index) => {
        // Flip the x-coordinate to match the flipped video
        const x = (1 - landmark.x) * canvasvd.width;
        const y = landmark.y * canvasvd.height;
  
        contextvd.beginPath();
        contextvd.arc(x, y, radius, 0, 2 * Math.PI);
        contextvd.fillStyle = color;
        contextvd.fill();
        contextvd.closePath();
        contextvd.fillStyle = "white";
        contextvd.fillText(index + 1, x - 5, y - 10);
      });
    }
  }
  function mindpointfinder(p) {
    if (p && p.length >= 9) {
      const p1 = {
        x: (1 - p[4].x) * canvasvd.width,
        y: p[4].y * canvasvd.height,
      };
  
      const p2 = {
        x: (1 - p[8].x) * canvasvd.width,
        y: p[8].y * canvasvd.height,
      };
  
      drawLine(p1.x, p1.y, p2.x, p2.y);
      const midpoint = findMidpoint(p1.x, p1.y, p2.x, p2.y);
      const distanceP1 = Math.sqrt(
        (p1.x - midpoint.x) ** 2 + (p1.y - midpoint.y) ** 2,
      );
      const distanceP2 = Math.sqrt(
        (p2.x - midpoint.x) ** 2 + (p2.y - midpoint.y) ** 2,
      );
  
      const proximityThreshold = 25;
      const isClose =
        distanceP1 < proximityThreshold && distanceP2 < proximityThreshold;
  
      if (isClose) {
        brush();
      }
    }
  }
  
  function findMidpoint(x1, y1, x2, y2) {
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    contextvd.beginPath();
    contextvd.arc(mx, my, 6, 0, 2 * Math.PI);
    contextvd.fillStyle = "blue";
    contextvd.fill();
    contextvd.closePath();
  
    drawPoints.prevX = drawPoints.x;
    drawPoints.prevY = drawPoints.y;
    drawPoints.x = mx;
    drawPoints.y = my;
    return { x: mx, y: my };
  }
  function drawLine(x1, y1, x2, y2) {
    contextvd.beginPath();
    contextvd.moveTo(x1, y1);
    contextvd.lineTo(x2, y2);
    contextvd.strokeStyle = "green";
    contextvd.lineWidth = 3;
    contextvd.stroke();
    contextvd.closePath();
  }
  function brush() {
    console.log(1);
    contextdr.fillStyle = "red";
    contextdr.beginPath();
    contextdr.arc(drawPoints.x, drawPoints.y, 10, 0, 2 * Math.PI);
    contextdr.fill();
    contextdr.closePath();
    // Draw a line connecting the current and previous points
    if (drawPoints.prevX !== undefined && drawPoints.prevY !== undefined) {
      contextdr.beginPath();
      contextdr.moveTo(drawPoints.prevX, drawPoints.prevY);
      contextdr.lineTo(drawPoints.x, drawPoints.y);
      contextdr.strokeStyle = "red";
      contextdr.lineWidth = 20; // Adjust line width as needed
      contextdr.stroke();
      contextdr.closePath();
    }
  }
  // function animate() {
  //   requestAnimationFrame(animate);
  // }
  // Detection function
  
  // Initialization function
  
  // Obtain user media and start the video and rendering
  