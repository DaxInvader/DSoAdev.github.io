$(document).ready(function() {
  var _timeDisplayStr = "";
  var _currentDate = new Date();

  var _afterVar = "";
  var _oldAfterVar = "";

  var _runningInterface = false;
  var _resultsLength = 2000; /*amount of results to get from json*/

  var _tryIncrements = 50;
  var _maxTries = 50;
  var _currentTry = 0;

  var _resultsCount = 0;
  var _validResultsCount = 0;

  var _minimumUTC;
  var _maxImageWidth = 300;
  var _maxImageHeight = 300;


  $("#utc_time").html(_currentDate.toLocaleString());
  var selectedNumberOfDays = document.getElementById("days");
  _currentDate.setDate(_currentDate.getDate() - parseInt(selectedNumberOfDays.value));
  _currentDate.setHours(0,0,0,0);
  $("#start_utc_time").html(_currentDate.toLocaleString());


  $("#days").change(function() {
    var selectedDay = $("#days").children("option:selected").val();
    _currentDate = new Date();
    _currentDate.setDate(_currentDate.getDate() - selectedDay);
    _currentDate.setHours(0,0,0,0);
    _minimumUTC = getUTCTime(_currentDate);
    $("#start_utc_time").html(_currentDate.toLocaleString());
  });

  $("#search_button").click(function() {
    var selectedSub = $("#subs").children("option:selected").val();
    $("#content").empty();
    _currentTry = 0;
    _resultsCount = 0;
    _validResultsCount = 0;
    _afterVar = "";
    _runningInterface = false;
    getImages(selectedSub);
  });

  $("#back_to_top").click(function() {
    $("html, body").animate({
      scrollTop: 0
    }, "slow");
    return false;
  });

  function getImages(sub_name) {

    var refreshId = setInterval(function() { // this code is executed every 500 milliseconds:

      if (_currentTry == _maxTries) {
        clearInterval(refreshId);
        checkAndpdateAllInvalidImages("content", _maxImageWidth, _maxImageHeight);
        return false;
      }

      if (_runningInterface == false) {

        if ($("#content").height() > window.innerHeight) {
          $("#back_to_top").show();
        }
        var runSearch = false;

        if (_afterVar == "null") {
          redditURL = "http://www.reddit.com/r/" + sub_name + "/comments.json?limit=" + _resultsLength + "&after=" + _oldAfterVar + "&count=" + _resultsLength + "&jsonp";

          $.getJSON(redditURL).then(function(data2) {

            var tempAfterVal = getJSonStringifyWithoutQuotes(data2.data.after);

            if (tempAfterVal != "null") {
              _afterVar = tempAfterVal;
              runSearch = true;
            } else {
              clearInterval(refreshId);
              checkAndpdateAllInvalidImages("content", _maxImageWidth, _maxImageHeight);
              return false;
            }
          });

        } else {
          runSearch = true;
        }
        if (runSearch) {
          _runningInterface = true;
          var redditURL = "http://www.reddit.com/r/" + sub_name + "/comments.json?limit=" + _resultsLength + "&jsonp";
          if (_afterVar.length > 0) {
            redditURL = "http://www.reddit.com/r/" + sub_name + "/comments.json?limit=" + _resultsLength + "&after=" + _afterVar + "&count=" + _resultsLength + "&jsonp";
          }


          try {

            $.getJSON(redditURL).then(function(data) {

              _oldAfterVar = _afterVar;
              _afterVar = getJSonStringifyWithoutQuotes(data.data.after);

              $.each(data.data.children, function(index, item) {
                try {
                  _resultsCount = _resultsCount + 1;

                  var createdUTC = JSON.stringify(item.data.created_utc);


                  if (createdUTC < _minimumUTC) {

                    //alert("search completed - " + _validResultsCount + " matching out of " + _resultsCount);
                    //alert("created UTC < minimimum - " + createdUTC + " : " + minimumUTC);
                    clearInterval(refreshId); // breaks
                    checkAndpdateAllInvalidImages("content", _maxImageWidth, _maxImageHeight);
                    return false;
                  }

                  /**************************************************/
                  var distinguished = getJSonStringifyWithoutQuotes(item.data.distinguished);

                  var author = getJSonStringifyWithoutQuotes(item.data.author);


                  var isSubmitter = JSON.stringify(item.data.is_submitter);

                  var bodyStr = getJSonStringifyWithoutQuotes(item.data.body);

                  bodyStr = bodyStr.replace("\\n", " ");

                  if ((bodyStr.toUpperCase().indexOf("HTTPS://") >= 0 || bodyStr.toUpperCase().indexOf("HTTP://") >= 0) &&
                    (author.toUpperCase() != "AUTOMODERATOR") &&
                    (author.toUpperCase() != "[DELETED]") &&
                    (distinguished.toUpperCase() != "MODERATOR") &&
                    (isSubmitter == "false")
                  ) {
                    _validResultsCount = _validResultsCount + 1;
                    var url = getURLFromString(bodyStr);

                    var commentLink = getJSonStringifyWithoutQuotes(item.data.permalink);

                    var dt = eval(createdUTC * 1000);
                    var createdTranslatedDate = new Date(dt);

                    $("#content").append("<div class='comment_results' id='comment_results_" + _resultsCount + "'><div class='commentinfo'>[" + createdTranslatedDate.toLocaleString() + "]<br/><a href='https://www.reddit.com/user/" + author + "' target='_blank' class='commentusername'><span class='commentusername'>u/" + author + "</span></a> | <a href='https://www.reddit.com" + commentLink + "'  target='_blank' class='commentusername'>comment link</a> | <a href='" + url + "' target='_blank' class='commentusername'>image link</a><span class='remove_loading' id='remove_loading_" + _resultsCount + "'>remove loading</span></div><div class='comment_image'><div class='loading_panel' id='loading_panel_" + _resultsCount + "'></div><img src='" + url + "' alt='" + url + "' id='comment_image_" + _resultsCount + "' width='0' height='0'><a class='commentusername'></a></div></div></div>");

                    if (isStringValidImageUrl(url) == false) {
                      if (url.toUpperCase().indexOf("REDDIT.COM") >= 0) {
                        getRedditPageImage(url, 'comment_results_' + _resultsCount);
                      } else if (url.toUpperCase().indexOf("IMGUR.COM") >= 0) {
                        getImgurImage(url, 'comment_results_' + _resultsCount);
                      } else if ((url.toUpperCase().indexOf("I.REDD.IT") >= 0) || (url.toUpperCase().indexOf("IMAGES-WIX") >= 0) || (url.toUpperCase().indexOf("PREVIEW.REDD.IT") >= 0)) {
                        //console.log('runSearch :',runSearch);  
                      } else if ((url.toUpperCase().indexOf("V.REDD.IT") >= 0)) {
                        $("#remove_loading_" + _resultsCount).remove();
                        getRedditPageVideo(url, 'comment_results_' + _resultsCount);
                      } else if (url.toUpperCase().indexOf("DEVIANT") >= 0 || url.toUpperCase().indexOf("FAV.ME") >= 0) {
                        getDeviantArtThumbnail(url, 'comment_results_' + _resultsCount);
                      } else if (url.toUpperCase().indexOf("TWITTER") >= 0) {
                        $("#remove_loading_" + _resultsCount).remove();
                        getTwitterEmbed(url, 'comment_results_' + _resultsCount);
                      } else if (url.toUpperCase().indexOf("VIDBLE") >= 0) {
                        getVidbleImage(url, 'comment_results_' + _resultsCount);
                      } else {
                        $("#remove_loading_" + _resultsCount).remove();
                        getInstagramIFrame(url, 'comment_results_' + _resultsCount);
                      }
                    } else {
                      var img = $("#comment_image_" + _resultsCount);

                      getImageDimensions(img, _maxImageWidth, _maxImageHeight);
                    }
                  }

                  if (index == data.data.children.length - 1) {
                    _runningInterface = false;

                  }

                } catch (err) {
                  alert(err.message);
                }
              });

            });
          } catch (err1) {
            alert("ERROR 1" + err1.message);
          }

        }

        _currentTry = _currentTry + 1;

      }

    }, 500);
  }


});


