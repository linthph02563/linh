$(document).ready(function () {
  function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
  }

  function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
  }
  var sideslider = $('[data-toggle=collapse-side]');
  var sel = sideslider.attr('data-target');
  var sel2 = sideslider.attr('data-target-2');
  sideslider.click(function(event){
    $(sel).toggleClass('in');
    $(sel2).toggleClass('out');
  });
  //Events that reset and restart the timer animation when the slides change
  $("#transition-timer-carousel").on("slide.bs.carousel", function(event) {
    //The animate class gets removed so that it jumps straight back to 0%
    $(".transition-timer-carousel-progress-bar", this)
        .removeClass("animate").css("width", "0%");
  }).on("slid.bs.carousel", function(event) {
    //The slide transition finished, so re-add the animate class so that
    //the timer bar takes time to fill up
    $(".transition-timer-carousel-progress-bar", this)
        .addClass("animate").css("width", "100%");
  });

  //Kick off the initial slide animation when the document is ready
  $(".transition-timer-carousel-progress-bar", "#transition-timer-carousel")
      .css("width", "100%");
  $(function() {
    $('.chat-hold').hover(function() {
      $(this).find('.overlay').fadeIn();
    }, function() {
      $('.overlay').fadeOut();
    });
  });
});