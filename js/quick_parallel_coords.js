   // <-- BEGIN make_parallel_coords -->
    var make_parallel_coords = function(el_id, data, dims_to_include, series_key, colorscheme, dim_ranges) {

    var default_colorscheme = ['#800','#080','#008','#806900','#CC8600'];

      var m = [80, 160, 200, 160],
        w = 1280 - m[1] - m[3],
        h = 800 - m[0] - m[2];

      var x,
          foreground
      ;

      var y = {},
          species = [],
          traits = []
      ;

      var line
          , axis
      ;

      if ( d3.version.startsWith('4.') ) { 
        line = d3.line(),
        axis = d3.axisLeft()
        ;
      } else {
        line = d3.svg.line(),
        axis = d3.svg.axis().orient("left")
        ;
      }




      var make_set = function(arr) {
        var out = [];
        arr.forEach(function(el) {
          if (out.indexOf(el) == -1) {
            out.push(el);
          }
        })
        return out
      }

      var d_to_series_class = function(d, series_key, species) {
        return 'series' + species.indexOf(d[series_key]);
      }

      var string_to_series_class = function(str, species) {
        return 'series' + species.indexOf(str);
      }

      // Returns the path for a given data point.
      function path(d, traits) {
        return line(traits.map(function(p) { return [x(p), y[p](d[p])]; }));
      }

      function brushstart() {
        d3.event.sourceEvent.stopPropagation();
      }

      if ( d3.version.startsWith('4.') ) { 
            
        function brush() {
          var actives = [];
          svg.selectAll(".brush")
          // svg.selectAll(".axis .brush")
            .filter(function(d) {
              return d3.brushSelection(this);
            })
            .each(function(d) {
              actives.push({
                dimension: d,
                extent: d3.brushSelection(this)
              });
            });

            foreground.classed("fade", function(d) {
              
              return !actives.every(function(p) {
                // invert the screen coordinates via axis scale... and reverse bc the scale is upside-down
                // see https://github.com/d3/d3-scale/blob/master/README.md#continuous_invert
                var extent_inv = p.extent.map(function(e) { return y[p.dimension].invert(e) }).reverse()
                return d[p.dimension] >= extent_inv[0] && d[p.dimension] <= extent_inv[1];
              });

            });

        }
      } else {

        // Handles a brush event, toggling the display of foreground lines.
        function brush() {
          var actives = traits.filter(function(p) { return !y[p].brush.empty(); }),
              extents = actives.map(function(p) { return y[p].brush.extent(); });
          
          foreground.classed("fade", function(d) {
            return !actives.every(function(p, i) {
              return extents[i][0] <= d[p] && d[p] <= extents[i][1];
            });
          });
        }
      }

      d3.select('#' + el_id).html('')

      var svg = d3.select('#' + el_id)
      .append("svg:svg")
        .attr("width", w + m[1] + m[3])
        .attr("height", h + m[0] + m[2])
      .append("svg:g")
        .attr("transform", "translate(" + m[3] + "," + m[0] + ")")
      ;

      traits = [];

      series_key = series_key || Object.keys(data[0])[0];
      dims_to_include = dims_to_include || Object.keys(data[0]).slice(1,5);
      colorscheme = colorscheme || default_colorscheme;
      traits = dims_to_include
      var default_color = 'blanchedalmond'

      var row,r,k,sett,val,r_min,r_max;

      if (typeof dim_ranges !== 'undefined') {
        for (row in data) {
          for (k in data[row]) {

            sett = dim_ranges[k];

            if (typeof sett != 'undefined') {
              val = data[row][k];
              r = sett['range'];

              r_min = r[0];
              r_max = r[1];
              if (val < r_min) {
                data[row][k] = r_min;
              }
              if (val > r_max) {
                data[row][k] = r_max;
              }
            }
          }
        };
      }

      if ( d3.version.startsWith('4.') ) { 
        x = d3.scalePoint().domain(traits).range([0, w]);
      } else {
        x = d3.scale.ordinal().domain(traits).rangePoints([0, w]);
      }

      species = make_set(data.map(function(el) { return el[series_key]}));

      // Create a scale and brush for each trait.
      traits.forEach(function(d) {
        // Coerce values to numbers.
        data.forEach(function(p) { p[d] = +p[d]; });

        if ( d3.version.startsWith('4.') ) {
          y[d] = d3.scaleLinear()
              .domain(d3.extent(data, function(p) { return p[d]; }))
              .range([h, 0])
          ;

          y[d].brush = d3.brushY()
            .extent([[-10,0],[10,h]])
            .on("start", brushstart)
            .on("brush", brush)
            .on("end", brush)
          ;          

        } else {
          y[d] = d3.scale.linear()
              .domain(d3.extent(data, function(p) { return p[d]; }))
              .range([h, 0])
          ;

          y[d].brush = d3.svg.brush()
            .y(y[d])
            .on("brush", brush)
          ;
        }

        
     });

      // only show series that have individual colors
      var legend_data = species.slice(0, colorscheme.length)
      // add additional "other" element if needed
      if (species.length > colorscheme.length) {
        legend_data.push(null)
      };

      // Add a legend.
      var legend = svg.selectAll("g.legend")
          .data(legend_data)
        .enter().append("svg:g")
          .attr("class", "legend")
          .attr("transform", function(d, i) { return "translate(0," + (i * 20 + 584) + ")"; });

      legend.append("svg:line")
          .attr("class", function(d) { return string_to_series_class(d, species) })
          .attr("x2", 8)
          .attr('stroke', function(d, i) {
            if (species.length > colorscheme.length && i == legend_data.length - 1) {
              return default_color
            } else {
              return colorscheme[species.indexOf(d)]
            }
          })
      ;

      legend.append("svg:text")
        .attr("x", 12)
        .attr("dy", ".31em")
        .text(function(d, i) { 
          if (species.length > colorscheme.length && i == legend_data.length - 1) {
            return "Other"
          } else {
            return d;
          }
        })
      ;

      // Add foreground lines.
      foreground = svg.append("svg:g")
          .attr("class", "foreground")
        .selectAll("path")
          .data(data)
        .enter().append("svg:path")
          .attr("d", function(d) { return path(d, traits) })
          .attr("class", function(d) {
              return d_to_series_class(d, series_key, species)
          })
          .attr('stroke', function(d) {

            return colorscheme[species.indexOf(d[series_key])] || default_color
          })
      ;

      // Add a group element for each trait.
      var g = svg.selectAll(".trait")
          .data(traits)
        .enter().append("svg:g")
          .attr("class", "trait")
          .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
          // // TODO: unclear how this works, so commenting out for now
          // .call(
          //   d3.behavior.drag()
          //     .origin(function(d) { return {x: x(d)}; })
          //     .on("dragstart", dragstart)
          //     .on("drag", drag)
          //     .on("dragend", dragend)
          // )
      ;

      // Add an axis and title.
      g.append("svg:g")
          .attr("class", "axis")
          .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
        .append("svg:text")
          .attr("text-anchor", "middle")
          .attr("class", "title")
          .attr("y", -9)
          .text(String)
      ;

      g.append("div")
        .each(function(d) {d3.select(this).call(function() { return "<div></div>"})})

      // Add a brush for each axis.
      g.append("svg:g")
          .attr("class", "brush")
          .each(function(d) { d3.select(this).call(y[d].brush); })
        .selectAll("rect")
          .attr("x", -8)
          .attr("width", 16);

      function dragstart(d) {
        i = traits.indexOf(d);
      }

      function drag(d) {
        x.range()[i] = d3.event.x;
        traits.sort(function(a, b) { return x(a) - x(b); });
        g.attr("transform", function(d) { return "translate(" + x(d) + ")"; });
        foreground.attr("d", function(d) { return path(d, traits) });
      }

      function dragend(d) {
        x.domain(traits).rangePoints([0, w]);
        var t = d3.transition().duration(500);
        t.selectAll(".trait").attr("transform", function(d) { return "translate(" + x(d) + ")"; });
        t.selectAll(".foreground path").attr("d", function(d) { return path(d, traits) });
      }
    }
    // <-- END make_parallel_coords -->