if (typeof _maxImageWidth === 'undefined') {
  var _maxImageWidth = 300;
}

if (typeof _maxImageHeight === 'undefined') {
  var _maxImageHeight = 300;
}


function getRedditPageImage(this_url, results_id) {

  var newURL = this_url;
  var httpStartIndex = newURL.indexOf("?");

  try {
    if (httpStartIndex >= 0) {
      //if there's a ? AND a &s, then we leave as is
      if (newURL.indexOf("&s=") < 0) {
        var strLen = newURL.length - httpStartIndex + 1;
        newURL = newURL.substring(0, httpStartIndex);
      }

    }


    //alert(newURL);
    var jsonURL = newURL + ".json";

    $.getJSON(jsonURL).then(function(data) {
      newURL = getJSonStringifyWithoutQuotes(data[0].data.children[0].data.url);

      if (newURL.toUpperCase().indexOf("V.REDD.IT") >= 0) {
        //alert(newURL);
        newURL = getJSonStringifyWithoutQuotes(data[0].data.children[0].data.secure_media.reddit_video.fallback_url);

        //alert(newURL);
        var vidStr = "<video width='" + _maxImageWidth + "' height='" + _maxImageHeight + "' controls autoplay><source src='" + newURL + "'' type='video/mp4'</video>";

        $("#" + results_id + " .comment_image").remove();
        $("#" + results_id).append(vidStr);


        $("#" + results_id).parent().find(".loading_panel").remove();
        //getRedditPageVideo(newURL, results_id);
      } else {
        $("#" + results_id + " img").attr("src", newURL);

        getImageDimensions($("#" + results_id + " img"), _maxImageWidth, _maxImageHeight);
      }


      //console.log("reddit_img : ",newURL);
    });
  } catch (err) {
    console.log("reddit_img ERR: ", err.message);
    newURL = this_url;
  }

}

