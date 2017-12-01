        function buyThing(index)
        {
          var xhr = new XMLHttpRequest();

          var host = 'http://localhost:3000/buyThink/' + index;

          xhr.open('Post', host, false);

          xhr.send();

          if (xhr.status != 200) {
            alert(xhr.responseText + xhr.status + ': ' + xhr.statusText );
          }
          else {
            alert( xhr.responseText );
          }
        }