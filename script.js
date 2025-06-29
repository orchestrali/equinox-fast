jQuery(document).ready(function(){
  
  $("a").attr("target", "_blank");

  var emojipasta = []
  var count = 0
  
function copyToClipboard(element) {
  var $temp = jQuery("<textarea>");
  var brRegex = /<br\s*[\/]?>/gi;
  $("body").append($temp);
  $temp.val(jQuery(element).html().replace(brRegex, "\r\n")).select();
  document.execCommand("copy");
  $temp.remove();
}
  
  function getStats() {

jQuery(".letter").each(function() {
  if (jQuery(this).hasClass("letter--hint-wrong")) {
    emojipasta.push("⬛️")
    count++
  }
    if (jQuery(this).hasClass("letter--hint-close")) {
    emojipasta.push("🎵")
      count++
  }
      if (jQuery(this).hasClass("letter--hint-correct")) {
    emojipasta.push("🎶")
        count++
  }
  
  if (count == 5 || count == 10 || count == 15 || count == 20 || count == 25 || count == 30  ) {
    
    if (emojipasta[emojipasta.length-1] === '<br>') {
   // do something
} else {
   emojipasta.push("<br>")
}
    
    // emojipasta.push("<br>")
  }
  
    });

  var emojistring = emojipasta.join("");
    
    jQuery(".feedback").html("Harmonicle<br>"+emojistring)
    copyToClipboard(jQuery(".feedback"));
    jQuery(".feedback").addClass("sharable");
    
    
    jQuery(".popup").html("Copied to clipboard! 💾")
        $(".popup").addClass("copied")

        setTimeout(function() {
            // $(".popup").html("")
            $(".popup").removeClass("copied")
        }, 5000);
    
  }
  
  
jQuery( ".feedback" ).one( "click", function() {
  getStats()
});

  
  })