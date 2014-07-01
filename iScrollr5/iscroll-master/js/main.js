/**
 * Created by ruben on 1-7-14.
 */

document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);

//add event handlers
bindEvents();
clickedGravePoint();

$("#filter").keyup(function(){

    // Retrieve the input field text and reset the count to zero
    var name = $(this).val();

    // Loop through the comment list
    $(".names li").each(function(){

        if ($(this).text().search(new RegExp(name, "i")) < 0) {
            $(this).hide();

        } else {
            $(this).show();
        }
    });

    if(name == 0){
        $(".names li").each(function(){
            $(this).hide();
        });
    }

});

function clickedGravePoint(e){
  if(e){e.preventDefault();}

  //load template
  var url = "templates/grave_detail.html";
  $.ajax({
      type:'GET',
      url:url,
      success: function(graveDetail){
        //fill in grave point data in template
        $('#wrapper').after(graveDetail);
        bindEvents();
        var originalTopMargin = $('#grave_detail').css('top');
        $('#grave_detail').css('top', '100%').animate({
            top: originalTopMargin
        }, 600);
      },
      error: function (xhr, ajaxOptions, thrownError) {}
  });
}

function closeGraveDetail(e){
  console.log
  if(e){e.preventDefault();}
  $('#grave_detail').animate({
      top: $(window).height()+'px'
  }, 600, function(e){
    $(this).remove();
  });
}

function bindEvents(){
  $('#close_detail').on('click', closeGraveDetail);
}
