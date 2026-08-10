// ==========================================================================
// PERSONAL-WORKSPACE — CAMERA CONTROLLER
// Menangani getUserMedia, live stream, shutter, dan cleanup.
// ==========================================================================

class CameraController {
    constructor() {
        this.video = document.getElementById('cameraVideo');
        this.canvas = document.getElementById('cameraCanvas');
        this.loadingOverlay = document.getElementById('cameraLoadingOverlay');
        this.loadingText = document.getElementById('cameraLoadingText');
        this.shutterBtn = document.getElementById('shutterBtn');
        this.stream = null;
        this.isActive = false;
        
        // Capture Review UI
        this.reviewOverlay = document.getElementById('captureReviewOverlay');
        this.reviewImage = document.getElementById('captureReviewImage');
        this.btnRetake = document.getElementById('btnRetake');
        this.btnSave = document.getElementById('btnSavePhoto');
        
        this.lastCapturedBlob = null;
    }

    async init() {
        if (!this.video) return; // Not on camera page
        
        this.bindEvents();
        await this.startCamera();
        
        // Ensure cleanup when leaving page
        window.addEventListener('beforeunload', () => this.stopCamera());
        // Handle visibility change (tab hidden) to save resources
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                // Optional: pause rendering/processing but maybe keep stream
            }
        });
    }

    bindEvents() {
        if (this.shutterBtn) {
            this.shutterBtn.addEventListener('click', () => this.capturePhoto());
        }
        
        if (this.btnRetake) {
            this.btnRetake.addEventListener('click', () => this.discardCapture());
        }
        
        if (this.btnSave) {
            this.btnSave.addEventListener('click', () => this.saveCapture());
        }
    }

    async startCamera() {
        this.isActive = true;
        this.setLoading(true, 'Meminta izin kamera...');
        
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user' // Front camera preferred
                },
                audio: false
            });
            
            this.video.srcObject = this.stream;
            
            // Wait for video to be ready
            return new Promise((resolve) => {
                this.video.onloadedmetadata = () => {
                    this.video.play();
                    this.setLoading(false);
                    
                    // Match canvas size to video resolution
                    this.updateCanvasSize();
                    
                    // Notify that camera is ready (for AR engine)
                    document.dispatchEvent(new CustomEvent('cameraReady', { 
                        detail: { video: this.video, canvas: this.canvas }
                    }));
                    
                    resolve();
                };
            });
            
        } catch (err) {
            console.error('Kamera gagal diakses:', err);
            this.setLoading(true, 'Gagal mengakses kamera. Periksa izin browser.');
            if (typeof showToast === 'function') {
                showToast('⚠️ Akses kamera ditolak atau tidak tersedia.', 'error');
            }
        }
    }

    stopCamera() {
        this.isActive = false;
        
        // Stop all MediaStream tracks (CRITICAL RULE)
        if (this.stream) {
            this.stream.getTracks().forEach(track => {
                track.stop();
            });
            this.stream = null;
        }
        
        if (this.video) {
            this.video.srcObject = null;
        }
        
        // Notify to stop render loops
        document.dispatchEvent(new CustomEvent('cameraStopped'));
    }

    updateCanvasSize() {
        if (!this.video || !this.canvas) return;
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;
    }

    setLoading(isLoading, text = '') {
        if (!this.loadingOverlay) return;
        if (isLoading) {
            this.loadingOverlay.style.display = 'flex';
            this.loadingOverlay.style.opacity = '1';
            if (this.loadingText && text) this.loadingText.textContent = text;
        } else {
            this.loadingOverlay.style.opacity = '0';
            setTimeout(() => {
                this.loadingOverlay.style.display = 'none';
            }, 300);
        }
    }

    // -----------------------------------------------------------------------
    // CAPTURE FLOW
    // -----------------------------------------------------------------------
    capturePhoto() {
        if (!this.video || !this.canvas || !this.isActive) return;
        
        // We want to capture both the video AND the AR overlay (canvas)
        // Create a temporary offscreen canvas for the final composition
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.video.videoWidth;
        tempCanvas.height = this.video.videoHeight;
        const ctx = tempCanvas.getContext('2d');
        
        // 1. Draw Video (mirrored, just like CSS preview)
        ctx.translate(tempCanvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(this.video, 0, 0, tempCanvas.width, tempCanvas.height);
        
        // 2. Draw AR Canvas over it
        // The AR canvas is already mirrored via CSS, but its internal pixels might not be.
        // We draw the AR canvas pixels directly onto our mirrored context.
        ctx.drawImage(this.canvas, 0, 0, tempCanvas.width, tempCanvas.height);
        
        // 3. Reset transform
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        
        // Convert to Blob
        tempCanvas.toBlob((blob) => {
            this.lastCapturedBlob = blob;
            this.showReview(URL.createObjectURL(blob));
            
            // Play shutter sound if possible
            this.playShutterSound();
        }, 'image/jpeg', 0.9);
    }
    
    showReview(imageUrl) {
        if (!this.reviewOverlay || !this.reviewImage) return;
        this.reviewImage.src = imageUrl;
        this.reviewOverlay.style.display = 'flex';
        
        // Optionally pause camera processing
        document.dispatchEvent(new CustomEvent('cameraPaused'));
    }
    
    discardCapture() {
        if (!this.reviewOverlay || !this.reviewImage) return;
        URL.revokeObjectURL(this.reviewImage.src);
        this.reviewImage.src = '';
        this.lastCapturedBlob = null;
        this.reviewOverlay.style.display = 'none';
        
        // Resume camera processing
        document.dispatchEvent(new CustomEvent('cameraResumed'));
    }
    
    async saveCapture() {
        if (!this.lastCapturedBlob) return;
        
        if (window.cameraGallery) {
            try {
                await window.cameraGallery.savePhoto(this.lastCapturedBlob);
                if (typeof showToast === 'function') {
                    showToast('✅ Foto berhasil disimpan ke galeri pribadi.');
                }
                this.discardCapture();
            } catch (err) {
                console.error("Gagal menyimpan foto:", err);
                if (typeof showToast === 'function') {
                    showToast('❌ Gagal menyimpan foto.', 'error');
                }
            }
        }
    }
    
    playShutterSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        } catch (e) {
            // Ignore if audio context fails
        }
    }
}

// Global instance
window.cameraController = new CameraController();

document.addEventListener('DOMContentLoaded', () => {
    window.cameraController.init();
});
