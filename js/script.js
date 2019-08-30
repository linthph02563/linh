jQuery(document).ready(function() {
    new WOW().init();
    $(".i-menu").click(function(){
        $(".nav-top").toggle();
    });

    $(".dot-dot").dotdotdot();

    $("#che").click(function(){        
        $("." + $("#che").attr('searchId')).click();
    })
    $(".dltn").click(function(){  
    	$(".bg-dltn").toggle(1, function() {
		    if($(this).is(':hidden')) { 
		        $(".a").removeClass('bg-black');
                $("#che").attr("searchId", "dltn");
		        $(".n3-form-search").css("z-index","initial");
		    	$(".n3-form-search").css("position","initial");
		    	$(".n3-form-search").css("background","#f1f1f1");
		    }
		    else {
		        $(".a").addClass('bg-black ');
                $("#che").attr("searchId", "dltn");
		    	$(".n3-form-search").css("z-index","9999");
		    	$(".n3-form-search").css("position","relative");
		    	$(".n3-form-search").css("background","initial");
		    }

		});
    	if($(".bg-dlnn").css("display","none")) {
    		
    	}else{
    		$(".bg-dlnn").css("display","none");
    	}

    	if($(".bg-dltt").css("display","none")) {
    		
    	}else{
    		$(".bg-dltt").css("display","none");
    	}

        if($(".bg-dltc").css("display","none")) {
            
        }else{
            $(".bg-dltc").css("display","none");
        }
        event.stopPropagation(); 
    });
    $(".itemcart-name").shorten({
        "showChars": 80,
        /*"moreText": "Xem thêm",
        "lessText": "Rút gọn",*/
    });
    $(".dlnn").click(function(){
    	$(".bg-dlnn").toggle(1, function() {
		    if($(this).is(':hidden')) { 
		        $(".a").removeClass('bg-black');
                $("#che").attr("searchId", "");
		        $(".n3-form-search").css("z-index","initial");
		    	$(".n3-form-search").css("position","initial");
		    	$(".n3-form-search").css("background","#f1f1f1");
		    }
		    else {
		        $(".a").addClass('bg-black ');
                $("#che").attr("searchId", "dlnn");
		    	$(".n3-form-search").css("z-index","9999");
		    	$(".n3-form-search").css("position","relative");
		    	$(".n3-form-search").css("background","initial");
		    }
		});
    	if($(".bg-dltn").css("display","none")) {
    		
    	}else{
    		$(".bg-dltn").css("display","none");
    	}
    	if($(".bg-dltt").css("display","none")) {
    		
    	}else{
    		$(".bg-dltt").css("display","none");
    	}
        if($(".bg-dltc").css("display","none")) {
            
        }else{
            $(".bg-dltc").css("display","none");
        }
    });
    $(".tttc").click(function(){
    	$(".bg-dltt").toggle(1, function() {
		    if($(this).is(':hidden')) { 
		        $(".a").removeClass('bg-black');
                $("#che").attr("searchId", "");
		        $(".n3-form-search").css("z-index","initial");
		    	$(".n3-form-search").css("position","initial");
		    	$(".n3-form-search").css("background","#f1f1f1");
		    }
		    else {
		        $(".a").addClass('bg-black ');
                $("#che").attr("searchId", "tttc");
		    	$(".n3-form-search").css("z-index","9999");
		    	$(".n3-form-search").css("position","relative");
		    	$(".n3-form-search").css("background","initial");
		    }
		});
    	if($(".bg-dlnn").css("display","none")) {
    		
    	}else{
    		$(".bg-dlnn").css("display","none");
    	}
    	if($(".bg-dltn").css("display","none")) {
    		
    	}else{
    		$(".bg-dltn").css("display","none");
    	}
        if($(".bg-dltc").css("display","none")) {
            
        }else{
            $(".bg-dltc").css("display","none");
        }
    });
    $(".dltc").click(function(){
        $(".bg-dltc").toggle(1, function() {
            if($(this).is(':hidden')) { 
                $(".a").removeClass('bg-black');
                $("#che").attr("searchId", "");
                $(".n3-form-search").css("z-index","initial");
                $(".n3-form-search").css("position","initial");
                $(".n3-form-search").css("background","#f1f1f1");
            }
            else {
                $(".a").addClass('bg-black ');
                $("#che").attr("searchId", "tttc");
                $(".n3-form-search").css("z-index","9999");
                $(".n3-form-search").css("position","relative");
                $(".n3-form-search").css("background","initial");
            }
        });
        if($(".bg-dlnn").css("display","none")) {
            
        }else{
            $(".bg-dlnn").css("display","none");
        }
        if($(".bg-dltn").css("display","none")) {
            
        }else{
            $(".bg-dltn").css("display","none");
        }
        if($(".bg-dltt").css("display","none")) {
            
        }else{
            $(".bg-dltt").css("display","none");
        }
    });
    $(".social-bot").click(function() {
      if($(".social-bot").hasClass("show1")) {
        $(".social-top").addClass("hidden");
        $(".social-top").removeClass("show");
        $(".social-bot").addClass("show2");
        $(".social-bot").removeClass("show1");
      }else{  
        $(".social-top").addClass("show");
        $(".social-top").removeClass("hidden");
        $(".social-bot").addClass("show1");
        $(".social-bot").removeClass("show2");
      }
    });
    $('.tab-chuongtrinhtour').click(function(){
        $('.tab-chitiettour').removeClass("active");
        $('.tab-luuy').removeClass("active");
        $('.tab-ngaykhac').removeClass("active");
        $('.tab-ykien').removeClass("active");
        $('.tab-lienhe').removeClass("active");
        $('.chitiettour').css("display","none");
        $('.luuy').css("display","none");
        $('.ngaykhac').css("display","none");
        $('.ykien').css("display","none");
        $('.lienhe').css("display","none");
        $('.chuongtrinhtour').css("display","block");
        $('.tab-chuongtrinhtour').addClass("active");
        $("html,body").animate({scrollTop:$(".chuongtrinhtour").offset().top},"800");
        return false;
    });
    $('.tab-chitiettour').click(function(){
        $('.tab-chuongtrinhtour').removeClass("active");
        $('.tab-luuy').removeClass("active");
        $('.tab-ngaykhac').removeClass("active");
        $('.tab-ykien').removeClass("active");
        $('.tab-lienhe').removeClass("active");
        $('.chuongtrinhtour').css("display","none");
        $('.luuy').css("display","none");
        $('.ngaykhac').css("display","none");
        $('.ykien').css("display","none");
        $('.lienhe').css("display","none");
        $('.chitiettour').css("display","block");
        $('.tab-chitiettour').addClass("active");
        $("html,body").animate({scrollTop:$(".chitiettour").offset().top},"800");
        return false;
    });
    $('.tab-luuy').click(function(){
        $('.tab-chuongtrinhtour').removeClass("active");
        $('.tab-chitiettour').removeClass("active");
        $('.tab-ngaykhac').removeClass("active");
        $('.tab-ykien').removeClass("active");
        $('.tab-lienhe').removeClass("active");
        $('.chuongtrinhtour').css("display","none");
        $('.chitiettour').css("display","none");
        $('.ngaykhac').css("display","none");
        $('.ykien').css("display","none");
        $('.lienhe').css("display","none");
        $('.luuy').css("display","block");
        $('.tab-luuy').addClass("active");
        $("html,body").animate({scrollTop:$(".luuy").offset().top},"800");
        return false;
    });
    $('.tab-ngaykhac').click(function(event){
        $('.tab-chuongtrinhtour').removeClass("active");
        $('.tab-chitiettour').removeClass("active");
        $('.tab-luuy').removeClass("active");
        $('.tab-ykien').removeClass("active");
        $('.tab-lienhe').removeClass("active");
        $('.chuongtrinhtour').css("display","none");
        $('.chitiettour').css("display","none");
        $('.luuy').css("display","none");
        $('.ykien').css("display","none");
        $('.lienhe').css("display","none");
        $('.ngaykhac').css("display","block");
        $('.tab-ngaykhac').addClass("active");
        $("html,body").animate({scrollTop:$(".ngaykhac").offset().top},"800");
        return false;
    });
    $('.tab-ykien').click(function(event){
        $('.tab-chuongtrinhtour').removeClass("active");
        $('.tab-chitiettour').removeClass("active");
        $('.tab-luuy').removeClass("active");
        $('.tab-ngaykhac').removeClass("active");
        $('.tab-lienhe').removeClass("active");
        $('.chuongtrinhtour').css("display","none");
        $('.chitiettour').css("display","none");
        $('.ngaykhac').css("display","none");
        $('.luuy').css("display","none");
        $('.lienhe').css("display","none");
        $('.ykien').css("display","block");
        $('.tab-ykien').addClass("active");
        $("html,body").animate({scrollTop:$(".ykien").offset().top},"800");
        return false;
    });
    $('.tab-lienhe').click(function(event){
        $('.tab-chuongtrinhtour').removeClass("active");
        $('.tab-chitiettour').removeClass("active");
        $('.tab-luuy').removeClass("active");
        $('.tab-ykien').removeClass("active");
        $('.tab-ngaykhac').removeClass("active");
        $('.chuongtrinhtour').css("display","none");
        $('.chitiettour').css("display","none");
        $('.ngaykhac').css("display","none");
        $('.luuy').css("display","none");
        $('.ykien').css("display","none");
        $('.lienhe').css("display","block");
        $('.tab-lienhe').addClass("active");
        $("html,body").animate({scrollTop:$(".lienhe").offset().top},"800");
        return false;
    });
    /*$(window).scroll(function () { 
        if ($(window).scrollTop() > 800) { 
            $(".panel-side-menu").addClass("top-scroll-all");    
        } 
        else { 
            $(".panel-side-menu").removeClass("top-scroll-all");     
        } 
    });*/
    $(".item-mn").click(function(event) {
        event.preventDefault();
        $(".mienbac").css("display", "none");
        $(".miennam").css("display", "block");
        $(".mientrung").css("display", "none");
        $(".item-mn").addClass("active");
        $(".item-mb").removeClass("active");
        $(".item-mt").removeClass("active");

    });
    $(".item-mt").click(function(event) {
        event.preventDefault();
        $(".mienbac").css("display", "none");
        $(".miennam").css("display", "none");
        $(".mientrung").css("display", "block");
        $(".item-mn").removeClass("active");
        $(".item-mb").removeClass("active");
        $(".item-mt").addClass("active");
    });
    $(".item-mb").click(function(event) {
        event.preventDefault();
        $(".mienbac").css("display", "block");
        $(".miennam").css("display", "none");
        $(".mientrung").css("display", "none");
        $(".item-mn").removeClass("active");
        $(".item-mb").addClass("active");
        $(".item-mt").removeClass("active");
    });
    
    $('.tab-dattour').click(function(){
        $('.tab-thanhvien').removeClass("active");
        $('.tab-tour').removeClass("active");
        $('.thanhvien').css("display","none");
        $('.dattour').css("display","block");
        $('.tour').css("display","none");
        $('.tab-dattour').addClass("active");
    });
    $('.tab-tour').click(function(){
        $('.tab-thanhvien').removeClass("active");
        $('.tab-dattour').removeClass("active");
        $('.thanhvien').css("display","none");
        $('.tour').css("display","block");
        $('.dattour').css("display","none");
        $('.tab-tour').addClass("active");
    });
    $('.tab-thanhvien').click(function(){
        $('.tab-thanhvien').addClass("active");
        $('.tab-tour').removeClass("active");
        $('.thanhvien').css("display","block");
        $('.dattour').css("display","none");
        $('.tour').css("display","none");
        $('.tab-dattour').removeClass("active");
    });
    $('.ah1 .hienra').click(function(event){
        event.preventDefault();
        $('.n3-tour-detail .chuongtrinhtour .d1.detail').css("max-height","initial");
        $('.n3-tour-detail .chuongtrinhtour .d1.detail').css("overflow-y","initial");
        $('.ah1 .andi').css("display","block");
        $('.ah1 .hienra').css("display","none");
    });
    $('.ah1 .andi').click(function(event){
        event.preventDefault();
        $('.n3-tour-detail .chuongtrinhtour .d1.detail').css("max-height","90px");
        $('.n3-tour-detail .chuongtrinhtour .d1.detail').css("overflow-y","hidden");
        $('.ah1 .andi').css("display","none");
        $('.ah1 .hienra').css("display","block");
    });
    $('.ah2 .hienra').click(function(event){
        event.preventDefault();
        $('.n3-tour-detail .chuongtrinhtour .d2.detail').css("max-height","initial");
        $('.n3-tour-detail .chuongtrinhtour .d2.detail').css("overflow-y","initial");
        $('.ah2 .andi').css("display","block");
        $('.ah2 .hienra').css("display","none");
    });
    $('.ah2 .andi').click(function(event){
        event.preventDefault();
        $('.n3-tour-detail .chuongtrinhtour .d2.detail').css("max-height","90px");
        $('.n3-tour-detail .chuongtrinhtour .d2.detail').css("overflow-y","hidden");
        $('.ah2 .andi').css("display","none");
        $('.ah2 .hienra').css("display","block");
    });
    $('.ah3 .hienra').click(function(event){
        event.preventDefault();
        $('.n3-tour-detail .chuongtrinhtour .d3.detail').css("max-height","initial");
        $('.n3-tour-detail .chuongtrinhtour .d3.detail').css("overflow-y","initial");
        $('.ah3 .andi').css("display","block");
        $('.ah3 .hienra').css("display","none");
    });
    $('.ah3 .andi').click(function(event){
        event.preventDefault();
        $('.n3-tour-detail .chuongtrinhtour .d3.detail').css("max-height","90px");
        $('.n3-tour-detail .chuongtrinhtour .d3.detail').css("overflow-y","hidden");
        $('.ah3 .andi').css("display","none");
        $('.ah3 .hienra').css("display","block");
    });
    $('.ah4 .hienra').click(function(event){
        event.preventDefault();
        $('.n3-tour-detail .chuongtrinhtour .d4.detail').css("max-height","initial");
        $('.n3-tour-detail .chuongtrinhtour .d4.detail').css("overflow-y","initial");
        $('.ah4 .andi').css("display","block");
        $('.ah4 .hienra').css("display","none");
    });
    $('.ah4 .andi').click(function(event){
        event.preventDefault();
        $('.n3-tour-detail .chuongtrinhtour .d4.detail').css("max-height","90px");
        $('.n3-tour-detail .chuongtrinhtour .d4.detail').css("overflow-y","hidden");
        $('.ah4 .andi').css("display","none");
        $('.ah4 .hienra').css("display","block");
    });

    $('.ah5 .hienra').click(function (event) {
        event.preventDefault();
        $('.n3-tour-detail .chuongtrinhtour .d5.detail').css("max-height", "initial");
        $('.n3-tour-detail .chuongtrinhtour .d5.detail').css("overflow-y", "initial");
        $('.ah5 .andi').css("display", "block");
        $('.ah5 .hienra').css("display", "none");
    });
    $('.ah5 .andi').click(function (event) {
        event.preventDefault();
        $('.n3-tour-detail .chuongtrinhtour .d5.detail').css("max-height", "90px");
        $('.n3-tour-detail .chuongtrinhtour .d5.detail').css("overflow-y", "hidden");
        $('.ah5 .andi').css("display", "none");
        $('.ah5 .hienra').css("display", "block");
    });
    $('.ah6 .hienra').click(function (event) {
        event.preventDefault();
        $('.n3-tour-detail .chuongtrinhtour .d6.detail').css("max-height", "initial");
        $('.n3-tour-detail .chuongtrinhtour .d6.detail').css("overflow-y", "initial");
        $('.ah6 .andi').css("display", "block");
        $('.ah6 .hienra').css("display", "none");
    });
    $('.ah6 .andi').click(function (event) {
        event.preventDefault();
        $('.n3-tour-detail .chuongtrinhtour .d6.detail').css("max-height", "90px");
        $('.n3-tour-detail .chuongtrinhtour .d6.detail').css("overflow-y", "hidden");
        $('.ah6 .andi').css("display", "none");
        $('.ah6 .hienra').css("display", "block");
    });
    $('.ah7 .hienra').click(function (event) {
        event.preventDefault();
        $('.n3-tour-detail .chuongtrinhtour .d7.detail').css("max-height", "initial");
        $('.n3-tour-detail .chuongtrinhtour .d7.detail').css("overflow-y", "initial");
        $('.ah7 .andi').css("display", "block");
        $('.ah7 .hienra').css("display", "none");
    });
    $('.ah7 .andi').click(function (event) {
        event.preventDefault();
        $('.n3-tour-detail .chuongtrinhtour .d7.detail').css("max-height", "90px");
        $('.n3-tour-detail .chuongtrinhtour .d7.detail').css("overflow-y", "hidden");
        $('.ah7 .andi').css("display", "none");
        $('.ah7 .hienra').css("display", "block");
    });
    $('.ah8 .hienra').click(function (event) {
        event.preventDefault();
        $('.n3-tour-detail .chuongtrinhtour .d8.detail').css("max-height", "initial");
        $('.n3-tour-detail .chuongtrinhtour .d8.detail').css("overflow-y", "initial");
        $('.ah8 .andi').css("display", "block");
        $('.ah8 .hienra').css("display", "none");
    });
    $('.ah8 .andi').click(function (event) {
        event.preventDefault();
        $('.n3-tour-detail .chuongtrinhtour .d8.detail').css("max-height", "90px");
        $('.n3-tour-detail .chuongtrinhtour .d8.detail').css("overflow-y", "hidden");
        $('.ah8 .andi').css("display", "none");
        $('.ah8 .hienra').css("display", "block");
    });
    $('.ah9 .hienra').click(function (event) {
        event.preventDefault();
        $('.n3-tour-detail .chuongtrinhtour .d9.detail').css("max-height", "initial");
        $('.n3-tour-detail .chuongtrinhtour .d9.detail').css("overflow-y", "initial");
        $('.ah9 .andi').css("display", "block");
        $('.ah9 .hienra').css("display", "none");
    });
    $('.ah9 .andi').click(function (event) {
        event.preventDefault();
        $('.n3-tour-detail .chuongtrinhtour .d9.detail').css("max-height", "90px");
        $('.n3-tour-detail .chuongtrinhtour .d9.detail').css("overflow-y", "hidden");
        $('.ah9 .andi').css("display", "none");
        $('.ah9 .hienra').css("display", "block");
    });
    $('.ah10 .hienra').click(function (event) {
        event.preventDefault();
        $('.n3-tour-detail .chuongtrinhtour .d10.detail').css("max-height", "initial");
        $('.n3-tour-detail .chuongtrinhtour .d10.detail').css("overflow-y", "initial");
        $('.ah10 .andi').css("display", "block");
        $('.ah10 .hienra').css("display", "none");
    });
    $('.ah10 .andi').click(function (event) {
        event.preventDefault();
        $('.n3-tour-detail .chuongtrinhtour .d10.detail').css("max-height", "90px");
        $('.n3-tour-detail .chuongtrinhtour .d10.detail').css("overflow-y", "hidden");
        $('.ah10 .andi').css("display", "none");
        $('.ah10 .hienra').css("display", "block");
    });
});
/*$(document).ready(function(){
    $(' .carousel[data-type="multi"] .item').each(function(){
      var next = $(this).next();
      if (!next.length) {
        next = $(this).siblings(':first');
      }
      next.children(':first-child').clone().appendTo($(this));
      
      for (var i=0;i<2;i++) {
        next=next.next();
        if (!next.length) {
            next = $(this).siblings(':first');
        }
        
        next.children(':first-child').clone().appendTo($(this));
      }
    });
});*/
