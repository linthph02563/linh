$(document).ready(function () {
    new WOW().init();
    function LoginAccount() {
        Email = $("#EmailLogin").val();
        Password = $("#PasswordLogin").val();

        if (Email == '' || Password == '') {
            alert('Quý khách vui lòng nhập Email và mật khẩu')
        }
        else {
            // Tương tác với server
            $.ajax({
                url: "/AccountCustomer/LoginAccount",
                data: { Email: Email, Password: Password },
                success: function (result) {
                    if (result == '1') {
                        alert('Đăng nhập thành công')
                        window.location.href = '/';
                    }
                    if (result == '2') {
                        alert('Tài khoản của quý khách chưa xác thực. Vui lòng kiểm tra Email để xác thực')
                    }
                    if (result == '0') {
                        alert('Đăng nhập không thành công')
                    }

                    $("#EmailLogin").val('');
                    $("#PasswordLogin").val('');
                }
            });
        }
    }

    var OneSignal = window.OneSignal || [];
    OneSignal.push(function () {
        OneSignal.init({
            appId: "59c8d6f2-85df-4bfa-93e1-eb9b0d169934",
            autoRegister: true,
            notifyButton: {
                enable: false,
            },
        });
    });

    var date_input = $('input[name="date"]'); //our date input has the name "date"
    var container = $('.bootstrap-iso form').length > 0 ? $('.bootstrap-iso form').parent() : "body";
    date_input.datepicker({
        format: 'dd/mm/yyyy',
        container: container,
        todayHighlight: true,
        autoclose: true,
    })

    $('.chat_face .title').on('click', function () {
        if ($('.chat_face').toggleClass('show_chat_box').hasClass('show_chat_box')) {
            $('.chat_face .title').html('<i class="fa fa-times-circle" aria-hidden="true"></i> Đóng')
        } else {
            $('.chat_face .title').html('<i class="fa fa-commenting" aria-hidden="true"></i> Chat với chúng tôi')
        }
    });
});

function onClickBlock() {
    $('.h-top .nav-top-mini .nav-top').toggle();
}