function getRedditPageVideo(this_url, results_id) {

  var newURL = this_url;
  var httpStartIndex = newURL.indexOf("?");

  try {
    if (httpStartIndex >= 0) {
      var strLen = newURL.length - httpStartIndex + 1;
      newURL = newURL.substring(0, httpStartIndex);
    }


    //alert(newURL);
    var jsonURL = newURL + ".json";

    $.getJSON(jsonURL).then(function(data) {
      try {
        alert(jsonURL);
        newURL = getJSonStringifyWithoutQuotes(data[0].data.children[0].data.secure_media.reddit_video.fallback_url);

        alert(newURL);
        var vidStr = "<video width='" + _maxImageWidth + "' height='" + _maxImageHeight + "' controls autoplay><source src='" + newURL + "'' type='video/mp4'</video>";

        $("#" + results_id + " .comment_image").remove();
        $("#" + results_id).append(vidStr);


        $("#" + results_id).parent().find(".loading_panel").remove();
      } catch (err2) {
        alert("vid error - " + err2.message);
      }
    });
  } catch (err) {
    alert("reddit_vid ERR: " + err.message);
  }

}

function getImgurImage(this_url, results_id) {
  var runAjax = false;
  var urlHolder = this_url.trim();

  if (urlHolder.indexOf(")") >= 0) //(this_url.endsWith(")") == true)
  {
    var endIndex = urlHolder.lastIndexOf(")");
    urlHolder = urlHolder.substring(0, endIndex); //this_url.length-1);
    //alert(urlHolder);
  }

  var split = urlHolder.split("/");

  if ((urlHolder.toUpperCase().indexOf("/A/") >= 0) || (split[split.length - 2] == "gallery")) {
    urlHolder = "https://api.imgur.com/3/album/" + split[split.length - 1];
    runAjax = true;
  } else {
    urlHolder = "https://i.imgur.com/" + split[split.length - 1];
    //alert(urlHolder + " single image");
    var split2 = urlHolder.split(".");
    if (split2.length < 4) {
      //alert(urlHolder + " has no ext");
      urlHolder = urlHolder + ".jpg";
    }
    //urlHolder = "https://i.imgur.com/"

    if (urlHolder.toUpperCase().indexOf(".MP4") >= 0) {
      var vidStr = "<video width='" + _maxImageWidth + "' height='" + _maxImageHeight + "'><source src='" + urlHolder + "'' type='video/mp4'</video>";

      $("#" + results_id + " .comment_image").remove();
      $("#" + results_id).append(vidStr);

      $("#" + results_id).parent().find(".loading_panel").remove();
    } else {
      $("#" + results_id + " img").attr("src", urlHolder);
      getImageDimensions($("#" + results_id + " img"), _maxImageWidth, _maxImageHeight);
    }

  }


  if (runAjax == true) {
    var req = new XMLHttpRequest();

    req.onreadystatechange = function() {
      if (req.readyState == 4 && req.status == 200) {
        try {
          var jsonResponse = JSON.parse(req.responseText);

          newURL = jsonResponse["data"]["images"][0]["link"];

          if (newURL.toUpperCase().indexOf(".MP4") >= 0) {
            var vidStr = "<video  width='" + _maxImageWidth + "' height='" + _maxImageHeight + "' controls autoplay><source src='" + newURL + "'' type='video/mp4'</video>";

            $("#" + results_id + " .comment_image").remove();
            $("#" + results_id).append(vidStr);

            $("#" + results_id).parent().find(".loading_panel").remove();
          } else {
            $("#" + results_id + " img").attr("src", newURL);
            getImageDimensions($("#" + results_id + " img"), _maxImageWidth, _maxImageHeight);
          }



          //console.log("imgur_path : ",newURL);
        } catch (err) {
          console.log("imgur_path ERR: ", err.message);
        }


      } else {
        //console.log("Error with Imgur Request : " + req.status + " ; " + req.readyState);
      }
    }
    req.open("GET", urlHolder, true); // true for asynchronous     
    req.setRequestHeader('Authorization', 'Client-ID a9189406f9e23de');
    req.send(null);
  }


}


