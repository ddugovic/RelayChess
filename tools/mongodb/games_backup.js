var gamesToMigrate = db.games.find();
var collection = db.games2;

print("Migrating " + gamesToMigrate.count() + " games");

collection.drop();
db.createCollection("games2");
collection = db.games2;

gamesToMigrate.forEach(function(u) {

  collection.insert(u);
});

print("Done!");
