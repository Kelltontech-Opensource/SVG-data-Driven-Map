    $(function(){
        var svg = d3.select("#map")
                    .append("svg")
                    .attr("width","936px")
                    .attr("height","604px")
                    .attr("style","background: url('images/map.png'); background-size: 936px 604px; background-repeat: no-repeat;");
            
        $.getJSON("js/laneData.json", function(result) {
            popMap(result, svg, function(){
                
                hidePaths(0);
                $(".marker").mouseover(function(e) {
                    hidePaths(200);
                    drawBigCircle(this.id, 1.3);
                    drawPaths(this.id);
                });

                $(".marker").mouseleave(function(){
                    makeCircleNormal(this.id, 1.3);
                    hidePaths(200);
                });

                $(".marker").click(function(e) {
                    var x = e.pageX;
                    x = x+15;
                    var y = e.pageY;
                    showToolTip(this.id, x, y);
                });
                
                // Function to hide popups if clicked anywhere outside the circles
                $('body').click(function(e) {
                    if(e.target.getAttribute('class') != 'transparent-circle' && $("#tool-tip").is(':visible')) {
                        $("#tool-tip").fadeOut('slow', function() {
                            $(".tool-tip-content").hide();
                        });
                    } 
                });
            });
        });
    });
        
        function hidePaths(speed){
            $(".lane").attr('display', 'none');
            $(".lane").each(function(index,path){
                var length = 1000; 
                $(path).velocity({"stroke-dasharray": length, "stroke-dashoffset": length}, speed);
            });
        }
        
        function drawBigCircle(circleId, relativeSize) {
              var transform = $("#"+circleId).attr('transform');
              
              transform = transform.split('scale')[0];
              transform = transform.replace ( /[^\d.,-]/g, '' );
              transform = transform.split(',');
              
              var x = parseInt(transform[0]) + parseInt((1 - relativeSize) * 100);
              var y = parseInt(transform[1]) + parseInt((1 - relativeSize) * 100);
              
              $("#" + circleId).attr('transform', 'translate(' + x + ',' + y + ') scale(' + relativeSize + ')');
        }
        
        function makeCircleNormal(circleId, relativeSize) {
              var transform = $("#"+circleId).attr('transform');
              transform = transform.split('scale')[0];              
              transform = transform.replace ( /[^\d.,-]/g, '' );
              transform = transform.split(',');
              
              var x = parseInt(transform[0]) + parseInt((relativeSize - 1) * 100);
              var y = parseInt(transform[1]) + parseInt((relativeSize - 1) * 100);
              $("#" + circleId).attr('transform', 'translate(' + x + ',' + y + ') scale(1)');
        }
        
        function drawPaths(circleId) {
            $("." + circleId + " path").removeAttr('display');
            $("." + circleId + " path").velocity({"stroke-dashoffset": "0"}, 1000);
        }
        
        function showToolTip(circleId, x, y) {
            if($("#tip-" + circleId).is(':visible')) {
               $("#tool-tip").fadeOut('slow', function() {
                  $(".tool-tip-content").hide();
               });
            }
            else {
                $("#tool-tip").fadeOut('slow', function() {
                  $(".tool-tip-content").hide();
                  $("#tip-" + circleId).show();
                  $('#tool-tip').css({'top':y,'left':x}).fadeIn('slow');
               });
            }
        }
        
        function percentToRadians(percent) {
            return ((percent*2)/100) * Math.PI;
        }

        function radiansToCart(radians) {
            var x = 100 + (15 * Math.cos(radians));
            var y = 100 + (15 * Math.sin(radians));

            return {x:x, y:y};
        }

    
    function popMap(data, svg, callback) {
        
                
                var origins = svg.selectAll("g.marker")
                    .data(data);
                
                origins.enter()
                    .append("g")
                    .attr("transform", function(d) { 
                        return "translate(" + d.x + "," + d.y +")"; 
                    })
                    .attr("id", function(d) { return d.code; })
                    .attr("class","marker")
                    .attr("stroke-width","5")
                    .attr("fill","none");
            
                var sections = origins.selectAll("path")
                    .data(function(d) { 
                        var green = {};
                        var yellow = {};
                        var red = {};
                        
                        green.color = "rgb(37,223,0)";
                        green.startRadians = 0;
                        green.stopRadians = percentToRadians(d.greens);
                        green.arc = (green.stopRadians - green.startRadians) <= Math.PI ? 0 : 1;
                        
                        yellow.color = "rgb(255,255,5)";
                        yellow.startRadians = green.stopRadians;
                        yellow.stopRadians = yellow.startRadians + percentToRadians(d.yellows);
                        yellow.arc = (yellow.stopRadians - yellow.startRadians) <= Math.PI ? 0 : 1;
                        
                        red.color = "rgb(255,0,73)";
                        red.startRadians = yellow.stopRadians;
                        red.stopRadians = red.startRadians + percentToRadians(d.reds);//2 * Math.PI;
                        red.arc = Math.abs((red.stopRadians - red.startRadians)) <= Math.PI ? 0 : 1;
                        
                        return [green, yellow, red];
                    });
            
                sections.enter()
                    .append("path")
                    .attr("d",function(d) {
                        var start = radiansToCart(d.startRadians);
                        var stop = radiansToCart(d.stopRadians);
                        
                        var path = "M " + start.x + "," + start.y + 
                                   " A 15,15 0 " + d.arc + ",1 " +
                                   stop.x + "," + stop.y;
                           
                        return path;
                    })
                    .attr("stroke", function(d){ return d.color; });
            
                var text = origins.append("text")
                    .attr("dy",".35em")
                    .attr("fill","#000")
                    .attr("id",function(d) { 
                        return "txt-" + d.code;
                    })
                    .attr("x","100")
                    .attr("y","100")
                    .attr("font-size","12px")
                    .attr("text-anchor","middle")
                    .text(function(d) { return d.code; });
            
                var hoverCircle = origins.append("circle")
                        .attr("cx","100")
                        .attr("cy","100")
                        .attr("r","19")
                        .attr("class","transparent-circle")
                        .style("stroke","none")
                        .style("fill","rgba(0, 0, 0, 0)");
                
                var laneGroups = svg.selectAll("g.lanes")
                    .data(data);
            
                laneGroups.enter()
                    .append("g")
                    .attr("class","lane")
                    .attr("class", function(d) { return d.code; });

                var lanes = laneGroups.selectAll("path")
                    .data(function(d) { return d.destinations; })
                    .enter()
                    .append("path")
                    .attr("fill","none")
                    .attr("stroke", function(d) {
                        if(d.strength === 2) {
                            return "rgb(37,223,0)";
                        }
                        if(d.strength === 1) {
                            return "rgb(255,255,5)";
                        }
                        if(d.strength === 0) {
                            return "rgb(255,0,73)";
                        }
                    })
                    .attr("stroke-width", function(d) {
                    	if(d.volume === 1) {
                    		return 6;
                    	}
                    	if(d.volume === 2) {
                    		return 4;
                    	}
                    	if(d.volume === 3) {
                    		return 2;
                    	}
                    })
                    .attr("class","lane")
                    .attr("d", function(d) {
                        return "M " + d.x + "," + d.y + " " + d.path;
                    });
                
                
                callback();
                
    }  