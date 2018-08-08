var socket = io();
    
socket.on('dowloadEvt', function(msg){
  $('#progress').css('width',msg + '%');
  $('#progress').text(msg + '%');
  if(msg == 100)
    setTimeout(()=>{
     $('.progress').css('visibility','hidden');
    },1500)
});
socket.on('nextPageEvt', function(items){
  //- items.nextPageToken;
  //- items
  console.log(items)
  if(!items.isSuccess)
    return alert('Nothing to show')
  files = items.files
  for(let i = 0 ; i < files.length; i++){
    $('#row').append(`
    <div class="col-lg-3 col-md-4 col-xs-6 thumb">
      <img class="zoom img-fluid" src="${files[i].thumbnailLink == null ? files[i].iconLink  : files[i].thumbnailLink }" alt="">
      <div class="title">
          <div class="titleName" data-toggle="tooltip" title="${files[i].name}">${files[i].name}</div>
          <div class="titleTime">${files[i].createdTime}</div>
          <div class="btn btn-danger titleBtn" onclick='Download("${files[i].id.trim()}","${files[i].name}","${files[i].size}")'>Download</div>
      </div>
  </div>
    `)
  }
  $('#nextPage').attr('onclick','nextPage("'+items.nextPageToken+'","'+ items.keyword+'")');
 
});
function nextPage(nextPageToken,keyword){
  socket.emit('nextPageEvt', {nextPageToken,keyword})
}
function Download(id, name, size){
  $('.progress').css('visibility','visible');
  $('#progress').css('width','0%');
  socket.emit('dowloadEvt',{id : id, name : name, size : size });
}