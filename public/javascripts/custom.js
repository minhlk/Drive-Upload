  Download = (url) =>{
    var request = new XMLHttpRequest();
    
    request.addEventListener('readystatechange', function(e) {
    	if(request.readyState == 2 && request.status == 200) {
    		// Download is being started
    	}
    	else if(request.readyState == 3) {
    		// Download is under progress
    	}
    	else if(request.readyState == 4) {
    		// Downloaing has finished
            console.log('done')
    		// _OBJECT_URL = URL.createObjectURL(request.response);

    		// // Set href as a local object URL
    		// document.querySelector('#save-file').setAttribute('href', _OBJECT_URL);
    		
    		// // Set name of download
    		// document.querySelector('#save-file').setAttribute('download', 'img.jpeg');
    		
    		// // Recommended : Revoke the object URL after some time to free up resources
    		// // There is no way to find out whether user finished downloading
    		// setTimeout(function() {
    		// 	window.URL.revokeObjectURL(_OBJECT_URL);
    		// }, 60*1000);
    	}
    });
    
    request.addEventListener('progress', function(e) {
    	var percent_complete = (e.loaded / e.total)*100;
    	console.log(percent_complete);
    });
    
    request.responseType = 'blob';
    
    // Downloading a JPEG file
    request.open('get', url); 
    
    request.send(); 
  }