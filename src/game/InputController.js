export class InputController {
  constructor(element) {
    this.element = element;
    
    this.state = {
      isDragging: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      dragVector: null // {x, y} pointing from current to start
    };

    this.onShoot = null; // Callback when released

    this.setupListeners();
  }

  setupListeners() {
    const handleStart = (e) => {
      e.preventDefault();
      const pos = this.getPos(e);
      this.state.isDragging = true;
      this.state.startX = pos.x;
      this.state.startY = pos.y;
      this.state.currentX = pos.x;
      this.state.currentY = pos.y;
      this.state.dragVector = { x: 0, y: 0 };
    };

    const handleMove = (e) => {
      if (!this.state.isDragging) return;
      e.preventDefault();
      const pos = this.getPos(e);
      this.state.currentX = pos.x;
      this.state.currentY = pos.y;
      
      // Calculate drag vector (direct aiming: moving mouse up shoots up)
      this.state.dragVector = {
        x: this.state.currentX - this.state.startX,
        y: this.state.currentY - this.state.startY
      };

      // Cap maximum drag length to prevent infinite power
      const maxDrag = 250;
      const mag = Math.sqrt(this.state.dragVector.x**2 + this.state.dragVector.y**2);
      if (mag > maxDrag) {
        this.state.dragVector.x = (this.state.dragVector.x / mag) * maxDrag;
        this.state.dragVector.y = (this.state.dragVector.y / mag) * maxDrag;
      }
    };

    const handleEnd = (e) => {
      if (!this.state.isDragging) return;
      e.preventDefault();
      this.state.isDragging = false;
      
      if (this.onShoot && this.state.dragVector) {
        // Only shoot if dragged a minimum amount
        const mag = Math.sqrt(this.state.dragVector.x**2 + this.state.dragVector.y**2);
        if (mag > 20) {
            this.onShoot(this.state.dragVector);
        }
      }
      this.state.dragVector = null;
    };

    this.element.addEventListener('mousedown', handleStart);
    this.element.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd); // Window catch to prevent sticking

    this.element.addEventListener('touchstart', handleStart, { passive: false });
    this.element.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
  }

  getPos(e) {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }

  // Programmatic triggers for Hand Tracking
  triggerStart(x, y) {
    if (this.state.isDragging) return;
    this.state.isDragging = true;
    this.state.startX = x;
    this.state.startY = y;
    this.state.currentX = x;
    this.state.currentY = y;
    this.state.dragVector = { x: 0, y: 0 };
  }

  triggerMove(x, y) {
    if (!this.state.isDragging) return;
    this.state.currentX = x;
    this.state.currentY = y;
    
    // Direct aiming
    this.state.dragVector = {
      x: this.state.currentX - this.state.startX,
      y: this.state.currentY - this.state.startY
    };

    const maxDrag = 250;
    const mag = Math.sqrt(this.state.dragVector.x**2 + this.state.dragVector.y**2);
    if (mag > maxDrag) {
      this.state.dragVector.x = (this.state.dragVector.x / mag) * maxDrag;
      this.state.dragVector.y = (this.state.dragVector.y / mag) * maxDrag;
    }
  }

  triggerEnd() {
    if (!this.state.isDragging) return;
    this.state.isDragging = false;
    
    if (this.onShoot && this.state.dragVector) {
      const mag = Math.sqrt(this.state.dragVector.x**2 + this.state.dragVector.y**2);
      if (mag > 20) {
          this.onShoot(this.state.dragVector);
      }
    }
    this.state.dragVector = null;
  }
}
