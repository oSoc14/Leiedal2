var Map = (function()
{
    // Parameters to quickly change maps
    var mapDivId = "mapdiv"; // The id of the div in which to display the map
    var mapServerURL = "http://www.govmaps.eu/arcgis/rest/services/WAR/WAR_begraafplaats/MapServer"; // The url of the server where the arcgis map is stored

    var graveId, defaultGraveDetailTop;
    var defaultWrapperHeight = '112px';

    function Map()
    {
      console.log('[Map.js] init');
      //load template
      $("#view2").html('').css('left',0).load("templates/map.html", function(){
        //set default height (no interefering with events from map)
        defaultGraveDetailTop = $(window).height()*0.55;
        setWrapperHeight(defaultWrapperHeight);
        bindEvents();
        //clickedGravePoint();
        buildMap();
      });
    }

    function filterKeyUp()
    {
        setWrapperHeight($(window).height());
        if(parseFloat($('#grave_detail').css('top')) < $(window).height()){
          closeGraveDetail();
        }
        if($("#scroller").hasClass('hide')){
          $("#scroller").removeClass('hide');
        }

        // Retrieve the input field text and reset the count to zero
        var name = $(this).val();

        if(name.length == 0){
          setWrapperHeight(defaultWrapperHeight);
        }

        // Loop through the comment list
        $(".names li").each(function(){

            if ($(this).text().search(new RegExp(name, "i")) < 0) {
                $(this).hide();
            } else {
                var substr = $(this).text().toLowerCase().split(name);
                var fixedstr = '';
                for(var i=0; i<substr.length; i++){
                  fixedstr += substr[i];
                  if(i != substr.length-1){
                    fixedstr += '<span>'+name+'</span>';
                  }
                }
                $(".names .border_radius_bottom").removeClass('border_radius_bottom');
                $(this).html(fixedstr).show().addClass("border_radius_bottom");
            }
        });

        if(name == 0){
            $(".names li").each(function(){
                $(this).hide();
            });
        }
    }

    function buildMap(e){
      console.log('[Map.js] buildMap');
      require([
        // Required to build the map and fetch the layer with graves
        "esri/map",
        "esri/arcgis/utils",
        "esri/layers/FeatureLayer",
        "esri/SpatialReference",
        "esri/geometry/Point",
        "esri/geometry/ScreenPoint",
        // Required to draw the circle when clicking
        "esri/tasks/query",
        "esri/geometry/Circle",
        "esri/graphic", "esri/InfoTemplate",
        "esri/symbols/SimpleMarkerSymbol",
        "esri/symbols/SimpleLineSymbol",
        "esri/symbols/SimpleFillSymbol",
        "esri/renderers/SimpleRenderer",
        "esri/config",
        "esri/Color",
        // Required to wait for the Document Object to be ready before executing
        "dojo/domReady!"
        ], function(Map,
                    arcgisUtils,
                    FeatureLayer,
                    SpatialReference,
                    Point,
                    ScreenPoint,
                    Query,
                    Circle,
                    Graphic,
                    InfoTemplate,
                    SimpleMarkerSymbol,
                    SimpleLineSymbol,
                    SimpleFillSymbol,
                    SimpleRenderer,
                    esriConfig,
                    Color) {

          // Fetch the graphics layers and add them to the map
          Map = new Map(mapDivId);
          var layer = new esri.layers.ArcGISTiledMapServiceLayer(mapServerURL);
          Map.addLayer(layer);

          // Fetch the FeatureLayer which contains the gravepoints
          var tombLayerURL = mapServerURL + "/0";
          var featureLayer = new FeatureLayer(tombLayerURL);

          Map.showZoomSlider();
          Map.centerAndZoom(new Point(5050, 150, new SpatialReference({wkid:31370})), 8);

          // Create the circle to display when clicking on the map
          var circleSymb = new SimpleFillSymbol(
            SimpleFillSymbol.STYLE_NULL,
            new SimpleLineSymbol(new Color([255, 0, 0]), 2), new Color([0, 0, 0, 0])
          );
          var circle;

          // The function to execute when clicking on the map
          Map.on("click", function(evt){
            // Create the geometric circle in which to search for graves
            circle = new Circle({
              center: evt.mapPoint,			// Centered on the point of clicking
              radius: 0.35,							// Radius in which to look for graves
              radiusUnit: "esriMeters"	// The unit of the radius, in this case meters
            });
            // Clear the graphics on the map and add the new circle
            Map.graphics.clear();
            Map.infoWindow.hide();
            var graphic = new Graphic(circle, circleSymb);
            Map.graphics.add(graphic);

            // Create a query for the FeatureLayer to search for graves within the perimeter
            var query = new Query();
            query.geometry = circle.getExtent();
            featureLayer.queryFeatures(query, selectInBuffer);
          });

          Map.on("click", function(evt) {
            console.log('ClickLocation: ' + evt.mapPoint.x+', '+evt.mapPoint.y);
            Map.centerAt(evt.mapPoint);
            clickedGravePoint();
          })

          // The selection function which fetches the GraveID from the FeatureLayer
          function selectInBuffer(response){
            var features = response.features;
            if(features.length > 0) {
              var objectId = features[0].attributes.OBJECTID;
              $.ajax({
                url: mapServerURL + "/0/query?where=OBJECTID=" + objectId + "&outFields=grafcode&f=json",
                async:false
              })
                .done(function(data) {
                  var json = $.parseJSON(data);
                  var code = json.features[0].attributes.grafcode;
                  graveId = code;
                });

              console.log("GraveId: " + graveId);

            }
          }
      });
    }

    function goToGrave(graveId) {
      var graveX;
      var graveY;
      $.ajax({
        url: mapServerURL + "/0/query?where=grafcode='" + graveId + "'&f=json",
        async:false
      })
        .done(function(data) {
          var json = $.parseJSON(data);
          console.log(data);
          graveX = json.features[0].geometry.x
          graveY = json.features[0].geometry.y
        });
      console.log(graveX + ', ' + graveY);
      //Map.centerAt(new esri.Point(graveX, graveY, new esri.SpatialReference( {wkid:31370} ) ));
    }

    function clickedGravePoint(e){
      console.log('[Map.js] clickedGravePoint');
      setWrapperHeight($(window).height());
      if(e){e.preventDefault();}
        if($("#grave_detail").hasClass('hide')){
          $("#grave_detail").removeClass('hide');
        }
        //load persons
        //TODO:als er geen personen zijn verwijder $('#people')
        $('#grave_detail').css('top', '100%').animate({
            top: defaultGraveDetailTop
        }, 600);
    }

    function closeGraveDetail(e){
      if(e){e.preventDefault();}
      $('#grave_detail').animate({
          top: $(window).height()+'px'
      }, 600, function(e){
        if(!$("#filter").is(":focus")){
          setWrapperHeight(defaultWrapperHeight);
        }
      });
    }

    function tappedBackButton(e){
      console.log("tappedBackButton");
      if(e){e.preventDefault();}
      $(window).trigger("BACK_TO_HOME");
    }

    function bindEvents(){
      $('#close_detail').on('click', closeGraveDetail);
      $('#close_detail').on('touchend', closeGraveDetail);
      $('#back_button').on('click', tappedBackButton);
      $('#back_button').on('touchend', tappedBackButton);
      $("#filter").on('keyup', filterKeyUp);
    }

    //utilities
    function setWrapperHeight(height){
      $('#wrapper').css('height', height);
    }

    return Map;

})();