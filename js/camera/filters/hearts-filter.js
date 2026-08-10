class HeartsFilter {
    constructor() {
        this.hearts = [];
        // Pre-generate hearts offsets and speeds
        for (let i = 0; i < 6; i++) {
            this.hearts.push({
                offsetX: (Math.random() - 0.5) * 200,
                offsetY: (Math.random() - 0.5) * 200,
                scale: Math.random() * 0.5 + 0.5,
                phase: Math.random() * Math.PI * 2,
                speed: Math.random() * 0.05 + 0.02
            });
        }
    }

    render(ctx, landmarks, canvas) {
        const { center, width } = landmarks;
        const time = performance.now() / 1000; // seconds
        
        ctx.translate(center.x, center.y);
        const faceScale = width / 150;
        
        for (let heart of this.hearts) {
            ctx.save();
            
            // Float effect
            const floatY = Math.sin(time * heart.speed * 10 + heart.phase) * 20;
            const floatX = Math.cos(time * heart.speed * 8 + heart.phase) * 10;
            
            ctx.translate(heart.offsetX * faceScale + floatX, heart.offsetY * faceScale + floatY);
            
            // Pulse effect
            const pulse = 1 + Math.sin(time * 5 + heart.phase) * 0.1;
            ctx.scale(heart.scale * faceScale * pulse, heart.scale * faceScale * pulse);
            
            // Draw heart
            ctx.fillStyle = '#FF3366';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.bezierCurveTo(0, -10, -15, -10, -15, 0);
            ctx.bezierCurveTo(-15, 10, 0, 20, 0, 25);
            ctx.bezierCurveTo(0, 20, 15, 10, 15, 0);
            ctx.bezierCurveTo(15, -10, 0, -10, 0, 0);
            ctx.fill();
            
            ctx.restore();
        }
    }
}

if (window.arFilterEngine) {
    window.arFilterEngine.registerFilter('hearts', new HeartsFilter());
}
