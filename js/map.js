'use strict';

var csv = `Kanton,City,Lat,Lon,Event,Date
Aargau,Lenzburg,47.3844222,8.1497351,Schloss Lenzburg,
Aargau,Villigen PSI,47.537909,8.2265159,PSI,
Basel-Stadt,Basel,47.5569557,7.590537,Naturhistorisches Museum,2019
Bern,Beatenberg,46.6848139,7.7731852,Beatushöhlen,
Bern,Bern,46.9499195,7.4408693,Foxtrail,
Bern,Brienz,46.7503389,8.0797807,Ballenberg,2020
Bern,Meiringen,46.7157887,8.2055731,Aareschlucht,2016
Bern,Mürren,46.5600925,7.8881733,Mürren & Grindelwald,
Bern,Unterseen,46.6860507,7.8286233,Lazy Rancho,2020
Genève,Geneva,46.208997,6.1563381,Visit,
Glarus,Braunwald,46.945813,8.9668454,Märchenhotel,2021
Graubünden,Arosa,46.7829327,9.6784831,Festival,2015
Lucerne,Luzern,47.0528766,8.3342023,Verkehrshaus,
Nidwalden,Wolfenschiessen,46.7711668,8.4240687,Titlis,2016
Obwalden,Engelberg,46.8090575,8.4043998,Engelberg,2016
Schaffhausen,Neuhausen am Rheinfall,47.6775715,8.6138349,Rheinfelden,
Solothurn,Solothurn,47.2080942,7.5219752,Daytrip,
Ticino,Morcote,45.9230785,8.9175285,Cottage,2015
Valais,Zermatt,45.9906828,7.6719054,Zermatt,2014
Zug,Zug,47.1687925,8.5003802,Mittelalterfest,2015-09-27
Zürich,Zürich,47.3778615,8.5381339,Home,
`;

/** Simple CSV parser
 * Converts to an object with each column as a key/value. No quote support.
 */
function parseCsv(csv) {
    var rows = csv.split("\n").filter(line => line.trim()).map(line => line.split(","));
    if(!rows.every(row => row.length == rows[0].length)) {
        console.error("CSV parse error");
        rows = rows.filter(row => row.length == rows[0].length);
    }
    var cols = {}
    for(var col=0; col< rows[0].length; col++) {
        var column = []
        for(var row=1; row < rows.length; row++) {
            column.push(rows[row][col]);
        }
        cols[rows[0][col]] = column;
    }
    return cols;
}
const places = parseCsv(csv);
const visited = new Set(places["Kanton"]);

function loadmap(mapid) {
    //@46.8357183,8.2575321,8.58z
    var mymap = L.map(mapid).setView([46.8357183, 8.2575321], 8);
    var accessToken = "pk.eyJ1IjoicXVhbnR1bTciLCJhIjoiY2tvM3lyaG5jMWVjdzJxb2I2ODgxbDVhOSJ9.yBFNSPZSc7PAy4e9mdATwA";

    var attribution;
    // mapbox layer
    attribution = 'Map data © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' +
        ' &mdash; '
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    // // watercolor layer
    // attribution = 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, ' +
    //     '<a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>' +
    //     ' &mdash; ' +
    //     'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
    //     '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>';

    // switzerland shapes
    attribution += ' &mdash; ' +
        'Canton data from <a href="http://gadm.org/">GADM</a> and ' +
        '<a href="https://github.com/druedin/swisscantonsmod/tree/master">Didier Ruedin</a>';


    L.tileLayer(
        'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
        {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 18,
            id: 'mapbox/outdoors-v11',// 'mapbox/streets-v11', //satellite-v9
            tileSize: 512,
            zoomOffset: -1,
            accessToken: accessToken
        }).addTo(mymap);


    // var watercolor = L.tileLayer('http://{s}.tile.stamen.com/watercolor/{z}/{x}/{y}.jpg', {
    //     attribution: attribution
    // }).addTo(mymap);

    const kantons = new Set();
    var shpfile = new L.Shapefile(
        'assets/swisscantonsmod.zip',
        {
            onEachFeature: function (feature, layer) {
                kantons.add(feature.properties["NAME_1"]);
                if (feature.properties) {
                    layer.bindPopup(Object.keys(feature.properties).map(function (k) {
                        return k + ": " + feature.properties[k];
                    }).join("<br />"), {
                        maxHeight: 200
                    });
                }
            },
            style: function (feature) {
                // https://leafletjs.com/reference-1.7.1.html#path-option
                //console.log(feature);

                // unvisited
                var options = {
                    color: "#999999",
                    fillOpacity: .2,
                    weight: 2
                };
                if(visited.has(feature.properties["NAME_1"])) {
                    options.color = "#3333ff";
                    options.fillOpacity = 0.2;
                }

                return options;
            },
            importUrl: "js/lib/shp.min.js"
        }
    );
    shpfile.addTo(mymap);
    shpfile.once("data:loaded", function (features, b,c,d) {
        // check for Kanton misspellings
        new Set(places.Kanton.filter(k => !(kantons.has(k)))).forEach(k => console.error("Unknown Kanton "+k));
    });

    for(var i=0;i<places.Kanton.length;i++) {
        const marker = L.marker([places.Lat[i], places.Lon[i]]).addTo(mymap);
        var evt = "";
        if(places.City[i]) {
            evt += `<b>${places.City[i]}</b><br/>`;
        }
        evt += `${places.Event[i]} `;
        if(places.Date[i]) {
            evt += `(${places.Date[i]})`;
        }
        marker.bindPopup(evt).openPopup();

    }

    var popup = L.popup()
        .setLatLng([45.936944, 7.866944])
        .setContent("<b>Dufourspitze</b><br/>Highest point!")
        .openOn(mymap);

    return mymap;
}