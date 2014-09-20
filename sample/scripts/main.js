
var main = function(){
  //alert(twitterjs.get.full_name()); 
}

function tjs_loaded (){  
  if(typeof twitterjs === 'undefined'){
    setTimeout(tjs_loaded, 10);
  }else{
    // run your code
    main();
  }  
}

tjs_loaded();