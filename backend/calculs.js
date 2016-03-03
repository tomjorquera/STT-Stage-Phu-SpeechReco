"use strict";

exports.werCalcul = function(diffObject,orgText){
	var added = 0;
	var removed = 0;
	var subs = 0;
	var N = 0;
	//get removed and added words with diff
	diffObject.forEach(function(part){
		if (part.removed){
			part.value.split(' ').forEach(function(a){
				//console.log('removed:'+a+'/');
				if(a!==''){
					removed += 1;
				}			
			});
		}
		if (part.added){
			part.value.split(' ').forEach(function(a){
				//console.log('added:'+a+'/');
				if(a!==''){
					added += 1;
				}
			})
		}
	});
	//calcul subs = min(added,removed)
	if (removed === added){
		subs = removed;
		removed = 0;
		added = 0;
	} else if (removed<added){
		subs = removed;
		var addedBis = added-removed;
		added = addedBis;
		removed = 0;
	} else {
		subs = added;
		var removedBis = removed-added;
		removed = removedBis;
		added = 0;
	}
	//sum up in
	orgText.split(' ').forEach(function(a){
		if(a!==''){
			N += 1;
		}
	});
	console.log("For WER calcul");
	console.log('removed = '+removed);
	console.log('added = '+added);
	console.log('subs = '+subs);
	console.log('N = '+N);
	var WER = (removed+added+subs)/N;
	return WER.toFixed(3);
}

exports.precisionRecall = function(result,keywords){
	var truePositives = 0;
	var resultLength = 0;
	//cut off the no character words
	result.forEach(function(mot){
		if (mot !== '' && mot !== ' '){
			resultLength += 1;
		}
	})
	//increment tp whenever a keyword is detected
	keywords.forEach(function(keyword){
		if (result.indexOf(keyword) > -1){
			truePositives += 1;
		}
	});

	console.log('tp = '+truePositives);
	console.log('kwl = '+keywords.length+' '+keywords);
	console.log('rsltl = '+resultLength+' '+result);
	//pre = tp/tp+fp = tp/keywordsLength
	var precision = truePositives/keywords.length;
	//recall = tp/(tp+fn) = tp/resultLength
	var recall = truePositives/resultLength;
	//F1-score
	var fScore = (2*precision*recall)/(precision+recall);
	return {
		precision: precision.toFixed(3),
		recall: recall.toFixed(3),
		fscore: fScore.toFixed(3)
	}
}