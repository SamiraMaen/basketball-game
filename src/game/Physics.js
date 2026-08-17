import Matter from 'matter-js';

export class PhysicsEngine {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.engine = Matter.Engine.create();
    this.world = this.engine.world;

    // Adjust gravity for a slightly floaty arcade feel
    this.engine.world.gravity.y = 1.2;

    this.ball = null;
    this.hoopParts = [];
    this.sensor = null;
    this.walls = [];

    this.createWalls();
  }

  createWalls() {
    // Floor (a bit below screen so we only see it when ball falls off)
    const floor = Matter.Bodies.rectangle(this.width / 2, this.height + 50, this.width * 2, 100, { 
      isStatic: true,
      label: 'floor'
    });
    
    // Left and right walls (invisible bounds)
    const leftWall = Matter.Bodies.rectangle(-50, this.height / 2, 100, this.height * 2, { isStatic: true });
    const rightWall = Matter.Bodies.rectangle(this.width + 50, this.height / 2, 100, this.height * 2, { isStatic: true });
    
    // Ceiling
    const ceiling = Matter.Bodies.rectangle(this.width / 2, -500, this.width * 2, 100, { isStatic: true });

    this.walls = [floor, leftWall, rightWall, ceiling];
    Matter.World.add(this.world, this.walls);
  }

  createBall(x, y, radius) {
    if (this.ball) {
      Matter.World.remove(this.world, this.ball);
    }
    
    this.ball = Matter.Bodies.circle(x, y, radius, {
      isStatic: true,
      restitution: 0.7, // Bounciness
      friction: 0.05,
      density: 0.05,
      label: 'ball'
    });
    
    Matter.World.add(this.world, this.ball);
  }

  createHoop(x, y, radius) {
    // Clean up old hoop
    if (this.hoopParts && this.hoopParts.length > 0) {
      this.hoopParts.forEach(part => Matter.World.remove(this.world, part));
      this.hoopParts = [];
    }
    if (this.sensor) {
      Matter.World.remove(this.world, this.sensor);
      this.sensor = null;
    }

    const rimThickness = 4;
    
    // Left rim point
    const leftRim = Matter.Bodies.circle(x - radius, y, rimThickness, {
      isStatic: true,
      restitution: 0.2,
      label: 'rim'
    });

    // Right rim point
    const rightRim = Matter.Bodies.circle(x + radius, y, rimThickness, {
      isStatic: true,
      restitution: 0.2,
      label: 'rim'
    });
    
    // Backboard (optional, behind the right rim)
    const backboard = Matter.Bodies.rectangle(x + radius + 10, y - 40, 10, 100, {
      isStatic: true,
      restitution: 0.5,
      label: 'backboard'
    });

    this.hoopParts = [leftRim, rightRim, backboard];

    // Scoring sensor: A rectangle just below the rim
    this.sensor = Matter.Bodies.rectangle(x, y + 15, radius * 1.5, 10, {
      isStatic: true,
      isSensor: true, // Doesn't collide, just triggers events
      label: 'scoreSensor'
    });

    Matter.World.add(this.world, [...this.hoopParts, this.sensor]);
  }

  update(dt) {
    // Cap dt between 0 and 33.33ms (30fps min) to prevent physics lag spikes
    const clampedDt = Math.min(Math.max(dt || 16.66, 0), 33.33);
    Matter.Engine.update(this.engine, clampedDt);
  }

  shootBall(velocity) {
    if (this.ball) {
      // Allow it to move freely now
      Matter.Body.setStatic(this.ball, false);
      Matter.Body.setVelocity(this.ball, velocity);
    }
  }

  resetBall(x, y) {
    if (this.ball) {
      Matter.Body.setPosition(this.ball, { x, y });
      Matter.Body.setVelocity(this.ball, { x: 0, y: 0 });
      Matter.Body.setAngularVelocity(this.ball, 0);
      Matter.Body.setStatic(this.ball, true); // Hold it in place until shot
    }
  }
}
