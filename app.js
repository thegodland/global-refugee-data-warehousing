var express = require("express"),
    app = express(),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    async = require("async"),
    Schema = mongoose.Schema;
const dblink = require("./db").dblink;
    
//connect to db test
// mongoose.connect("mongodb://localhost/projectADB");
mongoose.connect(dblink);


//define schema of collection facts
var factSchema = Schema({
	location:{
		shortName:String,
		fullName: String,
		region:String,
		group:String
	},
		year: Number,
	gdp: Number,
	unemploy_rate: Number,
	terror_case: Number,
	num_of_refugee: Number,
	population: Number,
	migrant: Number,
	life_expectancy: Number,
	ntd: Number,
	hb_coverage: Number
});


/*
var factSchema = Schema({
/*	locations:{
		shortName:String,
		countryName:String,
		region:String
	},
	year:String,
	refugee:Number*/
/*	location: { 
		fullName: String,
		region: String,
	},
	year: String,
	gdp: Number,
	num_of_refugee: Number,
	population: Number,
	migrant: Number,
	hb_coverage: Number
},{collection: "upload"});
*/



//build model
// var LocationModel = mongoose.model("Location", locationSchema);
var FactModel = mongoose.model("Fact", factSchema);
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));

//group by region,year, sum of refugee
// var groupByRegion_refugee = function(year,callback){
// FactModel.aggregate([
// 		{
// 			$match:{ year: year}
// 		},
//         {
//         	$group: {
//             _id: "$location.region" ,
//             numberOfRefugee: { $sum: "$Refugee" }
//         }}
//     ], function (err, result) {
//         if (err) {
//             console.log(err);
//             return;
//         }
//         console.log(result);
//         callback(err,result);
// });
// }

// //function to refugee distribution by year
// var groupByYear_refugee = function(callback){
// FactModel.aggregate([
//         {
//         	$group: {
//             _id: "$year" ,
//             numberOfRefugee: { $sum: "$num_of_refugee" }
//         	}
//         },	{ $sort : { _id: 1 } }
//     ], function (err, result) {
//         if (err) {
//             console.log(err);
//             return;
//         }
//         callback(err,result);
// });
// }

// //function to refugee distribution by income group
// var groupByIncome_refugee = function(callback){
// FactModel.aggregate([
//         {
//         	$group: {
//             _id: "$location.group" ,
//             numberOfRefugee: { $sum: "$num_of_refugee" }
//         	}
//         },	{ $sort : { numberOfRefugee: 1 } }
//     ], function (err, result) {
//         if (err) {
//             console.log(err);
//             return;
//         }
//         callback(err,result);
// });
// }

// //function to refugee distribution by region call back hell
// var groupByCountry_refugee = function(callback){
// FactModel.aggregate([
//         {
//         	$group: {
//             _id: "$location.fullName" ,
//             region: "$location.region",
//             numberOfRefugee: { $sum: "$num_of_refugee" }
//         	}
//         },	{ $sort : { _id: 1 } }
//     ], function (err, result) {
//         if (err) {
//             console.log(err);
//             return;
//         }
//         callback(err,result);
// });
// }

//function to refugee distribution by measure in year top number 
var groupByMeasure_refugee = function(year,top,method,callback){

	var query = {};
	query[method] = -1;
	var query2 = {};
	query2["location.fullName"] = 1;
	query2["num_of_refugee"] = 1;
	query2[method] = 1;
	query2["_id"] = 0;
    
FactModel.find({ "year" : year },query2,function(err,result){
        if(err){
            console.log(err);
            return;
        }
        // console.log(query2);
        // console.log(year);
        callback(err,result);
        }).sort(query).limit(top);
}


app.get("/",function(req,res){
	async.parallel({
	groupByYear: function(callback){
FactModel.aggregate([
        {
        	$group: {
            _id: "$year" ,
            numberOfRefugee: { $sum: "$num_of_refugee" }
        	}
        },	{ $sort : { _id: 1 } }
    ], function (err, result) {
        if (err) {
            console.log(err);
            return;
        }
        // console.log(result);
        callback(err,result);
});
}, 
	groupByIncome: function(callback){
FactModel.aggregate([
        {
        	$group: {
            _id: "$location.group" ,
            numberOfRefugee: { $sum: "$num_of_refugee" }
        	}
        },	{ $sort : { numberOfRefugee: -1 } }
    ], function (err, result) {
        if (err) {
            console.log(err);
            return;
        }
        callback(err,result);
});
}, groupByRegion: function(callback){
FactModel.aggregate([
        {
        	$group: {
            _id: { country: "$location.fullName" , region: "$location.region"},
            numberOfRefugee: { $sum: "$num_of_refugee" }
        	}
        },	{ $sort : { _id: 1 } }
    ], function (err, result) {
        if (err) {
            console.log(err);
            return;
        }
        // console.log(result);
        callback(err,result);
});
}
	}, 
	function (err, results) {
		if(err){
			console.log(err);
		}else{
			
			res.render("test",{results:results});
			// console.log(results);
		}
	});
});

app.get("/detail",function(req,res){
	res.render("detail");
});

////important///////
app.post("/getpara",function(req,res){
    var year = Number(req.body.yearSelected);
    var measure = req.body.measureSelected;
    var top = Number(req.body.topSelected);
    groupByMeasure_refugee(year,top,measure,function(err,result){
        if(err){
            console.log(err);
        }else{
            console.log(result);
            res.render("getpara",{results:result, method:measure});
        }
    });
});

app.listen(process.env.PORT, process.env.IP, function(){
    console.log("the test case server has been started...");
});