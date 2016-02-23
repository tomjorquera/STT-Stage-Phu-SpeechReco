exports.werCalcul = function(diffObject,orgText){
	var added = 0;
	var removed = 0;
	var subs = 0;
	var N = 0;
	//campare texts with diff
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
	//calcul subs
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
	console.log('removed = '+removed);
	console.log('added = '+added);
	console.log('subs = '+subs);
	console.log('N = '+N);
	var WER = (removed+added+subs)/N;
	return WER
}