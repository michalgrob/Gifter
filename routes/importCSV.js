/**
 * Created by yoavf on 7/2/2017.
 */
var express = require('express');
var router = express.Router();
var fs = require('fs');
var csv = require('fast-csv');




router.post('/', function(req, res, next) {
    var path = req.body.path;
    var csvData = [];
    fs.createReadStream(path).pipe(csv()).
    on('data',function (data) {
        csvData.push(data);
    })
        .on('end',function () {
            for (i = 1; i < csvData.length; i++) {
                var prodId = csvData[i][0];
                var giftName = csvData[i][1];
                var minAge = csvData[i][2];
                var maxAge = csvData[i][3];
                var gender = csvData[i][4];
                var price = csvData[i][5];
                var imgURL = csvData[i][6];
                var storeInterests = csvData[i][7].split(";");
            }

          //  console.log(csvData);
        });
    // var csvData = [];
    //
    // d3.csv(path, function(data) {
    //     console.log(data[0]);
    // });

    // fs.readFile(path, 'utf8', function (err,data) {
    //     if (err) {
    //         return console.log(err);
    //     }
    //     console.log(data);
    // });
    res.render('mainPage', {etitle : "present",LogedInUser: req.user ? req.user.username : 'guest',CartQty: req.session.cart ? req.session.cart.totalQty : 0});
});

module.exports = router;