function getInstagramIFrame(this_url, results_id) {

  var newURL = "";
  var split = this_url.split("?");

  try {
    newURL = newURL + split[0];

    if (newURL.endsWith(")") == true) {
      //alert(newURL);
      newURL = newURL.substring(0, newURL.length - 1);
      //alert(newURL);
    }
    //alert($("#"+results_id).find(".image_link").attr("href"));
    $("#" + results_id).find(".image_link").attr("href", newURL);
    if (newURL.endsWith("/") == false) {
      newURL = newURL + "/";
    }

    if (this_url.toUpperCase().indexOf("INSTAGRAM") >= 0) {
      newURL = newURL + "embed/captioned/";
    }
    newURL = "<iframe src='" + newURL + "' style='width: 300px; height: 300px' allowfullscreen='true' class='res-media-zoomable'></iframe>";

    $("#" + results_id + " .comment_image").remove();
    $("#" + results_id).append(newURL);


  } catch (err) {
    console.log("instagram ERR: ", err.message);
    newURL = this_url;
  }

}


function getDeviantArtThumbnail(this_url, results_id) {

  var newURL = "https://backend.deviantart.com/oembed?url=" + this_url + "&format=jsonp&callback=?";
  try {

    $.ajax({
      url: newURL,
      type: 'GET',
      dataType: 'jsonp',
      success: function(jsondata) {
        //console.log("jsondata :",jsondata); 
        var thumbNail = getJSonStringifyWithoutQuotes(jsondata.thumbnail_url);
        $("#" + results_id + " img").attr("src", thumbNail);

        getImageDimensions($("#" + results_id + " img"), _maxImageWidth, _maxImageHeight);

      },
      error: function(errordata) {
        //$("#content").append("ERROR - " + JSON.stringify(errordata));
        alert("errordata :", errordata);
      }
    });

  } catch (err) {
    console.log("DA ERR: ", err.message);
  }

}

function getVidbleImage(this_url, results_id) {
  var urlHolder = this_url.trim();

  var split = urlHolder.split("/");

  if (split.length > 0) {
    urlHolder = "https://vidble.com/" + split[split.length - 1] + "_med.jpeg";
    $("#" + results_id + " img").attr("src", urlHolder);
    getImageDimensions($("#" + results_id + " img"), _maxImageWidth, _maxImageHeight);
  }

}


function getUTCTime(current_date) {
  return Math.round((current_date).getTime() / 1000);
}


function getJSonStringifyWithoutQuotes(obj) {
  var rv = JSON.stringify(obj);

  if (rv != null) {
    if (rv.startsWith("\"") == true) {
      rv = rv.substring(1, rv.length);
    }

    if (rv.endsWith("\"") == true) {
      rv = rv.substring(0, rv.length - 1);
    }
  } else {
    rv = "";
  }

  return rv;
}

function getTwitterEmbed(this_url, results_id) {

  var urlHolder = this_url.trim().toLowerCase();

  var n = urlHolder.indexOf("status");

  var newStr = "";
  var embedID = "";

  var useID = false;
  var newURL = "";

  try {

    if (n >= 0) {
      useID = true;
      n += 7;
      newStr = urlHolder.substr(n, urlHolder.length - n);
      embedID = newStr.split("/")[0];

      embedID = embedID.split("?")[0];

      newURL = "<iframe style='width: 300px; height: 300px' src='https://platform.twitter.com/embed/index.html?dnt=false&embedId=twitter-widget-0&frame=false&hideCard=false&hideThread=false&id=" + embedID + "&lang=en&siteScreenName=reddit&theme=light&width=300px&height=300px'></iframe>";

    } else {
      n = urlHolder.indexOf(".com") + 5;
      newStr = urlHolder.substr(n, urlHolder.length - n);
      embedID = newStr; //.split("?")[0]; 
      newURL = "<iframe style='width: 300px; height: 300px' src='http://instagram.com/p/" + embedID + "'/embed' frameborder='0'></iframe>"
    }

  } catch (err) {

  }


  $("#" + results_id + " .comment_image").remove();
  $("#" + results_id).append(newURL);

}

