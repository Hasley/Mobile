var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

(function($) {
    //var url = 'http://demo.agoraevent.fr/api/';
    var url = 'http://localhost:60200/api/';

    var guestsList = {
        id : null,
        eventId: null,
        list : null,
        row : null,
        statusPar : ["Erreur", "Potentiel", "Pr\351vu", "Pr\351sent", "Factur\351", "Pay\351", "Non Inscrit", "Groupe", "Absent"],
        jsonStr: null,
        localChange: []
    }

    var ApiToken = null;

    var rememberMe = "false";

    $(document).ajaxStop($.unblockUI);

    function onDeviceReady(){
        document.addEventListener("backbutton", function(e){
            if($.mobile.activePage.is('#homepage')){
                e.preventDefault();
                navigator.app.exitApp();
            }
            else {
                navigator.app.backHistory();
            }
        }, false);
    }

    // Centrage de block ui
    $.fn.center = function () {
        this.css("position","absolute");
        this.css("top", ( $(window).height() - this.height() ) / 2+$(window).scrollTop() + "px");
        this.css("left", ( $(window).width() - this.width() ) / 2+$(window).scrollLeft() + "px");
        return this;
    }

    // REGEX paramètres url
    function getParameterByName(url, name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(url);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    // Fonctions  des différents appels ajax
    var ajax = {
        parseEvents:function(result){
            $('#eventsList').empty();
            var monthsInYear= new Array("janvier", "f\351vrier", "mars", "avril", "mai", "juin", "juillet", "ao\373t", "septembre", "octobre", "novembre", "d\351cembre");
            $.each(result, function(i, row) {
                var date = new Date(row.StartDate);
                $('#eventsList').append('<li><a href="" data-id="' + row.ID + '"><h3>' + row.Title + '</h3><p>' + date.getDate() + " " + monthsInYear[date.getMonth()] + " " + date.getFullYear()  + '</p></a></li>');
            });
            $('#eventsList').listview('refresh');
        },
        parseGuests:function(result){
            $('#guestsList').empty();
            guestsList.list = result;
            /* DIV FOR SWIPE LEFT ON LISTVIEW
            $.each(result, function(i, row) {
                console.log(JSON.stringify(row));
                $('#guestsList').append('<li><div class="behindOptionListView"><a href="#"  class="ui-btn changeStatusBtn" data-role="button" data-iconpos="top" style="background-color: #1DD718;" data-icon="check" data-id="' + row.ID +
                    '">Valider</a></div><a href="" data-id="' +
                    row.ID + '"><h3>' + row.LastName + '</h3><p>' + row.FirstName +
                    '<span class="statusListView status' + row.Status.ID +  ' ">[' + guestsList.statusPar[row.Status.ID] + ']</span></p></a></li>');
            });
            */
            $.each(result, function(i, row) {
                $('#guestsList').append('<li><a href="" data-id="' +
                row.ID + '"><h3>' + row.LastName + '</h3><p>' + row.FirstName +
                '<span class="statusListView status' + row.StatusID +  ' ">[' + guestsList.statusPar[row.StatusID] + ']</span></p></a></li>');
            });
        },
        getEventsList: function(){
            ajax.blockui();
            $.ajax({
                type: 'GET',
                url: url + 'Events/',
                crossDomain: true,
                headers: {'AgoraEvent-Token': ApiToken},
                success: function (result) {
                    ajax.parseEvents(result);
                },
                error: function (request, error) {
                    alert("Error in finding event list");
                }
            });
        },
        blockui: function(){
            $.blockUI({ css: {
                width: '250px',
                centerX: true,
                centerY: true,
                allowBodyStretch: true,
                border: 'none',
                backgroundColor: '#000',
                '-webkit-border-radius': '10px',
                '-moz-border-radius': '10px',
                opacity: .5,
                color: '#fff'
            },
                message: '<h2>Chargement...</h2>'
            });

            $('.blockUI.blockMsg').center();
        },
        blockuiNoMsg: function(){
            $.blockUI({ css: {
                width: '250px',
                centerX: true,
                centerY: true,
                allowBodyStretch: true,
                border: 'none',
                backgroundColor: '#000',
                '-webkit-border-radius': '10px',
                '-moz-border-radius': '10px',
                opacity: .5,
                color: '#fff'
            },
                message: ''
            });
        }

    }

    /***********  Page Before Show **************/

    $(document).on('pagebeforeshow', '#loginPage', function(){
        rememberMe = window.localStorage.getItem("rememberMe");
        if(rememberMe == "true"){
            $('#checkboxRememberMe').prop('checked', true).checkboxradio('refresh');
            document.getElementById("username").value = window.localStorage.getItem("username");
            document.getElementById("password").value = window.localStorage.getItem("password");
        }

        $('#checkboxRememberMe').change(function() {
            if($(this).is(":checked")) {
                window.localStorage.setItem("rememberMe", "true");
            }else{
                window.localStorage.setItem("rememberMe", "false");
            }
        });
    });

    $(document).on('pagebeforeshow', '#eventsPage', function(){
        ajax.getEventsList();
    });

    $(document).on('pagebeforeshow', '#guestsPage', function(){
        $('#guestsList').listview('refresh');
    });

    $(document).on('pagebeforeshow', '#guestsPageLocal', function(){
        $('#guestsListLocal').listview('refresh');
    });

    $(document).on('pagebeforeshow', '#infoGuestPageLocal', function(){
        $('#guestDataLocal').empty();
        var cpt = 0;
        $.each(guestsList.list, function(i, row) {
            if(row.ID.toString() == guestsList.id) {
                guestsList.row = cpt;
                $('#guestDataLocal').append('<span class="infoGuestStatusLocal status' + row.StatusID +  '">[' + guestsList.statusPar[row.StatusID] + ']</span><br/>'+
                    '<strong>Nom: </strong>' + row.FirstName + '<br/>' +
                    '<strong>Pr\351nom: </strong>' + row.LastName + '<br/>' +
                    '<strong>Email: </strong>' + row.Email + '<br/>'

                );
            }
            cpt++;
        });
    });

    $(document).on('pagebeforeshow', '#infoGuestPage', function(){
        $('#guestData').empty();
        var cpt = 0;
        $.each(guestsList.list, function(i, row) {
            if(row.ID == guestsList.id) {
                guestsList.row = cpt;
                $('#guestData').append('<span class="infoGuestStatus status' + row.StatusID +  '">[' + guestsList.statusPar[row.StatusID] + ']</span><br/>'+
                    '<strong>Nom: </strong>' + row.FirstName + '<br/>' +
                    '<strong>Pr\351nom: </strong>' + row.LastName + '<br/>' +
                    '<strong>Email: </strong>' + row.Email + '<br/>'

                );
            }
            cpt++;
        });
    });

    /***********  Gestion des clicks **************/
    document.addEventListener("backbutton", function(e){
        e.preventDefault();
        alert("backbuttonpressed");
    }, false);

    $( document ).on('vclick', '#btnConnexion', function(){
        var form = $("#authenticationForm");
        var username = $("#username", form).val();
        var password = $("#password", form).val();

        if(username != "" && password != "") {
            // Blocage de l'interface
            ajax.blockui();
            $.ajax({
                type: 'POST',
                url: url + 'authentication/authenticate',
                crossDomain: true,
                data:  {login: username, password : password},
                dataType: 'json',
                success: function (result) {
                    //Récupération du token d'authentification
                    ApiToken = result;

                    //Stockage local si on a coché se souvenir de moi
                    if(window.localStorage.getItem("rememberMe") == "true"){
                        var username = document.getElementById("username").value;
                        var password = document.getElementById("password").value;
                        window.localStorage.setItem("username", username);
                        window.localStorage.setItem("password", password);
                    }

                    $.mobile.changePage( "#eventsPage", { transition: "slide", changeHash: false });
                },
                error: function (request,error) {
                    alert("Combinaison identifiants / mot de passe invalide");
                }
            });
        }
        else {
            //if the email and password is empty
            alert("Veuillez renseigner les champs d'authentification");
        }
    });

    $(document).on('vclick', '#eventsList li a', function(){
        var id = $(this).attr('data-id');
        guestsList.eventId = id;
        var eventName = this.getElementsByTagName("h3")[0].innerHTML;
        document.getElementById("guestsPageTitle").innerHTML = eventName;

        ajax.blockui();
        $.ajax({
            type: 'GET',
            //url: url + 'methods/events/' + id + '/ParticipantStatus/',
            url: url + 'MobileParticipants?id=' + id,
            crossDomain: true,
            headers: {'AgoraEvent-Token': ApiToken},
            success: function (result) {
                ajax.parseGuests(result);
                $.mobile.changePage( "#guestsPage", { transition: "slide", changeHash: false });
            },
            error: function (request,error) {
                alert('Network error has occurred please try again!');
            }
        });
    });

    $(document).on('vclick', '#guestsList li a', function(){
        guestsList.id = $(this).attr('data-id');
        $.mobile.changePage( "#infoGuestPage", { transition: "slide", changeHash: false });
    });

    function openBarcodeScan(viewInfo, callback) {
        var scanner = cordova.plugins.barcodeScanner;
        scanner.scan(function (result) {
            if (!result.cancelled) {
                callback(result);
            }
        }, function (error) {
            alert(error);
        });
    }

    $(document).on('vclick', '#guestsListFooterBtnQrcode', function(){
        openBarcodeScan("scan", function (barcode) {
            var id = getParameterByName(barcode.text, "IdA09");

            var found = false;
            if(id != ""){
                var cpt = 0;
                $.each(guestsList.list, function(i, row) {
                    if (row.ID == id) {
                        guestsList.row = cpt;
                        found = true;
                    }
                    cpt++;
                });
            }
            else {
                alert("Impossible d'identifier le Qr code!");
            }

            if(Boolean(found)){
                if(guestsList.list[guestsList.row].StatusID != 3) {
                    ajax.blockuiNoMsg();
                    setTimeout(function(){
                            $.ajax({
                                type: 'POST',
                                url: url + 'methods/participants/SetPresence/' + id,
                                crossDomain: true,
                                async: false,
                                headers: {'AgoraEvent-Token': ApiToken},
                                success: function (result) {
                                    $("#guestsList").find("[data-id='" + id + "']")[0].getElementsByClassName("statusListView")[0].innerHTML = "[" + guestsList.statusPar[3] + "]";
                                    $("#guestsList").find("[data-id='" + id + "']")[0].getElementsByClassName("statusListView")[0].className = "statusListView status3";

                                    guestsList.list[guestsList.row].StatusID = 3;
                                    guestsList.id = id;
                                    $("#guestsList").listview("refresh");

                                    $.mobile.changePage( "#infoGuestPage", { transition: "slide", changeHash: false });
                                },
                                error: function (request, error) {
                                    alert('Error');
                                }
                            });
                    }, 500);

                }else{
                    alert("Le participant est d\351j\340 pr\351sent!")
                }
            }
        });
    });

    $(document).on('vclick', '#guestsListLocalFooterBtnQrcode', function(){
        openBarcodeScan("scan", function (barcode) {
            var id = getParameterByName(barcode.text, "IdA09");

            var found = false;
            if(id != ""){
                var cpt = 0;
                $.each(guestsList.list, function(i, row) {
                    if (row.ID == id) {
                        guestsList.row = cpt;
                        found = true;
                    }
                    cpt++;
                });
            }
            else {
                alert("Impossible d'identifier le Qr code!");
            }

            if(Boolean(found)){
                if(guestsList.list[guestsList.row].StatusID != 3) {
                    ajax.blockuiNoMsg();
                    setTimeout(function(){
                        $("#guestsListLocal").find("[data-id='" + id + "']")[0].getElementsByClassName("statusListView")[0].innerHTML = "[" + guestsList.statusPar[3] + "]";
                        $("#guestsListLocal").find("[data-id='" + id + "']")[0].getElementsByClassName("statusListView")[0].className = "statusListView status3";

                        guestsList.list[guestsList.row].StatusID = 3;
                        guestsList.id = id;
                        $("#guestsListLocal").listview("refresh");

                        guestsList.localChange.push(id);
                        guestsList.jsonStr = JSON.stringify(guestsList.list);
                        window.localStorage.setItem("guestsList", guestsList.jsonStr);
                        window.localStorage.setItem("changeList", JSON.stringify(guestsList.localChange));

                        $.unblockUI();
                        $.mobile.changePage( "#infoGuestPageLocal", { transition: "slide", changeHash: false });
                    }, 1000);

                }else{
                    alert("Le participant est d\351j\340 pr\351sent!")
                }
            }
        });
    });

    $(document).on('vclick', '#guestsListFooterBtnImport', function(){
        ajax.blockui();
        setTimeout(function(){
            window.localStorage.setItem("guestsList", JSON.stringify(guestsList.list));
            $.unblockUI();
            alert("Import termin\351!");
        }, 2000);
    });


    $(document).on('vclick', '#btnWifi', function(){
        $.mobile.changePage( "#loginPage", { transition: "slide", changeHash: false });
    });

    $(document).on('vclick', '#btnNoWifi', function(){
        var localData = JSON.parse(localStorage.getItem('guestsList'));
        guestsList.list = localData;

        $.each(localData, function(i, row) {
            $('#guestsListLocal').append('<li><a href="" data-id="' +
            row.ID + '"><h3>' + row.LastName + '</h3><p>' + row.FirstName +
            '<span class="statusListView status' + row.StatusID +  ' ">[' + guestsList.statusPar[row.StatusID] + ']</span></p></a></li>');
        });

        $.mobile.changePage( "#guestsPageLocal", { transition: "slide", changeHash: false });
    });

    $(document).on('vclick', '#infoGuestLocalFooterBtnCheck', function(){
        var id = guestsList.id;

        if(guestsList.list[guestsList.row].StatusID != 3) {
            ajax.blockuiNoMsg();
            setTimeout(function(){
                document.getElementsByClassName("infoGuestStatusLocal")[0].innerHTML = "[" + guestsList.statusPar[3] + "]";
                document.getElementsByClassName("infoGuestStatusLocal")[0].style.color = "green";

                $("#guestsListLocal").find("[data-id='" + id + "']")[0].getElementsByClassName("statusListView")[0].innerHTML = "[" + guestsList.statusPar[3] + "]";
                $("#guestsListLocal").find("[data-id='" + id + "']")[0].getElementsByClassName("statusListView")[0].className = "statusListView status3";

                guestsList.list[guestsList.row].StatusID = 3;
                guestsList.id = id;
                $("#guestsListLocal").listview("refresh");

                guestsList.localChange.push(id);
                guestsList.jsonStr = JSON.stringify(guestsList.list);
                window.localStorage.setItem("guestsList", guestsList.jsonStr);
                window.localStorage.setItem("changeList", JSON.stringify(guestsList.localChange));

                $.unblockUI();
            }, 1000);
        }else{
            alert("Le participant est d\351j\340 pr\351sent!")
        }
    });

    $(document).on('vclick', '#infoGuestFooterBtnCheck', function(){
        var id = guestsList.id;

        if(guestsList.list[guestsList.row].StatusID != 3) {
            ajax.blockui();
            $.ajax({
                type: 'POST',
                url: url + 'methods/participants/SetPresence/' + id,
                crossDomain: true,
                headers: {'AgoraEvent-Token': ApiToken},
                success: function (result) {
                    document.getElementsByClassName("infoGuestStatus")[0].innerHTML = "[" + guestsList.statusPar[3] + "]";
                    document.getElementsByClassName("infoGuestStatus")[0].style.color = "green";

                    $("#guestsList").find("[data-id='" + id + "']")[0].getElementsByClassName("statusListView")[0].innerHTML = "[" + guestsList.statusPar[3] + "]";
                    $("#guestsList").find("[data-id='" + id + "']")[0].getElementsByClassName("statusListView")[0].className = "statusListView status3";

                    guestsList.list[guestsList.row].StatusID = 3;
                    $("#guestsList").listview("refresh");
                },
                error: function (request, error) {
                    alert('Network error has occurred please try again!');
                }
            });
        }else{
            alert("Le participant est d\351j\340 pr\351sent!")
        }
    });

    $(document).on('vclick', '#dialogExportHeader', function(){
        $("#dialogPageExport").fadeOut(500);
        el = document.getElementById("overlay");
        el.style.visibility = "hidden";
    });

    $(document).on('vclick', '#guestsListLocalFooterBtnExport', function(){
        el = document.getElementById("overlay");
        el.style.visibility = "visible";

        var $dialog = $("#dialogPageExport");
        if (!$dialog.hasClass('ui-dialog')) {
            $dialog.page();
        }
        $dialog.fadeIn(500);

        var rememberMe = window.localStorage.getItem("rememberMe");
        if(rememberMe == "true"){
            document.getElementById("usernameExport").value = window.localStorage.getItem("username");
            document.getElementById("passwordExport").value = window.localStorage.getItem("password");
        }
    });

    $(document).on('vclick', '#btnConnexionExport', function(){
        $("#dialogPageExport").fadeOut(500);
        el = document.getElementById("overlay");
        el.style.visibility = "hidden";

        var form = $("#authenticationFormExport");
        var username = $("#usernameExport", form).val();
        var password = $("#passwordExport", form).val();

        if(username != "" && password != "") {
            // Blocage de l'interface
            ajax.blockui();
            $.ajax({
                type: 'POST',
                url: url + 'authentication/authenticate',
                crossDomain: true,
                data:  {login: username, password : password},
                dataType: 'json',
                success: function (result) {
                    ajax.blockui();
                    //Récupération du token d'authentification
                    ApiToken = result;

                    var localChange = JSON.parse(localStorage.getItem('changeList'));

                    $.each(localChange, function(i, id) {
                        $.ajax({
                            type: 'POST',
                            url: url + 'methods/participants/SetPresence/' + id,
                            crossDomain: true,
                            headers: {'AgoraEvent-Token': ApiToken},
                            success: function (result) {
                                alert("Export termin\351!")
                            },
                            error: function (request, error) {
                                alert('Network error has occurred please try again!');
                            }
                        });
                    });
                },
                error: function (request,error) {
                    alert("Combinaison identifiants / mot de passe invalide");
                }
            });
        }
        else {
            //if the email and password is empty
            alert("Veuillez renseigner les champs d'authentification");
        }
    });

    $(document).on('vclick', '#guestsListLocal li a', function(){
        guestsList.id = $(this).attr('data-id');
        $.mobile.changePage( "#infoGuestPageLocal", { transition: "slide", changeHash: false });
    });

    /***********  Fonctions de Swipe  **************/

    $("#loginPage").swiperight(function() {
        $.mobile.changePage("#mainPage", { transition: "slide", reverse: true, changeHash: false });
    });

    $("#infoGuestPage").swiperight(function() {
        $.mobile.changePage("#guestsPage", { transition: "slide", reverse: true, changeHash: false });
    });

    $("#eventsPage").swiperight(function() {
        $.mobile.changePage("#loginPage", { transition: "slide", reverse: true, changeHash: false });
    });

    $("#guestsPage").swiperight(function() {
        $.mobile.changePage("#eventsPage", { transition: "slide", reverse: true, changeHash: false });
    });

    $("#guestsPageLocal").swiperight(function() {
        $.mobile.changePage("#mainPage", { transition: "slide", reverse: true, changeHash: false });
    });

    /*
    $("#guestsList").on("swipeleft",">li",function(e){
        var li = $(this);
        var contents = $(li.children()[0]);
        var item = contents.text(); // Get the item value
        var itemId = contents.attr("data-id");

        $(e.currentTarget).animate({left: "-100px"}, 100);
    });
    */
})(jQuery);