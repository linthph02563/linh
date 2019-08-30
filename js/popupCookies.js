(function ($, w, d) {
    function vtv_closepopup() {
        $("#vtv_overlay").hide();
        $("#vtv_popup").hide();
    };
    function vtv_setmycookie(name, value, minutes) {
        var myday = new Date();
        myday.setMinutes(myday.getMinutes() + minutes);
        d.cookie = name + "=" + value + ";path=/;expires=" + myday.toGMTString();
    };
    function vtv_showpopupcookie(name, width, height) {
        var cookiename = '__vtv_' + name;
        if (d.cookie.match(new RegExp(cookiename + '=[^;]+'))) {
            return;
        }
        vtv_setmycookie(cookiename, 'show', 2);
        html = "<div id='vtv_overlay' class='hidden-xs'></div>\
<div id='vtv_popup' class='hidden-xs'>\
<div id='vtv_close'><img src='images/vtvpopup/close.png' alt='Close Popup'/> </div><iframe id='vtvpopup' name='vtvpopup' src='home/_VtvPopup' frameborder='0'></iframe>\
</div>";
        $('body').append(html);
        $('#vtv_overlay').click(vtv_closepopup);
        $('#vtv_close').click(vtv_closepopup);
        $('#vtv_overlay').css({
            background: '#000',
            height: '100%',
            left: 0,
            opacity: 0.9,
            overflow: 'hidden',
            top: 0,
            width: '100%',
            'z-index': 9999,
            position: 'fixed'
        });
        $('#vtv_popup').css({
            position: 'fixed',
            width: width + 'px',
            height: height + 'px',
            left: ($(w).width() - width) / 2 + 'px',
            top: '140px',
            'z-index': 10000,
            background: 'transparent'
        });
        $('#vtv_close').css({
            background: 'transparent',
            float: 'right',
            cursor: 'pointer',
            'font-weight': 'bold',
            color: '#fff',
            'margin-top': '-18px',
        });
        $('#vtv_popup>iframe').css({ width: '100%', height: '100%' });
    }
    $(d).ready(function () {
        vtv_showpopupcookie("showpopup", 835, 455);
    });
})(jQuery, window, document);