// ==========================================================================
// PERSONAL-WORKSPACE — FACE TRACKER
// Uses MediaPipe Tasks Vision to detect face landmarks
// ==========================================================================

class FaceTracker {
    constructor() {
        this.faceLandmarker = null;
        this.runningMode = "VIDEO";
        this.lastVideoTime = -1;
        this.results = null;
        this.isTracking = false;
        
        // Ensure MediaPipe is loaded
        if (!window.MediaPipeTasksVision) {
            console.error("MediaPipe Vision tasks not found! Make sure the CDN script is loaded.");
            if (typeof showToast === 'function') {
                showToast("⚠️ Komponen AR gagal dimuat. Periksa koneksi internet.", "error");
            }
        }
    }

    async init() {
        try {
            const { FaceLandmarker, FilesetResolver } = window.MediaPipeTasksVision;
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
            );
            this.faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                    delegate: "GPU"
                },
                outputFaceBlendshapes: true,
                runningMode: this.runningMode,
                numFaces: 1
            });
            console.log("Face Landmarker loaded successfully");
        } catch (error) {
            console.error("Error loading Face Landmarker:", error);
            if (typeof showToast === 'function') {
                showToast("⚠️ Gagal memuat model pendeteksi wajah.", "error");
            }
        }
    }

    startTracking(videoElement) {
        if (!this.faceLandmarker) return;
        this.isTracking = true;
        this.video = videoElement;
        
        // Start the detection loop
        requestAnimationFrame(() => this.detect(this.video));
    }

    stopTracking() {
        this.isTracking = false;
        this.results = null;
    }

    async detect(videoElement) {
        if (!this.isTracking) return;

        if (videoElement.currentTime !== this.lastVideoTime && videoElement.videoWidth > 0) {
            this.lastVideoTime = videoElement.currentTime;
            
            try {
                this.results = this.faceLandmarker.detectForVideo(videoElement, performance.now());
                
                // Dispatch event with landmarks if face detected
                if (this.results && this.results.faceLandmarks && this.results.faceLandmarks.length > 0) {
                    const landmarks = this.results.faceLandmarks[0];
                    const processedData = this.processLandmarks(landmarks, videoElement.videoWidth, videoElement.videoHeight);
                    
                    document.dispatchEvent(new CustomEvent('faceDetected', {
                        detail: { landmarks: processedData, rawResults: this.results }
                    }));
                } else {
                    document.dispatchEvent(new CustomEvent('faceLost'));
                }
            } catch (e) {
                console.error("Detection error", e);
            }
        }

        // Keep looping
        if (this.isTracking) {
            requestAnimationFrame(() => this.detect(videoElement));
        }
    }

    // Helper to extract key positions and map them to standard width/height
    processLandmarks(landmarks, width, height) {
        // Find center of face (approx nose)
        const nose = landmarks[1];
        
        // Eyes
        const leftEye = landmarks[33]; // user's left eye
        const rightEye = landmarks[263]; // user's right eye
        
        // Mouth
        const mouth = landmarks[13];
        
        // Face outline points for scale/rotation
        const top = landmarks[10];
        const bottom = landmarks[152];
        const leftSide = landmarks[234];
        const rightSide = landmarks[454];

        // Calculate face scale (width based)
        const faceWidth = Math.abs(leftSide.x - rightSide.x);
        const faceHeight = Math.abs(top.y - bottom.y);
        
        // Calculate orientation (tilt angle)
        const dX = rightEye.x - leftEye.x;
        const dY = rightEye.y - leftEye.y;
        const angle = Math.atan2(dY, dX);
        
        return {
            center: { x: nose.x * width, y: nose.y * height },
            nose: { x: nose.x * width, y: nose.y * height, z: nose.z },
            leftEye: { x: leftEye.x * width, y: leftEye.y * height, z: leftEye.z },
            rightEye: { x: rightEye.x * width, y: rightEye.y * height, z: rightEye.z },
            mouth: { x: mouth.x * width, y: mouth.y * height, z: mouth.z },
            topHead: { x: top.x * width, y: top.y * height, z: top.z },
            faceScale: faceWidth,
            width: faceWidth * width,
            height: faceHeight * height,
            angle: angle,
            raw: landmarks // full array
        };
    }
}

// Global instance
window.faceTracker = new FaceTracker();

// Listen to camera events from CameraController
document.addEventListener('cameraReady', async (e) => {
    const video = e.detail.video;
    
    // Initialize Face Landmarker if not yet
    if (!window.faceTracker.faceLandmarker) {
        await window.faceTracker.init();
    }
    
    // Start tracking
    window.faceTracker.startTracking(video);
});

document.addEventListener('cameraStopped', () => {
    window.faceTracker.stopTracking();
});

document.addEventListener('cameraPaused', () => {
    window.faceTracker.stopTracking();
});

document.addEventListener('cameraResumed', () => {
    if (window.cameraController && window.cameraController.video) {
        window.faceTracker.startTracking(window.cameraController.video);
    }
});
