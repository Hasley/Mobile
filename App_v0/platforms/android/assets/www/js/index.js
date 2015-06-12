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
    var url = 'http://recette.agoraevent.fr/api/';
    //var url = 'http://localhost:60200/api/';

    var guestsList = {
        id : null,
        eventId: null,
        list : null,
        listSearch: null,
        row : null,
        nbRecord: 0,
        startRecord : 0,
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

        var db = window.sqlitePlugin.openDatabase({name: "my.db"});

        db.transaction(function(tx) {
            tx.executeSql("select * from A09_PARTICIPANT WHERE ID=?;", [guestsList.id], function(tx, res) {
                $('#guestDataLocal').append('<span class="infoGuestStatusLocal status' + res.rows.item(0).StatusID +  '">[' + guestsList.statusPar[res.rows.item(0).StatusID] + ']</span><br/>'+
                    '<strong>Nom: </strong>' + res.rows.item(0).FirstName + '<br/>' +
                    '<strong>Pr\351nom: </strong>' + res.rows.item(0).LastName + '<br/>' +
                    '<strong>Email: </strong>' + res.rows.item(0).Email + '<br/>'
                );

                if(res.rows.item(0).StatusID == 3){
                    $('#infoGuestLocalFooterBtnCheck')[0].className += " ui-disabled";
                }
                guestsList.id = res.rows.item(0).ID;
            });
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
                if(row.StatusID == 3){
                    $('#infoGuestFooterBtnCheck')[0].className += " ui-disabled";
                }
            }
            cpt++;
        });
    });

    /***********  Gestion des clicks **************/
    document.addEventListener("backbutton", function(e){
        e.preventDefault();
        alert("backbuttonpressed");
    }, false);

    function offlineMode(){
        ajax.blockui();

        var db = window.sqlitePlugin.openDatabase({name: "my.db"});

        db.transaction(function(tx) {
            tx.executeSql("select * from A09_PARTICIPANT limit 100;", [], function(tx, res) {
                for (i = 0; i < res.rows.length; i++) {
                    $('#guestsListLocal').append('<li><a href="" data-id="' +
                    res.rows.item(i).ID + '"><h3>' + res.rows.item(i).LastName + '</h3><p>' + res.rows.item(i).FirstName +
                    '<span class="statusListView status' + res.rows.item(i).StatusID +  ' ">[' + guestsList.statusPar[res.rows.item(i).StatusID] + ']</span></p></a></li>');
                }
                guestsList.startRecord = 100;
                guestsList.nbRecord = res.rows.length;

            });
        });

        setTimeout(function(){
            $.mobile.changePage( "#guestsPageLocal", { transition: "slide", changeHash: false });
            $('#guestsListLocal').listview('refresh');
        }, 1000);
        setTimeout(function(){
            $.unblockUI();
        }, 1500);
    }

    $(document).on('vclick', '#btnWifi', function(){
        $("#guestsListLocal").empty();
        $.mobile.changePage( "#loginPage", { transition: "slide", changeHash: false });
    });

    $(document).on('vclick', '#btnNoWifi', function(){
        offlineMode();
    });

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
        guestsList.startRecord = 0;

        ajax.blockui();
        $.ajax({
            type: 'GET',
            //url: url + 'methods/events/' + id + '/ParticipantStatus/',
            url: url + 'MobileParticipants?id=' + id + '&StartRecord=' + guestsList.startRecord + '&RecordsCount=100',
            crossDomain: true,
            headers: {'AgoraEvent-Token': ApiToken},
            success: function (result) {
                guestsList.list = result;
                ajax.parseGuests(result);
                guestsList.startRecord += 100;
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

    $(document).on('vclick', '#guestsListFooterBtnImport', function(){
        ajax.blockui();

        var db = window.sqlitePlugin.openDatabase({name: "my.db"});

        db.transaction(function(tx) {
            tx.executeSql('DROP TABLE IF EXISTS A09_PARTICIPANT');
            tx.executeSql('CREATE TABLE IF NOT EXISTS A09_PARTICIPANT (ID integer, LastName text, FirstName text, Email text, StatusID integer)');


            tx.executeSql('DROP TABLE IF EXISTS CHANGE_LIST');
            tx.executeSql('CREATE TABLE IF NOT EXISTS CHANGE_LIST (ID integer, StatusID integer)');

            var id = guestsList.eventId;
            $.ajax({
                type: 'GET',
                url: url + 'MobileParticipants?id=' + id,
                crossDomain: true,
                async: false,
                headers: {'AgoraEvent-Token': ApiToken},
                success: function (result) {
                    ajax.blockui();
                    var cpt = 0;

                    $.each(result, function(i, row) {
                        tx.executeSql("INSERT INTO A09_PARTICIPANT (ID, LastName, FirstName, Email, StatusID) VALUES (?,?,?,?,?)", [row.ID, row.LastName, row.FirstName, row.Email, row.StatusID], function(tx, res) {});
                    });

                    setTimeout(function(){
                        alert("Import termin\351!");
                        $.unblockUI();
                    }, 500);

                    $('#guestsPageOptionPanel').animate({
                        bottom: "-=200px"
                    }, 300, function() {
                    });
                },
                error: function (request, error) {
                    alert('Error');
                }
            });
        }, function(e) {
            console.log("ERROR: " + e.message);
        });
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

    $(document).on('vclick', '#guestsListLocalFooterBtnHorsLigne', function(){
        offlineMode();
    });

    /********** GUEST LIST OPTION PANEL  *********/
    $(document).on('vclick', '#guestsListFooterBtnSettings', function(){
        var bottom = "+=200px";
        if($('#guestsPageOptionPanel')[0].style.bottom == "0px"){
            bottom = "-=200px";
        }

        $('#guestsPageOptionPanel').animate({
            bottom: bottom
        }, 300, function() {
            // Animation complete.
        });

    });

    $(document).on('vclick', '#dialogSearchHeader', function(){
        $("#dialogPageSearch").fadeOut(500);
        el = document.getElementById("overlay");
        el.style.visibility = "hidden";
    });


    $(document).on('vclick', '#guestsListFooterBtnSearch', function(){
        $.mobile.silentScroll(0);
        el = document.getElementById("overlay");
        el.style.visibility = "visible";

        var $dialog = $("#dialogPageSearch");
        if (!$dialog.hasClass('ui-dialog')) {
            $dialog.page();
        }
        $dialog.fadeIn(300);
    });

    $(document).on('vclick', '#btnSearch', function(){
        var activePage = $.mobile.pageContainer.pagecontainer("getActivePage");
        var searchText = document.getElementById("searchField").value;

        if(searchText != ""){
            if (activePage[0].id == "guestsPage") {
                var id = guestsList.eventId;

                $("#dialogPageSearch").fadeOut(500);
                el = document.getElementById("overlay");
                el.style.visibility = "hidden";

                ajax.blockui();
                setTimeout(function(){
                    $.ajax({
                        type: 'GET',
                        url: url + 'MobileParticipants?id=' + id + '&Query=' + searchText,
                        crossDomain: true,
                        async: false,
                        headers: {'AgoraEvent-Token': ApiToken},
                        success: function (result) {
                            guestsList.listSearch = result;
                            ajax.parseGuests(result);

                            $('#guestsList').listview('refresh');

                            $('#guestsPageSearchFilter').animate({
                                bottom: "+=90px"
                            }, 200, function() {
                                // Animation complete.
                            });

                            $('#deleteBtnSearchFilter')[0].innerHTML = searchText;
                        },
                        error: function (request, error) {
                            alert('Error');
                        }
                    });
                }, 500);
            }else if(activePage[0].id == "guestsPageLocal"){
                var db = window.sqlitePlugin.openDatabase({name: "my.db"});

                $("#dialogPageSearch").fadeOut(500);
                el = document.getElementById("overlay");
                el.style.visibility = "hidden";

                ajax.blockui();

                setTimeout(function(){
                    db.transaction(function(tx) {
                        var query = "select * from A09_PARTICIPANT where LastName like ?;"
                        tx.executeSql(query, ["%" + searchText + "%"], function(tx, res) {
                            $('#guestsListLocal').empty();
                            for (i = 0; i < res.rows.length; i++) {
                                $('#guestsListLocal').append('<li><a href="" data-id="' +
                                res.rows.item(i).ID + '"><h3>' + res.rows.item(i).LastName + '</h3><p>' + res.rows.item(i).FirstName +
                                '<span class="statusListView status' + res.rows.item(i).StatusID +  ' ">[' + guestsList.statusPar[res.rows.item(i).StatusID] + ']</span></p></a></li>');
                            }
                            $("#guestsListLocal").listview("refresh");

                            $('#guestsPageLocalSearchFilter').animate({
                                bottom: "+=90px"
                            }, 200, function() {
                                // Animation complete.
                            });
                            $('#deleteBtnLocalSearchFilter')[0].innerHTML = searchText;

                        });
                    });
                    $.unblockUI();
                }, 500);
            }
        }else{
            alert("Veuillez renseigner la recherche!");
        }
    });

    $(document).on('vclick', '#deleteBtnSearchFilter', function() {
        $('#guestsPageSearchFilter').animate({
            bottom: "-=90px"
        }, 200, function() {
        });

        setTimeout(function(){
            ajax.parseGuests(guestsList.list);
            $('#guestsList').listview('refresh');
        }, 200);
    });

    /***********  PAGE LOCALE  **************/
    $(document).on('vclick', '#dialogExportHeader', function(){
        $("#dialogPageExport").fadeOut(500);
        el = document.getElementById("overlay");
        el.style.visibility = "hidden";
    });

    $(document).on('vclick', '#guestsListLocalFooterBtnExport', function(){
        $.mobile.silentScroll(0);
        el = document.getElementById("overlay");
        el.style.visibility = "visible";

        var $dialog = $("#dialogPageExport");
        if (!$dialog.hasClass('ui-dialog')) {
            $dialog.page();
        }
        $dialog.fadeIn(300);

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

                    var db = window.sqlitePlugin.openDatabase({name: "my.db"});

                    db.transaction(function(tx) {
                        tx.executeSql("select * from CHANGE_LIST;", [], function(tx, res) {
                            var idList = [];
                            for (i = 0; i < res.rows.length; i++) {
                                idList.push(res.rows.item(i).ID);
                            }

                            var tmp = JSON.stringify(idList);

                            $.ajax({
                                type: 'POST',
                                url: url + 'methods/participants/SetPresence/',
                                crossDomain: true,
                                headers: {'AgoraEvent-Token': ApiToken},
                                data: JSON.stringify(tmp),
                                dataType: 'json',
                                contentType: "application/json; charset=utf-8",
                                success: function (result) {
                                    alert("Export termin\351!");
                                },
                                error: function (request,error) {
                                    alert('Network error has occurred please try again!');
                                }
                            });
                            // DO DROP CHANGELIST
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

    $(document).on('vclick', '#infoGuestLocalFooterBtnCheck', function(){
        var id = guestsList.id;
        alert("id:" + id);
        var db = window.sqlitePlugin.openDatabase({name: "my.db"});

        db.transaction(function(tx) {
            tx.executeSql("select StatusID from A09_PARTICIPANT WHERE ID=?;", [id], function(tx, res) {
                alert("status:" + res.rows.item(0).StatusID);
                if(res.rows.item(0).StatusID != 3){
                    ajax.blockuiNoMsg();

                    db.transaction(function(tx) {
                        tx.executeSql("INSERT INTO CHANGE_LIST (ID, StatusID) VALUES (?,?)", [id, 3], function(tx, res) {
                        });

                        tx.executeSql("UPDATE A09_PARTICIPANT set StatusID=3 WHERE ID =?", [id], function(tx, res) {
                        });

                        document.getElementsByClassName("infoGuestStatusLocal")[0].innerHTML = "[" + guestsList.statusPar[3] + "]";
                        document.getElementsByClassName("infoGuestStatusLocal")[0].style.color = "green";

                        $("#guestsListLocal").find("[data-id='" + id + "']")[0].getElementsByClassName("statusListView")[0].innerHTML = "[" + guestsList.statusPar[3] + "]";
                        $("#guestsListLocal").find("[data-id='" + id + "']")[0].getElementsByClassName("statusListView")[0].className = "statusListView status3";

                        guestsList.id = id;
                        $("#guestsListLocal").listview("refresh");
                    }, function(e) {
                        console.log("ERROR: " + e.message);
                    });
                    $.unblockUI();
                }else{
                    alert("Le participant est d\351j\340 pr\351sent!")
                }
            });
        });
    });

    $(document).on('vclick', '#guestsListLocalFooterBtnQrcode', function(){
        openBarcodeScan("scan", function (barcode) {
            var id = getParameterByName(barcode.text, "IdA09");

            var db = window.sqlitePlugin.openDatabase({name: "my.db"});

            db.transaction(function(tx) {
                tx.executeSql("select StatusID from A09_PARTICIPANT WHERE ID=?;", [id], function(tx, res) {
                    if(res.rows.item(0).StatusID != 3){
                        ajax.blockuiNoMsg();

                        db.transaction(function(tx) {
                            tx.executeSql("INSERT INTO CHANGE_LIST (ID, StatusID) VALUES (?,?)", [id, 3], function(tx, res) {
                            });

                            tx.executeSql("UPDATE A09_PARTICIPANT set StatusID=3 WHERE ID =?", [id], function(tx, res) {
                            });

                            $("#guestsListLocal").find("[data-id='" + id + "']")[0].getElementsByClassName("statusListView")[0].innerHTML = "[" + guestsList.statusPar[3] + "]";
                            $("#guestsListLocal").find("[data-id='" + id + "']")[0].getElementsByClassName("statusListView")[0].className = "statusListView status3";

                            guestsList.id = id;
                            $("#guestsListLocal").listview("refresh");


                            $.unblockUI();
                            $.mobile.changePage( "#infoGuestPageLocal", { transition: "slide", changeHash: false });
                        }, function(e) {
                            console.log("ERROR: " + e.message);
                        });
                        $.unblockUI();
                    }else if(res.rows.item(0).StatusID == 3){
                        alert("Le participant est d\351j\340 pr\351sent!")
                    }else{
                        alert("Le participant ne fait pas partie de la base d'invit\351s!")
                    }
                });
            });
        });
    });

    $(document).on('vclick', '#guestsListLocal li a', function(){
        guestsList.id = $(this).attr('data-id');
        $.mobile.changePage( "#infoGuestPageLocal", { transition: "slide", changeHash: false });
    });

    /********** LOCAL GUEST LIST OPTION PANEL  *********/
    $(document).on('vclick', '#guestsListLocalFooterBtnSettings', function(){
        var bottom = "+=150px";
        if($('#guestsPageLocalOptionPanel')[0].style.bottom == "-50px"){
            bottom = "-=150px";
        }

        $('#guestsPageLocalOptionPanel').animate({
            bottom: bottom
        }, 300, function() {
            // Animation complete.
        });

    });

    $(document).on('vclick', '#dialogSearchHeader', function(){
        $("#dialogPageSearch").fadeOut(500);
        el = document.getElementById("overlay");
        el.style.visibility = "hidden";
    });


    $(document).on('vclick', '#guestsListLocalFooterBtnSearch', function(){
        $.mobile.silentScroll(0);
        el = document.getElementById("overlay");
        el.style.visibility = "visible";

        var $dialog = $("#dialogPageSearch");
        if (!$dialog.hasClass('ui-dialog')) {
            $dialog.page();
        }
        $dialog.fadeIn(300);
    });

    $(document).on('vclick', '#deleteBtnLocalSearchFilter', function() {
        $('#guestsPageLocalSearchFilter').animate({
            bottom: "-=90px"
        }, 200, function() {
        });

        setTimeout(function(){
            var db = window.sqlitePlugin.openDatabase({name: "my.db"});

            db.transaction(function(tx) {
                tx.executeSql("select * from A09_PARTICIPANT limit " + guestsList.startRecord + ";", [], function(tx, res) {
                    $("#guestsListLocal").empty();
                    for (i = 0; i < res.rows.length; i++) {
                        $('#guestsListLocal').append('<li><a href="" data-id="' +
                        res.rows.item(i).ID + '"><h3>' + res.rows.item(i).LastName + '</h3><p>' + res.rows.item(i).FirstName +
                        '<span class="statusListView status' + res.rows.item(i).StatusID +  ' ">[' + guestsList.statusPar[res.rows.item(i).StatusID] + ']</span></p></a></li>');
                    }
                    $("#guestsListLocal").listview("refresh");
                });
            });
        }, 200);
    });

    /***********  Lazy Loading  **************/
    function addMore(page) {
        if(page[0].id == "guestsPage" ){
            if(guestsList.list.length == guestsList.startRecord){
                $.mobile.loading("show", {
                    text: "loading more..",
                    textVisible: true,
                    theme: "b"
                });

                $.ajax({
                    type: 'GET',
                    //url: url + 'methods/events/' + id + '/ParticipantStatus/',
                    url: url + 'MobileParticipants?id=' + guestsList.eventId + '&StartRecord=' + guestsList.startRecord + '&RecordsCount=100',
                    crossDomain: true,
                    headers: {'AgoraEvent-Token': ApiToken},
                    success: function (result) {
                        guestsList.startRecord += 100;
                        guestsList.list = result;

                        $.each(result, function(i, row) {
                            $('#guestsList').append('<li><a href="" data-id="' +
                            row.ID + '"><h3>' + row.LastName + '</h3><p>' + row.FirstName +
                            '<span class="statusListView status' + row.StatusID +  ' ">[' + guestsList.statusPar[row.StatusID] + ']</span></p></a></li>');
                        });

                        $.mobile.loading("hide");
                        $('#guestsList').listview('refresh');
                    },
                    error: function (request,error) {
                        $.mobile.loading("hide");
                        alert('Network error has occurred please try again!');
                    }
                });
            }
        }
        else{
            if(guestsList.nbRecord == guestsList.startRecord){
                $.mobile.loading("show", {
                    text: "loading more..",
                    textVisible: true,
                    theme: "b"
                });

                var db = window.sqlitePlugin.openDatabase({name: "my.db"});

                db.transaction(function(tx) {
                    tx.executeSql("select * from A09_PARTICIPANT limit " + guestsList.nbRecord + ", 100;", [], function(tx, res) {
                        for (i = 0; i < res.rows.length; i++) {
                            $('#guestsListLocal').append('<li><a href="" data-id="' +
                            res.rows.item(i).ID + '"><h3>' + res.rows.item(i).LastName + '</h3><p>' + res.rows.item(i).FirstName +
                            '<span class="statusListView status' + res.rows.item(i).StatusID +  ' ">[' + guestsList.statusPar[res.rows.item(i).StatusID] + ']</span></p></a></li>');
                        }
                        $("#guestsListLocal").listview("refresh");
                        guestsList.startRecord += 100;
                        guestsList.nbRecord += res.rows.length;

                        $.mobile.loading("hide");
                    });
                });
            }
        }
    }

    /* scroll event */
    $(document).on("scrollstop", function (e) {
        var activePage = $.mobile.pageContainer.pagecontainer("getActivePage"),
            screenHeight = $.mobile.getScreenHeight(),
            contentHeight = $(".ui-content", activePage).outerHeight(),
            scrolled = $(window).scrollTop(),
            header = $(".ui-header", activePage).hasClass("ui-header-fixed") ? $(".ui-header", activePage).outerHeight() - 1 : $(".ui-header", activePage).outerHeight(),
            footer = $(".ui-footer", activePage).hasClass("ui-footer-fixed") ? $(".ui-footer", activePage).outerHeight() - 1 : $(".ui-footer", activePage).outerHeight(),
            scrollEnd = contentHeight - screenHeight + header + footer;
        $(".ui-btn-left", activePage).text("Scrolled: " + scrolled);
        $(".ui-btn-right", activePage).text("ScrollEnd: " + scrollEnd);
        if ((activePage[0].id == "guestsPage" || activePage[0].id == "guestsPageLocal") && scrolled >= scrollEnd) {
            console.log("adding...");
            addMore(activePage);
        }
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