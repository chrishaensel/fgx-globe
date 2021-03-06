	if ( ! Detector.webgl ) { Detector.addGetWebGLMessage(); }

	var FGx = FGx || {};
	FGx.callbackCount = 0;
	FGx.startTime = new Date();

	init();
	animate();

	function init() {
	
		if ( ! Detector.webgl ) {
			FGx.renderer = new THREE.CanvasRenderer( { antialias: true } );
		} else {
			FGx.renderer = new THREE.WebGLRenderer( { antialias: true } );
		}

		var light, geometry, texture, material, mesh;

		FGx.renderer.setSize( window.innerWidth, window.innerHeight );
		FGx.renderer.shadowMapEnabled = true;
		document.body.appendChild( FGx.renderer.domElement );
		FGx.scene = new THREE.Scene();

		FGx.camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 1000 );
		FGx.camera.position.set(200, 100, 0);
		FGx.controls = new THREE.TrackballControls( FGx.camera, FGx.renderer.domElement );
		FGx.controls.minDistance = 58;
		FGx.controls.maxDistance = 150;

		FGx.stats = new Stats();
		FGx.stats.domElement.style.cssText = 'position: absolute; top: 0px; zIndex: 100; ';
		document.body.appendChild( FGx.stats.domElement );

		window.addEventListener( 'resize', onWindowResize, false );
		document.addEventListener( 'mouseup', onDocumentMouseUp, false );
		document.addEventListener( 'DOMMouseScroll', onDocumentMouseUp, true );
		document.addEventListener( 'mousewheel', onDocumentMouseUp, true );
		document.addEventListener( 'mousemove', onDocumentMouseMove, false );

//  Helpers - Lights
		mesh = new THREE.AxisHelper( 100 ); // r=x g=y b=z
		FGx.scene.add( mesh );

		light = new THREE.DirectionalLight( 0xffffff, 1 );
		light.position.set( 1, 1, 1 ).normalize();
		FGx.scene.add( light );

		light = new THREE.DirectionalLight( 0xffffff, 1 );
		light.position.set( -1, -1, -1 ).normalize();
		FGx.scene.add( light );

		light = new THREE.AmbientLight( 0xffffff);
		light.color.setHSL( 0.1, 0.5, 0.3 );
		FGx.scene.add( light );

		light = new THREE.SpotLight( 0xffffff, 1.5 );
		light.position.set( 400, 0, 0 );
		light.castShadow = true;

		light.shadowMapWidth = 1024;
		light.shadowMapHeight = 1024;
		light.shadowCameraNear = 300;
		light.shadowCameraFar = 600;
		light.shadowCameraFov = 20;
		FGx.scene.add( light );
// light.shadowCameraVisible = true;