function getURLFromString(string_to_extract) {
  var url = string_to_extract.toString().trim();

  var split = url.split(" ");

  for (var i = 0; i < split.length; i++) {
    if (split[i].toUpperCase().indexOf("HTTPS://") >= 0 || split[i].toUpperCase().indexOf("HTTP://") >= 0) {
      url = split[i];
      break;
    }
  }

  var httpStartIndex = url.toUpperCase().lastIndexOf("HTTPS://");
  if (httpStartIndex < 0) {
    httpStartIndex = url.toUpperCase().lastIndexOf("HTTP://");
  }
  if (httpStartIndex >= 0) {
    //if httpStartIndex == 0, then the http starts at the beginning
    if (httpStartIndex == 0) {
      url = url.substring(httpStartIndex, url.length);
    } else {
      //if not, then something is at the beginning
      var startingCharacter = url.charAt(httpStartIndex - 1);

      url = url.substring(httpStartIndex, url.length);

      //alert(url + " - starting : " + startingCharacter);
      if (startingCharacter == "(") {
        var closingIndex = url.indexOf(")");

        //alert(url + " - starting : " + startingCharacter + " ; ending ) = " + closingIndex);
        if (closingIndex >= 0) //remove the ')'
        {
          url = url.substring(0, closingIndex);
        }
      }
    }


    if (url.indexOf("\\") >= 0) {
      url = url.substring(0, url.indexOf("\\"));
    }
    url = url.replace("\n", "");
    url = url.replace("\r", "");
    //url = url.replace("\\",""); 

  }

  return url;
}

function isStringValidImageUrl(string_to_check) {
  var imageFormat = /\.(gif|jpe?g|tiff?|png|webp|bmp)$/i;
  return imageFormat.test(string_to_check);
}


function getImageDimensions(image_tag, max_width, max_height) {
  try {

    var tmpImg = new Image();
    tmpImg.onload = function() {
      var newWidth = this.width;
      var newHeight = this.height;

      if (newHeight > max_height) {
        var heightRatio = max_height / newHeight;
        newHeight = parseInt(newHeight * heightRatio, 10);

        newWidth = parseInt(newWidth * heightRatio, 10);
      }

      if (newWidth > max_width) {
        var widthRatio = max_width / newWidth;
        newWidth = parseInt(newWidth * widthRatio, 10);

        newHeight = parseInt(newHeight * widthRatio, 10);

      }
      //alert("height : " + tmpImg.height + " -> " + newHeight);
      console.log(tmpImg.src + ' width:' + newWidth + " ; height: " + newHeight);

      $("#" + tagID).attr('width', newWidth);
      $("#" + tagID).attr('height', newHeight);


      try {
        $("#" + tagID).parent().find(".loading_panel").remove();
        $("#" + tagID).parent().parent().find(".remove_loading").remove();
      } catch (err2) {}
    }
    tmpImg.src = image_tag.attr("src");
    var tagID = image_tag.attr("id");

  } catch (err) {
    alert("ERROR - " + err.message);
  }


}

var _imagesLoaded = 0;
var _totalImages;

function checkAndpdateAllInvalidImages(container_id, max_width, max_height) {
  try {
    _totalImages = $("#" + container_id).find("img").length;
    //console.log("_totalImages - ",_totalImages);
    $("#" + container_id).find("img").each(function(idx, img) {
      $('<img>').on('load', imageLoaded(container_id, max_width, max_height)).attr('src', $(img).attr('src'));
    });
  } catch (err) {
    //alert("ERROR - " + err.message);
    console.log("ERROR image loop - ", err.message);
  }

}

function imageLoaded(container_id, max_width, max_height) {
  _imagesLoaded++;
  //console.log("_imagesLoaded - ",_imagesLoaded);
  if (_imagesLoaded == _totalImages) {
    //alert(_imagesLoaded + " = "  + _totalImages);
    setAllImagesFromZeroToMax(container_id, max_width, max_height);
  }
}



function setAllImagesFromZeroToMax(container_id, max_width, max_height) {
  try {

    $("#" + container_id).find("img").each(function(index, item) {
      if ($(this).attr('width') == "0") {
        $(this).attr('width', max_width);
        $(this).attr('height', max_height);
      }
    });
  } catch (err) {
    alert("ERROR - " + err.message);
  }


}
