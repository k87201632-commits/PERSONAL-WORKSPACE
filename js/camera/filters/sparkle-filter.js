class SparkleFilter {
    constructor() {
        this.sparkles = [];
        for (let i = 0; i < 15; i++) {
            this.sparkles.push({
                angle: Math.random() * Math.PI * 2,
                dist: Math.random() * 120 + 80, // Distance from face center
                size: Math.random() * 3 + 1,
                speed: Math.random() * 0.5 + 0.1,
                phase: Math.random() * Math.PI * 2
            });
        }
    }

    render(ctx, landmarks, canvas) {
        const { center, width } = landmarks;
        const time = performance.now() / 200; 
        
        ctx.translate(center.x, center.y);
        const faceScale = width / 150;
        ctx.scale(faceScale, faceScale);
        
        ctx.fillStyle = '#FFD700';
        
        for (let s of this.sparkles) {
            const opacity = (Math.sin(time * s.speed + s.phase) + 1) / 2; // 0 to 1
            if (opacity < 0.1) continue;
            
            ctx.save();
            const x = Math.cos(s.angle) * s.dist;
            const y = Math.sin(s.angle) * s.dist - 50; // offset slightly upwards
            
            ctx.translate(x, y);
            ctx.globalAlpha = opacity;
            
            // Draw 4-point star (sparkle)
            ctx.beginPath();
            ctx.moveTo(0, -s.size*3);
            ctx.lineTo(s.size, -s.size);
            ctx.lineTo(s.size*3, 0);
            ctx.lineTo(s.size, s.size);
            ctx.lineTo(0, s.size*3);
            ctx.lineTo(-s.size, s.size);
            ctx.lineTo(-s.size*3, 0);
            ctx.lineTo(-s.size, -s.size);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
        }
    }
}

if (window.arFilterEngine) {
    window.arFilterEngine.registerFilter('sparkle', new SparkleFilter());
}
