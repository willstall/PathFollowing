function main()
{
	// Setup
	setup();

	// Keyboard
	document.onkeydown = keyPressed;
	
	// Experiment
	var step = 50;
	var amount = 30;
	var origin = step * amount * -.5;
	var path = new Path(30);
		path.alpha = .15;
	for(var i = 0; i < amount; i ++)
	{
		var x = origin + i * step;//* 2 + (i * Math.random() * step);
		var y = createjs.Math.randomRange(-step*2,step*2);
		path.addPoint(x,y);
	}
	var ball = new Ball(30,"#00FFFF");
		ball.x = -200;

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

function mousedown( event )
{
	// var m = container.globalToLocal( stage.mouseX, stage.mouseY );
	// 	m.normalize(1);
	// 	m = m.scale(2);

	// container.ball.applyForce(m);
	container.ball.x = container.ball.y = 0;
}

function update( event )
{
	// redraw path to mouse
	var m = container.globalToLocal( stage.mouseX, stage.mouseY );
	// container.path.end = m;
	// seek
	// container.ball.seek( m );
	// container.ball.seekToPath( container.path );
	// update ball
	container.ball.update();
}

(function() {
    function Ball( size = 30, color = "#FF0000")
    {
    	this.Container_constructor();
	
		var shape = new createjs.Shape();
			shape.graphics.f( color ).dr(size *-.5,size*-.25,size,size*.5).ef();
		
		this.velocity = new createjs.Point(0,0);
		this.acceleration = new createjs.Point();

		this.friction = 0;//.01;
		this.mass = .1;
		this.lookAhead = 25;
		this.maxSpeed = 2;

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
			var normalPoint = this.getNormalPoint( predictPosition, path.start, path.end );
			var direction = path.end.subtract( path.start );
				direction.normalize(1);
				direction = direction.scale(this.lookAhead * .5 );

			var target = normalPoint.add( direction );

			var distance = createjs.Point.distance( normalPoint, predictPosition );

			if(distance > path.radius)
			{
				this.seek( target );
			}			
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
			this.rotation = createjs.Math.lerp(this.rotation,this.velocity.heading(), .1 );
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
				g.c().s(c).ss(this.radius);

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
		}
		p.removePoint = function( p )
		{
			var points = this.points.filter( x => x != p); //this.points.map( x => x != p );
			console.log(points);
			this.points = points;
		}
		p.removePoints = function()
		{
			this.points = [];
		}

    window.Path = createjs.promote( Path, "Container" );
} () );