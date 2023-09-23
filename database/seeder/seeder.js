// Instructions: 
// Write database entries as JS objects in ./seed-data, then run seeder with node (not npm start!)
// Copy output.json into Postman and post to DB 

const fs = require("fs");
const seedData = require("./seed-data");

fs.writeFile("./output.json", seedData, (err) => {
    if(err) {
        console.log(err);
        return;
    }
    console.log("File written successfully to ./output.json");
});