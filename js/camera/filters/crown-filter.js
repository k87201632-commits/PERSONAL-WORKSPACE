class CrownFilter {
    render(ctx, landmarks, canvas) {
        const { center, angle, width, height } = landmarks;
        
        ctx.translate(center.x, center.y);
        ctx.rotate(angle);
        
        const scale = width / 150; 
        ctx.scale(scale, scale);
        
        const relTopY = -height / 2 / scale;

        // Draw Crown above head
        ctx.fillStyle = '#FFD700'; // Gold
        
        ctx.beginPath();
        ctx.moveTo(-50, relTopY + 10);
        ctx.lineTo(-60, relTopY - 60);
        ctx.lineTo(-20, relTopY - 30);
        ctx.lineTo(0, relTopY - 70);
        ctx.lineTo(20, relTopY - 30);
        ctx.lineTo(60, relTopY - 60);
        ctx.lineTo(50, relTopY + 10);
        ctx.closePath();
        ctx.fill();
        
        // Jewels
        ctx.fillStyle = '#FF0000';
        ctx.beginPath(); ctx.arc(0, relTopY - 30, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#0000FF';
        ctx.beginPath(); ctx.arc(-30, relTopY - 20, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#00FF00';
        ctx.beginPath(); ctx.arc(30, relTopY - 20, 6, 0, Math.PI*2); ctx.fill();
    }
}

if (window.arFilterEngine) {
    window.arFilterEngine.registerFilter('crown', new CrownFilter());
}
