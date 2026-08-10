class BunnyFilter {
    render(ctx, landmarks, canvas) {
        const { center, angle, nose, width, height } = landmarks;
        
        ctx.translate(center.x, center.y);
        ctx.rotate(angle);
        
        const scale = width / 150; 
        ctx.scale(scale, scale);
        
        const relTopY = -height / 2 / scale;

        // Draw Bunny Ears (Long)
        ctx.fillStyle = '#FFFFFF';
        
        // Left Ear
        ctx.beginPath();
        ctx.ellipse(-30, relTopY - 40, 15, 80, -Math.PI/12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFCCCC';
        ctx.beginPath();
        ctx.ellipse(-30, relTopY - 40, 8, 60, -Math.PI/12, 0, Math.PI * 2);
        ctx.fill();
        
        // Right Ear
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(30, relTopY - 40, 15, 80, Math.PI/12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFCCCC';
        ctx.beginPath();
        ctx.ellipse(30, relTopY - 40, 8, 60, Math.PI/12, 0, Math.PI * 2);
        ctx.fill();

        ctx.scale(1/scale, 1/scale);
        ctx.rotate(-angle);
        ctx.translate(-center.x, -center.y);
        
        // Nose
        ctx.translate(nose.x, nose.y);
        ctx.rotate(angle);
        ctx.scale(scale, scale);
        
        ctx.fillStyle = '#FF99CC';
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Bunny Teeth
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-8, 10, 7, 12);
        ctx.fillRect(1, 10, 7, 12);
        ctx.strokeStyle = '#CCC';
        ctx.strokeRect(-8, 10, 7, 12);
        ctx.strokeRect(1, 10, 7, 12);
    }
}

if (window.arFilterEngine) {
    window.arFilterEngine.registerFilter('bunny', new BunnyFilter());
}
