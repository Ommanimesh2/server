var ee = require('@google/earthengine');
const express = require('express');
const app= express();
const bodyParser = require('body-parser');
const cors=require('cors');
const privateKey = require('./stable-glass-363410-ce8643c85d9c.json');

const port = process.env.PORT || 4000;
app.use(bodyParser.json()); 
app.use(cors())
var dataset;
app.get('/view', (req, res) => {  
  res.send(dataset)
})
app.post('/map',(req,res)=>{
  const recieve=req.body
  const roi=recieve["body"]

  function get_dataset(collection_name, start_date, end_date, roi){
    return ee.ImageCollection(collection_name)
             .filterDate(start_date, end_date)
             .filterBounds(roi);
  }
  function get_chart(imagecollection, region, series_names, title, vaxis ){
    var chart1 = ui.Chart.image.series({imageCollection: imagecollection,region: region})
                  .setSeriesNames(series_names)
                  .setOptions({
                    title: title,
                    hAxis: {title: 'Date', titleTextStyle: {italic: false, bold: true}},
                    vAxis: {title: vaxis,titleTextStyle: {italic: false, bold: true}},
                    colors: ['e37d05', '1d6b99'],
                  });
    return chart1;
  }



  //Load button onClick function
  function load_timeseries(){
    //values required
    var dataset_selected = "Landsat8_sr";
    var year_selected    =2018;
    var season_selected  = "Kharif [May to Oct]";
    var type_selected    = "LST";
    //start and end dates
    var start_date = null;
    var end_date   = null;
    if (season_selected == 'Kharif [May to Oct]'){
      start_date = ee.Date.fromYMD({day: 1,month: 5,year: year_selected});
      end_date   = ee.Date.fromYMD({day: 31,month: 10,year: year_selected});
    }
    else if (season_selected == 'Rabi [Nov to Apr]'){
      start_date = ee.Date.fromYMD({day: 1,month: 11,year: year_selected});
      end_date   = ee.Date.fromYMD({day: 30,month: 4,year: year_selected}).advance(1, 'year');
    }
    else if (season_selected == 'Zaid [Mar to Jun]'){
      start_date = ee.Date.fromYMD({day: 1,month: 3,year: year_selected});
      end_date   = ee.Date.fromYMD({day: 30,month: 6,year: year_selected});
    }
    //dataset - landsat 8
    if (dataset_selected == 'Landsat8_sr'){
      var get_scalefactor = function(image){
      var opticalBands = image.select('SR_B.').multiply(0.0000275).add(-0.2);
      var thermalBands = image.select('ST_B.*').multiply(0.00341802).add(149.0);
      return image.addBands(opticalBands, null, true)
                .addBands(thermalBands, null, true);
      };
      dataset = get_dataset('LANDSAT/LC08/C02/T1_L2', start_date, end_date, roi);
      dataset = dataset.map(get_scalefactor);
      dataset = dataset.map(function(image){return image.addBands(image.normalizedDifference(['SR_B5', 'SR_B4']).rename('ndvi'));});
      dataset = dataset.map(function(image){return image.addBands(image.expression('2.5 * ((NIR - RED) / (NIR + 6 * RED + 7.5 * BLUE + 1))', {'NIR': image.select('SR_B5'),'RED': image.select('SR_B4'),'BLUE': image.select('SR_B2')}).rename('evi'));});
      dataset=dataset.select('ndvi','evi')
      // var vi_chart  = get_chart(dataset.select('ndvi','evi'), roi, {ndvi: 'NDVI', evi: 'EVI'}, 'Average Vegetation Index Value by Date for Farmland', 'Vegetative indices' );
      // var lst_chart = get_chart(dataset.select('ST_B10'), roi, ['LST'], 'Average Land Surface Temperature Value by Date for Farmland', 'LST [Kelvin]');
      // if (type_selected == 'LST'){
      //   print(lst_chart);
      // }
    }
    
    }
    load_timeseries()
})

  ee.data.authenticateViaPrivateKey(
    privateKey,
    () => {
      console.log('Authentication successful.');
      ee.initialize(
          null, null,
          () => {
            console.log('Earth Engine client library initialized.');
            app.listen(port);
            console.log(`Listening on port ${port}`);
          },
          (err) => {
            console.log(err);
            console.log(
                `Please make sure you have created a service account and have been approved.
Visit https://developers.google.com/earth-engine/service_account#how-do-i-create-a-service-account to learn more.`);
          });
    },
    (err) => {
      console.log(err);
    });

console.log('Authenticating Earth Engine API using private key...');

