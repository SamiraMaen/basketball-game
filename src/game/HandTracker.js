
export class HandTracker {
  constructor(videoElement, canvasElement) {
    this.video = videoElement;
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    
    this.handLandmarker = null;
    this.webcamRunning = false;
    this.lastVideoTime = -1;
    
    // Callbacks
    this.onPinchStart = null;
    this.onPinchMove = null;
    this.onPinchEnd = null;
    this.onHandMove = null;

    this.isPinched = false;
    this.pinchStartThreshold = 0.08; 
    this.pinchEndThreshold = 0.12; 
  }

  async init() {
    try {
      const { HandLandmarker, FilesetResolver } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0');

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
      );
      
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU"
        },
        runningMode: "VIDEO",
        numHands: 1
      });

      await this.startCamera();
    } catch (e) {
      console.error("Initialization Error: ", e);
      alert("Error initializing hand tracking: " + e.message);
    }
  }

  async startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera API not supported in this browser context (might be blocked by iframe or requires HTTPS).");
      return;
    }

    const constraints = { video: { facingMode: "user" } };
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        this.video.srcObject = stream;
        await this.video.play();
        this.video.addEventListener("loadeddata", () => {
            this.webcamRunning = true;
            this.predictWebcam();
        });
    } catch (err) {
        console.error("Error accessing camera: ", err);
        alert("Error accessing camera. Please check permissions. " + err.message);
    }
  }

  predictWebcam() {
    if (!this.webcamRunning) return;

    this.canvas.width = this.video.videoWidth;
    this.canvas.height = this.video.videoHeight;
    
    let startTimeMs = performance.now();
    if (this.lastVideoTime !== this.video.currentTime) {
      this.lastVideoTime = this.video.currentTime;
      const results = this.handLandmarker.detectForVideo(this.video, startTimeMs);
      
      this.ctx.save();
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      if (results.landmarks && results.landmarks.length > 0) {
        const landmarks = results.landmarks[0]; // first hand
        
        // Index finger tip is 8, Thumb tip is 4
        const indexTip = landmarks[8];
        const thumbTip = landmarks[4];
        
        // Calculate position in screen coordinates (mirrored horizontally)
        // MediaPipe coords are 0-1.
        // Because the video is mirrored via CSS, we must mirror the X coordinate for logical mapping
        const screenX = (1 - indexTip.x) * window.innerWidth;
        const screenY = indexTip.y * window.innerHeight;

        // Calculate distance between thumb and index for pinch
        const dx = indexTip.x - thumbTip.x;
        const dy = indexTip.y - thumbTip.y;
        const dz = indexTip.z - thumbTip.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        let currentlyPinched = this.isPinched;
        if (!this.isPinched && distance < this.pinchStartThreshold) {
            currentlyPinched = true;
        } else if (this.isPinched && distance > this.pinchEndThreshold) {
            currentlyPinched = false;
        }
        
        // Visual feedback on the camera canvas
        this.drawLandmarks(landmarks, currentlyPinched);

        // Fire callbacks
        if (this.onHandMove) {
           this.onHandMove(screenX, screenY, currentlyPinched);
        }

        if (currentlyPinched && !this.isPinched) {
            this.isPinched = true;
            if (this.onPinchStart) this.onPinchStart(screenX, screenY);
        } else if (currentlyPinched && this.isPinched) {
            if (this.onPinchMove) this.onPinchMove(screenX, screenY);
        } else if (!currentlyPinched && this.isPinched) {
            this.isPinched = false;
            if (this.onPinchEnd) this.onPinchEnd(screenX, screenY);
        }
      }
      this.ctx.restore();
    }
    
    // Call this function again to keep predicting when the browser is ready.
    requestAnimationFrame(() => this.predictWebcam());
  }

  drawLandmarks(landmarks, isPinched) {
    const toCanvas = (lm) => ({
      x: lm.x * this.canvas.width,
      y: lm.y * this.canvas.height
    });

    const index = toCanvas(landmarks[8]);
    const thumb = toCanvas(landmarks[4]);

    if (isPinched) {
      const midX = (index.x + thumb.x) / 2;
      const midY = (index.y + thumb.y) / 2;
      const radius = 25;

      // Draw AR Basketball
      this.ctx.fillStyle = '#F06522';
      this.ctx.beginPath();
      this.ctx.arc(midX, midY, radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = '#222';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();

      // Cross lines for basketball
      this.ctx.beginPath();
      this.ctx.moveTo(midX, midY - radius);
      this.ctx.lineTo(midX, midY + radius);
      this.ctx.stroke();

      this.ctx.beginPath();
      this.ctx.moveTo(midX - radius, midY);
      this.ctx.lineTo(midX + radius, midY);
      this.ctx.stroke();
    } else {
      // Draw open hand points
      this.ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      this.ctx.beginPath();
      this.ctx.arc(index.x, index.y, 6, 0, 2 * Math.PI);
      this.ctx.fill();
      
      this.ctx.beginPath();
      this.ctx.arc(thumb.x, thumb.y, 6, 0, 2 * Math.PI);
      this.ctx.fill();
    }
  }
}
