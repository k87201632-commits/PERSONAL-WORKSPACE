class DogFilter {
    render(ctx, landmarks, canvas) {
        const { center, topHead, faceScale, angle, nose, width, height } = landmarks;
        
        ctx.translate(center.x, center.y);
        ctx.rotate(angle);
        
        // Face scale is distance between left and right side of face
        // We use a baseline width of 150 to scale
        const scale = width / 150; 
        ctx.scale(scale, scale);
        
        const relTopY = -height / 2 / scale;

        // Draw Dog Ears
        ctx.fillStyle = '#8B4513';
        
        // Left Ear
        ctx.beginPath();
        ctx.ellipse(-50, relTopY, 25, 60, -Math.PI/6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFC0CB';
        ctx.beginPath();
        ctx.ellipse(-50, relTopY, 12, 45, -Math.PI/6, 0, Math.PI * 2);
        ctx.fill();
        
        // Right Ear
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(50, relTopY, 25, 60, Math.PI/6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFC0CB';
        ctx.beginPath();
        ctx.ellipse(50, relTopY, 12, 45, Math.PI/6, 0, Math.PI * 2);
        ctx.fill();

        // Rotate back to draw nose exactly at nose coordinates
        // Actually since we rotated canvas, we need nose position relative to rotated center
        ctx.scale(1/scale, 1/scale);
        ctx.rotate(-angle);
        ctx.translate(-center.x, -center.y);
        
        // Draw Nose directly on nose coords
        ctx.translate(nose.x, nose.y);
        ctx.rotate(angle);
        ctx.scale(scale, scale);
        
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.ellipse(0, 0, 15, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cute tongue
        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.ellipse(0, 20, 10, 15, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}

if (window.arFilterEngine) {
    window.arFilterEngine.registerFilter('dog', new DogFilter());
}
