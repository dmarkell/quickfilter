// Various formatters.
  var formatNumberGeneral = d3.format("d"),
    formatNumber = d3.format(",d"),
    formatNumberPrec1 = d3.format(",.1f"),
    formatNumberPrec0 = d3.format(",.0f"),
    formatPrec0 = d3.format(".0f"),
    formatPrec1 = d3.format(".1f"),
    formatPrec2 = d3.format(".2f"),
    formatPrec3 = d3.format(".3f"),
    formatChange = d3.format("+,d"),
    formatPercent2 = d3.format(".2%"),
    formatPercent1 = d3.format(".1%"),
    formatPercent0 = d3.format("%"),
    formatDate = d3.time.format("%B %d, %Y"),
    formatDateShort = d3.time.format("%b. %d, %Y"),
    formatTime = d3.time.format("%I:%M %p")
  ;

var get_lin_reg_line = function(data, dim_x, dim_y) {

      var data_arr = data.map(d => [+d[dim_x], +d[dim_y]])
      var linReg = ss.linearRegression(data_arr)
      var linRegLine = ss.linearRegressionLine(linReg)
      var r2 = ss.rSquared(data_arr, linRegLine)
      
      var x_vals = data_arr.map(d=> d[0])

      const xCoordinates = [
          d3.min(x_vals)
          , d3.max(x_vals)
        ];
        
      var regressionPoints = xCoordinates.map(d => ({
          x: d,
          y: linRegLine(d)
        })
      )

      return {
        'x': dim_x,
        'y': dim_y,
        'm': linReg.m,
        'b': linReg.b,
        'line': linRegLine,
        'r2': r2,
        'points': regressionPoints
      }

  }

