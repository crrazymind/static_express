taskList = $.taskList = {
	name : "global taskList namespace",
	utils : {},
	app : {},
	updateQueue : {
		stack : [],
		flush : function(){
			for (var i = this.stack.length - 1; i >= 0; i--) {
				//console.log(this.stack[i]);
			};
		}
	},
	waitQueue : {},
	globalId  : 0
}
//console.log('args: ', [].splice.call(arguments,0));

$(document).ready(function(){

//http://stackoverflow.com/a/7607853
var BaseView = $.taskList.utils.BaseView = function (options) {
    this.bindings = [];
    Backbone.View.apply(this, [options]);
};
_.extend(BaseView.prototype, Backbone.View.prototype, {
    bindTo: function (model, ev, callback) {
        model.bind(ev, callback, this);
        this.bindings.push({ model: model, ev: ev, callback: callback });
    },
    unbindFromAll: function () {
        _.each(this.bindings, function (binding) {
            binding.model.unbind(binding.ev, binding.callback);
        });
        this.bindings = [];
    },
    dispose: function () {
        this.unbindFromAll(); // this will unbind all events that this view has bound to 
        this.unbind(); // this will unbind all listeners to events from this view. This is probably not necessary because this view will be garbage collected.
        this.remove(); // uses the default Backbone.View.remove() method which removes this.el from the DOM and removes DOM events.
    }
});
BaseView.extend = Backbone.View.extend;
	var methodMap = {
		'create': 'POST',
		'update': 'PUT',
		'delete': 'DELETE',
		'read':   'GET'
	};

	var getValue = function(object, prop) {
		if (!(object && object[prop])) return null;
		//if(prop == "url" && _.isFunction(object[prop])) console.log(object[prop]())
		return _.isFunction(object[prop]) ? object[prop]() : object[prop];
	};

	function ownSync(method, model, options){
		options.timeout = 2000;  
		options.dataType = "jsonp";
		options.dataKeyword = "items";
		var type = methodMap[method];
		options || (options = {});
		var params = {type: type, dataType: 'jsonp'};

		if (!options.url) {
			params.url = getValue(model, 'url') || urlError();
		}
		if (!options.data && model && (method == 'create' || method == 'update')) {
		  params.contentType = 'application/json';
		  params.data = JSON.stringify(model.toJSON());
		}
		if((typeof params.data != "undefined") && options.dataKeyword) {
			params.data = options.dataKeyword + "=" + params.data;
			params.data += "&_method=" + method;
		}else{
			params.data = "_method=" + method;
		}
		return $.ajax(_.extend(params, options));
	}

	/** application general **/

	$.taskList.AppModel = Backbone.Model.extend({
		idAttribute: '_id',
		silent : true,
		sync: ownSync,
		url : "http://localhost:5000/api",
		initialize: function(){
			_.bindAll(this, "fetchSuccess")
			this.name = "AppModel";
			this.modelId = $.taskList.globalId++;
			this.fetch({success : this.fetchSuccess});
		},
		fetchSuccess : function(){}
	});
	
	$.taskList.tasksCollection = Backbone.Collection.extend({
		url : "http://localhost:5000/api",
		//model: $.taskList.AppModel,
		initialize: function(model, options) {
			this.name = "tasksCollection";
			_.bindAll(this, "loadSucess")
			this.add(model);
		},
		loadSucess: function(root, data, status){
			console.log(arguments);
		},
		loadError: function(root, data, status){
			console.log("error: ", root);
		},
		sync: ownSync
	});

	$.taskList.detailsCollection = Backbone.Collection.extend({
		url : "http://localhost:5000/",
		initialize: function(model, options) {
			this.name = "detailsCollection";
			this.url = "http://localhost:5000/"+options.hashCode
		},
		sync: ownSync
	});

	//$.taskList.TaskGenerator = Backbone.View.extend({
	$.taskList.TaskGenerator = $.taskList.utils.BaseView.extend({
		template: _.template($('#my_template').html()),
		el: '<div class="app"></div>',
		events: {
			"click .submit-task": "navigate",
			"click .add-one": "addNew"
		},
		initialize: function(){
			this.name = "TaskGenerator view";
			_.bindAll(this, "render", "fetchError")
			this.bindTo(this.model, 'change', this.render);
			//this.bindTo(this.model, 'destroy', this.render);
			this.bindTo(this.model, 'error', this.fetchError);
		},
		fetchError: function(model, response) {
			console.log('fetch error ', response);
		},
		render: function(){
			var items = this.collection.toJSON()[0].items;
			console.log("render: " ,items)
			if(!items) return false;
			$(this.el).append(_.template($('#task_header_template').html()));
			for(var _i=0; _i < items.length; _i++){
				this.addChild(items[_i]);
			}
			$(this.el).append(_.template($('#submit-btm-tpl').html()));
			return this;
		},
		addChild: function(data){
			var itemModel = new $.taskList.ItemModel(data, this);
			var one = new $.taskList.itemThing({data:data, model:itemModel});
			$(this.el).append(one.render().el);
		},
		addNew : function(){
			var newModel = new $.taskList.NewItemModel({}, this);
			newModel.validate();
			var one = new $.taskList.itemThing({model: newModel});
			var newOne = $(one.render().el);
			newOne.insertBefore($(this.el).find('.view:last'));
			newOne.hide();
			newOne.slideDown();
		},
		navigate: function(e){
			console.log(this.model);
			$.taskList.AppRouter.navigate("/selected");
			//this.model.save({success: this.saveSuccess, error: this.saveError});
		},
		saveSuccess: function(model, response){
			console.log('save callback');
		},
		saveError: function(model, response){
			console.log('smth went ololo!11');
		}
	});

	/* single item */
	$.taskList.ItemModel = Backbone.Model.extend({
		idAttribute: '_id',
		sync: ownSync,
		urlRoot : "http://localhost:5000/api",
		initialize : function(data, view){
			this.name = "ItemModel model";
			this.modelId = $.taskList.globalId++;
			this.viewLink = view;
		},
		validate : function(item){
			if(this._id == "") this.id = "new";
			if (typeof this.id == "object") this.id = this.id.$oid;
		}
	});

	$.taskList.NewItemModel = $.taskList.ItemModel.extend({
		defaults: function(){
		  return {
			title: 'New task',
			_id : '',
			duration: 0,
			cost: 0,
			eta: new Date().toUTCString(),
			link: '',
			done: false
		  };
		}
	})

	$.taskList.itemThing = $.taskList.utils.BaseView.extend({
		template: _.template($('#my_template').html()),
		el: '<div class="item_hold"></div>',
		events: {
			"click .save": "submitModel",
			"dblclick .item": "changeTtl",
			"click .remove": "removeHandler",
			"change .duration": "calcCost",
			"blur .item input": "itemEditComplete"
		},
		initialize: function(args) {
			this.model = args.model;
			this.timer = "";
			this.bindTo(this.model, 'destroy', this.destroyView, this);
			this.bindTo(this.model, 'change', this.modelChangeCallback, this);
			this.model.viewLink = this;
		},
		modelChangeCallback : function(add){
			if(this.model.hasChanged){
				this.submitEl.fadeIn();
				var root = this;
				if(this.timer) clearTimeout(this.timer);
				this.timer = setTimeout(function(){
					root.model.viewLink.idEl.val(root.model.get("_id"));
				},100);
			}
			//console.log('render_add: ', [].splice.call(arguments,0));
		},
		removeHandler : function(e){
			if(this.model.attributes._id == ""){
				this.$el.slideUp();
				this.model.id = null
				this.model.destroy();
				return;
			}else{
				var choise = confirm("are you sure?");
				if(choise){
					this.model.validate();
					this.model.destroy({success: this.removeSuccess, error: this.removeError});
				}
			}
		},
		remove : function(){
			var root = this;
			this.$el.slideUp(600, function(){
				root.$el.remove();
			});
		},
		destroyView : function(e){
			this.dispose();
		},
		removeSuccess: function(model, response){},
		removeError: function(model, response){
			console.log("wtf?11 - removeError" , this);
		},
		render: function(data) {
			var elCode = $(this.template(this.model.toJSON()));
			this.$el.append(elCode);
			this.submitEl = this.model.viewLink.submitEl = elCode.find(".save");
			this.removeEl = this.model.viewLink.removeEl= elCode.find(".remove");
			this.removeEl = this.model.viewLink.idEl= elCode.find("._id");
			this.submitEl.hide();
			return this;
		},
		submitModel: function(e){
			if(this.model.hasChanged()) this.model.save({},{success: this.saveSuccess, error: this.saveError});
		},
		saveSuccess: function(model, response){
			model.viewLink.submitEl.fadeOut();
			if($.taskList.updateQueue.stack[0]) {
				model.viewLink.model.set("_id", $.taskList.updateQueue.stack[0])
				$.taskList.updateQueue.stack.pop();
				console.log("saveSuccess: ", model.get("_id"));
				model.viewLink.submitEl.fadeOut();
			}
		},
		saveError: function(model, response){
			console.log('smth was ololo!11 ', response);
		},
		changeTtl: function(e){
			var el = $(e.currentTarget);
			if(el.hasClass('eta') || el.hasClass('edit') || el.hasClass('buttons')) return;
			var val = el.text();
			el.empty();
			var edit = el.find('input');
			if(edit.length > 0){
				edit.val(val);
				edit.show();
			}else{
				edit = $('<input type="text" value="'+val+'"/>');
				el.append(edit);
			}
			edit.focus();
		},
		parseData : function (el) {
			var data = {};
			var num = el.find('._id').val();
			var arr = ["duration","cost","eta","link","done","_id","title"];
			for (var i = arr.length - 1; i >= 0; i--) {
				data[arr[i]] = el.find('.' + arr[i]).text();
			};
			if(data['done'] == "") data['done'] = false;
			data['_id'] = num;
			return data;
		},
		checkNumber: function(e){
			if(!e.currentTarget || e.currentTarget.length <= 0) return;
			var reg = /([0-9])/gi;
			var val = $(e.currentTarget).val().match(reg);
			if(val) val = val.join('')*1;
			$(e.currentTarget).val(val ? val : 0)
		},
		calcCost: function (e){
			$(e.currentTarget).closest('.view').find('.cost').text($(e.currentTarget).find('input').val()*15);		
		},
		itemEditComplete: function(e){
			var el = $(e.currentTarget).closest('.item');
			var hold = $(e.currentTarget).closest('.view');
			if(el && el.hasClass('cost') || el.hasClass('eta') || el.hasClass('duration')) this.checkNumber(e);
			var val = $(e.target).val();
			el.text(val);
			$(e.target).remove();
			var data = this.parseData(hold);
			this.model.set(data);
		}
	});
});

