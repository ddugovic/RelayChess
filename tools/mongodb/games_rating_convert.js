var gamesToConvert = db.games.find();
var collection = db.games;

print("Converting " + gamesToConvert.count() + " games");

gamesToConvert.forEach(function(g) {

  var prewglicko = {r: g.result.preRatings.white, rd: 350.0, vol: 0.06};
  var prebglicko = {r: g.result.preRatings.black, rd: 350.0, vol: 0.06};
  var preglicko = {white: prewglicko, black: prebglicko};
  collection.update({_id: g._id}, {$set: {"result.preRatings": preglicko}});

  var wglicko = {r: g.result.ratings.white, rd: 350.0, vol: 0.06};
  var bglicko = {r: g.result.ratings.black, rd: 350.0, vol: 0.06};
  var glicko = {white: wglicko, black: bglicko};
  collection.update({_id: g._id}, {$set: {"result.ratings": glicko}});
});

print("Done!");