var make_scatterplot_matrix = function(container_id, data, dims_to_include, series_key, colorscheme) {

  

    var make_set = function(arr) {
      var out = [];
      arr.forEach(function(el) {
        if (out.indexOf(el) == -1) {
          out.push(el);
        }
      })
      return out
    }

    var brushCell;

    // Clear the previously-active brush, if any.
    function brushstart(p) {
      if (brushCell !== this) {
        // d3.select(brushCell).call(brush.move, null);
        
         d3.select(brushCell).call(brush.clear());
      x.domain(domainByTrait[p.x]);
      y.domain(domainByTrait[p.y]);
      brushCell = this;
      }
    }

    // Highlight the selected circles.
    function brushmove(p) {
    var e = brush.extent();
    svg.selectAll("circle").classed("hidden", function(d) {
      return e[0][0] > d[p.x] || d[p.x] > e[1][0]
          || e[0][1] > d[p.y] || d[p.y] > e[1][1];
    });
  }

    // If the brush is empty, select all circles.
    function brushend() {
      // var e = d3.brushSelection(this);
      // if (e === null) svg.selectAll(".hidden").classed("hidden", false);
      if (brush.empty()) svg.selectAll(".hidden").classed("hidden", false);
    }

    function cross(a, b) {
      var c = [], n = a.length, m = b.length, i, j;
      for (i = -1; ++i < n;) for (j = -1; ++j < m;) c.push({x: a[i], i: i, y: b[j], j: j});
      return c;
    }

    var width = 960,
        size = 230,
        padding = 20
    ;

    // var x = d3.scaleLinear()
    var x = d3.scale.linear()
        .range([padding / 2, size - padding / 2]);

    // var y = d3.scaleLinear()
    var y = d3.scale.linear()
        .range([size - padding / 2, padding / 2]);

    // var xAxis = d3.axisBottom()
    var xAxis = d3.svg.axis()
        .scale(x)
        .ticks(6);

    // var yAxis = d3.axisLeft()
    var yAxis = d3.svg.axis().orient('left')
        .scale(y)
        .ticks(6)
    ;

    var default_colorscheme = ['#800','#080','#008','#806900','#CC8600'];
    var colorscheme = colorscheme || default_colorscheme;
    var max_dim_count = 5;

    series_key = series_key || Object.keys(data[0])[0];
    dims_to_include = dims_to_include || Object.keys(data[0]).slice(1,max_dim_count + 1);
    traits = dims_to_include

    var domainByTrait = {},
        // traits = d3.keys(data[0]).filter(function(d) { return d !== "species"; }),
        n = traits.length
    ;
    
    traits.forEach(function(trait) {
      domainByTrait[trait] = d3.extent(data, function(d) { return d[trait]; });
    });

    var reg_lines = cross(traits, traits)
      .filter(d => d.x != d.y)
      .map(
        function(d) {
          return get_lin_reg_line(data, d.x, d.y)
        }
      )
    ;
    var reg_lines_lookup = {}
    reg_lines.forEach(function(v) {
      reg_lines_lookup[v.x + '.' + v.y] = v
    })
    
    var species = make_set(data.map(function(el) { return el[series_key]}));
    // var species = ["setosa", "versicolor","virginica"]

    xAxis.tickSize(size * n);
    yAxis.tickSize(-size * n);

    // var brush = d3.brush()
    var brush = d3.svg.brush()
        .x(x)
        .y(y)
        .on("brushstart", brushstart)
        .on("brush", brushmove)
        .on("brushend", brushend)
        // .extent([[0,0],[size,size]])
    ;

    // clear container
    d3.select('#' + container_id).html('')

    var svg = d3.select('#' + container_id)
    // var svg = d3.select("body")
      .append("svg")
        .attr("width", size * n + padding)
        .attr("height", size * n + padding)
      .append("g")
        .attr("transform", "translate(" + padding + "," + padding / 2 + ")");

    svg.selectAll(".x.axis")
        .data(traits)
      .enter().append("g")
        .attr("class", "x axis")
        .attr("transform", function(d, i) { return "translate(" + (n - i - 1) * size + ",0)"; })
        .each(function(d) { x.domain(domainByTrait[d]); d3.select(this).call(xAxis); });

    svg.selectAll(".y.axis")
        .data(traits)
      .enter().append("g")
        .attr("class", "y axis")
        .attr("transform", function(d, i) { return "translate(0," + i * size + ")"; })
        .each(function(d) { y.domain(domainByTrait[d]); d3.select(this).call(yAxis); });

    var cell = svg.selectAll(".cell")
        .data(cross(traits, traits))
      .enter().append("g")
        .attr("class", "cell")
        .attr("transform", function(d) { return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")"; })
        .each(plot)
    ;

    // Titles for the diagonals.
    cell.filter(function(d) { return d.i === d.j; })
      .append("text")
        .attr("x", padding)
        .attr("y", padding)
        .attr("dy", ".71em")
        .text(function(d) { return d.x })
    ;

    // Formulas for the non-diagonals
    cell.filter(function(d) { return d.i != d.j; })
      .append("text")
        .attr("class", "regression_formula")
        .attr("x", padding)
        .attr("y", padding)
        .attr("dy", ".71em")
        .text(function(d) {
          var out = 'y = '
          out += formatPrec1(reg_lines_lookup[d.x + '.' + d.y].m)
          out += 'x + '
          out += formatPrec1(reg_lines_lookup[d.x + '.' + d.y].b)
          out += ', '
          out += 'R2 = '
          out += formatPrec3(reg_lines_lookup[d.x + '.' + d.y].r2)
          return  out

        })
    ;

    cell.call(brush);

    function plot(p) {

      var cell = d3.select(this);

      var line = d3.svg.line()
         .x(d => x(d.x))
         .y(d => y(d.y))
      ;

      x.domain(domainByTrait[p.x]);
      y.domain(domainByTrait[p.y]);

      cell.append("rect")
          .attr("class", "frame")
          .attr("x", padding / 2)
          .attr("y", padding / 2)
          .attr("width", size - padding)
          .attr("height", size - padding);

      cell.selectAll("circle")
          .data(data)
        .enter().append("circle")
          .attr("cx", function(d) { return x(d[p.x]); })
          .attr("cy", function(d) { return y(d[p.y]); })
          .attr("r", 4)
          // .style("fill", function(d) { return color(d.species); });
          .style("fill", function(d) { return colorscheme[species.indexOf(d[series_key])]; })
      ;

      if (p.x != p.y) {
        cell.append("path")
          .classed('regressionLine', true)
          .datum(reg_lines_lookup[p.x + '.' + p.y].points)
          .attr('d', line)
        ;
      }

            
    }

    // Add a legend.
      var legend = svg.selectAll("g.legend")
          .data(species)
        .enter().append("svg:g")
          .attr("class", "legend")
          .attr("transform", function(d, i) { return "translate(0," + (i * 20 + 584) + ")"; });

      legend.append("svg:line")
          // .attr("class", function(d) { return string_to_series_class(d, species) })
          .attr("x2", 8)
          .attr('stroke', function(d) {
            return colorscheme[species.indexOf(d)]
          })
      ;

      legend.append("svg:text")
        .attr("x", 12)
        .attr("dy", ".31em")
        .text(function(d) { return d; })
      ;

  }