$(window).load(function(){
	//http://localhost:3000/task/#/views/10

    function appCore(){
    	return {
	    	configUrl : "/cofig",
	    	getConfig : function(){
	    		var config = {};
				config.routes = {
		            "views/:id": "getView",
		            "selected/:id": "renderSelected",
		            "*actions": "defaultRoute"
		        }
	    		return config;
	    	},
	    	init : function(){
	    		var AppRouter = Backbone.Router.extend(this.getConfig());
	    		var app_router = $.taskList.app.globalAppRouter = new AppRouter;
			    app_router.on('route:getView', function (id) {
			        console.log('model save: ', $.taskList.AppRouter);
			        alert( "Get post number " + id );   
			    });
			    app_router.on('route:renderSelected', function (id) {
			    	console.log($.taskList.detailsCollection)
			        var detailsCollection = $.taskList.app.detailsCollection = new $.taskList.detailsCollection(new $.taskList.AppModel, {hashCode:"showDetails/"+id});
			    	var detailsApp = $.taskList.app.detailsView = new $.taskList.TaskGenerator({collection: detailsCollection});
			    	$("#todoapp").empty().html(detailsApp.el);
				});
			    app_router.on('route:defaultRoute', function (actions) {
			    	var appModel = new $.taskList.AppModel;
			    	var appCollection = $.taskList.app.appCollection = new $.taskList.tasksCollection(appModel);
			    	var indexApp = $.taskList.app.globalView = new $.taskList.TaskGenerator({model: appModel, collection: appCollection});
			    	//new $.taskList.utils.SourceView({model: new $.taskList.AppModel, collection : new $.taskList.tasksCollection})
					$("#todoapp").html(indexApp.el);
			    });
			    Backbone.history.start();
			    return this;
	    	}
	    }
    }
    var tsk = new appCore().init();

})
	/*$.taskList.NewItemModel = Backbone.Model.extend({
		idAttribute: '_id',
		initialize: function(data, view){
			console.log("new item model initialize");
			this.viewLink = view;
			this.modelId = $.taskList.globalId++;
		},
		defaults: function(){
		  return {
			title: 'task title some other ',
			_id : '',
			duration: 0,
			cost: 0,
			eta: '0/1/0',
			link: 'http://localhost',
			done: false
		  };
		}
	});*/