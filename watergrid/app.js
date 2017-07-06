(function(){
  //UI configuration
  var itemSize = 18,
    cellSize = itemSize-1,
    width = 500,
    height = 500,
    margin = {top:20,right:20,bottom:20,left:25};

  //formats
  var hourFormat = d3.time.format('%H'),
    dayFormat = d3.time.format('%j'),
    timeFormat = d3.time.format('%Y%m%d%H'),
    monthDayFormat = d3.time.format('%m.%d');

  //data vars for rendering
  var dateExtent = null,
    data = null,
    dayOffset = 0,
    colorCalibration = ['#e0f1f4','#a2c9d0','#639faa','#2d707c','#0c464f','#01272d'],
    dailyValueExtent = {};

  //axises and scales
  var axisWidth = 0 ,
    axisHeight = itemSize*24,
    xAxisScale = d3.time.scale(),
    xAxis = d3.svg.axis()
      .orient('top')
      .ticks(d3.time.days,3)
      .tickFormat(monthDayFormat),
    yAxisScale = d3.scale.linear()
      .range([0,axisHeight])
      .domain([0,24]),
    yAxis = d3.svg.axis()
      .orient('left')
      .ticks(5)
      .tickFormat(d3.format('02d'))
      .scale(yAxisScale);

  initCalibration();

  var svg = d3.select('[role="heatmap"]');
  var heatmap = svg
    .attr('width',width)
    .attr('height',height)
  .append('g')
    .attr('width',width-margin.left-margin.right)
    .attr('height',height-margin.top-margin.bottom)
    .attr('transform','translate('+margin.left+','+margin.top+')');
  var rect = null,
      left = 0;

  var singleDay = [],
      itemSize2 = 30,
      barWidth = itemSize2-5;
      xAxisWidth = itemSize2*23;
      margin2 = {top: 20, right: 20, bottom: 30, left: 40},
      margin3 = {top: 30, right: 20, bottom: 20, left: 25}
      width2 = 765 - margin2.left - margin2.right,
      height2 = 300 - margin2.top - margin2.bottom;

  //axises and scales
  var xscaling = d3.scale.linear()
        .domain([0,23])
        .range([0,xAxisWidth]);

  var yscaling = d3.scale.linear()
    .domain([0,250])
    .range([250,0]);

  var xAxis2 = d3.svg.axis()
    .orient('bottom')
    .ticks(23)
    .scale(xscaling);

  var yAxis2 = d3.svg.axis()
    .orient('left')
    .ticks(5)
    .scale(yscaling);




  var canvas = d3.select('[role="barchart"]')
      .attr("width",765)
      .attr("height",300);

  var g = canvas.append("g")
    .attr("transform","translate("+margin2.left+","+margin2.top+")");

  var linechartcanvas = d3.select('[role="linechart"]')
      .attr("width",765)
      .attr("height",350);

  var linechartg = linechartcanvas.append("g")
    .attr("transform","translate("+margin2.left+","+margin3.top+")");

  d3.json('waterConsumption.json',function(err,data){
    data = data.data;

    data.forEach(function(valueObj){
      valueObj['date'] = timeFormat.parse(valueObj['timestamp']);//将特定时间格式的字符串转换成date对象
      console.log(valueObj['date']);
      var day = valueObj['day'] = monthDayFormat(valueObj['date']);

      var dayData = dailyValueExtent[day] = (dailyValueExtent[day] || [1000,-1]);
      var pmValue = valueObj['value']['consumption'];
      dayData[0] = d3.min([dayData[0],pmValue]);
      dayData[1] = d3.max([dayData[1],pmValue]);
    });
    
    //extent方法：获取数组的范围(最小值和最大值)
    dateExtent = d3.extent(data,function(d){
      return d.date;
    });

    console.log(dateExtent[1]);
    console.log(dayFormat(dateExtent[1]));

    axisWidth = itemSize*(dayFormat(dateExtent[1])-dayFormat(dateExtent[0])+1);

    //render axises
    xAxis.scale(xAxisScale.range([0,axisWidth]).domain([dateExtent[0],dateExtent[1]]));  
    svg.append('g')
      .attr('transform','translate('+margin.left+','+margin.top+')')
      .attr('class','x axis')
      .call(xAxis)
    .append('text')
      .text('日期')
      .attr('transform','translate('+axisWidth+',-10)');

    svg.append('g')
      .attr('transform','translate('+margin.left+','+margin.top+')')
      .attr('class','y axis')
      .call(yAxis)
    .append('text')
      .text('小时')
      .attr('transform','translate(-10,'+axisHeight+') rotate(-90)');

    //render heatmap rects
    dayOffset = dayFormat(dateExtent[0]);
    rect = heatmap.selectAll('rect')
      .data(data)
    .enter().append('rect')
      .attr('width',cellSize)
      .attr('height',cellSize)
      .attr('x',function(d){
        return itemSize*(dayFormat(d.date)-dayOffset);
      })
      .attr('y',function(d){            
        return hourFormat(d.date)*itemSize;
      })
      .attr('fill','#ffffff');

    rect.filter(function(d){ return d.value['consumption']>0;})
      .append('title')
      .text(function(d){
        return monthDayFormat(d.date)+' '+d.value['consumption'];
      });

    renderColor();
    clickevent();
  });

  function initCalibration(){
    d3.select('[role="calibration"] [role="example"]').select('svg')
      .selectAll('rect').data(colorCalibration).enter()
    .append('rect')
      .attr('width',cellSize)
      .attr('height',cellSize)
      .attr('x',function(d,i){
        return i*itemSize;
      })
      .attr('fill',function(d){
        return d;
      });


    //bind click event
    d3.selectAll('[role="calibration"] [name="displayType"]').on('click',function(){
      renderColor();
      clickevent();
    });
  }
  function highlight(left) {
    var container = d3.select('.heatmap')
      .append("rect")
      .attr("class","highlight removehighlight")
      .attr("width",cellSize)
      .attr("height",axisHeight)
      .attr("x",left)
      .attr("y",margin.top)
      .attr("fill","rgba(0,0,0,0.2)")
  }

  function renderColor(){
    var renderByCount = document.getElementsByName('displayType')[0].checked;

    rect
      .filter(function(d){
        return (d.value['consumption']>=0);
      })
      .transition()
      .delay(function(d){      
        return (dayFormat(d.date)-dayOffset)*15;
      })
      .duration(500)
      .attrTween('fill',function(d,i,a){
        //choose color dynamicly      
        var colorIndex = d3.scale.quantize()
          .range([0,1,2,3,4,5])
          .domain((renderByCount?[0,300]:dailyValueExtent[d.day]));

        return d3.interpolate(a,colorCalibration[colorIndex(d.value['consumption'])]);

      });
      
  }
  function clickevent(){
    d3.selectAll("g rect").on('click',function(d,i){
        d3.selectAll(".removehighlight").remove();
        left = Math.floor(i/24) *itemSize+margin.left;
        highlight(left);
        d3.selectAll(".remove").remove();
        var str = d.timestamp;
        str = str.substr(0,str.length-2);
        console.log(str);

        d3.json('waterConsumption.json',function (data) {
          console.log(data.data[0].timestamp.indexOf(str));
          for (var i = 0,j=0; i < data.data.length; i++) {
            if (data.data[i].timestamp.indexOf(str)==0) {
              singleDay[j] = data.data[i].value['consumption'];
              j++;
            }
          }

        g.append("text")
          .attr("fill","#000")
          .attr("x",0)
          .attr("y",0)
          .attr("class","remove")
          .text(str+"日用水量")
          .attr("transform","translate(10,0)");
        
        g.selectAll("rect")
          .data(singleDay)
          .enter()
          .append("rect")
          .attr("class","bar2 remove")
          .attr("x",function(d,i){ return i*itemSize2; })
          .attr("y",function(d){ return (height2-d);})
          .attr("width",barWidth)
          .attr("height",function(d){ return d;})

        g.selectAll(".text")
          .data(singleDay)
          .enter()
          .append("text")
          .attr("class","remove text")
          .attr("fill","#000")
          .attr("x",function(d,i){ return i*itemSize2; })
          .attr("y",function(d){ return (height2-d);})
          .text(function(d){ return d;})
          .attr("transform","translate(0,-2)")

        g.append("g")
          .attr("class","remove x axis")
          .call(xAxis2)
          .attr("transform","translate(12,"+height2+")");

        g.append("g")
          .attr("class","remove y axis")
          .call(yAxis2);

        var line = d3.svg.line()
          .x(function(d,i){ return i*itemSize2 })
          .y(function(d){ return height2-d });

        linechartg.selectAll("path")
          .data([singleDay])
          .enter()
          .append("path")
          .attr("class","remove")
          .attr("d",line)
          .attr("fill","none")
          .attr("stroke","steelblue")
          .attr("stroke-width",2);

        linechartg.append("g")
          .attr("class","remove x axis")
          .call(xAxis2)
          .attr("transform","translate(0,"+height2+")");

        linechartg.selectAll(".linecharttext")
          .data(singleDay)
          .enter()
          .append("text")
          .attr("class","remove text")
          .attr("fill","#000")
          .attr("x",function(d,i){ return i*itemSize2; })
          .attr("y",function(d){ return (height2-d);})
          .text(function(d){ return d;})
          .attr("transform","translate(-12,-5)");

        linechartg.selectAll("circle")
          .data(singleDay)
          .enter()
          .append("circle")
          .attr("class","remove")
          .attr("cx",function(d,i){ return i*itemSize2;})
          .attr("cy",function(d){ return (height2-d);})
          .attr("r","2")
          .attr("fill","steelblue");

        linechartg.append("g")
          .attr("class","remove y axis")
          .call(yAxis2);

      });
    })   
  };
  d3.select(self.frameElement).style("height", "600px");  
})();
