function main()
{
	// Setup
	setup();

	// Keyboard
	document.onkeydown = keyPressed;
	
	// Experiment
	var path = new Path({x:0,y:0},{x:600,y:600});

	container.path = path;
	container.addChild( path );
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
	var m = container.globalToLocal( stage.mouseX, stage.mouseY );
	container.path.end = m;
}

(function() {
    function Ball( size = 10, color = "#FF0000")
    {
    	this.Container_constructor();
	
		var shape = new createjs.Shape();
			shape.this.shape.graphics.f( color ).dc(0,0,size).ef();
		
		this.addChild( this.shape );
    }

    var p = createjs.extend( Ball, createjs.Container );
    window.Ball = createjs.promote( Ball, "Container" );
} () );

(function() {
    function Path( start = new createjs.Point(), end = new createjs.Point())
    {
    	this.Container_constructor();
		
		this.start = start;
		this.end = end;

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
			var s = 2;
			this.shape.graphics.c().s(c).ss(s).mt(this.start.x,this.start.y).lt(this.end.x,this.end.y).es();			
		}

    window.Path = createjs.promote( Path, "Container" );
} () );