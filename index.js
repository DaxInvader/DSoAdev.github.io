$(document).ready(function () 
{     
    var _timeDisplayStr = ""; 
    var _currentDate = new Date();
    
    var _afterVar = "";
    var _oldAfterVar = "";
    
    var _runningInterface = false;
    var _resultsLength = 100;  /*amount of results to get from json*/
    
    var _tryIncrements = 50;
    var _maxTries = 50;
    var _currentTry = 0;
    
    var _resultsCount = 0;
    var _validResultsCount = 0;
    
    var _minimumUTC;
    var _maxImageWidth = 300;
    var _maxImageHeight  = 300;
    
    
    //_timeDisplayStr = _currentDate.toLocaleString() +  ' ;  ' + getUTCTime(_currentDate);
    $("#utc_time").html(_currentDate.toLocaleString());
    
    _currentDate.setDate(_currentDate.getDate() - 1);
    //_timeDisplayStr =_currentDate.toLocaleString();
    
    _minimumUTC = getUTCTime(_currentDate);//Math.round((currentDate).getTime() / 1000);
    //_timeDisplayStr += ' ;  ' + _minimumUTC;
    $("#start_utc_time").html(_currentDate.toLocaleString());
    
    
    $("#days").change(function() {
      var selectedDay = $("#days").children("option:selected").val();
      
      _currentDate = new Date(); 
      _currentDate.setDate(_currentDate.getDate() - selectedDay);
      
      //var currentStr =_currentDate.toLocaleString();
      
      _minimumUTC = getUTCTime(_currentDate) ; //Math.round((currentDate).getTime() / 1000);
      
      //currentStr += ' ;  ' + _minimumUTC;
      $("#start_utc_time").html(_currentDate.toLocaleString());
      
    });
     
    $(document).on('change', '#page', function() {
      var selectedPage = $("#page").children("option:selected").val();
      
      //alert("selected page = " + selectedPage);
      window.location.href=selectedPage;

      
    });
    
    
    
    $("#selected_gallery_controls").click(function() {
      
      if($('#selected_gallery_panel').is(':visible'))
      {
          $(this).text("show faves");
          $("#selected_gallery_panel").hide();
      }
      else
      {
         $(this).text("hide faves");
         $("#selected_gallery_panel").show();
      }
    });

    
    $("#search_button").click(function() {
      var selectedSub = $("#subs").children("option:selected").val();
      //alert("You have selected the sub - " + selectedSub);

      $("#content").empty();
      
      _currentTry = 0;
      
      _resultsCount = 0;
      _validResultsCount = 0;
      
      _afterVar = "";
      _runningInterface = false;
      
      $("#selected_gallery_list").empty();
      buildSelectedGalleryText();
      
      getImages(selectedSub);
    });
    
    $("#back_to_top").click(function() {
        $("html, body").animate({ scrollTop: 0 }, "slow");
        return false;
    });
    
    
    $('body').on('click', '.add_item_to_gallery', function() {
        //selected_gallery_list
        
        var userName = $(this).parent().find(".comment_user_name").text().toLowerCase();
        var afterID = "";
        
        //var insertIndex=0;
        
        $(".remove_item_from_gallery").each(function( index ) 
        {
        
           var thisUserName = $(this).parent().find(".comment_user_name").text().toLowerCase();
           var thisID = $(this).parent().attr("id");
           
           //console.log( index + ": " + thisUserName + " ? " + userName + " = " + userName.localeCompare(thisUserName) + " ; ID = " + thisID); 

            if(userName.localeCompare(thisUserName) < 0)  //> -1)
            {
              //insertIndex = index; // breaks
              afterID =  thisID;
              return false;
            }

        });    
        //alert(userName + " insert after " + afterID);
        
        //****************************************************************************//
        
        var clone = $(this).parent().clone();
        
        $(this).attr("id",$(this).attr("id").replaceAll("add_item_to_gallery","comment_remove_item_from_gallery"));
        $(this).attr("class","comment_remove_item_from_gallery");
        $(this).html("Remove from favourites");
        
        //var img = $(this).parent().find("img");//.attr("src");
        //alert(img);
        //getImageDimensions(img,300,300);
        
        clone.html(clone.html().replaceAll("comment_results_","gallery_results_"));
        clone.html(clone.html().replaceAll("add_item_to_gallery","remove_item_from_gallery"));
        
        clone.find(".remove_item_from_gallery").html("Remove from favourites");
        
        if(afterID == "")
        {
            $("#selected_gallery_list").append(clone);
        }
        else
        {
            clone.insertBefore( $("#" + afterID) );
            //$("#selected_gallery_list>div:nth-child(" + insertIndex + ")").append(clone.html());
        }
        
        //$("#selected_gallery_list").append(clone);
        
        
        //alert("You have selected the item - " + $(this).attr("id"));
        buildSelectedGalleryText();
    });
    
    
     $('body').on('click', '.remove_loading', function() {
        //selected_gallery_list
        var loadingPanelID = $(this).attr("id").replaceAll("remove_loading_","loading_panel_");
        
        $("#"+loadingPanelID).remove();
        $(this).remove();

    });
    
    
    $('body').on('click', '.remove_item_from_gallery', function() {
        //selected_gallery_list
        var commentDivID = $(this).attr("id").replace("remove_item_from_gallery","comment_remove_item_from_gallery");
        //alert(commentDivID);
        
        var newID = $('#'+commentDivID).attr("id").replace("comment_remove_item_from_gallery","add_item_to_gallery");
        
        $('#'+commentDivID).attr("class","add_item_to_gallery");
        $('#'+commentDivID).html("Add to favourites");
        $('#'+commentDivID).attr("id",newID);
        
        $(this).parent().remove();
        buildSelectedGalleryText();
    });
    
    $('body').on('click', '.comment_remove_item_from_gallery', function() {
        //selected_gallery_list
        var galleryDivID = $(this).attr("id").replace("comment_remove_item_from_gallery","remove_item_from_gallery");
        //alert(galleryDivID);
        
        $('#'+galleryDivID).parent().remove();

        var newID = $(this).attr("id").replace("comment_remove_item_from_gallery","add_item_to_gallery");
        //alert(newID);
 
        $(this).attr("class","add_item_to_gallery");
        $(this).html("Add to favourites");
        $(this).attr("id",newID);
        
        buildSelectedGalleryText();
        
        
    });
    
    
    
    function buildSelectedGalleryText()
    {
        $("#selected_gallery_text_area").val("");
        
        var totalElements = $("#selected_gallery_list").children('.comment_results').length;
        var content = "";
        
        $("#selected_gallery_list").children('.comment_results').each(function(index) 
        { 
        //alert($(this).find(".comment_info .user_link .comment_user_name").html());
            var userName = $(this).find(".comment_info .user_link .comment_user_name").html();
            var occurences = content.indexOf(userName);
            
            var imgLink =  $(this).find(".image_link").attr("href");
            //alert(imgLink);
            if(imgLink.toLowerCase().indexOf("instagram") == 0)
            {
               imgLink =  $(this).find(".comment_image img").attr("src");
            }
            content = content + userName + " - " + imgLink ;  //$(this).find(".comment_image img").attr("src") ;
             
            if (occurences >= 0)
            {
                content = content + " *duplicate user*" ;
            }

            
            content = content  + "\n\n"; 
            //alert(str);

            if (index == totalElements-1)  
            {
                //var newVal = $('#selected_gallery_text_area').val() + str; 
                $('#selected_gallery_text_area').val(content); 
            }
            
        });
        
        $("#selected_gallery_info").text("selected : " + totalElements);
        $("#selected_gallery_controls").text("show faves (" + totalElements + ")");
    }
    
    
    function getImages(sub_name) 
    {
    
      var refreshId = setInterval(function() 
      { // this code is executed every 500 milliseconds:
                
        if(_currentTry == _maxTries)
        {
          alert(_tryIncrements + " pages loaded - " + _validResultsCount + " matching out of " + _resultsCount);
          
          //alert(_maxTries + " : " + _currentTry);
          clearInterval(refreshId); // breaks
          checkAndpdateAllInvalidImages("content", _maxImageWidth, _maxImageHeight);
          return false;
        }
                    
                    
        if(_runningInterface == false)
        {

          if($("#content").height() >  window.innerHeight)
         {
            $("#back_to_top").show();
         }
         
         
          var runSearch = false;
          
          if (_afterVar == "null")
          {
               //alert("no 'after' value found ; old val = " + _oldAfterVar); 

             redditURL ="http://www.reddit.com/r/" + sub_name + "/comments.json?limit=" + _resultsLength + "&after="+ _oldAfterVar + "&count=" + _resultsLength + "&jsonp";
             
             $.getJSON(redditURL).then(function(data2) {
              
                var tempAfterVal = getJSonStringifyWithoutQuotes(data2.data.after);

                if (tempAfterVal != "null")
                {
                    alert("redone afterval = " + _afterVar + " -> " + tempAfterVal); 
                    _afterVar = tempAfterVal;
                    runSearch = true;
                }
                else
                {
                    alert("Cannot find other entries - " + _validResultsCount + " matching out of " + _resultsCount);
                    clearInterval(refreshId); // breaks
                    
                    checkAndpdateAllInvalidImages("content", _maxImageWidth, _maxImageHeight);
                    
                    return false;
                }
             }); 

          }
          else
          {
            runSearch = true;
            
          }
          //console.log('runSearch :',runSearch);      
          if (runSearch)
          {
              _runningInterface = true;
              
              var redditURL= "http://www.reddit.com/r/" + sub_name + "/comments.json?limit=" + _resultsLength + "&jsonp"; 
              
              if (_afterVar.length > 0)
              {
                  redditURL ="http://www.reddit.com/r/" + sub_name + "/comments.json?limit=" + _resultsLength + "&after="+ _afterVar + "&count=" + _resultsLength + "&jsonp";
              } 

                //alert(redditURL);
               
               try
               {
               
                $.getJSON(redditURL).then(function(data) { 
                    //var compare = JSON.stringify(data.data.after) + " changed to ";
                     
                    //_afterVar = JSON.stringify(data.data.after);
                    //_afterVar = _afterVar.substring(1,_afterVar.length-1);
                    
                    _oldAfterVar = _afterVar;
                    _afterVar =getJSonStringifyWithoutQuotes(data.data.after);
                    
                   
                    //alert(compare + _afterVar  + " ; " + data.data.children.length);
                    
                    //console.log('afterVar :',_afterVar);
                    //console.log('min UTC :',_minimumUTC);
                    //console.log('child count :',data.data.children.length);
                    
                    $.each(data.data.children, function(index,item)
                    { 
                      try 
                      {
                       _resultsCount = _resultsCount +1;
                       
                       var createdUTC = JSON.stringify(item.data.created_utc); 
      
                        //console.log('createdUTC :',createdUTC);
                        
                        if(createdUTC < _minimumUTC )
                        {

                          alert("search completed - " + _validResultsCount + " matching out of " + _resultsCount);
                          //alert("created UTC < minimimum - " + createdUTC + " : " + minimumUTC);
                          clearInterval(refreshId); // breaks
                          checkAndpdateAllInvalidImages("content", _maxImageWidth, _maxImageHeight);
                          return false;
                        }
                        
                        /**************************************************/
                        var distinguished =getJSonStringifyWithoutQuotes(item.data.distinguished);
                        //var distinguished =  JSON.stringify(item.data.distinguished);
                        //distinguished = distinguished.substring(1,distinguished.length-1);
                        
                        var author =  getJSonStringifyWithoutQuotes(item.data.author);
                        //var author =  JSON.stringify(item.data.author);
                        //author = author.substring(1,author.length-1);
                        
                        var isSubmitter =  JSON.stringify(item.data.is_submitter);
                        
                        var bodyStr = getJSonStringifyWithoutQuotes(item.data.body);
                        //var bodyStr = JSON.stringify(item.data.body);
                        bodyStr = bodyStr.replace("\\n", " ");
                        //bodyStr = bodyStr.substring(1,bodyStr.length-1);
                        
                        //console.log('index :',index);
                        //console.log('isSubmitter :',isSubmitter);
                         /*if(author.toUpperCase() == "VELVETPINCHES")
                         {
                               var url2 = getURLFromString(bodyStr);
                               alert(url2);
                         }   */
                         /*
                         if ( (bodyStr.toUpperCase().indexOf("HTTPS://") >= 0 || bodyStr.toUpperCase().indexOf("HTTP://") >= 0)   && 
                              (author.toUpperCase() != "AUTOMODERATOR") && (author.toUpperCase() != "JCCHANG4") &&    
                              (author.toUpperCase() != "[DELETED]") &&  
                              (distinguished.toUpperCase() != "MODERATOR") &&    
                              (isSubmitter == "false")
                            )
                         */ 
                        if ( (bodyStr.toUpperCase().indexOf("HTTPS://") >= 0 || bodyStr.toUpperCase().indexOf("HTTP://") >= 0)   && 
                              (author.toUpperCase() != "AUTOMODERATOR") && (author.toUpperCase() != "JCCHANG4") &&    
                              (author.toUpperCase() != "[DELETED]") &&  
                              (distinguished.toUpperCase() != "MODERATOR") &&    
                              (isSubmitter == "false")
                            )
                        {
                            _validResultsCount = _validResultsCount +1;
                        
                           var url = getURLFromString(bodyStr);
                           
                          //alert("match = " + bodyStr + " ; " + url);
                           var commentLink = getJSonStringifyWithoutQuotes(item.data.permalink);
                           //var commentLink = JSON.stringify(item.data.permalink);
                           //commentLink = commentLink.substring(1,commentLink.length-1);
                           
                           
                           var dt=eval(createdUTC*1000);
                           var createdTranslatedDate = new Date(dt);
                           
                           $("#content").append("<div class='comment_results' id='comment_results_" + _resultsCount + "'><div class='add_item_to_gallery' id='add_item_to_gallery_" + _resultsCount + "'>Add to favourites</div><div class='comment_info'><a href='https://www.reddit.com/user/" + author + "' target='_blank' class='user_link'><span class='comment_user_name'>u/" + author + "</span></a> [" + createdTranslatedDate.toLocaleString() + "] <br /><a href='https://www.reddit.com" + commentLink + "'  target='_blank' class='comment_link'>comment link</a> | <a href='" + url + "' target='_blank' class='image_link'>image link</a> | <span class='remove_loading' id='remove_loading_" + _resultsCount + "'>remove loading</span></div><div class='comment_image'><div class='loading_panel' id='loading_panel_" + _resultsCount + "'></div><img src='" + url + "' alt='" + url + "' id='comment_image_" + _resultsCount + "' width='0' height='0'></div></div></div>");  
                           //console.log('URL :',url);  
                           if(isStringValidImageUrl(url) == false)
                           {
                             if (url.toUpperCase().indexOf("REDDIT.COM") >= 0)
                             {
                                 getRedditPageImage(url,'comment_results_' + _resultsCount); 
                             }
                             else if (url.toUpperCase().indexOf("IMGUR.COM") >= 0)
                             {
                                  getImgurImage(url,'comment_results_' + _resultsCount); 
                             }
                             else if ((url.toUpperCase().indexOf("I.REDD.IT") >= 0) || (url.toUpperCase().indexOf("IMAGES-WIX") >= 0) || (url.toUpperCase().indexOf("PREVIEW.REDD.IT") >= 0))
                             {
                                 //console.log('runSearch :',runSearch);  
                             }
                             else if ((url.toUpperCase().indexOf("V.REDD.IT") >= 0))
                             {
                                  $("#remove_loading_" + _resultsCount).remove();
                                  getRedditPageVideo(url,'comment_results_' + _resultsCount);  
                             }
                             else if (url.toUpperCase().indexOf("DEVIANT") >= 0 || url.toUpperCase().indexOf("FAV.ME") >= 0)
                             {
                                   getDeviantArtThumbnail(url, 'comment_results_' + _resultsCount); 
                             }
                             else if (url.toUpperCase().indexOf("TWITTER") >= 0)
                             {
                                   $("#remove_loading_" + _resultsCount).remove();
                                   getTwitterEmbed(url, 'comment_results_' + _resultsCount); 
                             }
                             else if (url.toUpperCase().indexOf("VIDBLE") >= 0)
                             {
                                   getVidbleImage(url, 'comment_results_' + _resultsCount); 
                             }
                             else /*if (url.toUpperCase().indexOf("INSTAGRAM") >= 0)   */
                             {
                                  $("#remove_loading_" + _resultsCount).remove();
                                  getInstagramIFrame(url,'comment_results_' + _resultsCount); 
                             }
                           } 
                           else
                           {
                                var img = $("#comment_image_" + _resultsCount);//.attr("src");
                                //alert("ig from index = " + img.attr("src"));
                                getImageDimensions(img,_maxImageWidth,_maxImageHeight);                           
                           }
                        }
                        /*else
                        {
                        $("#content").append("u/" + author + " [" + index + "]- [" + createdUTC  + "] <br />");                  
                        }  */
                            
                       //console.log('runningInterface :',_runningInterface);
                       
                        
                        if (index == data.data.children.length-1)  
                        {
                             _runningInterface = false;
                             //alert("max hit");
                        } 
                        
                      }
                      catch(err) 
                      {
                        alert(err.message);
                      } 
                  });   
                
                });
             }
            catch(err1) 
              {
                alert("ERROR 1" + err1.message);
              }  

           }
           
           _currentTry = _currentTry + 1; 
            
         }
         
      }, 500);
  }
          
               
});