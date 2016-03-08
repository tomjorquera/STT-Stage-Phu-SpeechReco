angular.module('myApp.factories', []).
	factory('toolSelectedFactory', function(){
		var selectedTool =  {
			tool: [],
			getSelectedTool: function(){
				return selectedTool.tool;
			},
			setSelectedTool: function(toolName){
				(selectedTool.tool).push(toolName);
			},
			rmSelectedTool: function(toolName){
				(selectedTool.tool).splice((selectedTool.tool).indexOf(toolName),1);
			},
			clearList: function(){
				selectedTool.tool = [];
			}
		};
		return selectedTool;
	}).
	factory('mySocket', function (socketFactory) {
	  	var myIoSocket = io.connect(location.href.substr(0,location.href.lastIndexOf('/')+1));

		mySocket = socketFactory({
			ioSocket: myIoSocket
		});

		return mySocket;
	}).
	factory('clientDistinct', function(){
		var client = {
			name: "unknown",
			setNameClient: function(name){
				client.name = name;
			},
			getNameClient: function(){
				return client.name;
			},
		};
		return client;
	}).
	factory('choosedCorpus',function(){
		var corpus = {
			name: "unknown",
			setCorpusName: function(corpusName){
				corpus.name = corpusName;
			},
			getCorpusName: function(){
				return corpus.name;
			}
		}
		return corpus;
	}).
	factory('corpusName',function(){
		var corpusName = {
			value: "",
			setName: function(name){
				corpusName.value = name;
			},
			getName: function(){
				return corpusName.value;
			}
		}
		return corpusName;
	}).
	factory('dataResult',function(){
		return {	
			data: [{value:[-1,-1,-1], stat: false},{value:[-1,-1,-1], stat: false}],
			setValue: function(werValue,recallValue,timeValue){
				if(!this.data[0].stat){
					this.data[0].value[0] = werValue;
					this.data[0].value[1] = recallValue;
					this.data[0].value[2] = timeValue;
					this.data[0].stat = true;
				} else{
					this.data[1].value[0] = werValue;
					this.data[1].value[1] = recallValue;
					this.data[1].value[2] = timeValue;
					this.data[1].stat = true;
				}
				
			},
			getValue: function(){
				return this.data;
			},
			clear: function(){
				this.data = [{value:[-1,-1,-1], stat: false},{value:[-1,-1,-1], stat: false}];
			}
		};
	}).
	factory('seriesDraw',function(){
		return{
			series: [],
			getSeries: function(){
				return this.series;
			},
			setSeries: function(toolName){
				(this.series).push(toolName);
			},
			rmSeries: function(toolName){
				(this.series).splice((this.series).indexOf(toolName),1);
			},
			clearList: function(){
				this.series = [];
			}
		}
	})
;