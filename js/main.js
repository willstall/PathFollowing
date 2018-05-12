function main()
{
	// Setup
	setup();

	// Keyboard
	document.onkeydown = keyPressed;
	
	// Experiment

	var path = new Path(50);
		path.alpha = .15;

	createRandomPath( path );

	var ball = new Ball(30,"#00FFFF");
		ball.x = stage.width * -.25;
		//ball.applyForce( new createjs.Point(1,0) );

	container.path = path;
	container.ball = ball;
	container.addChild( path, ball );
	container.on("tick", update ).bind(this);
	stage.on("stagemousedown", mousedown).bind(this);
}

function keyPressed( event )
{
	//Keycodes found at http://keycode.info
	if( event.keyCode == 32 )
	{
		console.log("enter key hit");
	}
}

function createRandomPath( path )
{
	var step = 100;
	var amount = 20;
	var origin = step * amount * -.5;

	path.clearPoints();

	for(var i = 0; i < amount; i ++)
	{
		var x = origin + i * step;//* 2 + (i * Math.random() * step);
		var y = createjs.Math.randomRange(-step*2,step*2);
		var p = path.addPoint(x,y);

		if(i == 11)
			var last = p;
	}
}

function mousedown( event )
{
	// var m = container.globalToLocal( stage.mouseX, stage.mouseY );
	// 	m.normalize(1);
	// 	m = m.scale(2);
	// container.ball.applyForce(m);

	// Reset Ball
	container.ball.x = stage.width * -.25;
	container.ball.y = 0;
	// Create New Path
	createRandomPath( container.path );
}

function update( event )
{
	// seek to path
		container.ball.seekToPath( container.path );
	// update ball
		container.ball.update();
}

(function() {
    function Ball( size = 30, color = "#FF0000")
    {
    	this.Container_constructor();
	
		var shape = new createjs.Shape();
			shape.graphics.f( color ).dr(size * -.5, size * -.25, size, size * .5).ef();
		
		this.velocity = new createjs.Point(0,0);
		this.acceleration = new createjs.Point();

		this.friction = 0;//.01;
		this.mass = 1;
		this.minSpeed = 1;		
		this.maxSpeed = 7;
		this.lookAhead = this.maxSpeed * 5;
		this.maxSteerForce = this.maxSpeed * .35;

		this.addChild( shape );
    }

	var p = createjs.extend( Ball, createjs.Container );
		p.getNormalPoint = function( p, a, b )
		{
			var ap = p.subtract( a );
			var ab = b.subtract( a );

			ab.normalize(1);
			ab = ab.scale( createjs.Point.dot(ap,ab) );

			var normalPoint = a.add(ab);
			return normalPoint;
		}
		p.seekToPath = function( path )
		{
			var predict = this.velocity.clone();
				predict.normalize(1);
				predict = predict.scale( this.lookAhead );

			var predictPosition = this.getPosition().add( predict );			
			var recordDistance = 100000000000000;
			var target = null;

			for( var i = 0; i < path.points.length-1; i++)
			{
				var a = path.points[i];
				var b = path.points[i+1];

				var normalPoint = this.getNormalPoint( predictPosition, a, b );

				if( normalPoint.x < a.x || normalPoint.x > b.x )
					normalPoint = b;

				var distance = createjs.Point.distance( predictPosition, normalPoint );
				if( distance < recordDistance )
				{					
					var direction = b.subtract( a );
						direction.normalize(1);
						// direction = direction.scale(this.lookAhead * .1);	// used for scaling the direction a little...their example had like a .65

					target = normalPoint.add( direction );
					
					recordDistance = distance;
					// console.log("new distance");
				}
			}
			
			this.arrive( target );

			// if(recordDistance > path.radius)
			// {
			// 	console.log("seek target");
			// 	this.seek( target );
			// }
			// var normalPoint = this.getNormalPoint( predictPosition, path.start, path.end );
			// var direction = path.end.subtract( path.start );
			// 	direction.normalize(1);
			// 	direction = direction.scale(this.lookAhead * .5 );

			// var target = normalPoint.add( direction );

			// var distance = createjs.Point.distance( normalPoint, predictPosition );

			// if(distance > path.radius)
			// {
			// 	this.seek( target );
			// }			
		}
		p.update = function()
		{
			// add friction
			this.applyFriction();
			// add acceleration
			this.velocity = this.velocity.add( this.acceleration );
			this.acceleration = new createjs.Point();
			// apply velocity
			this.x += this.velocity.x;
			this.y += this.velocity.y;
			// rotate
			this.rotation = createjs.Math.lerp(this.rotation,this.velocity.heading(), .2);
			// screen wrap
			if( this.x > this.stage.width * .51)
				this.x = this.stage.width * -.5;
			else if( this.x < this.stage.width * -.51)
				this.x = this.stage.width * .5;
		}
		p.arrive = function( position )
		{
			var desired = position.subtract( this.getPosition() );
			var d = desired.length();
			
			desired.normalize(1);	

			var approachRadius = 100;
			if(d < approachRadius)
			{
				var speed = createjs.Math.mapRange(d,0,approachRadius,this.minSpeed,this.maxSpeed);
				desired = desired.scale( speed );
			}else{
				desired = desired.scale( this.maxSpeed );
			}
			
			var steer = desired.subtract( this.velocity );
				steer.normalize(this.maxSteerForce);

			this.applyForce( steer );			
		}
		p.seek = function( position )
		{
			// very clearly need a better seeking algorithm
			var desired = position.subtract( this.getPosition() );
				desired.normalize( 1 );
				desired = desired.scale( this.maxSpeed );
			
			var steer = desired.subtract( this.velocity );
				steer.normalize(this.maxSteerForce);

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
    function Path( radius = 5)
    {
    	this.Container_constructor();

		this.radius = radius;

		this.shape = new createjs.Shape();
		this.points = [];

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

			//this.shape.graphics.c().s(c).ss(this.radius).mt(this.start.x,this.start.y).lt(this.end.x,this.end.y).es();		
			
			var g = this.shape.graphics;
				g.c().s(c).ss(this.radius*2);

			if( this.points.length < 1)
				return;

			g.mt(this.points[0])

			// console.log( this.points.length);
			for(var i = 1; i < this.points.length; i++)
			{
				var p = this.points[i];
				g.lt(p.x,p.y);
			}
			g.es();

			this.shape.graphics = g;
		}
		p.addPoint = function( x, y )
		{
			var p = new createjs.Point(x,y);
			this.points.push( p );
			return p;
		}
		p.removePoint = function( p )
		{
			var points = this.points.filter( x => x != p); //this.points.map( x => x != p );
			console.log(points);
			this.points = points;
			return points;
		}
		p.clearPoints = function()
		{
			this.points = [];
			return this.points;
		}

    window.Path = createjs.promote( Path, "Container" );
} () );