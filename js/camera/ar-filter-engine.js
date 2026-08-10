// ==========================================================================
// PERSONAL-WORKSPACE — AR FILTER ENGINE
// Manages rendering filters onto the canvas overlay
// ==========================================================================

class ARFilterEngine {
    constructor() {
        this.canvas = document.getElementById('cameraCanvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.currentFilterName = 'normal';
        this.filters = {};
        this.activeFilter = null;
        
        this.lastLandmarks = null;
        
        this.bindEvents();
    }

    bindEvents() {
        // Listen for face detected
        document.addEventListener('faceDetected', (e) => {
            this.lastLandmarks = e.detail.landmarks;
            this.render();
        });
        
        // Listen for face lost
        document.addEventListener('faceLost', () => {
            this.lastLandmarks = null;
            this.clearCanvas();
        });
        
        // Listen for UI filter selection
        const filterItems = document.querySelectorAll('.filter-item');
        filterItems.forEach(item => {
            item.addEventListener('click', () => {
                filterItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                
                const filterName = item.getAttribute('data-filter');
                this.setFilter(filterName);
            });
        });
    }

    registerFilter(name, filterInstance) {
        this.filters[name] = filterInstance;
    }

    setFilter(name) {
        if (this.currentFilterName === name) return;
        this.currentFilterName = name;
        this.activeFilter = this.filters[name] || null;
        
        if (!this.activeFilter) {
            this.clearCanvas();
        }
    }

    clearCanvas() {
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    render() {
        if (!this.ctx || !this.canvas) return;
        
        // Always clear the canvas before drawing the next frame
        this.clearCanvas();
        
        if (this.currentFilterName === 'normal' || !this.activeFilter || !this.lastLandmarks) {
            return; // No AR overlay to draw
        }
        
        this.ctx.save();
        
        // Draw the active filter
        try {
            this.activeFilter.render(this.ctx, this.lastLandmarks, this.canvas);
        } catch (e) {
            console.error(`Error rendering filter ${this.currentFilterName}:`, e);
        }
        
        this.ctx.restore();
    }
}

window.arFilterEngine = new ARFilterEngine();
