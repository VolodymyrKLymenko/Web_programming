var slide = {};

slide.getElements = function (content) 
{
  	if (typeof content == "object")
  	{
  	  	return [content];
  	}
   	else 
  	{
    	return document.querySelectorAll(content);
  	}
};

slide.setStyle = function (element, prop, val) 
{
  element.style.setProperty(prop, val);
};

slide.slideshow = function (classPhoto) 
{
  var arrOfPhoto = slide.getElements(classPhoto);
  var len = arrOfPhoto.length;
  
  var curPh = { };
  curPh.current = 1;

  curPh.display = function (pos) 
  {
	var index;
  	var len = (arrOfPhoto).length;

  	for (index = 0; index < len; index++) 
  	{    
    	slide.setStyle(arrOfPhoto[index], "display", "none");
  	}

    slide.setStyle(arrOfPhoto[pos - 1], "display", "block");
  }

  curPh.start = function() 
  {
    curPh.display(curPh.current);
  };

  curPh.next = function() 
  {
    curPh.current += 1;

    if (curPh.current > arrOfPhoto.length)
    {
    	curPh.current = 1;
    }
    curPh.start();
  };

  curPh.previous = function() 
  {
    curPh.current -= 1;
    if (curPh.current < 1) 
    {
    	curPh.current = arrOfPhoto.length;
    }
    curPh.start();
  };

  curPh.start();

  return curPh;
};

(document.getElementById('generalSection').childNodes[1]).onclick = function(){

  if((document.getElementById("generalSection").childNodes[5]).style.display == "none")
  {
    (document.getElementById("generalSection").childNodes[5]).style.display = "block";
    this.innerHTML = "Hide";
  }
  else
  {
    (document.getElementById("generalSection").childNodes[5]).style.display = "none";
    this.innerHTML = "Show";
  }
};

(document.getElementById('generalArticle').childNodes[1]).onclick = function(){

  if((document.getElementById("generalArticle").childNodes[5]).style.display == "none")
  {
    (document.getElementById("generalArticle").childNodes[5]).style.display  = "block";
    this.innerHTML = "Hide";
  }
  else
  {
    (document.getElementById("generalArticle").childNodes[5]).style.display = "none";
    this.innerHTML = "Show";
  }
};

document.getElementById('generalSection').onmouseover = function()
{
  var startFontSize = 23;

    for (var i = 1000; i <= 200000; i++) 
    {
      if(i % 1000 == 0)
      {
        document.getElementById('generalSection').style.setProperty("font-size", ("" + startFontSize + "px"));
        ++startFontSize; 
      }
    };
};