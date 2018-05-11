function main()
{
	// Setup
	setup();

	// Keyboard
	document.onkeydown = keyPressed;
	
	// Experiment
	var path = new Path(
		new createjs.Point(0.0),
		new createjs.Point(600,600)
	);
	var ball = new Ball();
		ball.x = -200;
		ball.path = path;

	container.path = path;
	container.ball = ball;
	container.addChild( path, ball );
	container.on("tick", update ).bind(this);
}

function keyPressed( event )
{
	//Keycodes found at http://keycode.info
	if( event.keyCode == 32 )
	{
		console.log("enter key hit");
	}
}

function update( event )
{
	// redraw path to mouse
	var m = container.globalToLocal( stage.mouseX, stage.mouseY );
	container.path.end = m;
	// update ball
	container.ball.seek( m );
	container.ball.update();
}

(function() {
    function Ball( size = 10, color = "#FF0000")
    {
    	this.Container_constructor();
	
		var shape = new createjs.Shape();
			shape.graphics.f( color ).dc(0,0,size).ef();
		
		this.velocity = new createjs.Point(1,0);
		this.acceleration = new createjs.Point();

		this.friction = 1;
		this.mass = .1;
		this.lookAhead = 10;
		this.maxSpeed = 2;

		this.addChild( shape );
    }

	var p = createjs.extend( Ball, createjs.Container );
		p.update = function()
		{
			var c = this.velocity.clone();
				c.normalize(1);
				c = c.scale( this.lookAhead );

			var predict = this.getPosition().add( c );

			var a = predict.subtract( this.path.start );
			var b = this.path.end.subtract( this.path.start );

			// scale b to our theta
			b.normalize(1);
			b = b.scale( createjs.Point.dot(a, b) );

			var normalPoint = this.path.start.clone().add(b);
			var distance = createjs.Point.distance( predict, normalPoint );

			if(distance >= this.path.radius)
			{
				b.normalize(1);
				b = b.scale( this.lookAhead );
				var target = normalPoint.add( b );

				// this.seek( target );
			}

			// add friction
			// this.applyFriction();
			// add acceleration
			this.velocity = this.velocity.add( this.acceleration );
			this.acceleration = new createjs.Point();
			// apply velocity
			this.x += this.velocity.x;
			this.y += this.velocity.y;
		}
		p.seek = function( position )
		{
			var desired = position.subtract( this.getPosition() );
				desired.normalize( 1 );
				desired = desired.scale( this.maxSpeed );
			
			var steer = desired.subtract( this.velocity );
			
			this.applyForce( steer );
		}
		p.applyForce = function( force )
		{
			var f = force.divide( this.mass );
			this.acceleration = this.acceleration.add(force);
		}
		p.applyFriction = function()
		{
			var f = this.velocity.normalized().scale(-1);
				f.normalize(1);
				f = f.scale( this.friction );

			this.applyForce( f );			
		}
    window.Ball = createjs.promote( Ball, "Container" );
} () );

(function() {
    function Path( start = new createjs.Point(), end = new createjs.Point(), radius = 5)
    {
    	this.Container_constructor();
		
		this.start = start;
		this.end = end;
		this.radius = radius;

		this.shape = new createjs.Shape();
		
		this.addChild( this.shape );

		this.on("added", this.added );
		this.on("removed", this.removed );
    }

    var p = createjs.extend( Path, createjs.Container );
		p.added = function( event )
		{
			this.on("tick", this.update );
			this.off("added", this.added );

		}
		p.removed = function( event )
		{
			this.off("removed", this.removed );
			this.off("tick", this.update );
		}
		p.update = function( event )
		{
			var c = "#00FFFF";

			this.shape.graphics.c().s(c).ss(this.radius).mt(this.start.x,this.start.y).lt(this.end.x,this.end.y).es();			
		}

    window.Path = createjs.promote( Path, "Container" );
} () );