var usersToMigrate = db.users.find();
var collection = db.users2;

print("Migrating " + usersToMigrate.count() + " users");

collection.drop();
db.createCollection("users2");
collection = db.users2;

usersToMigrate.forEach(function(u) {

  collection.insert(u);
});

print("Done!");
