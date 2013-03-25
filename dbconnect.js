var sys = require("util");
var mongoose = require("mongoose"),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

var dbConnection = mongoose.createConnection(nconf.get('mongo:prod_url'));

function validatePresenceOf(value) {
  return value && value.length;
}

var UsersSchema = new Schema({
    'name': { type: String, validate: [validatePresenceOf, 'an email is required'], index: { unique: true } },
    'pwd': String,
    'salt': String,
    'id' : Number
});

UsersSchema.pre('save', function(next) {
    if (!validatePresenceOf(this.name)) {
      next(new Error('Invalid data'));
    } else {
      next();
    }
});

var taskListShema = new Schema({
    "title": { type: String, validate: [validatePresenceOf, 'an title is required'], index: { unique: true } },
    "id" : Number,
    "duration": Number,
    "cost": Number,
    "eta": String,
    "link": String,
    "done": Boolean
});
taskListShema.pre('save', function(next) {
    if (!validatePresenceOf(this.title)) {
      next(new Error('Invalid data'));
    } else {
      next();
    }
});
var usersModelCons = dbConnection.model('users', UsersSchema);
var userModel = function(){
    this.model = usersModelCons;

    this.findItems = function(query, callback){
        this.model.find(query, callback);
    };

    this.saveItem = function(data,callback){
        var user = new this.model(data);
        if(user){
            user.save(function(err, data){
            if(err){
                    callback('save failed');
                    return;
                }else{
                    callback(null, data.name + ' saved');
                }

            });
        }else{
            callback('wrong data');
        }

    }
}



var taskList = function(){
    this.model = dbConnection.model('tasklists', taskListShema);
    
    this.findItems = function(query, callback){
        this.model.find(query, callback);
    };
    this.saveItem = function(data,callback){
        var user = new this.model(data);
        if(user){
            user.save(function(err, data){
            if(err){
                    console.log(err);
                    callback('save failed');
                    return;
                }else{
                    callback(data);
                }

            });
        }else{
            callback('wrong data');
        }

    }
}

exports.usersModel = new userModel;
exports.taskList = new taskList;