// Assets
		var texture = THREE.ImageUtils.loadTexture( '../../textures/earth_atmos_2048.jpg');
		material = new THREE.MeshPhongMaterial( { map: texture, shading: THREE.SmoothShading } );

		geometry = new THREE.SphereGeometry( 50, 80, 50 );
		// material = new THREE.MeshNormalMaterial( { shading: THREE.SmoothShading });
		var globe = new THREE.Mesh( geometry, material );
		FGx.scene.add( globe );

		texture = THREE.ImageUtils.loadTexture( '../../textures/stars-2048x1024.png');  // http://paulbourke.net/miscellaneous/starfield/
		texture = THREE.ImageUtils.loadTexture( '../../textures/stars-8192x4096.png');
		material = new THREE.MeshBasicMaterial( { map: texture, side: THREE.BackSide } );

		geometry = new THREE.SphereGeometry( 155, 80, 50 );
		// material = new THREE.MeshNormalMaterial( { shading: THREE.SmoothShading });
		var stars = new THREE.Mesh( geometry, material );
		FGx.scene.add( stars );
		
		initText();
		loadAirports('../../apt1000/apt1000-icao.csv');
	}

	function loadAirports( fname ) {
		FGx.xmlhttp = new XMLHttpRequest();
		FGx.xmlhttp.open( 'GET', fname, true );
		FGx.xmlhttp.onreadystatechange = callbackAirports;
		FGx.xmlhttp.send( null );
	}

	function callbackAirports() {
		var airport, ap;
		if ( FGx.xmlhttp.readyState == 4  ) {
			var dataLines = FGx.xmlhttp.responseText;
			dataLines = dataLines.split(/\r\n|\n/);
			var dataLength = dataLines.length - 1;
			var separator = ',';
			FGx.airports = {};
			FGx.airport = function() {}
			for ( var i = 1; i < dataLength; i++ ) {
				ap = dataLines[i].split( separator );
				FGx.airports[ ap[0] ] = new FGx.airport();
				airport = FGx.airports[ap[0]];
				airport.data = ap;
				airport.position = calcPosition( ap[2], ap[3], 50 );
			}
			FGx.airportKeys = Object.keys( FGx.airports );
			FGx.runways = [];
			FGx.navaids = [];
			onDocumentMouseUp();
			loadNavaids( '../../apt1000/apt1000-nav.csv' );
console.log( new Date() - FGx.startTime );
		} else {
			FGx.callbackCount++;
console.log('waiting...');
			statusBar.innerHTML = stbHTML + ' Responses: ' + FGx.callbackCount;
		}
	}
	
	function loadNavaids( fname ) {
		FGx.xmlhttp = new XMLHttpRequest();
		FGx.xmlhttp.open( 'GET', fname, true );
		FGx.xmlhttp.onreadystatechange = callbackNavaids;
		FGx.xmlhttp.send( null );
	}	
	
	function callbackNavaids() {
		if ( FGx.xmlhttp.readyState == 4  ) {
			var dataLines = FGx.xmlhttp.responseText;
			dataLines = dataLines.split(/\r\n|\n/);
			var dataLength = dataLines.length;
			var separator = ',';
			FGx.navaids = [];
			for ( var i = 0; i < dataLength; i++ ) {
				FGx.navaids.push( dataLines[i].split( separator ) );
			}
// console.log( navaids );
		} 
	}	

	function v(x,y,z){ return new THREE.Vector3(x,y,z); }
	function cos(a){return Math.cos(a);} function sin(a){return Math.sin(a);}
	var pi = Math.PI, d2r = Math.PI / 180, origin = v( 0, 0, 0);

	function calcPosition( lat, lon, rad ) {
		return  v(
			rad * cos( lat * d2r ) * sin( 0.5 * pi + lon * d2r),
			rad * sin( lat * d2r ),
			rad * cos( lat * d2r ) * cos(  0.5 * pi + lon * d2r)
		);
	}

	function animate() {
		requestAnimationFrame( animate );
		FGx.controls.update();
		FGx.renderer.render( FGx.scene, FGx.camera );
		FGx.stats.update();
	}

	function onWindowResize() {
		windowHalfX = window.innerWidth / 2;
		windowHalfY = window.innerHeight / 2;
		FGx.camera.aspect = window.innerWidth / window.innerHeight;
		FGx.camera.updateProjectionMatrix();
		FGx.renderer.setSize( window.innerWidth, window.innerHeight );
	}

	function onDocumentMouseUp() {
		if ( FGx.airports == undefined ) return;
		if ( FGx.objects != undefined ) { FGx.scene.remove( FGx.objects ); }
		var camDistance, ils, nearby, ap, airport, position, distance, cnt = 0;
		FGx.objects = new THREE.Object3D();
		material = new THREE.MeshNormalMaterial();
		var camDistance = FGx.camera.position.distanceTo( v( 0, 0, 0 ) );
// console.log( camDistance);
		var scale = 0.0025 * camDistance;
		geometry = new THREE.CubeGeometry( scale, scale, 5 * scale );
		if ( camDistance > 130 ) { 
			ils = 3;
			nearby = 500;
		} else if ( camDistance > 90 ) { 
			ils = 2;
			nearby = 100;
		} else if ( camDistance > 70 ) { 
			ils = 1;
			nearby = 50;
		} else {
			ils = 0;
			nearby = 20;
		}
		for (var i = 0, len = FGx.airportKeys.length; i < len; i++) {
			ap = FGx.airports[ FGx.airportKeys[i] ];
			distance = ap.position.distanceTo( FGx.camera.position );
			if ( ap.data[5] >= ils && distance < nearby ) {
				airport = new THREE.Mesh( geometry, material );
				airport.position = ap.position;
				airport.lookAt( v( 0, 0, 0 ) );
				airport.ap = ap;
				FGx.objects.add( airport );
				cnt++;
			}
		}
		FGx.scene.add( FGx.objects );
		var sum = FGx.airportKeys.length + FGx.runways.length + FGx.navaids.length
		statusBar.innerHTML = stbHTML +
			'Airports: ' + FGx.airportKeys.length + ' + Runways: ' + FGx.runways.length + ' + Navaids: ' + FGx.navaids.length + ' = ' + sum + '<br>' +
			'Distance: ' + (camDistance * 80 - 4000).toFixed(0) + ' &nbsp;Minimum ILS for display: ' + ils + ' &nbsp;Airports visible: ' + cnt;
	}
	
	function findNavaid( airport ) {
		var navaid, position, distance;
		sbrBody.innerHTML = '';
// console.log(airport);
		for (var i = 0, len = FGx.navaids.length; i < len; i++) {
			navaid = FGx.navaids[i];
			position = calcPosition( navaid[1], navaid[2], 50 );
			distance = airport.position.distanceTo( position );
			if ( distance < 0.05) {
				sbrBody.innerHTML += '<p><b>Navaid data</b>:<br>' + 
					'Type: ' + navaid[0] + '<br>' +
					'Latitude: ' + parseFloat(navaid[1]).toFixed(4) + '&deg<br>' +
					'Longitude: ' + parseFloat(navaid[2]).toFixed(4) + '&deg<br>' +
					'Feet: ' + navaid[3] + '\'<br>' +
					'Frequency: ' + navaid[4] + '<br>' +
					'Range: ' + navaid[5] + 'nm<br>' +
					'Bearing: ' + navaid[6] + '&deg<br>' +
					'ID: ' + navaid[7] + '<br>' +
					'ICAO: ' + navaid[8] + '<br>' +
					'Runway: ' + navaid[9] + '<br>' +
					'Name: ' + navaid[10] + '<br>' +
				'';
			}
			// if ( navaid[10] != undefined && navaid[10].indexOf(',') > 0 ) {console.log('Offending comma on line:', i); }
		} 
	}	

	function onDocumentMouseMove( event ) {
		if ( FGx.objects == undefined ) return;
		var mouse = { x: -1, y: -1 };
		var projector = new THREE.Projector();
		// event.preventDefault();
		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

		var vector = new THREE.Vector3( mouse.x, mouse.y, 0.5 );
		projector.unprojectVector( vector, FGx.camera );
		var raycaster = new THREE.Raycaster( FGx.camera.position, vector.sub( FGx.camera.position ).normalize() );
		var intersects = raycaster.intersectObjects( FGx.objects.children );

		if ( intersects.length > 0 ) {
			if ( intersected != intersects[ 0 ].object ) { // not same one
				var intersected = intersects[ 0 ].object;
			}
			headsUp.style.left = 10 + 0.5 * window.innerWidth + mouse.x * 0.5 * window.innerWidth + 'px';
			headsUp.style.bottom = 10 + 0.5 * window.innerHeight + mouse.y * 0.5 * window.innerHeight+ 'px';
			headsUp.style.display = 'block';
			var ap = intersected.ap.data;
			headsUp.innerHTML =  'ICAO: ' + ap[0] + 
				'<br>Name: ' + ap[1].replace(/["']/g, "") + 
				'<br>Latitude: ' + parseFloat(ap[2]).toFixed(4) + '&deg' +
				'<br>Longitude: ' + parseFloat(ap[3]).toFixed(4) + '&deg' +
				'<br>Runways: ' + ap[4] + '<br>ILS: ' + ap[5] + 
			'<br>';
			// findRunway( ap );
			findNavaid( intersected.ap );
		} else {
			headsUp.style.display = 'none';
		}
	}