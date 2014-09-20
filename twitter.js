var twitterjs = (function(){
  var api       = {},
      observers = {before:{}, on:{}, after:{}};

  api.get     = {};
  api.observe = {};

  var actions = {tweet:'tweet', dm:'direct_message', retweet:'retweet', follow:'follow', unfollow:'unfollow', typeahead:'search.typeahead'}
     
  var routes = {
    "/i/tweet/create"          :actions.tweet,
    "/i/direct_messages/new"   :actions.dm,
    "/i/tweet/retweet"         :actions.retweet,
    "/i/user/follow"           :actions.follow,
    "/i/user/unfollow"         :actions.unfollow,
    "/i/search/typeahead.json" :actions.typeahead
  }

  var utils = {
      
      /*
       * 
       */
      parse_url : function(url){
        var parsed = {};

        // extract path/query params
        parsed.path = url; 
        var index_of_qmark = url.indexOf('?');
        if(index_of_qmark != -1){
          // path = everything before '?'
          parsed.path = url.substring(0, index_of_qmark);
          // query = everything after '?' (length check to safe)
          if(url.length > (index_of_qmark+1)) parsed.query_string = url.substring(index_of_qmark + 1);
        }
        
        // extract query params
        if(typeof parsed.query_string !== 'undefined'){
          parsed.params = this.parse_data(parsed.query_string);
        }
        return parsed;
      },

      /*
       * 
       */
      parse_data : function(data){
        if(data == null) return;

        var parsed = {}
        data.split("&").forEach(function(part) {
          var item = part.split("=");
          item[1] = item[1].replace(/\+/g, ' '); // twitter uses '+' to represent spaces
          parsed[item[0]] = decodeURIComponent(item[1]);
        });
        return parsed;
      }
      
      
      
  }

  // user's twitter @username
  api.get.screen_name = function(){
    return $('div[data-screen-name]').attr('data-screen-name');
  }

  // uesr's internal id used by twitter
  api.get.user_id = function(){
    return $('div[data-screen-name]').attr('data-user-id');
  }

  // users full name
  api.get.full_name = function(){
    return $('div[data-screen-name]').find('b.fullname').text();
  }
  
  // return all tweets on the current page (Me, Discover, Home)
  api.get.tweets = function(){
    // '#discover'
    if (window.location.href.indexOf('i/discover') != -1) {
      return $('.discover-stream').find('.stream-item');
    
    } else if (window.location.href.indexOf('/' + api.get.screen_name()) != -1) { // 'Me' page
      return $('.GridTimeline-items[role="list"]').find('div[data-item-type="tweet"]');
      
    } else if (window.location.href == 'https://twitter.com/') { // homepage 
      return  $('.home-stream').find('.stream-item');
    }
    return {};
  }

  api.observe.on = function(action, callback){
    api.observe.bind('on', action, callback);
  }

  api.observe.before = function(action, callback){
    api.observe.bind('before', action, callback);
  }

  api.observe.bind = function(type, action, callback){
    if(typeof observers[type][action] != 'object') {
      observers[type][action] = [];
    }
    observers[type][action].push(callback);
  }

  api.observe.trigger = function(type, action, args){
    if(typeof observers[type][action] === 'undefined') return;
    
    // execute all observing event handlers
    $.each(observers[type][action], function(){
      this.apply(undefined, args);
    });
  }

  api.init = function(){
    // override xhr open
    var _open = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
      this.params = {method:method, url:url}; // store original parameters
      // call the default open
      return _open.apply(this, arguments);
    };

    // override xhr send
    var _send = window.XMLHttpRequest.prototype.send;
    window.XMLHttpRequest.prototype.send = function(data) {
      // array of args we'll pass to any 'action' handlers
      var callback_args = [];

      // parse the url (path, query, query params)
      var url_map = utils.parse_url(this.params.url);

      // parse the 'data' being sent
      var data_map = utils.parse_data(data);

      // find our action
      var valid_action = true;
      var action = routes[url_map.path];

      // below is a great place to add specific logic to return back
      // relevant data to the observing 'handlers' (ie. fn callbacks)
      switch (action) {
        case actions.typeahead:
          callback_args.push(url_map.params.q); // search term
          break;
        case actions.tweet:
          // tweeted tweet
          var tweet = {
            tagged_users : data_map.tagged_users,
            text         : data_map.status,
            location     : $('.geo-status').html()
          }
          callback_args.push(tweet);
          break;
        case actions.retweet:
          // retweeted tweet
          var tweet = {
            id       : data_map.id,
            username : $('#retweet-tweet-dialog-body').find('.username').text(),
            text     : $('#retweet-tweet-dialog-body').find('.tweet-text').text()
          }
          callback_args.push(tweet);
          break;
        case actions.follow:
          callback_args.push(data_map.user_id);
          break;
        case actions.unfollow:
          callback_args.push(data_map.user_id);
          break;
        case actions.dm:
          // TODO: implement me!
          break;
        default:
          valid_action = false;
          break;
      }
      
      // trigger 'before' handlers
      if(valid_action){
        // pack the args that we'll pass to our 'action' handlers
        callback_args.push(data);
        callback_args.push(this); // xhr object
        api.observe.trigger('before', action, callback_args);
      }

      // send it!
      var ret = _send.apply(this, arguments);

      // TODO: implement 'after' (via onreadystagechange)

      // trigger 'on' handlers
      // Note: 'on' fires right after the request is sent
      if(valid_action) api.observe.trigger('on', action, callback_args);
      return ret;
    }
  }

  api.init(); // init all handlers
  return api;
})();