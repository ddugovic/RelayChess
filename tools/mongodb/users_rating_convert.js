var usersToConvert = db.users.find();
var collection = db.users;

print("Converting " + usersToConvert.count() + " users");

usersToConvert.forEach(function(u) {

  var glicko = {r: u.rating, rd: 350.0, vol: 0.06};
  collection.update({_id: u._id}, {$set: {rating: glicko}});
});

print("Done!");
