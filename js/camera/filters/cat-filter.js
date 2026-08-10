class CatFilter {
    render(ctx, landmarks, canvas) {
        const { center, angle, nose, width, height } = landmarks;
        
        ctx.translate(center.x, center.y);
        ctx.rotate(angle);
        
        const scale = width / 150; 
        ctx.scale(scale, scale);
        
        const relTopY = -height / 2 / scale;

        // Draw Cat Ears
        ctx.fillStyle = '#FF9900';
        
        // Left Ear
        ctx.beginPath();
        ctx.moveTo(-30, relTopY + 20);
        ctx.lineTo(-60, relTopY - 40);
        ctx.lineTo(-80, relTopY + 30);
        ctx.fill();
        
        // Left Ear inner
        ctx.fillStyle = '#FFCCCC';
        ctx.beginPath();
        ctx.moveTo(-35, relTopY + 20);
        ctx.lineTo(-55, relTopY - 25);
        ctx.lineTo(-70, relTopY + 25);
        ctx.fill();
        
        // Right Ear
        ctx.fillStyle = '#FF9900';
        ctx.beginPath();
        ctx.moveTo(30, relTopY + 20);
        ctx.lineTo(60, relTopY - 40);
        ctx.lineTo(80, relTopY + 30);
        ctx.fill();

        // Right Ear inner
        ctx.fillStyle = '#FFCCCC';
        ctx.beginPath();
        ctx.moveTo(35, relTopY + 20);
        ctx.lineTo(55, relTopY - 25);
        ctx.lineTo(70, relTopY + 25);
        ctx.fill();

        ctx.scale(1/scale, 1/scale);
        ctx.rotate(-angle);
        ctx.translate(-center.x, -center.y);
        
        // Nose & Whiskers
        ctx.translate(nose.x, nose.y);
        ctx.rotate(angle);
        ctx.scale(scale, scale);
        
        // Nose
        ctx.fillStyle = '#FF66B2';
        ctx.beginPath();
        ctx.moveTo(-10, -5);
        ctx.lineTo(10, -5);
        ctx.lineTo(0, 10);
        ctx.fill();
        
        // Whiskers Left
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-15, 0); ctx.lineTo(-60, -10);
        ctx.moveTo(-15, 5); ctx.lineTo(-60, 5);
        ctx.moveTo(-15, 10); ctx.lineTo(-60, 20);
        ctx.stroke();
        
        // Whiskers Right
        ctx.beginPath();
        ctx.moveTo(15, 0); ctx.lineTo(60, -10);
        ctx.moveTo(15, 5); ctx.lineTo(60, 5);
        ctx.moveTo(15, 10); ctx.lineTo(60, 20);
        ctx.stroke();
    }
}

if (window.arFilterEngine) {
    window.arFilterEngine.registerFilter('cat', new CatFilter());
}
