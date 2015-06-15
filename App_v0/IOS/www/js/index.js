/*******************************************************/
/***********     Structure du document    **************/
/*

#region Fonctions de la variable Ajax 
    - parseEvents : gestion du json récupéré pour le parser sur la listview
    - parseGuests : gestion du json récupéré pour le parser sur la listview
    - parsePrestations : gestion du json récupéré pour le parser sur la listview
    - getEventsList : récupère la liste des évènements (ajax)
    - getGuestslist : récupère la liste des invités (ajax)
    - blockui : overlay avec le message chargement
    - blockuiNoMsg : overlay sans message
    
#region ONSEN UI

#region backbutton
    - Fonctions permettant de gérer les clicks du bouton back sur ANDROID 
    
#region Fonctions utilitaires
    - checkTokenValidity
    - offlineMode
    - openBarcodeScan
    
#region MainPage
    
#region loginPage 

#region eventsPage

#region prestationsPage

#region guestsPage
    #subregion GUEST LIST OPTION PANEL
        - Qr Code
        - #search
        - #importBase
    #subregion infoGuestPage

#region LOCAL
 - Gestions des pages du mode hors ligne:
    #subregion prestationsPageLocal
    #subregion guestsPageLocal 
    #subregion Export
        - Fonctions permettant l'export des données vers les APIs
    #subregion Check presence
        - Validation de la présence d'un invité hors ligne
    #subregion infoGuestPageLocal
    #subregion LOCAL GUEST LIST OPTION PANEL
        
    
#region Lazy Loading
 - Chargement des listes d'invités en mode lazy loading pour éviter la surchage des listviews
 
#region  Swipe
 - Fonctions permettant de gérer la navigation du swipe right de l'écran 

 /*******************************************************/

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

    //var url = 'http://recette.agoraevent.fr/api/';
    //var url = 'http://localhost:60200/api/';
	var url = 'http://recette.apiagora.com/api/';

    // Variables locales
    var guestsList = {
        id : null,
        eventId: null,
        prestationId: null,
        prestationName: null,
        prestation: false,
        list : null,
        listSearch: null,
        row : null,
        nbRecord: 0,
        startRecord : 0,
        eventName : null,
        nbParticipants: 0,
        nbPresents: 0,
        tablette: false,
        dialog : 0, 
        // 0 = aucune, 1 = search, 2 = searchLocal, 3 = authLocal, 4 = optionPanelPresta, 5 = optionPanel, 6 = searchFilter
        // 7 = optionPanelPrestaLocal, 8 = optionPanelLocal, 9 = Scan, 10 = ScanLocal
        qrCode : 0,
        statusPar : ["Inconnu", "Potentiel", "Pr\351vu", "Pr\351sent", "Factur\351", "Pay\351", "Non Inscrit", "Groupe", "Absent"],
    }

    var ApiToken = null;

    var rememberMe = "false";

    $(document).ajaxStop($.unblockUI);

    $( document ).ready(function() {
        if($(window).width() > 700){
            document.getElementsByClassName("guestsPageView")[1].parentNode.removeChild(document.getElementsByClassName("guestsPageView")[1]);
            document.getElementsByClassName("guestsPageView")[1].parentNode.removeChild(document.getElementsByClassName("guestsPageView")[1]);

            document.getElementsByClassName("guestsPageViewLocal")[1].parentNode.removeChild(document.getElementsByClassName("guestsPageViewLocal")[1]);
            document.getElementsByClassName("guestsPageViewLocal")[1].parentNode.removeChild(document.getElementsByClassName("guestsPageViewLocal")[1]);
            guestsList.tablette = true;
        }else{
            document.getElementsByClassName("guestsPageView")[0].parentNode.removeChild(document.getElementsByClassName("guestsPageView")[0]);
            document.getElementsByClassName("guestsPageViewLocal")[0].parentNode.removeChild(document.getElementsByClassName("guestsPageViewLocal")[0]);
        }
    });
    
    // Centrage de l'overlay block ui
    $.fn.center = function () {
        this.css("position","absolute");
        this.css("top", ( $(window).height() - this.height() ) / 2+$(window).scrollTop() + "px");
        this.css("left", ( $(window).width() - this.width() ) / 2+$(window).scrollLeft() + "px");
        return this;
    }

    // REGEX pour récupérer les paramètres url
    // Exemple http://recette.agoraevent.fr/api?id=2 
    // getParameterByName(url, id) return 2
    function getParameterByName(url, name) {
        name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
        var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
            results = regex.exec(url);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    }

    //Callback for notification plugin alert
    function alertDismissed() {
        // do something
    }

    //CallBack Confirm
    function onConfirmQuitApp(buttonIndex) {
        if(buttonIndex == 2){
            navigator.app.exitApp();
        }
    }

    /*************************/
    /*   #region ONSEN UI    */
    /*************************/
    var dialogLoginExport; 
    var dialogSearch; 

    var module = angular.module('app', ['onsen']);

    module.controller('AppController', function($scope) {
        ons.createDialog('loginExport.html').then(function(dialog) {
            dialogLoginExport = dialog;
        });

        ons.createDialog('search.html').then(function(dialog) {
            dialogSearch = dialog;
        });
    });

    /**********************************************/
    /***** #region Fonctions de la variable Ajax */
    /*********************************************/
    // Appels ajax + utilitaires
    var ajax = {
        parseEvents:function(result){
            $('#eventsList').empty();
            var monthsInYear= new Array("janvier", "f\351vrier", "mars", "avril", "mai", "juin", "juillet", "ao\373t", "septembre", "octobre", "novembre", "d\351cembre");
            $.each(result, function(i, row) {
                var date = new Date(row.StartDate);
                var endDate = new Date(row.EndDate);
                var today = new Date();
                if(endDate < today){
                    $('#eventsList').append('<li><a href="" data-id="' + row.ID + '"><i class="fa fa-calendar-o fa-3x calendarIcon"></i><h3>' + row.Title + '</h3><p>' + date.getDate() + " " + monthsInYear[date.getMonth()] + " " + date.getFullYear()  + '</p></a></li>');
                }else{
                    $('#eventsList').append('<li><a href="" data-id="' + row.ID + '"><i class="fa fa-calendar fa-3x calendarIcon"></i><h3>' + row.Title + '</h3><p>' + date.getDate() + " " + monthsInYear[date.getMonth()] + " " + date.getFullYear()  + '</p></a></li>');
                }
            });
            $('#eventsList').listview('refresh');
        },
        parseGuests:function(result){
            $('#guestsList').empty();
            if(guestsList.prestations){
                $.each(result, function(i, row) {
                    $('#guestsList').append('<li><a href="" data-id="' +
                    row.ID + '"><h3><i class="fa fa-user fa-2x"></i>' + row.LastName + '<p>' + row.FirstName + '</p></h3></a></li>');
                });
            }else{
                $.each(result, function(i, row) {
                    $('#guestsList').append('<li><a href="" data-id="' +
                    row.ID + '"><h3><i class="fa fa-user fa-2x"></i>' + row.LastName + '<p>' + row.FirstName + '</p></h3></a></li>');
                });
            }            
        },
        parsePrestations:function(result){
            $('#prestationsList').empty();

            fullURLCount = 'methods/MobileApp/CountParticipants?id=' + guestsList.eventId;
            $.ajax({
                type: 'GET',
                url: url + fullURLCount,
                crossDomain: true,
                headers: {'AgoraEvent-Token': ApiToken},
                success: function (resultCount) {
                    var text0 = ' invit\351';
                    if(resultCount[0] > 0){
                        text0 = ' invit\351s';
                    }

                    var text1 = ' pr\351sent';
                    if(resultCount[1] > 0){
                        text1 = ' pr\351sents';
                    }

                    $('#prestationsList').append('<li><a href="" data-id="0" style="color: green;"><i class="fa fa-home fa-3x homePrestation"></i><h3>Accueil Principal</h3><p>' + resultCount[0] + text0 +'</p><span class="statusListView">' + resultCount[1] + '/' + resultCount[0] + ' ' + text1 + '</span></a></li>');

                    $.each(result, function(i, row) {

                        var nb_inscrits = row.PLACE_DISPO - row.PLACE_RESTANTE;
                        var text1 = ' inscrit sur ';
                        var text2 = ' place disponible';
                        if(isNaN(nb_inscrits)){
                            text1 = "";
                            text2 = "";
                            nb_inscrits = "";
                            row.PLACE_DISPO = "";
                        }else{
                            if(nb_inscrits > 0){
                                text1 = ' inscrits sur ';
                            }                                
                            if(row.PLACE_DISPO > 0){
                                text2 = ' places disponibles';
                            }  
                        }

                        var text3 = ' pr\351sent';
                        if(row.NB_PRESENT > 0){
                            text3 = ' pr\351sents';
                        }
                        $('#prestationsList').append('<li><a href="" data-id="' + row.ID + '"><i class="fa fa-ticket fa-3x"></i><h3>' + row.LIBELLE + '</h3><p>' + nb_inscrits + text1 + row.PLACE_DISPO + text2 + '</p><span class="statusListView">' + row.NB_PRESENT + '/' + nb_inscrits + ' ' + text3 + '</span></a></li>');
                    });
                    $('#prestationsList').listview('refresh');
                },
                error: function (request,error) {
                }
            });
        },
        getEventsList: function(){
            ajax.blockui();
            $.ajax({
                type: 'GET',
                url: url + 'methods/MobileApp/GetEventsList',
                crossDomain: true,
                headers: {'AgoraEvent-Token': ApiToken},
                success: function (result) {
                    ajax.parseEvents(result);
                },
                error: function (request, error) {
                    if(request.status == 401){
                        // Unauthorized
                        navigator.notification.alert(
                            "Votre session a expir\351, veuillez-vous identifier \340 nouveau",  // message
                            alertDismissed,         // callback
                            "Notification",            // title
                            "Ok"                  // buttonName
                        );

                        $.mobile.changePage( "#loginPage", { transition: "slide", reverse: true, changeHash: false });
                    }

                    navigator.notification.alert(
                        "Erreur lors de la r\351cup\351ration des \351v\350nements", 
                        alertDismissed,       
                        "Notification",            
                        "Ok"                
                    );
                }
            });
        },
        getGuestslist: function(prestation){
            guestsList.startRecord = 0;
            var fullURLGet = "";
            var fullURLCount = "";
            if(prestation){
                document.getElementById("guestsPageTitle").innerHTML = guestsList.prestationName;
                fullURLGet = 'methods/MobileApp/GetParticipants?id=' + guestsList.prestationId + '&idManif=' + guestsList.eventId + '&Prestation=true&StartRecord=' + guestsList.startRecord + '&RecordsCount=100';
                fullURLCount = 'methods/MobileApp/CountParticipants?id=' + guestsList.prestationId + '&idManif=' + guestsList.eventId + '&Prestation=true';
            }else{
                document.getElementById("guestsPageTitle").innerHTML = guestsList.eventName;
                fullURLGet = 'methods/MobileApp/GetParticipants?id=' + guestsList.eventId + '&StartRecord=' + guestsList.startRecord + '&RecordsCount=100';
                fullURLCount = 'methods/MobileApp/CountParticipants?id=' + guestsList.eventId;
            }

            ajax.blockui();
            $.ajax({
                type: 'GET',
                url: url + fullURLGet,
                crossDomain: true,
                headers: {'AgoraEvent-Token': ApiToken},
                success: function (result) {
                    guestsList.list = result;
                    ajax.parseGuests(result);
                    guestsList.startRecord += 100;
                    ajax.blockui();
                    //COUNT NB PARTICIPANTS
                    $.ajax({
                        type: 'GET',
                        url: url + fullURLCount,
                        crossDomain: true,
                        headers: {'AgoraEvent-Token': ApiToken},
                        success: function (result) {
                            guestsList.nbParticipants = result[0];
                            guestsList.nbPresents = result[1];
                            var text0 = ' r\351sultat';
                            if(result[0] > 0){
                                text0 = ' r\351sultats';
                            }
                            document.getElementById("guestsPageNbResults").innerHTML = result[0] + text0;

                            var text1 = ' pr\351sent';
                            if(result[1] > 0){
                                text1 = ' pr\351sents';
                            }
                            document.getElementById("guestsPageNbPresents").innerHTML = result[1] + text1;

                            $.mobile.changePage( "#guestsPage", { transition: "slide", changeHash: false });
                            $('#guestsList').listview('refresh');
                        },
                        error: function (request,error) {
                            navigator.notification.alert(
                                "Erreur lors de la r\351cup\351ration du nombre de r\351sultats", 
                                alertDismissed,       
                                "Notification",            
                                "Ok"                
                            );
                        }
                    });
                },
                error: function (request,error) {
                    if(request.status == 401){
                        // Unauthorized
                        navigator.notification.alert(
                            "Votre session a expir\351, veuillez-vous identifier \340 nouveau", 
                            alertDismissed,       
                            "Notification",            
                            "Ok"                
                        );

                        $.mobile.changePage( "#loginPage", { transition: "slide", reverse: true, changeHash: false });
                    }

                    navigator.notification.alert(
                        "Erreur lors de la r\351cup\351ration des invit\351s", 
                        alertDismissed,       
                        "Notification",            
                        "Ok"                
                    );
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

    /*************************/
    /*   #region backbutton  */
    /*************************/
    /***********  Gestion des clicks sur le bouton back ANDROID **************/
    document.addEventListener("backbutton", function(e){
        e.preventDefault();

        if(guestsList.qrCode == 1){
            // DONT CLOSE
        }
        else if(guestsList.dialog > 0 && !($.mobile.activePage.is('#scanPage'))){
            // 0 = aucune, 1 = search, 2 = searchLocal, 3 = authLocal, 4 = optionPanelPresta, 5 = optionPanel, 6 = searchFilter
            // 7 = optionPanelPrestaLocal, 8 = optionPanelLocal
            if(guestsList.dialog == 1 || guestsList.dialog == 2){
                setTimeout(function(){ dialogSearch.hide(); }, 50);
            }
            else if(guestsList.dialog == 3){
                setTimeout(function(){ dialogLoginExport.hide(); }, 50);
            }
            else if(guestsList.dialog == 4){
                $("#moreOptionOverlayDivPrestationPage").click();
            }
            else if(guestsList.dialog == 5){
                $("#moreOptionOverlayDivGuestsPageLocal").click();
            }
            else if(guestsList.dialog == 6){
                $('#guestsPageSearchFilter').fadeOut("slow");
            }
            else if(guestsList.dialog == 7){
                $('#moreOptionOverlayDivPrestationPageLocal').fadeOut("slow");
            }
            else if(guestsList.dialog == 8){
                $('#moreOptionOverlayDivGuestsPageLocal').fadeOut("slow");
            }
            guestsList.dialog = 0;
        }
        else if($.mobile.activePage.is('#mainPage')){
            navigator.notification.confirm(
                "Etes-vous s\373r de vouloir quitter l'application?", // message
                 onConfirmQuitApp,         // callback to invoke with index of button pressed
                "Notification",           // title
                ['Annuler','Oui']        // buttonLabels
            );
        }
        else if($.mobile.activePage.is('#loginPage')){
            $.mobile.changePage( "#mainPage", { transition: "slide", reverse: true, changeHash: false });
        }
        else if($.mobile.activePage.is('#eventsPage')){
            importedBase = window.localStorage.getItem("importedBase");
            if(importedBase == "true"){
                $.mobile.changePage( "#mainPage", { transition: "slide", reverse: true, changeHash: false });
            }
        }
        else if($.mobile.activePage.is('#prestationsPage')){
            $.mobile.changePage( "#eventsPage", { transition: "slide", reverse: true, changeHash: false });
        }
        else if($.mobile.activePage.is('#guestsPage')){
            if(guestsList.prestations || (!guestsList.prestations && guestsList.prestationId == 0)){
                $.mobile.changePage( "#prestationsPage", { transition: "slide", reverse: true, changeHash: false });
            }
            else
            {
                $.mobile.changePage( "#eventsPage", { transition: "slide", reverse: true, changeHash: false });
            }
        }
        else if($.mobile.activePage.is('#infoGuestPage')){
            $.mobile.changePage( "#guestsPage", { transition: "slide", reverse: true, changeHash: false });
        }
        else if($.mobile.activePage.is('#prestationsPageLocal')){
            $.mobile.changePage( "#mainPage", { transition: "slide", reverse: true, changeHash: false });
        }
        else if($.mobile.activePage.is('#guestsPageLocal')){
            if(guestsList.prestations){
                $.mobile.changePage( "#prestationsPageLocal", { transition: "slide", reverse: true, changeHash: false });
            }
            else {
                $.mobile.changePage( "#mainPage", { transition: "slide", reverse: true, changeHash: false });
            }
        }
        else if($.mobile.activePage.is('#infoGuestPageLocal')){
            $.mobile.changePage( "#guestsPageLocal", { transition: "slide", reverse: true, changeHash: false });
        }
        else if($.mobile.activePage.is('#scanPage')){
            if(guestsList.dialog == 9){
                $.mobile.changePage("#guestsPage", { transition: "fade", changeHash: false });
            }
            else if(guestsList.dialog == 10){
                $.mobile.changePage("#guestsPageLocal", { transition: "fade", changeHash: false });
            }
            guestsList.dialog = 0;
        }
        
        $.unblockUI();
    }, false);

    /************************************************/
    /******    #region Fonctions utilitaires *******/
    /**********************************************/
    function checkTokenValidity(){
        if(window.localStorage.getItem("tokenDate") != null && window.localStorage.getItem("token")){
            var tokenDate = new Date(window.localStorage.getItem("tokenDate"));
            var today = new Date();

            if((today-tokenDate) < 7200000) // inférieur à 2h
            {
                ApiToken = window.localStorage.getItem("token");
                return true;
            }
            /*
            navigator.notification.alert(
                "Votre session a expir\351, veuillez-vous identifier \340 nouveau", 
                alertDismissed,       
                "Notification",            
                "Ok"                
            );*/
        }
        return false;
    }

    function offlineMode(){
        importedBase = window.localStorage.getItem("importedBase");
        if(importedBase != "true"){
            //Si aucune base importé alors on redirige directement vers la page de connexion
            navigator.notification.alert(
                "Aucune liste d'invit\351s n'a \351t\351 t\351l\351charg\351e au pr\351alable", 
                alertDismissed,       
                "Notification",            
                "Ok"                
            );
        }
        else{
            ajax.blockui();

            var db = window.sqlitePlugin.openDatabase({name: "my.db"});

            prestations = window.localStorage.getItem("prestations");
            if(prestations == "true"){
                db.transaction(function(tx) {
                    $('#prestationsLocalList').empty();                
                    tx.executeSql("select count(*) as cnt from A09_PARTICIPANT;", [], function(tx, res2) {
                        var text0 = ' invit\351';
                        if(res2.rows.item(0).cnt > 0){
                            text0 = ' invit\351s';
                        }
                        $('#prestationsLocalList').append('<li><a href="" data-id="0" style="color: green;"><i class="fa fa-home fa-3x homePrestation"></i><h3>Accueil Principal</h3><p>' + res2.rows.item(0).cnt + text0 +'</p></a></li>');
                    });

                    tx.executeSql("select * from A10_PRESTATION;", [], function(tx, res) {
                        for (i = 0; i < res.rows.length; i++) {
                            var nb_inscrits = parseInt(res.rows.item(i).PLACE_DISPO) - parseInt(res.rows.item(i).PLACE_RESTANTE);
                            var text1 = ' inscrit sur ';
                            var text2 = ' place disponible';

                            if(isNaN(nb_inscrits)){
                                nb_inscrits = "";
                                text1 = "";
                                text2 = "";
                                res.rows.item(i).PLACE_DISPO = "";
                            }else{
                                if(nb_inscrits > 0){
                                    text1 = ' inscrits sur ';
                                }                            
                                if(parseInt(res.rows.item(i).PLACE_DISPO) > 0){
                                    text2 = ' places disponibles';
                                } 
                            }

                            $('#prestationsLocalList').append('<li><a href="" data-id="' +
                            res.rows.item(i).ID + '"><i class="fa fa-ticket fa-3x"></i><h3>' + res.rows.item(i).LIBELLE + '</h3><p>' + nb_inscrits + text1 + res.rows.item(i).PLACE_DISPO + text2 + '</p></a></li>');
                        }  

                        setTimeout(function(){
                            $.mobile.changePage( "#prestationsPageLocal", { transition: "slide", changeHash: false });
                            $('#prestationsLocalList').listview('refresh');

                            $.unblockUI();
                        }, 500);
                    });
                });

            }else{
                parseGuestsListLocal(false);
            }
        }
    }

    function openBarcodeScan(viewInfo, callback) {
        var scanner = cordova.plugins.barcodeScanner;
        scanner.scan(function (result) {
            if (!result.cancelled) {
                callback(result);
            }
        }, function (error) {
            navigator.notification.alert(
                "Erreur lors de l'ouverture du plugin barcodeScanner", 
                alertDismissed,       
                "Notification",            
                "Ok"                
            );
        });
    }

    
    /************************************************/
    /******       #region MainPage          ********/
    /**********************************************/
    $(document).on('pagebeforeshow', '#mainPage', function(){        
        /*
        window.localStorage.removeItem("token");
        window.localStorage.removeItem("tokenDate");
        

        importedBase = window.localStorage.getItem("importedBase");
        if(importedBase != "true"){
            //Si aucune base importé alors on redirige directement vers la page de connexion
            if(checkTokenValidity()){
                $.mobile.changePage( "#eventsPage", { transition: "slide", changeHash: false });
            }else{
                $.mobile.changePage( "#loginPage", { transition: "slide", changeHash: false });
            }
        }
        else{
            document.getElementById("offlineModeDivEventName").style.display = "block";
            document.getElementById("offlineModeEventName").innerHTML = window.localStorage.getItem("importedBaseName");
        }*/
    });

    $(document).on('vclick', '#btnWifi', function(){
        $("#guestsListLocal").empty();
        if(checkTokenValidity()){
            $.mobile.changePage( "#eventsPage", { transition: "slide", changeHash: false });
        }else{
            $.mobile.changePage( "#loginPage", { transition: "slide", changeHash: false });
        }
    });    

    $(document).on('vclick', '#btnNoWifi', function(){
        offlineMode();
    });


    /***************************************/
    /******       #region loginPage  *******/
    /***************************************/
    $(document).on('pagebeforeshow', '#loginPage', function(){
        $('#authenticationForm').on('submit', function(event) {
            $('#password').blur();
            event.preventDefault(); 
            setTimeout(function() {
                $('#btnConnexion').trigger( 'click' );
            }, 50);
            return false;
        });

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

    $( document ).on('vclick', '#btnConnexion', function(){
        var form = $("#authenticationForm");
        var username = $("#username", form).val();
        var password = $("#password", form).val();

        //Stockage local si on a coché se souvenir de moi
        if(window.localStorage.getItem("rememberMe") == "true"){
            var username = document.getElementById("username").value;
            var password = document.getElementById("password").value;
            window.localStorage.setItem("username", username);
            window.localStorage.setItem("password", password);
        }

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

                    window.localStorage.setItem("token", ApiToken);
                    window.localStorage.setItem("tokenDate", new Date().toString());

                    $.mobile.changePage( "#eventsPage", { transition: "slide", changeHash: false });
                },
                error: function (request,error) {
                    navigator.notification.alert(
                        "Combinaison identifiants / mot de passe invalide", 
                        alertDismissed,       
                        "Notification",            
                        "Ok"                
                    );
                }
            });
        }
        else {
            //if the email and password is empty
            navigator.notification.alert(
                "Veuillez renseigner les champs d'authentification", 
                alertDismissed,       
                "Notification",            
                "Ok"                
            );
        }
    });

    /***************************************/
    /*       #region eventsPage        *****/
    /***************************************/
    $(document).on('pagebeforeshow', '#eventsPage', function(){
        importedBase = window.localStorage.getItem("importedBase");
        if(importedBase == "true"){
            document.getElementById("backtoLoginButton").style.display = "inline";
        }
        ajax.getEventsList();
    });

    $(document).on('vclick', '#backtoLoginButton', function(){
        $.mobile.changePage( "#mainPage", { transition: "slide", reverse: true, changeHash: false });
    });  

    $(document).on('pagebeforeshow', '#prestationsPage', function(){
        $('#prestationsList').listview('refresh');
        ajax.getEventsList();
    });

    $(document).on('vclick', '#prestationsPageFooterBtnActualiser', function(){
        loadEventList();
    });  

    $(document).on('vclick', '#eventsList li a', function(){
        var id = $(this).attr('data-id');
        guestsList.eventId = id;
        guestsList.eventName = this.getElementsByTagName("h3")[0].innerHTML;
        guestsList.prestationId = null;
        loadEventList();
    });

    $(document).on('vclick', '#moreOptionEventsPage', function(){
        setTimeout(function(){ 
            document.getElementById("moreOptionOverlayDivEventsPage").style.display="block";
         }, 50);
        document.getElementById("moreOptionDivEventsPage").style.display="block";
    });
    
    $(document).on('vclick', '#moreOptionOverlayDivEventsPage', function(){
        document.getElementById("moreOptionDivEventsPage").style.display="none";
        setTimeout(function(){ 
            document.getElementById("moreOptionOverlayDivEventsPage").style.display="none";
         }, 50);
    });

    $(document).on('vclick', '#eventsPageBtnAccueil', function(){
        document.getElementById("moreOptionDivEventsPage").style.display="none";
        setTimeout(function(){ 
            document.getElementById("moreOptionOverlayDivEventsPage").style.display="none";
        }, 50);

        $.mobile.changePage( "#mainPage", { transition: "slide", reverse: true, changeHash: false });
    });

    $(document).on('vclick', '#disconnect', function(){
        window.localStorage.removeItem("token");
        window.localStorage.removeItem("tokenDate");

        document.getElementById("moreOptionDivEventsPage").style.display="none";
        setTimeout(function(){ 
            document.getElementById("moreOptionOverlayDivEventsPage").style.display="none";
        }, 50);

        $.mobile.changePage( "#loginPage", { transition: "slide", reverse: true, changeHash: false });
    });  

    function loadEventList(){
        // CHECK IF THERE ARE PRESTATIONS
        ajax.blockui();
        $.ajax({
            type: 'GET',
            url: url + 'methods/MobileApp/GetPrestations/' + guestsList.eventId,
            crossDomain: true,
            headers: {'AgoraEvent-Token': ApiToken},
            success: function (result) {
                if(result.length > 0)
                {
                    guestsList.prestations = true;
                    ajax.parsePrestations(result);

                    document.getElementById("PrestationsPageTitle").innerHTML = guestsList.eventName;
                    $.mobile.changePage( "#prestationsPage", { transition: "slide", changeHash: false });
                }
                else
                {
                    guestsList.prestations = false;
                    ajax.getGuestslist(false);   
                }
            },
            error: function (request,error) {
                if(request.status == 401){
                    // Unauthorized
                    navigator.notification.alert(
                        "Votre session a expir\351, veuillez-vous identifier \340 nouveau", 
                        alertDismissed,       
                        "Notification",            
                        "Ok"                
                    );

                    $.mobile.changePage( "#loginPage", { transition: "slide", reverse: true, changeHash: false });
                }
                navigator.notification.alert(
                    "Erreur lors de la r\351cup\351ration des prestations en ligne", 
                    alertDismissed,       
                    "Notification",            
                    "Ok"                
                );
            }
        });
    }

    /***************************************/
    /******    #region prestationsPage    ***/
    /***************************************/
    $(document).on('vclick', '#backBtnPrestationsPage', function(){
        $.mobile.changePage( "#eventsPage", { transition: "slide", reverse: true, changeHash: false });
    });
    

    $(document).on('vclick', '#prestationsList li a', function(){
        guestsList.prestationName = $(this)[0].querySelector("h3").textContent;
        guestsList.prestationId = $(this).attr('data-id');
        if(guestsList.prestationId == 0){
            ajax.getGuestslist(false);
            guestsList.prestations = false;
        }else{
            ajax.getGuestslist(true);
            guestsList.prestations = true;
        }
    });

    $(document).on('vclick', '#moreOptionPrestationPage', function(){
        guestsList.dialog = 4;
        setTimeout(function(){ 
            document.getElementById("moreOptionOverlayDivPrestationPage").style.display="block";
         }, 50);
        document.getElementById("moreOptionDivPrestationPage").style.display="block";
    });
    
    $(document).on('vclick', '#moreOptionOverlayDivPrestationPage', function(){
        guestsList.dialog = 0;
        document.getElementById("moreOptionDivPrestationPage").style.display="none";
        setTimeout(function(){ 
            document.getElementById("moreOptionOverlayDivPrestationPage").style.display="none";
         }, 50);
    });

    $(document).on('vclick', '#prestationsPageFooterBtnAccueil', function(){
        document.getElementById("moreOptionDivPrestationPage").style.display="none";
        setTimeout(function(){ 
            document.getElementById("moreOptionOverlayDivPrestationPage").style.display="none";
        }, 50);

        importedBase = window.localStorage.getItem("importedBase");
        if(importedBase == "true"){
            $.mobile.changePage( "#mainPage", { transition: "slide", reverse: true, changeHash: false });
        }
        else{
            $.mobile.changePage( "#eventsPage", { transition: "slide", reverse: true, changeHash: false });
        }
    });

    $(document).on('vclick', '#prestationsPageFooterBtnImport', function(){
        document.getElementById("moreOptionDivPrestationPage").style.display="none";
        setTimeout(function(){ 
            document.getElementById("moreOptionOverlayDivPrestationPage").style.display="none";
        }, 50);

        importBase(true);
    });

    $(document).on('vclick', '#prestationsPageFooterBtnHorsLigne', function(){
        document.getElementById("moreOptionDivPrestationPage").style.display="none";
        setTimeout(function(){ 
            document.getElementById("moreOptionOverlayDivPrestationPage").style.display="none";
        }, 50);

        offlineMode();
    });

    /***************************************/
    /******       #region guestsPage    ****/
    /***************************************/
    function emptyGuestData(){
        $('#guestData').empty();
        $('#guestDataPrestationsList').empty();

        document.getElementById("infoGuestPageName").innerHTML = "Nom Pr\351nom";
        document.getElementById("infoGuestPageCategory").innerHTML = "Cat\351gorie";

        $('#guestData').append(
            '<strong>Soci\351t\351: </strong><br/>' +
            '<strong>Email: </strong><br/>' +
            '<strong>T\351l\351phone: </strong><br/>'
        );   
    }

    $(document).on('pagebeforeshow', '#guestsPage', function(){
        emptyGuestData();
        $('#guestsList').listview('refresh');    
    });

    $(document).on('vclick', '#guestsPageBackButton', function(){
        if(guestsList.prestations || (!guestsList.prestations && guestsList.prestationId == 0)){
            $.mobile.changePage( "#prestationsPage", { transition: "slide", reverse: true, changeHash: false });
        }
        else
        {
            $.mobile.changePage( "#eventsPage", { transition: "slide", reverse: true, changeHash: false });
        }
    });

    $(document).on('vclick', '#moreOptionGuestsPage', function(){
        setTimeout(function(){ 
            document.getElementById("moreOptionOverlayDivGuestsPage").style.display="block";
         }, 50);
        document.getElementById("moreOptionDivGuestsPage").style.display="block";
    });

    $(document).on('vclick', '#moreOptionOverlayDivGuestsPage', function(){
        document.getElementById("moreOptionDivGuestsPage").style.display="none";
        setTimeout(function(){ 
            document.getElementById("moreOptionOverlayDivGuestsPage").style.display="none";
         }, 50);
    });

    $(document).on('vclick', '#guestsList li a', function(){
        ajax.blockui();
        guestsList.id = $(this).attr('data-id');

        if(guestsList.tablette){
            loadParticipantPresenceInfos();
        }else{
            $.mobile.changePage( "#infoGuestPage", { transition: "slide", changeHash: false });
        }
    });

    $(document).on('vclick', '#infoGuestPageEbillet', function(){
        var fileObject;
        var path;
        window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, onFileSystemSuccess, fail);

        function onFileSystemSuccess(fileSystem) {   
            path = fileSystem.root.toURL();    
            fileSystem.root.getFile("ebillet.pdf",
            {create: true, exclusive: false},
            gotFileEntry, fail); 
        }

        function gotFileEntry(fileEntry) {
            fileObject = fileEntry;
            saveFileContent();
        }

        function saveFileContent() {
            fileObject.createWriter(success, fail);
        }

        function success(writer) {
            ajax.blockui();

            var fullURL = "";

            if(guestsList.prestations){
                fullURL = 'methods/MobileApp/GetEbillet?id=' + guestsList.id + '&Prestation=true';
            }else 
            {
                fullURL = 'methods/MobileApp/GetEbillet?id=' + guestsList.id;
            }

            $.ajax({
                type: 'GET',
                url: url + fullURL,
                crossDomain: true,
                async: false,
                dataType: 'binary',
                headers: {'AgoraEvent-Token': ApiToken},
                success: function (result) {
                    writer.write(result);

                    cordova.plugins.fileOpener2.open(
                        path + fileObject.fullPath,
                        'application/pdf', 
                        { 
                            error : function(e) { 
                                alert('Error status: ' + e.status + ' - Error message: ' + e.message);
                            },
                            success : function () {
                            }
                        }
                    );
                },
                error: function (request, error) {
                    navigator.notification.alert(
                        "Erreur lors du t\351l\351chargement du E-Billet", 
                        alertDismissed,       
                        "Notification",            
                        "Ok"                
                    );
                }
            });             
        };

        function fail(error){
            alert(error.target);
        }
    });

    /********** #subregion GUEST LIST OPTION PANEL  *********/
    function scanQrCode(){
        guestsList.dialog = 9;
        openBarcodeScan("scan", function (barcode) {
            var id = getParameterByName(barcode.text, "IdA09");
            guestsList.id = id;

            if(id != ""){
                setTimeout(function(){
                    var fullURL;
                    if(guestsList.prestations){
                        fullURL = 'methods/MobileApp/SetPresenceInscription?id=' + id + '&ebillet=true&idPrestation=' + guestsList.prestationId;
                    }
                    else{
                        fullURL = 'methods/MobileApp/SetPresence/' + id;
                    }

                    $.ajax({
                        type: 'POST',
                        url: url + fullURL,
                        crossDomain: true,
                        async: false,
                        headers: {'AgoraEvent-Token': ApiToken},
                        success: function (result) {
                            guestsList.id = result[0];
                            
                            // Mise à jour du nombre de présents
                            guestsList.nbPresents ++;

                            var text0 = " pr\351sent";
                            if(guestsList.nbPresents > 1){
                                text0 = " pr\351sents";
                            }
                            document.getElementById("guestsPageNbPresents").innerHTML = guestsList.nbPresents + " pr\351sents";

                            document.getElementById("scanResultText").innerHTML = "ok";
                            document.getElementById("scanPage").style.backgroundColor = "rgb(133, 229, 55)";
                            document.getElementById("scanPageLinkGuest").style.display = "block";
                            document.getElementById("scanPageTitle1").innerHTML = "Billet valide";

                            // FILL PARTICIPANT INFOS
                            document.getElementById("scanPageTitle2").innerHTML = result[1] + " " + result[2];
                            
                            document.getElementById("scanPageMessage").innerHTML = "Pr\351sence valid\351e"; 
                            document.getElementById("scanPageLinkBack").onclick = function(){
                                $.mobile.changePage("#guestsPage", { transition: "fade", changeHash: false });
                            };
                            document.getElementById("scanPageContent").onclick = scanAgain;

                            document.getElementById("scanPageLinkGuest").onclick = moreInfoScan;

                            setTimeout(function(){ 
                                $.mobile.changePage( "#scanPage", { transition: "fade", changeHash: false });
                            }, 50);
                            navigator.notification.vibrate(500);
                        },
                        error: function (request, error) {
                            navigator.notification.vibrate(500);
                            if(request.status == 404 || request.status == 401){
                                document.getElementById("scanResultText").innerHTML = "X";
                                document.getElementById("scanPage").style.backgroundColor = "rgb(254,0,0)";
                                document.getElementById("scanPageLinkGuest").style.display = "none";
                                
                                document.getElementById("scanPageTitle1").innerHTML = "Billet non valide";
                                document.getElementById("scanPageTitle2").innerHTML = "Erreur:";
                                document.getElementById("scanPageMessage").innerHTML = "Impossible d'identifier le num\351ro du billet, veuillez v\351rifier les informations de celui-ci";

                                document.getElementById("scanPageContent").onclick = scanAgain;
                                document.getElementById("scanPageLinkBack").onclick = function(){
                                    $.mobile.changePage( "#guestsPage", { transition: "fade", changeHash: false });
                                };

                                setTimeout(function(){ 
                                    $.mobile.changePage( "#scanPage", { transition: "fade", changeHash: false });
                                }, 50);
                            }
                            else if(request.status == 403){
                                document.getElementById("scanResultText").innerHTML = "X";
                                document.getElementById("scanPage").style.backgroundColor = "rgb(236,101,0)";
                                document.getElementById("scanPageLinkGuest").style.display = "block";
                                
                                document.getElementById("scanPageTitle1").innerHTML = "Billet d\351j\340 enregistr\351";
                                document.getElementById("scanPageTitle2").innerHTML = "Alerte:";
                                document.getElementById("scanPageMessage").innerHTML = "Le num\351ro du billet a d\351j\340 \351t\351 scann\351 auparavant";

                                document.getElementById("scanPageContent").onclick = scanAgain;
                                document.getElementById("scanPageLinkBack").onclick = function(){
                                    $.mobile.changePage( "#guestsPage", { transition: "fade", changeHash: false });
                                };

                                setTimeout(function(){ 
                                    $.mobile.changePage( "#scanPage", { transition: "fade", changeHash: false });
                                }, 50);
                            }
                            else{
                                navigator.notification.alert(
                                    "Erreur lors de la validation d'un invit\351 par QRCode", 
                                    alertDismissed,       
                                    "Notification",            
                                    "Ok"                
                                );
                            }
                        }
                    });    
                }, 200);
            } 
            else{
                $.unblockUI();
                document.getElementById("scanResultText").innerHTML = "X";
                document.getElementById("scanPage").style.backgroundColor = "rgb(254,0,0)";
                document.getElementById("scanPageLinkGuest").style.display = "none";
                
                document.getElementById("scanPageTitle1").innerHTML = "Billet non valide";
                document.getElementById("scanPageTitle2").innerHTML = "Erreur:";
                document.getElementById("scanPageMessage").innerHTML = "Impossible d'identifier le num\351ro du billet, veuillez v\351rifier les informations de celui-ci";

                document.getElementById("scanPageContent").onclick = scanAgain;
                document.getElementById("scanPageLinkBack").onclick = function(){
                    $.mobile.changePage( "#guestsPage", { transition: "fade", changeHash: false });
                };

                setTimeout(function(){ 
                    $.mobile.changePage( "#scanPage", { transition: "fade", changeHash: false });
                }, 50);
            }      
        });
    }

    $(document).on('vclick', '#guestsListFooterBtnQrcode', function(){
        ajax.blockui();
        scanQrCode();
    });

    function moreInfoScan(){        
        if(guestsList.tablette){
            $.mobile.changePage("#guestsPage", { transition: "fade", changeHash: false });                          
        }
        else{
            $.mobile.changePage( "#infoGuestPage", { transition: "slide", changeHash: false });
        }
    }

    function scanAgain(){
        setTimeout(function(){ 
            scanQrCode();
         }, 50);
    }

    $(document).on('vclick', '#guestsListFooterBtnAccueil', function(){
        document.getElementById("moreOptionDivGuestsPage").style.display="none";
        setTimeout(function(){ 
            document.getElementById("moreOptionOverlayDivGuestsPage").style.display="none";
         }, 50);

        importedBase = window.localStorage.getItem("importedBase");
        if(importedBase == "true"){
            $.mobile.changePage( "#mainPage", { transition: "slide", reverse: true, changeHash: false });
        }
        else{
            $.mobile.changePage( "#eventsPage", { transition: "slide", reverse: true, changeHash: false });
        }
    });

    $(document).on('vclick', '#guestsListFooterBtnImport', function(){
        document.getElementById("moreOptionDivGuestsPage").style.display="none";
        setTimeout(function(){ 
            document.getElementById("moreOptionOverlayDivGuestsPage").style.display="none";
         }, 50);

        if(guestsList.prestations || (!guestsList.prestations && guestsList.prestationId == 0)){
            importBase(true);
        }
        else{
            importBase(false);
        }
    });

    $(document).on('vclick', '#guestsListFooterBtnActualiser', function(){
        if(guestsList.prestationId == 0){
            ajax.getGuestslist(false);
            guestsList.prestations = false;
        }else{
            ajax.getGuestslist(true);
            guestsList.prestations = true;
        }
    });


    $(document).on('vclick', '#guestsListFooterBtnSearch', function(){
        $.mobile.silentScroll(0);
        setTimeout(function(){ dialogSearch.show(); }, 50);
        guestsList.dialog = 1;


        $('#searchForm').on('submit', function(event) {
            event.preventDefault();
            $('#searchField').blur();

            setTimeout(function() {
                $('#btnSearch').trigger( 'click' );
            }, 50);
            return false;
        });
    });

    //#search
    $(document).on('vclick', '#btnSearch', function(){
        var activePage = $.mobile.pageContainer.pagecontainer("getActivePage");
        var searchText = document.getElementById("searchField").value;
        
        if(searchText != ""){
            if (activePage[0].id == "guestsPage") {
                var id = guestsList.eventId;
                setTimeout(function(){ dialogSearch.hide(); }, 50);
                ajax.blockui();
                setTimeout(function(){
                    if(guestsList.prestations && guestsList.prestationId != 0){
                        var fullURL = 'MobileApp?id=' + guestsList.prestationId + '&Prestation=true&Query=' + searchText;
                    }else{
                        var fullURL = 'MobileApp?id=' + id + '&Query=' + searchText;
                    }
                    
                    $.ajax({
                        type: 'GET',
                        url: url + fullURL,
                        crossDomain: true,
                        async: false,
                        headers: {'AgoraEvent-Token': ApiToken},
                        success: function (result) {
                            guestsList.listSearch = result;
                            ajax.parseGuests(result);

                            var text0 = " r\351sultat";
                            if(guestsList.listSearch.length > 0){
                                text0 = " r\351sultats";
                            }
                            document.getElementById("guestsPageNbResults").innerHTML = guestsList.listSearch.length + text0;

                            $('#guestsList').listview('refresh');

                            $('#guestsPageSearchFilter').fadeIn("slow");

                            $('#deleteBtnSearchFilter')[0].innerHTML = searchText;
                            guestsList.dialog = 6;
                        },
                        error: function (request, error) {
                            if(request.status == 401){
                                // Unauthorized
                                navigator.notification.alert(
                                    "Votre session a expir\351, veuillez-vous identifier \340 nouveau", 
                                    alertDismissed,       
                                    "Notification",            
                                    "Ok"                
                                );

                                $.mobile.changePage( "#loginPage", { transition: "slide", reverse: true, changeHash: false });
                            }
                            navigator.notification.alert(
                                "Erreur lors de la recherche d'un invit\351", 
                                alertDismissed,       
                                "Notification",            
                                "Ok"                
                            );
                        }
                    });
                }, 500);
            }else if(activePage[0].id == "guestsPageLocal"){

                var db = window.sqlitePlugin.openDatabase({name: "my.db"});
                setTimeout(function(){ dialogSearch.hide(); }, 50);
                guestsList.dialog = 0;

                setTimeout(function(){
                    db.transaction(function(tx) {
                        if(prestations && guestsList.prestationId != 0){
                            tx.executeSql("select a.*,  b.ID_STATUT_A39 from A09_PARTICIPANT as a left join A07_INSCRIPTION as b on a.ID=b.ID_PARTICIPANT where PRESTATION_A10=? and (LastName like ? or FirstName like ? ) limit 100;", [guestsList.prestationId, "%" + searchText + "%", "%" + searchText + "%"], function(tx, res) {
                            
                                $('#guestsListLocal').empty();
                                for (i = 0; i < res.rows.length; i++) {
                                    $('#guestsListLocal').append('<li><a href="" data-id="' +
                                    res.rows.item(i).ID + '"><h3>' + res.rows.item(i).LastName + '</h3><p>' + res.rows.item(i).FirstName +
                                    '<span class="statusListView status' + res.rows.item(i).StatusID +  ' ">[' + guestsList.statusPar[res.rows.item(i).StatusID] + ']</span></p></a></li>');
                                }
                                document.getElementById("guestsPageLocalNbResults").innerHTML = res.rows.length + " r\351sultat(s)";
                                $("#guestsListLocal").listview("refresh");

                                document.getElementById("deleteBtnLocalSearchFilter").innerHTML = searchText;
                                $('#guestsPageLocalSearchFilter').fadeIn("slow");
                                $.unblockUI();
                            });
                        }
                        else{
                            var query = "select * from A09_PARTICIPANT where (LastName like ? or FirstName like ?) limit 100;";
                            tx.executeSql(query, ["%" + searchText + "%", "%" + searchText + "%"], function(tx, res) {
                                $('#guestsListLocal').empty();
                                for (i = 0; i < res.rows.length; i++) {
                                    $('#guestsListLocal').append('<li><a href="" data-id="' +
                                    res.rows.item(i).ID + '"><h3>' + res.rows.item(i).LastName + '</h3><p>' + res.rows.item(i).FirstName +
                                    '<span class="statusListView status' + res.rows.item(i).StatusID +  ' ">[' + guestsList.statusPar[res.rows.item(i).StatusID] + ']</span></p></a></li>');
                                }
                                document.getElementById("guestsPageLocalNbResults").innerHTML = res.rows.length + " r\351sultat(s)";
                                $("#guestsListLocal").listview("refresh");

                                document.getElementById("deleteBtnLocalSearchFilter").innerHTML = searchText;
                                $('#guestsPageLocalSearchFilter').fadeIn("slow");
                                $.unblockUI();
                            });
                        }
                    });
                }, 500);
            }
        }else{
            navigator.notification.alert(
                "Veuillez renseigner le champ de recherche!", 
                alertDismissed,       
                "Notification",            
                "Ok"                
            );
        }
    });

    $(document).on('vclick', '#deleteBtnSearchFilter', function() {
        $('#guestsPageSearchFilter').fadeOut("slow");
        guestsList.dialog = 0;
        setTimeout(function(){
            $("#guestsList").empty();
            ajax.parseGuests(guestsList.list);
            $('#guestsList').listview('refresh');
            document.getElementById("guestsPageNbResults").innerHTML = guestsList.nbParticipants + " r\351sultat(s)";
        }, 200);
    });

    //Import de la base en hors ligne
    $(document).on('vclick', '#guestsListFooterBtnHorsLigne', function(){
        document.getElementById("moreOptionDivGuestsPage").style.display="none";
        setTimeout(function(){ 
            document.getElementById("moreOptionOverlayDivGuestsPage").style.display="none";
         }, 50);

        /*        
        var askImport = confirm("Voulez-vous importer la liste d'invit\351s avant de passer en mode hors ligne?");

        if(askImport){
            importBase(false);
        }
        */
        offlineMode();
    });

    // #importBase
    function importBase(prestations){
        ajax.blockui();
        
        setTimeout(function(){        
            var db = window.sqlitePlugin.openDatabase({name: "my.db"});

            db.transaction(function(tx) {
                tx.executeSql('DROP TABLE IF EXISTS A10_PRESTATION');
                tx.executeSql('DROP TABLE IF EXISTS A07_INSCRIPTION');
                tx.executeSql('DROP TABLE IF EXISTS CHANGE_LIST_INSCRIPTION');

                if(prestations){
                    tx.executeSql('CREATE TABLE IF NOT EXISTS A10_PRESTATION (ID integer, LIBELLE text, NUMERO_MANIFESTATION integer, PLACE_DISPO integer, PLACE_RESTANTE integer)');
                    tx.executeSql('CREATE TABLE IF NOT EXISTS A07_INSCRIPTION (ID integer, ID_PARTICIPANT integer, PRESTATION_A10 integer, ID_STATUT_A39 integer, DatePresence date, A10_LIBELLE text)');
                    tx.executeSql('CREATE TABLE IF NOT EXISTS CHANGE_LIST_INSCRIPTION (ID integer, ID_STATUT_A39 integer)');
                }

                tx.executeSql('DROP TABLE IF EXISTS A09_PARTICIPANT');
                tx.executeSql('CREATE TABLE IF NOT EXISTS A09_PARTICIPANT (ID integer, LastName text, FirstName text, Email text, StatusID integer, Societe text, Tel text, DatePresence date, Category text)');

                tx.executeSql('DROP TABLE IF EXISTS CHANGE_LIST');
                tx.executeSql('CREATE TABLE IF NOT EXISTS CHANGE_LIST (ID integer, StatusID integer)');

                tx.executeSql('DROP TABLE IF EXISTS I42_INV_DATES_PRESENCE');
                tx.executeSql('CREATE TABLE IF NOT EXISTS I42_INV_DATES_PRESENCE (ID_PART_A09 integer, DATE_PRESENCE date, NUMERO_MANIFESTATION integer, STATUTPART_A09 integer)');
                
                tx.executeSql('DROP TABLE IF EXISTS CHANGE_LIST_I42_INV_DATES_PRESENCE');
                tx.executeSql('CREATE TABLE IF NOT EXISTS CHANGE_LIST_I42_INV_DATES_PRESENCE (ID_PART_A09 integer, DATE_PRESENCE date, NUMERO_MANIFESTATION integer, STATUTPART_A09 integer)');

                var id = guestsList.eventId;
                $.ajax({
                    type: 'GET',
                    url: url + 'MobileApp?id=' + id,
                    crossDomain: true,
                    async: false,
                    headers: {'AgoraEvent-Token': ApiToken},
                    success: function (result) {
                        ajax.blockui();
                        var cpt = 0;

                        $.each(result, function(i, row) {
                            tx.executeSql("INSERT INTO A09_PARTICIPANT (ID, LastName, FirstName, Email, StatusID, Societe, Tel, DatePresence, Category) VALUES (?,?,?,?,?,?,?,?,?)", [row.ID, row.LastName, row.FirstName, row.Email, row.StatusID, row.Societe, row.Tel, row.DatePresence, row.Category], function(tx, res) {});
                        });
                        $.ajax({
                            type: 'GET',
                            url: url + 'methods/MobileApp/GetInvDatePresence/' + id,
                            crossDomain: true,
                            async: false,
                            headers: {'AgoraEvent-Token': ApiToken},
                            success: function (result) {
                                $.each(result, function(i, row) {
                                    tx.executeSql("INSERT INTO I42_INV_DATES_PRESENCE (ID_PART_A09, DATE_PRESENCE, NUMERO_MANIFESTATION, STATUTPART_A09) VALUES (?,?,?,?)", [row.ID_PART_A09, row.DATE_PRESENCE, id, row.STATUS_PART_A09], function(tx, res) {});
                                });                                          
                            },
                            error: function (request,error) {
                                if(request.status == 401){
                                    // Unauthorized
                                    navigator.notification.alert(
                                        "Votre session a expir\351, veuillez-vous identifier \340 nouveau", 
                                        alertDismissed,       
                                        "Notification",            
                                        "Ok"                
                                    );

                                    $.mobile.changePage( "#loginPage", { transition: "slide", reverse: true, changeHash: false });
                                }
                                navigator.notification.alert(
                                    "Erreur lors de la r\351cup\351ration des dates de pr\351sence", 
                                    alertDismissed,       
                                    "Notification",            
                                    "Ok"                
                                );
                            }
                        });
                        if(prestations){
                            $.ajax({
                                type: 'GET',
                                url: url + 'methods/MobileApp/GetPrestations/' + id,
                                crossDomain: true,
                                async: false,
                                headers: {'AgoraEvent-Token': ApiToken},
                                success: function (result) {
                                    $.each(result, function(i, row) {
                                        tx.executeSql("INSERT INTO A10_PRESTATION (ID, LIBELLE, NUMERO_MANIFESTATION, PLACE_DISPO, PLACE_RESTANTE) VALUES (?,?,?,?,?)", [row.ID, row.LIBELLE, row.NUMERO_MANIFESTATION, row.PLACE_DISPO, row.PLACE_RESTANTE], function(tx, res) {});
                                    });

                                    $.ajax({
                                        type: 'GET',
                                        url: url + 'methods/MobileApp/GetInscriptions/' + id,
                                        crossDomain: true,
                                        async: false,
                                        headers: {'AgoraEvent-Token': ApiToken},
                                        success: function (result) {
                                            $.each(result, function(i, row) {
                                                tx.executeSql("INSERT INTO A07_INSCRIPTION (ID, ID_PARTICIPANT, PRESTATION_A10, ID_STATUT_A39, DatePresence, A10_LIBELLE) VALUES (?,?,?,?,?,?)", [row.ID, row.ID_PARTICIPANT, row.PRESTATION_A10, row.ID_STATUT_A39, row.DatePresence, row.A10_LIBELLE], function(tx, res) {});
                                            });
                                            window.localStorage.setItem("prestations", "true");
                                            window.localStorage.setItem("importedBase", "true");
                                            window.localStorage.setItem("importedBaseName", guestsList.eventName);
                                            window.localStorage.setItem("eventId", guestsList.eventId);

                                            setTimeout(function(){
                                                navigator.notification.alert(
                                                    "Import termin\351!", 
                                                    alertDismissed,       
                                                    "Notification",            
                                                    "Ok"                
                                                );
                                                $.unblockUI();
                                            }, 300);                                            
                                        },
                                        error: function (request,error) {
                                            if(request.status == 401){
                                                // Unauthorized
                                                navigator.notification.alert(
                                                    "Votre session a expir\351, veuillez-vous identifier \340 nouveau", 
                                                    alertDismissed,       
                                                    "Notification",            
                                                    "Ok"                
                                                );

                                                $.mobile.changePage( "#loginPage", { transition: "slide", reverse: true, changeHash: false });
                                            }
                                            navigator.notification.alert(
                                                "Erreur lors de la r\351cup\351ration des prestations", 
                                                alertDismissed,       
                                                "Notification",            
                                                "Ok"                
                                            );
                                        }
                                    });
                                },
                                error: function (request,error) {
                                    if(request.status == 401){
                                        // Unauthorized
                                        navigator.notification.alert(
                                            "Votre session a expir\351, veuillez-vous identifier \340 nouveau", 
                                            alertDismissed,       
                                            "Notification",            
                                            "Ok"                
                                        );

                                        $.mobile.changePage( "#loginPage", { transition: "slide", reverse: true, changeHash: false });
                                    }
                                    navigator.notification.alert(
                                        "Erreur lors de la r\351cup\351ration des prestations hors ligne", 
                                        alertDismissed,       
                                        "Notification",            
                                        "Ok"                
                                    );
                                }
                            });
                        }else{
                            window.localStorage.setItem("prestations", "false");
                            window.localStorage.setItem("importedBase", "true");
                            window.localStorage.setItem("importedBaseName", guestsList.eventName);

                            setTimeout(function(){
                                navigator.notification.alert(
                                    "Import termin\351!", 
                                    alertDismissed,       
                                    "Notification",            
                                    "Ok"                
                                );
                                $.unblockUI();
                            }, 500);
                        }
                    },
                    error: function (request, error) {
                        if(request.status == 401){
                            // Unauthorized
                            navigator.notification.alert(
                                "Votre session a expir\351, veuillez-vous identifier \340 nouveau", 
                                alertDismissed,       
                                "Notification",            
                                "Ok"                
                            );

                            $.mobile.changePage( "#loginPage", { transition: "slide", reverse: true, changeHash: false });
                        }
                        navigator.notification.alert(
                            "Erreur lors de l'import des \351v\350nements hors ligne", 
                            alertDismissed,       
                            "Notification",            
                            "Ok"                
                        );
                    }
                });
            }, function(e) {
                console.log("ERROR: " + e.message);
            });
        }, 300);
    }

    /******    #subregion infoGuestPage      *******/
    $(document).on('pagebeforeshow', '#infoGuestPage', function(){
        loadParticipantPresenceInfos();
    });

    function loadParticipantPresenceInfos(){
        $('#guestData').empty();
        $('#guestDataPrestationsList').empty();
        var monthsInYear= new Array("janvier", "f\351vrier", "mars", "avril", "mai", "juin", "juillet", "ao\373t", "septembre", "octobre", "novembre", "d\351cembre");

        // RECUPERATION DES INFORMATIONS DE L'INVITE
        ajax.blockui();
        var fullUrl = 'methods/MobileApp/GetParticipantInfos?id=' + guestsList.id;
        if(guestsList.prestations){
            var fullUrl = 'methods/MobileApp/GetParticipantInfos?id=' + guestsList.id + '&Prestation=true';
        }
        $.ajax({
            type: 'GET',
            url: url + fullUrl,
            crossDomain: true,
            async: false,
            headers: {'AgoraEvent-Token': ApiToken},
            success: function (result) {
                document.getElementById("infoGuestPageName").innerHTML = result.FirstName + " " + result.LastName;
                document.getElementById("infoGuestPageCategory").innerHTML = result.Category;

                $('#guestData').append(
                    '<strong>Soci\351t\351: </strong>' + result.Societe + '<br/>' +
                    '<strong>Email: </strong>' + result.Email + '<br/>' +
                    '<strong>T\351l\351phone: </strong>' + result.Tel + '<br/>'
                );        
            },
            error: function (request,error) {
                if(request.status == 401){
                    // Unauthorized
                    navigator.notification.alert(
                        "Votre session a expir\351, veuillez-vous identifier \340 nouveau", 
                        alertDismissed,       
                        "Notification",            
                        "Ok"                
                    );

                    $.mobile.changePage( "#loginPage", { transition: "slide", reverse: true, changeHash: false });
                }
                navigator.notification.alert(
                    "Erreur lors de la r\351cup\351ration des informations d'un invit\351", 
                    alertDismissed,       
                    "Notification",            
                    "Ok"                
                );
            }
        });

        // APPEND LA LISTE DES PRESENCES A L'INVITE
        ajax.blockui();
        var fullUrl = 'methods/MobileApp/GetParticipantPresence?id=' + guestsList.id;
        if(guestsList.prestations){
            var fullUrl = 'methods/MobileApp/GetParticipantPresence?id=' + guestsList.id + '&Prestation=true';
        }
        $.ajax({
            type: 'GET',
            url: url + fullUrl,
            crossDomain: true,
            async: false,
            headers: {'AgoraEvent-Token': ApiToken},
            success: function (result) {
                var tmpText = '<li><i class="fa fa-home homePrestation"></i><h3>Accueil Principal</h3>' +
                    '<span class="infoGuestStatus status' + result[0].STATUS_PART_A09 +  '">[' + guestsList.statusPar[result[0].STATUS_PART_A09] + ']</span>';
                $.each(result, function(i, row) {
                    var date = new Date(row.DATE_PRESENCE);
                    if(date.getFullYear() < 2000){
                       tmpText += '<p>Date de validation:</p>';
                    }else{
                        tmpText += '<p>Date de validation: ' + date.getDate() + " " + monthsInYear[date.getMonth()] + " " + date.getFullYear()  + '</p>';  
                    } 
                });
                tmpText += '</li>';
                $('#guestDataPrestationsList').append(tmpText); 
               
                $('#guestDataPrestationsList').listview("refresh");
                                                     
            },
            error: function (request,error) {
                if(request.status == 401){
                    // Unauthorized
                    navigator.notification.alert(
                        "Votre session a expir\351, veuillez-vous identifier \340 nouveau", 
                        alertDismissed,       
                        "Notification",            
                        "Ok"                
                    );

                    $.mobile.changePage( "#loginPage", { transition: "slide", reverse: true, changeHash: false });
                }
                navigator.notification.alert(
                    "Erreur lors de la r\351cup\351ration des pr\351sences d'un invit\351", 
                    alertDismissed,       
                    "Notification",            
                    "Ok"                
                );
            }
        });

        // APPEND LA LISTE DES PRESTATIONS A L'INVITE
        ajax.blockui();
        fullUrl = 'methods/MobileApp/GetParticipantInscriptions?id=' + guestsList.id;
        if(guestsList.prestations){
            fullUrl = 'methods/MobileApp/GetParticipantInscriptions?id=' + guestsList.id + '&Prestation=true';
        }
        $.ajax({
            type: 'GET',
            url: url + fullUrl,
            crossDomain: true,
            headers: {'AgoraEvent-Token': ApiToken},
            success: function (result) {
                $.each(result, function(i, row2) {
                    var date2 = new Date(row2.DatePresence);
                    if(date2.getFullYear() < 2000){
                        $('#guestDataPrestationsList').append('<li><i class="fa fa-ticket"></i><h3>' + row2.A10_LIBELLE + '</h3>' + 
                        '<span class="infoGuestStatus status' + row2.ID_STATUT_A39 +  '">[' + guestsList.statusPar[row2.ID_STATUT_A39] + ']</span>' + 
                        '<p>Date de validation: </p></li>');  
                    }else{
                        $('#guestDataPrestationsList').append('<li><i class="fa fa-ticket"></i><h3>' + row2.A10_LIBELLE + 
                        '</h3><span class="infoGuestStatus status' + row2.ID_STATUT_A39 +  '">[' + guestsList.statusPar[row2.ID_STATUT_A39] + ']</span>' + 
                        '<p>Date de validation: ' + date2.getDate() + " " + monthsInYear[date2.getMonth()] + " " + date2.getFullYear()  + '</p></li>');  
                    }
                });
                $('#guestDataPrestationsList').listview("refresh");                                     
            },
            error: function (request,error) {
                if(request.status == 401){
                    // Unauthorized
                    navigator.notification.alert(
                        "Votre session a expir\351, veuillez-vous identifier \340 nouveau", 
                        alertDismissed,       
                        "Notification",            
                        "Ok"                
                    );

                    $.mobile.changePage( "#loginPage", { transition: "slide", reverse: true, changeHash: false });
                }
                navigator.notification.alert(
                    "Erreur lors de la r\351cup\351ration des prestations d'un invit\351", 
                    alertDismissed,       
                    "Notification",            
                    "Ok"                
                );
            }
        });
    }

    $(document).on('vclick', '#infoGuestPageBackButton', function(){
        $.mobile.changePage( "#guestsPage", { transition: "slide", reverse: true, changeHash: false });
    });

    function validateGuest(id){
        ajax.blockui();
        
        var fullURL;
        if(guestsList.prestations){
            fullURL = 'methods/MobileApp/SetPresenceInscription?id=' + id;
        }
        else{
            fullURL = 'methods/MobileApp/SetPresence/' + id;
        }

        $.ajax({
            type: 'POST',
            url: url + fullURL,
            crossDomain: true,
            headers: {'AgoraEvent-Token': ApiToken},
            success: function (result) {
                loadParticipantPresenceInfos();

                guestsList.nbPresents ++;
                var text0 = " pr\351sent";
                if(guestsList.nbPresents > 1){
                    text0 = " pr\351sents";
                }
                document.getElementById("guestsPageNbPresents").innerHTML = guestsList.nbPresents + " pr\351sents";                
                navigator.notification.vibrate(500);
            },
            error: function (request, error) {
                navigator.notification.vibrate(500);
                if(request.status == 401){
                    // Unauthorized
                    navigator.notification.alert(
                        "Votre session a expir\351, veuillez-vous identifier \340 nouveau", 
                        alertDismissed,       
                        "Notification",            
                        "Ok"                
                    );

                    $.mobile.changePage( "#loginPage", { transition: "slide", reverse: true, changeHash: false });
                }
                else if(request.status == 404){
                    navigator.notification.alert(
                        "Attention: veuillez v\351rifier que le participant fait partie de la liste d'invit\351", 
                        alertDismissed,       
                        "Notification",            
                        "Ok"                
                    );
                }
                else if(request.status == 403){
                    navigator.notification.alert(
                        "Attention: le participant a d\351j\340 \351t\351 enregistr\351 aujourd'hui", 
                        alertDismissed,       
                        "Notification",            
                        "Ok"                
                    );
                }
                else{
                    navigator.notification.alert(
                        "Erreur lors de la validation d'un invit\351 en ligne", 
                        alertDismissed,       
                        "Notification",            
                        "Ok"                
                    );
                }
            }
        });   
    }
    

    $(document).on('vclick', '#infoGuestFooterBtnCheck', function(){
        var id = guestsList.id;
        validateGuest(id);
    });

    /***************************************/
    /******       #region LOCAL      *******/
    /***************************************/

    /******    #subregion prestationsPageLocal   *****/
    $(document).on('pagebeforeshow', '#prestationsPageLocal', function(){
        document.getElementById("PrestationsPageLocalTitle").innerHTML = "Mode hors ligne: " + window.localStorage.getItem("importedBaseName");
    });

    $(document).on('vclick', '#prestationsPageLocalFooterBtnExport', function(){
        btnExportClick();
    });

    $(document).on('vclick', '#backBtnPrestationsPageLocal', function(){
        $.mobile.changePage( "#mainPage", { transition: "slide", reverse: true, changeHash: false });
    });

    $(document).on('vclick', '#prestationsLocalList li a', function(){
        guestsList.prestationName = $(this)[0].querySelector("h3").textContent;
        guestsList.prestationId = $(this).attr('data-id');
        $('#guestsListLocal').empty();

        if(guestsList.prestationId == 0){
            parseGuestsListLocal(false);
            guestsList.prestations = false;
        }else{
            parseGuestsListLocal(true);
            guestsList.prestations = true;
        }
    });

    $(document).on('vclick', '#moreOptionPrestationPageLocal', function(){
        guestsList.dialog = 7;
        setTimeout(function(){ 
            document.getElementById("moreOptionOverlayDivPrestationPageLocal").style.display="block";
         }, 50);
        document.getElementById("moreOptionDivPrestationPageLocal").style.display="block";
    });
    
    $(document).on('vclick', '#moreOptionOverlayDivPrestationPageLocal', function(){
        guestsList.dialog = 0;
        document.getElementById("moreOptionDivPrestationPageLocal").style.display="none";
        setTimeout(function(){ 
            document.getElementById("moreOptionOverlayDivPrestationPageLocal").style.display="none";
         }, 50);
    });

    $(document).on('vclick', '#prestationsPageLocalFooterBtnAccueil', function(){
        document.getElementById("moreOptionDivPrestationPage").style.display="none";
        setTimeout(function(){ 
            document.getElementById("moreOptionOverlayDivPrestationPage").style.display="none";
        }, 50);

        $.mobile.changePage( "#mainPage", { transition: "slide", reverse: true, changeHash: false });
    });

    /******    #subregion guestsPageLocal   *****/
    function parseGuestsListLocal(prestations){
        ajax.blockui();
        var db = window.sqlitePlugin.openDatabase({name: "my.db"});
        $('#guestsListLocal').empty();
        if(prestations){
            db.transaction(function(tx) {
                tx.executeSql("select a.*,  b.ID_STATUT_A39, b.ID as ID_A07 from A09_PARTICIPANT as a left join A07_INSCRIPTION as b on a.ID=b.ID_PARTICIPANT where PRESTATION_A10=? limit 100;", [guestsList.prestationId], function(tx, res) {
                    for (i = 0; i < res.rows.length; i++) {
                        $('#guestsListLocal').append('<li><a href="" data-id="' +
                        res.rows.item(i).ID_A07 + '"><h3><i class="fa fa-user fa-2x"></i>' + res.rows.item(i).LastName + '<p>' + res.rows.item(i).FirstName + '</p></h3></a></li>');
                    }
                    guestsList.startRecord = 100;
                    guestsList.nbRecord = res.rows.length;

                });
                tx.executeSql("select count(*) as cnt from A09_PARTICIPANT as a left join A07_INSCRIPTION as b on a.ID=b.ID_PARTICIPANT where PRESTATION_A10=? limit 100;", [guestsList.prestationId], function(tx, res) {
                    guestsList.nbParticipants = res.rows.item(0).cnt; 
                    document.getElementById("guestsPageLocalTitle").innerHTML = "Mode hors ligne: " + guestsList.prestationName;
                    var text0 = " r\351sultat";
                    if(guestsList.nbParticipants > 0){
                        text0 = " r\351sultats";
                    }
                    document.getElementById("guestsPageLocalNbResults").innerHTML = guestsList.nbParticipants + text0;
                });
            });
        }
        else
        {
            db.transaction(function(tx) 
            {               
                 tx.executeSql("select * from A09_PARTICIPANT limit 100;", [], function(tx, res) {
                    for (i = 0; i < res.rows.length; i++) {
                        $('#guestsListLocal').append('<li><a href="" data-id="' +
                        res.rows.item(i).ID + '"><h3><i class="fa fa-user fa-2x"></i>' + res.rows.item(i).LastName + '<p>' + res.rows.item(i).FirstName + '</p></h3></a></li>');
                    }
                    guestsList.startRecord = 100;
                    guestsList.nbRecord = res.rows.length;

                });
                tx.executeSql("select count(*) as cnt from A09_PARTICIPANT;", [], function(tx, res) {
                    guestsList.nbParticipants = res.rows.item(0).cnt; 
                    document.getElementById("guestsPageLocalTitle").innerHTML = "Mode hors ligne: " + window.localStorage.getItem("importedBaseName");
                    var text0 = " r\351sultat";
                    if(guestsList.nbParticipants > 0){
                        text0 = " r\351sultats";
                    }
                    document.getElementById("guestsPageLocalNbResults").innerHTML = guestsList.nbParticipants + text0;
                });
            });
        }
        setTimeout(function(){
            $.mobile.changePage( "#guestsPageLocal", { transition: "slide", changeHash: false });
            $('#guestsListLocal').listview('refresh');
            $.unblockUI();
        }, 1000);
    }

    function emptyGuestDataLocal(){
        $('#guestDataLocal').empty();
        $('#guestDataPrestationsListLocal').empty();

        document.getElementById("infoGuestPageLocalName").innerHTML = "Nom Pr\351nom";
        document.getElementById("infoGuestPageLocalCategory").innerHTML = "Cat\351gorie";

        $('#guestDataLocal').append(
            '<strong>Soci\351t\351: </strong><br/>' +
            '<strong>Email: </strong><br/>' +
            '<strong>T\351l\351phone: </strong><br/>'
        );   
    }
    
    $(document).on('pagebeforeshow', '#guestsPageLocal', function(){
        $('#guestsListLocal').listview('refresh');
        emptyGuestDataLocal();
    });

    $(document).on('vclick', '#guestsPageLocalBackButton', function(){
        $("#guestsListLocal").empty();
        
        if(guestsList.prestations || (!guestsList.prestations && guestsList.prestationId == 0)){
            $.mobile.changePage( "#prestationsPageLocal", { transition: "slide", reverse: true, changeHash: false });
        }
        else
        {
            $.mobile.changePage("#mainPage", { transition: "slide", reverse: true, changeHash: false });
        }
    });

    $(document).on('vclick', '#guestsListLocal li a', function(){
        guestsList.id = $(this).attr('data-id');     
        loadParticipantInfo();   
        if(!guestsList.tablette){
            setTimeout(function(){ 
                $.mobile.changePage( "#infoGuestPageLocal", { transition: "slide", changeHash: false });
            }, 10);
        }
    });

    $(document).on('vclick', '#moreOptionGuestsPageLocal', function(){
        guestsList.dialog = 8;
        setTimeout(function(){ 
            document.getElementById("moreOptionOverlayDivGuestsPageLocal").style.display="block";
         }, 50);
        document.getElementById("moreOptionDivGuestsPageLocal").style.display="block";
    });
    
    $(document).on('vclick', '#moreOptionOverlayDivGuestsPageLocal', function(){
        guestsList.dialog = 0;
        document.getElementById("moreOptionDivGuestsPageLocal").style.display="none";
        setTimeout(function(){ 
            document.getElementById("moreOptionOverlayDivGuestsPageLocal").style.display="none";
         }, 50);
    });

    $(document).on('vclick', '#guestsListLocalFooterBtnAccueil', function(){
        document.getElementById("moreOptionDivGuestsPageLocal").style.display="none";
        setTimeout(function(){ 
            document.getElementById("moreOptionOverlayDivGuestsPageLocal").style.display="none";
        }, 50);

        $.mobile.changePage( "#mainPage", { transition: "slide", reverse: true, changeHash: false });
    });

    $(document).on('vclick', '#infoGuestPageLocalBackButton', function(){
        $.mobile.changePage( "#guestsPageLocal", { transition: "slide", reverse: true, changeHash: false });
    });

    /***********  #subregion Export  **************/
    $(document).on('vclick', '#guestsListLocalFooterBtnExport', function(){
        btnExportClick();
    });

    function btnExportClick(){
        $.mobile.silentScroll(0);

        setTimeout(function(){ dialogLoginExport.show(); }, 50);
        
        guestsList.dialog = 3;

        var rememberMe = window.localStorage.getItem("rememberMe");
        if(rememberMe == "true"){
            document.getElementById("usernameExport").value = window.localStorage.getItem("username");
            document.getElementById("passwordExport").value = window.localStorage.getItem("password");
        }

        $('#authenticationFormExport').on('submit', function(event) {
            event.preventDefault(); 
            $('#passwordExport').blur();
            setTimeout(function() {
                    $('#btnConnexionExport').trigger('click');
            }, 50);
        });   
    }

    $(document).on('vclick', '#btnConnexionExport', function(){
        setTimeout(function(){ dialogLoginExport.hide(); }, 50)
        
        guestsList.dialog = 0;

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

                    window.localStorage.setItem("token", ApiToken);
                    window.localStorage.setItem("tokenDate", new Date().toString());

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
                                url: url + 'methods/MobileApp/SetPresenceList/',
                                crossDomain: true,
                                headers: {'AgoraEvent-Token': ApiToken},
                                data: tmp,
                                dataType: 'json',
                                contentType: "application/json; charset=utf-8",
                                success: function (result) {
                                    navigator.notification.alert(
                                        "Export termin\351!", 
                                        alertDismissed,       
                                        "Notification",            
                                        "Ok"                
                                    );

                                    tx.executeSql("Delete from CHANGE_LIST;", [], function(tx, res) {});
                                    $.unblockUI();
                                },
                                error: function (request,error) {
                                    navigator.notification.alert(
                                        "Erreur lors de l'export des fichiers", 
                                        alertDismissed,       
                                        "Notification",            
                                        "Ok"                
                                    );
                                }
                            });
                        });

                        tx.executeSql("select * from CHANGE_LIST_INSCRIPTION;", [], function(tx, res) {
                            var idList = [];
                            for (i = 0; i < res.rows.length; i++) {
                                idList.push(res.rows.item(i).ID);
                            }

                            var tmp = JSON.stringify(idList);

                            $.ajax({
                                type: 'POST',
                                url: url + 'methods/MobileApp/SetPresenceListInscription/',
                                crossDomain: true,
                                headers: {'AgoraEvent-Token': ApiToken},
                                data: tmp,
                                dataType: 'json',
                                contentType: "application/json; charset=utf-8",
                                success: function (result) {
                                    tx.executeSql("Delete from CHANGE_LIST;", [], function(tx, res) {});
                                    $.unblockUI();
                                },
                                error: function (request,error) {
                                    navigator.notification.alert(
                                        "Erreur lors de l'export des fichiers", 
                                        alertDismissed,       
                                        "Notification",            
                                        "Ok"                
                                    );
                                }
                            });
                        });

                        tx.executeSql("select * from CHANGE_LIST_I42_INV_DATES_PRESENCE;", [], function(tx, res) {
                            var list = [];
                            for (i = 0; i < res.rows.length; i++) {
                                var date = new Date(res.rows.item(i).DATE_PRESENCE.toString());
                                res.rows.item(i).DATE_PRESENCE = "#" + date.getDate() + "/" + date.getMonth() + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + "#";
                                list.push(res.rows.item(i));
                            }
                            var tmp = JSON.stringify(list);

                            $.ajax({
                                type: 'POST',
                                url: url + 'methods/MobileApp/SetInv_Dates_PresenceList/',
                                crossDomain: true,
                                headers: {'AgoraEvent-Token': ApiToken},
                                data: tmp,
                                dataType: 'json',
                                contentType: "application/json; charset=utf-8",
                                success: function (result) {
                                    tx.executeSql("Delete from CHANGE_LIST_I42_INV_DATES_PRESENCE;", [], function(tx, res) {});
                                    $.unblockUI();
                                },
                                error: function (request,error) {
                                    navigator.notification.alert(
                                        "Erreur lors de l'export des fichiers", 
                                        alertDismissed,       
                                        "Notification",            
                                        "Ok"                
                                    );
                                }
                            });
                        });
                    });
                },
                error: function (request,error) {
                    navigator.notification.alert(
                        "Combinaison identifiants / mot de passe invalide", 
                        alertDismissed,       
                        "Notification",            
                        "Ok"                
                    );
                }
            });
        }
        else {
            //if the email and password is empty
            navigator.notification.alert(
                "Veuillez renseigner les champs d'authentification", 
                alertDismissed,       
                "Notification",            
                "Ok"                
            );
        }
    });
    
    /***********  #subregion Check presence  **************/
    $(document).on('vclick', '#infoGuestLocalFooterBtnCheck', function(){
        validateLocal();
    });

    function showErrorScanPageLocal(){
        document.getElementById("scanResultText").innerHTML = "X";
        document.getElementById("scanPage").style.backgroundColor = "rgb(254,0,0)";
        document.getElementById("scanPageLinkGuest").style.display = "none";
        document.getElementById("scanPageTitle1").innerHTML = "Billet non valide";
        document.getElementById("scanPageTitle2").innerHTML = "Erreur:";
        $("#scanPageContent").click(scanAgainLocal);
        $("#scanPageLinkBack").click(function(){
            $.mobile.changePage( "#guestsPageLocal", { transition: "fade", changeHash: false });
        });
        document.getElementById("scanPageMessage").innerHTML = "Impossible d'identifier le num\351ro du billet, veuillez v\351rifier les informations de celui-ci";

        $.mobile.changePage( "#scanPage", { transition: "fade", changeHash: false });
        guestsList.qrCode = 0;
    }

    function showAlreadyScanPageLocal(){
        document.getElementById("scanResultText").innerHTML = "X";
        document.getElementById("scanPage").style.backgroundColor = "rgb(236,101,0)";
        document.getElementById("scanPageLinkGuest").style.display = "block";
        $("#scanPageLinkGuest").click(moreInfoScanLocal);
        $("#scanPageContent").click(scanAgainLocal);
        $("#scanPageLinkBack").click(function(){
            $.mobile.changePage( "#guestsPageLocal", { transition: "fade", changeHash: false });
        });
        document.getElementById("scanPageTitle1").innerHTML = "Billet d\351j\340 enregistr\351";
        document.getElementById("scanPageTitle2").innerHTML = "Alerte:";
        document.getElementById("scanPageMessage").innerHTML = "Le num\351ro du billet a d\351j\340 \351t\351 scann\351 auparavant";

        $.mobile.changePage( "#scanPage", { transition: "fade", changeHash: false });
        guestsList.qrCode = 0;
    }

    function showOkScanPageLocal(lastName, firstName){
        document.getElementById("scanResultText").innerHTML = "ok";
        document.getElementById("scanPage").style.backgroundColor = "rgb(133, 229, 55)";
        document.getElementById("scanPageLinkGuest").style.display = "block";
        $("#scanPageLinkBack").click(function(){
            $.mobile.changePage( "#guestsPageLocal", { transition: "fade", changeHash: false });
        });

        document.getElementById("scanPageTitle1").innerHTML = lastName;
        document.getElementById("scanPageTitle2").innerHTML = firstName;

        document.getElementById("scanPageMessage").innerHTML = "";
        $("#scanPageLinkGuest").click(moreInfoScanLocal);
        $("#scanPageContent").click(scanAgainLocal);

        $.mobile.changePage( "#scanPage", { transition: "fade", changeHash: false });
        guestsList.qrCode = 0;
    }

    function validateLocalPrestation(){
        var db = window.sqlitePlugin.openDatabase({name: "my.db"});
        db.transaction(function(tx) {
            tx.executeSql("select * from A07_INSCRIPTION WHERE ID=?;", [guestsList.id], function(tx, res) {
                if(res.rows.length == 0){
                    if(guestsList.qrCode == 1){
                        showErrorScanPageLocal();
                    }
                    else{
                        navigator.notification.alert(
                            "Impossible d'identifier le participant", 
                            alertDismissed,       
                            "Notification",            
                            "Ok"                
                        );
                    }
                }
                else if(res.rows.item(0).ID_STATUT_A39 != 3){
                    ajax.blockuiNoMsg();

                    db.transaction(function(tx) {
                        tx.executeSql("INSERT INTO CHANGE_LIST_INSCRIPTION (ID, ID_STATUT_A39) VALUES (?,?)", [guestsList.id, 3], function(tx, res) {
                        });

                        var today = new Date();
                        tx.executeSql("UPDATE A07_INSCRIPTION set ID_STATUT_A39=3, DatePresence=? WHERE ID =?", [today, guestsList.id], function(tx, res) {
                        });
                    
                        $("#guestsListLocal").listview("refresh");

                        if(guestsList.qrCode == 1){
                            tx.executeSql("select LastName, FirstName from A09_PARTICIPANT as a left join A07_INSCRIPTION as b on a.ID=b.ID_PARTICIPANT WHERE b.ID=?;", [guestsList.id], function(tx, res) {
                                showOkScanPageLocal(res.rows.item(0).LastName, res.rows.item(0).FirstName);
                            });
                        }else{
                            loadParticipantInfo();
                            document.getElementById("iconUserInfoGuestPageLocal").style.color = "green";
                        }

                        setTimeout(function(){ 
                            $.unblockUI();
                        }, 200); 
                    }, function(e) {
                        console.log("ERROR: " + e.message);
                    });                   
                }else if(res.rows.item(0).ID_STATUT_A39 == 3){
                    if(guestsList.qrCode == 1){
                        showAlreadyScanPageLocal();
                    }
                    else{
                        navigator.notification.alert(
                            "Le participant est d\351j\340 pr\351sent", 
                            alertDismissed,       
                            "Notification",            
                            "Ok"                
                        );
                    }
                }
            });

        });
    }

    function validateLocal(){
        var db = window.sqlitePlugin.openDatabase({name: "my.db"});
        if(guestsList.prestations){
            db.transaction(function(tx) {
                // SI on scan un QRcode alors l'id récupéré est un ID_PARTICIPANT et non un ID de A07_INSCRIPTION
                // On va donc faire un select pour obtenir cet id
                if(guestsList.qrCode == 1){
                    tx.executeSql("select ID from A07_INSCRIPTION WHERE ID_PARTICIPANT=?;", [guestsList.id], function(tx, res) {
                        if(res.rows.length == 0){
                            if(guestsList.qrCode == 1){
                                showErrorScanPageLocal();
                            }
                        }else{
                            guestsList.id = res.rows.item(0).ID;
                            validateLocalPrestation();
                        }
                    });
                }
                else{
                    validateLocalPrestation();
                }
            });
        }
        else{
            db.transaction(function(tx) {
                tx.executeSql("select FirstName, LastName, StatusID from A09_PARTICIPANT where ID=?;", [guestsList.id], function(tx, res) {
                    if(res.rows.length == 0){
                        if(guestsList.qrCode == 1){
                            showErrorScanPageLocal();
                        }
                        else{
                            navigator.notification.alert(
                                "Impossible d'identifier le participant", 
                                alertDismissed,       
                                "Notification",            
                                "Ok"                
                            );
                        }
                    }
                    else{
                        var firstname = res.rows.item(0).FirstName;
                        var lastname = res.rows.item(0).LastName;
                        db.transaction(function(tx) {
                            tx.executeSql("select * from I42_INV_DATES_PRESENCE where ID_PART_A09=?;", [guestsList.id], function(tx, res) {
                                var today = new Date();
                                if(res.rows.length == 0){
                                    ajax.blockuiNoMsg();
                                    var eventID = window.localStorage.getItem("eventId", guestsList.eventId);
                                    tx.executeSql("INSERT INTO CHANGE_LIST (ID, StatusID) VALUES (?,?)", [guestsList.id, 3], function(tx, res) {
                                    });

                                    tx.executeSql("INSERT INTO I42_INV_DATES_PRESENCE (ID_PART_A09, DATE_PRESENCE, NUMERO_MANIFESTATION, STATUTPART_A09) VALUES (?,?,?,?)", [guestsList.id, today, eventID, 3], function(tx, res) {
                                    });

                                    tx.executeSql("INSERT INTO CHANGE_LIST_I42_INV_DATES_PRESENCE (ID_PART_A09, DATE_PRESENCE, NUMERO_MANIFESTATION, STATUTPART_A09) VALUES (?,?,?,?)", [guestsList.id, today, eventID, 3], function(tx, res) {
                                    });

                                    tx.executeSql("UPDATE A09_PARTICIPANT set StatusID=3 WHERE ID =?", [guestsList.id], function(tx, res) {
                                    });

                                    tx.executeSql("UPDATE A09_PARTICIPANT set DatePresence=? WHERE ID =?", [today ,guestsList.id], function(tx, res) {
                                    });

                                    $("#guestsListLocal").listview("refresh");

                                    if(guestsList.qrCode == 1){
                                        showOkScanPageLocal(lastname, firstname);
                                    }else{
                                        loadParticipantInfo();
                                    }

                                    setTimeout(function(){ 
                                        $.unblockUI();
                                    }, 200); 
                                }
                                else{
                                    var datePresence = new Date(res.rows.item(0).DATE_PRESENCE);
                                    if (datePresence.getDate() != today.getDate() && datePresence.getMonth() != today.getMonth() && datePresence.getFullYear() != today.getFullYear()){
                                        ajax.blockuiNoMsg();
                                        var eventID = window.localStorage.getItem("eventId", guestsList.eventId);

                                        tx.executeSql("INSERT INTO CHANGE_LIST (ID, StatusID) VALUES (?,?)", [guestsList.id, 3], function(tx, res) {
                                        });

                                        tx.executeSql("INSERT INTO I42_INV_DATES_PRESENCE (ID_PART_A09, DATE_PRESENCE, NUMERO_MANIFESTATION, STATUTPART_A09) VALUES (?,?,?,?)", [guestsList.id, today, eventID, 3], function(tx, res) {
                                        });

                                        tx.executeSql("INSERT INTO CHANGE_LIST_I42_INV_DATES_PRESENCE (ID_PART_A09, DATE_PRESENCE, NUMERO_MANIFESTATION, STATUTPART_A09) VALUES (?,?,?,?)", [guestsList.id, today, eventID, 3], function(tx, res) {
                                        });
                                    
                                        $("#guestsListLocal").listview("refresh");
                                        if(guestsList.qrCode == 1){
                                            showOkScanPageLocal(lastname, firstname);
                                        }else{
                                            loadParticipantInfo();
                                            document.getElementById("iconUserInfoGuestPageLocal").style.color = "green";
                                        }

                                        setTimeout(function(){ 
                                            $.unblockUI();
                                        }, 200);                                 
                                    }else{
                                        if(guestsList.qrCode == 1){
                                            showAlreadyScanPageLocal();
                                        }
                                        else{
                                            navigator.notification.alert(
                                                "Le participant est d\351j\340 pr\351sent", 
                                                alertDismissed,       
                                                "Notification",            
                                                "Ok"                
                                            );
                                        }
                                    }
                                }
                            });
                        });
                    }
                });
            });
        }
        navigator.notification.vibrate(500);
    }

    function moreInfoScanLocal(){
        if(guestsList.tablette){
            $.mobile.changePage( "#guestsPageLocal", { transition: "slide", changeHash: false });
        }else{
            $.mobile.changePage( "#infoGuestPageLocal", { transition: "slide", changeHash: false });
        }
    }

    function scanAgainLocal(){
        setTimeout(function(){ scanQrCodeLocal(); }, 50);
    }

    function scanQrCodeLocal(){
        guestsList.qrCode = 1;
        guestsList.dialog = 10;
        openBarcodeScan("scan", function (barcode) {
            guestsList.id = getParameterByName(barcode.text, "IdA09");
            if(guestsList.id != ""){
                validateLocal();
            }else{
                navigator.notification.vibrate(500);
                showErrorScanPageLocal();
            }
        });
    }
    
    $(document).on('vclick', '#guestsListLocalFooterBtnQrcode', function(){
        scanQrCodeLocal();
    });

    /******    #subregion infoGuestPageLocal   *****/
    function loadParticipantInfo(){
        $('#guestDataLocal').empty();

        var db = window.sqlitePlugin.openDatabase({name: "my.db"});
        var monthsInYear= new Array("janvier", "f\351vrier", "mars", "avril", "mai", "juin", "juillet", "ao\373t", "septembre", "octobre", "novembre", "d\351cembre");

        if(guestsList.prestations){
            db.transaction(function(tx) {                
                tx.executeSql("select *, ID_STATUT_A39 from A09_PARTICIPANT as a left join A07_INSCRIPTION as b on a.ID=b.ID_PARTICIPANT where b.ID=?;", [guestsList.id], function(tx, res) {
                    document.getElementById("infoGuestPageLocalName").innerHTML = res.rows.item(0).FirstName + " " + res.rows.item(0).LastName;
                    document.getElementById("infoGuestPageLocalCategory").innerHTML = res.rows.item(0).Category;

                    $('#guestDataLocal').append(
                        '<strong>Soci\351t\351: </strong>' + res.rows.item(0).Societe + '<br/>' +
                        '<strong>Email: </strong>' + res.rows.item(0).Email + '<br/>' +
                        '<strong>T\351l\351phone: </strong>' + res.rows.item(0).Tel + '<br/>'
                    );
                    $('#guestDataPrestationsListLocal').empty();
                    var statusID = res.rows.item(0).StatusID;
                    var participantID =  res.rows.item(0).ID;
                    db.transaction(function(tx) {  
                        tx.executeSql("select count(*) as cnt from I42_INV_DATES_PRESENCE where ID_PART_A09=?;", [participantID], function(tx, res) {
                            if(res.rows.item(0).cnt == 0){
                                $('#guestDataPrestationsListLocal').append('<li><i class="fa fa-home homePrestation"></i><h3>Accueil Principal</h3>' +
                                    '<span class="infoGuestStatusLocal status' + statusID +  '">[' + guestsList.statusPar[statusID] + ']</span>'+
                                    '<p>Date de validation:</p></li>');
                            }else{
                                db.transaction(function(tx) {  
                                    tx.executeSql("select * from I42_INV_DATES_PRESENCE where ID_PART_A09=?;", [participantID], function(tx, res) {
                                        var tmpText = '<li><i class="fa fa-home homePrestation"></i><h3>Accueil Principal</h3>' +
                                        '<span class="infoGuestStatusLocal status' + res.rows.item(0).STATUS_PART_A09 +  '">[' + guestsList.statusPar[res.rows.item(0).STATUTPART_A09] + ']</span>';
                                        for (i = 0; i < res.rows.length; i++) {
                                            var date = new Date(res.rows.item(i).DATE_PRESENCE);
                                            if(date.getFullYear() < 2000){
                                               tmpText += '<p>Date de validation:</p>';
                                            }else{
                                                tmpText += '<p>Date de validation: ' + date.getDate() + " " + monthsInYear[date.getMonth()] + " " + date.getFullYear()  + '</p>';  
                                            } 
                                        }
                                        tmpText += '</li>';
                                        $('#guestDataPrestationsListLocal').append(tmpText);
                                    });
                                }); 
                            }
                        });
                    }); 
                });

                tx.executeSql("select * from A07_INSCRIPTION where ID=?;", [guestsList.id], function(tx, res) {
                    var id = res.rows.item(0).ID_PARTICIPANT;

                    db.transaction(function(tx) {  
                        tx.executeSql("select *,  LIBELLE from A07_INSCRIPTION as a left join A10_PRESTATION as b on a.PRESTATION_A10=b.ID where a.ID_PARTICIPANT=?;", [id], function(tx, res) {
                            for (i = 0; i < res.rows.length; i++) {
                                var date2 = new Date(res.rows.item(i).DatePresence);
                                if(date2.getFullYear() < 2000){
                                    $('#guestDataPrestationsListLocal').append('<li><i class="fa fa-ticket"></i><h3>' + res.rows.item(i).A10_LIBELLE + '</h3>' + 
                                    '<span class="infoGuestStatusLocal status' + res.rows.item(i).ID_STATUT_A39 +  '">[' + guestsList.statusPar[res.rows.item(i).ID_STATUT_A39] + ']</span>' + 
                                    '<p>Date de validation: </p></li>');  

                                }else{
                                    $('#guestDataPrestationsListLocal').append('<li><i class="fa fa-ticket"></i><h3>' + res.rows.item(i).LIBELLE + '</h3>' +  
                                    '<span class="infoGuestStatusLocal status' + res.rows.item(i).ID_STATUT_A39 +  '">[' + guestsList.statusPar[res.rows.item(i).ID_STATUT_A39] + ']</span>' + 
                                    '<p>Date de validation: ' + date2.getDate() + " " + monthsInYear[date2.getMonth()] + " " + date2.getFullYear()  + '</p></li>');  
                                }
                            }
                            $('#guestDataPrestationsListLocal').listview("refresh");
                        });
                    }); 
                });              
            });
        }
        else{
            db.transaction(function(tx) {
                tx.executeSql("select * from A09_PARTICIPANT WHERE ID=?;", [guestsList.id], function(tx, res) {
                    $('#guestDataLocal').empty();
                    document.getElementById("infoGuestPageLocalName").innerHTML = res.rows.item(0).FirstName + " " + res.rows.item(0).LastName;
                    document.getElementById("infoGuestPageLocalCategory").innerHTML = res.rows.item(0).Category;


                    $('#guestDataLocal').append(
                        '<strong>Soci\351t\351: </strong>' + res.rows.item(0).Societe + '<br/>' +
                        '<strong>Email: </strong>' + res.rows.item(0).Email + '<br/>' +
                        '<strong>T\351l\351phone: </strong>' + res.rows.item(0).Tel + '<br/>'
                    );

                    var statusID = res.rows.item(0).StatusID;


                    $('#guestDataPrestationsListLocal').empty();
                    tx.executeSql("select count(*) as cnt from I42_INV_DATES_PRESENCE where ID_PART_A09=?;", [guestsList.id], function(tx, res) {
                        if(res.rows.item(0).cnt == 0){
                            $('#guestDataPrestationsListLocal').append('<li><i class="fa fa-home homePrestation"></i><h3>Accueil Principal</h3>' +
                                '<span class="infoGuestStatusLocal status' + statusID +  '">[' + guestsList.statusPar[statusID] + ']</span>'+
                                '<p>Date de validation:</p></li>');
                        }else{  
                            tx.executeSql("select * from I42_INV_DATES_PRESENCE where ID_PART_A09=?;", [guestsList.id], function(tx, res) {
                                var tmpText = '<li><i class="fa fa-home homePrestation"></i><h3>Accueil Principal</h3>' +
                                '<span class="infoGuestStatusLocal status' + res.rows.item(0).STATUTPART_A09 +  '">[' + guestsList.statusPar[res.rows.item(0).STATUTPART_A09] + ']</span>';
                                for (i = 0; i < res.rows.length; i++) {
                                    var date = new Date(res.rows.item(i).DATE_PRESENCE);
                                    if(date.getFullYear() < 2000){
                                       tmpText += '<p>Date de validation:</p>';
                                    }else{
                                        tmpText += '<p>Date de validation: ' + date.getDate() + " " + monthsInYear[date.getMonth()] + " " + date.getFullYear()  + '</p>';  
                                    } 
                                }
                                tmpText += '</li>';
                                $('#guestDataPrestationsListLocal').append(tmpText);
                            });
                        }

                        tx.executeSql("select * from A07_INSCRIPTION as a left join A10_PRESTATION as b on a.PRESTATION_A10=b.ID where a.ID_PARTICIPANT=?;", [guestsList.id], function(tx, res) {
                            for (i = 0; i < res.rows.length; i++) {
                                var date2 = new Date(res.rows.item(i).DatePresence);
                                if(date2.getFullYear() < 2000){
                                    $('#guestDataPrestationsListLocal').append('<li><i class="fa fa-ticket"></i><h3>' + res.rows.item(i).LIBELLE + '</h3>' + 
                                    '<span class="infoGuestStatusLocal status' + res.rows.item(i).ID_STATUT_A39 +  '">[' + guestsList.statusPar[res.rows.item(i).ID_STATUT_A39] + ']</span>' + 
                                    '<p>Date de validation: </p></li>');  

                                }else{
                                    $('#guestDataPrestationsListLocal').append('<li><i class="fa fa-ticket"></i><h3>' + res.rows.item(i).LIBELLE + '</h3>' +
                                    '<span class="infoGuestStatusLocal status' + res.rows.item(i).ID_STATUT_A39 +  '">[' + guestsList.statusPar[res.rows.item(i).ID_STATUT_A39] + ']</span>' + 
                                    '<p>Date de validation: ' + date2.getDate() + " " + monthsInYear[date2.getMonth()] + " " + date2.getFullYear()  + '</p></li>');  
                                }
                            }
                            $('#guestDataPrestationsListLocal').listview("refresh");
                        });
                    }); 
                });               
            });
        }
    }
    
    /********** #subregion LOCAL GUEST LIST OPTION PANEL  *********/
    $(document).on('vclick', '#guestsListLocalFooterBtnSearch', function(){
        $.mobile.silentScroll(0);
        setTimeout(function(){ dialogSearch.show(); }, 50);
        guestsList.dialog = 2;


        $('#searchForm').on('submit', function(event) {
            event.preventDefault(); 

            $('#searchField').blur();

            setTimeout(function() {
                $('#btnSearch').trigger( 'click' );
            }, 50);
            return false;
        });
    });

    $(document).on('vclick', '#deleteBtnLocalSearchFilter', function() {
        $('#guestsPageLocalSearchFilter').fadeOut("slow");
        setTimeout(function(){
            var db = window.sqlitePlugin.openDatabase({name: "my.db"});

            if(prestations && guestsList.prestationId != 0){
                db.transaction(function(tx) {
                    tx.executeSql("select a.*,  b.ID_STATUT_A39 from A09_PARTICIPANT as a left join A07_INSCRIPTION as b on a.ID=b.ID_PARTICIPANT where PRESTATION_A10=? limit 100;", [guestsList.prestationId], function(tx, res) {
                        $("#guestsListLocal").empty();

                        for (i = 0; i < res.rows.length; i++) {
                            $('#guestsListLocal').append('<li><a href="" data-id="' +
                            res.rows.item(i).ID + '"><h3><i class="fa fa-user fa-2x"></i>' + res.rows.item(i).LastName + '</h3><p>' + res.rows.item(i).FirstName +
                            '<span class="statusListView status' + res.rows.item(i).ID_STATUT_A39 +  ' ">[' + guestsList.statusPar[res.rows.item(i).ID_STATUT_A39] + ']</span></p></a></li>');
                        }
                        guestsList.startRecord = 100;
                        guestsList.nbRecord = res.rows.length;

                    });
                    tx.executeSql("select count(*) as cnt from A09_PARTICIPANT as a left join A07_INSCRIPTION as b on a.ID=b.ID_PARTICIPANT where PRESTATION_A10=? limit 100;", [guestsList.prestationId], function(tx, res) {
                        guestsList.nbParticipants = res.rows.item(0).cnt; 
                        document.getElementById("guestsPageLocalNbResults").innerHTML = guestsList.nbParticipants + " r\351sultat(s)";
                    });
                    setTimeout(function(){
                        $("#guestsListLocal").listview("refresh");
                    }, 50);
                });
            }
            else
            {
                db.transaction(function(tx) {
                    tx.executeSql("select * from A09_PARTICIPANT limit 100;" + guestsList.startRecord + ";", [], function(tx, res) {
                        $("#guestsListLocal").empty();
                        for (i = 0; i < res.rows.length; i++) {
                            $('#guestsListLocal').append('<li><a href="" data-id="' +
                            res.rows.item(i).ID + '"><h3><i class="fa fa-user fa-2x"></i>' + res.rows.item(i).LastName + '<p>' + res.rows.item(i).FirstName +
                            '<span class="statusListView status' + res.rows.item(i).StatusID +  ' ">[' + guestsList.statusPar[res.rows.item(i).StatusID] + ']</span></p></h3></a></li>');
                        }
                        $("#guestsListLocal").listview("refresh");
                        document.getElementById("guestsPageLocalNbResults").innerHTML = guestsList.nbParticipants + " r\351sultat(s)";
                    });
                });
            }
        }, 200);
    });

    /***********************************************/
    /*********     #region Lazy Loading     ********/
    /***********************************************/
    function addMore(page) {
        if(page[0].id == "guestsPage" && guestsList.dialog != 6){
            if(guestsList.list.length == guestsList.startRecord){
                $.mobile.loading("show", {
                    text: "Chargement...",
                    textVisible: true,
                    theme: "b"
                });

                guestsList.startRecord++;
                if(guestsList.prestations){
                    var fullURLGet = 'methods/MobileApp/GetEventsList?id=' + guestsList.prestationId + '&idManif=' + guestsList.eventId + '&Prestation=true&StartRecord=' + guestsList.startRecord + '&RecordsCount=100';

                    $.ajax({
                        type: 'GET',
                        url: url + fullURLGet,
                        crossDomain: true,
                        headers: {'AgoraEvent-Token': ApiToken},
                        success: function (result) {
                            guestsList.startRecord += 100;
                            guestsList.list = guestsList.list.concat(result);

                            $.each(result, function(i, row) {
                                $('#guestsList').append('<li><a href="" data-id="' +
                                row.ID + '"><h3><i class="fa fa-user fa-2x"></i>' + row.LastName + '<p>' + row.FirstName +
                                '<span class="statusListView status' + row.StatusID +  ' ">[' + guestsList.statusPar[row.StatusID] + ']</span></p></h3></a></li>');
                            });
                            $('#guestsList').listview('refresh');
                            $.mobile.loading("hide");
                        },
                        error: function (request,error) {
                            $.mobile.loading("hide");
                            if(request.status == 401){
                                // Unauthorized
                                navigator.notification.alert(
                                    "Votre session a expir\351, veuillez-vous identifier \340 nouveau", 
                                    alertDismissed,       
                                    "Notification",            
                                    "Ok"                
                                );
                                $.mobile.changePage( "#loginPage", { transition: "slide", reverse: true, changeHash: false });
                            }
                            navigator.notification.alert(
                                "Erreur lors du chargement des invit\351s", 
                                alertDismissed,       
                                "Notification",            
                                "Ok"                
                            );
                        }
                    });
                }
                else{
                    $.ajax({
                        type: 'GET',
                        url: url + 'MobileApp?id=' + guestsList.eventId + '&StartRecord=' + guestsList.startRecord + '&RecordsCount=100',
                        crossDomain: true,
                        headers: {'AgoraEvent-Token': ApiToken},
                        success: function (result) {
                            guestsList.startRecord += 100;
                            guestsList.list = guestsList.list.concat(result);

                            $.each(result, function(i, row) {
                                $('#guestsList').append('<li><a href="" data-id="' +
                                row.ID + '"><h3><i class="fa fa-user fa-2x"></i>' + row.LastName + '<p>' + row.FirstName +
                                '<span class="statusListView status' + row.StatusID +  ' ">[' + guestsList.statusPar[row.StatusID] + ']</span></p></h3></a></li>');
                            });
                            $('#guestsList').listview('refresh');
                            $.mobile.loading("hide");
                        },
                        error: function (request,error) {
                            $.mobile.loading("hide");
                            if(request.status == 401){
                                // Unauthorized
                                navigator.notification.alert(
                                    "Votre session a expir\351, veuillez-vous identifier \340 nouveau", 
                                    alertDismissed,       
                                    "Notification",            
                                    "Ok"                
                                );

                                $.mobile.changePage( "#loginPage", { transition: "slide", reverse: true, changeHash: false });
                            }
                            navigator.notification.alert(
                                "Erreur lors du chargement des invit\351s", 
                                alertDismissed,       
                                "Notification",            
                                "Ok"                
                            );
                        }
                    });
                }   
                    
            }
        }
        else if(page[0].id == "guestsPageLocal" && guestsList.dialog != 6){
            if(guestsList.nbRecord == guestsList.startRecord){
                $.mobile.loading("show", {
                    text: "Chargement...",
                    textVisible: true,
                    theme: "b"
                });

                var db = window.sqlitePlugin.openDatabase({name: "my.db"});

                if(guestsList.prestations){
                    db.transaction(function(tx) {
                        tx.executeSql("select *,  ID_STATUT_A39 from A09_PARTICIPANT as a left join A07_INSCRIPTION as b on a.ID=b.ID_PARTICIPANT where PRESTATION_A10=? limit " + guestsList.nbRecord + ", 100;", [guestsList.prestationId], function(tx, res) {
                            for (i = 0; i < res.rows.length; i++) {
                                $('#guestsListLocal').append('<li><a href="" data-id="' +
                                res.rows.item(i).ID + '"><h3><i class="fa fa-user fa-2x"></i>' + res.rows.item(i).LastName + '<p>' + res.rows.item(i).FirstName +
                                '<span class="statusListView status' + res.rows.item(i).ID_STATUT_A39 +  ' ">[' + guestsList.statusPar[res.rows.item(i).ID_STATUT_A39] + ']</span></p></h3></a></li>');
                            }
                            $("#guestsListLocal").listview("refresh");
                            guestsList.startRecord += 100;
                            guestsList.nbRecord += res.rows.length;

                            $.mobile.loading("hide");
                        });
                    });
                }
                else{
                    db.transaction(function(tx) {
                        tx.executeSql("select * from A09_PARTICIPANT limit " + guestsList.nbRecord + ", 100;", [], function(tx, res) {
                            for (i = 0; i < res.rows.length; i++) {
                                $('#guestsListLocal').append('<li><a href="" data-id="' +
                                res.rows.item(i).ID + '"><h3><i class="fa fa-user fa-2x"></i>' + res.rows.item(i).LastName + '<p>' + res.rows.item(i).FirstName +
                                '<span class="statusListView status' + res.rows.item(i).StatusID +  ' ">[' + guestsList.statusPar[res.rows.item(i).StatusID] + ']</span></p></h3></a></li>');
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
        if ((activePage[0].id == "guestsPage" || activePage[0].id == "guestsPageLocal") && scrolled >= scrollEnd) {
            addMore(activePage);
        }
    });

    /***********************************************/
    /***********  #region  Swipe  ******************/
    /***********************************************/
    $("#loginPage").swiperight(function() {
        $.mobile.changePage("#mainPage", { transition: "slide", reverse: true, changeHash: false });
    });

    $("#infoGuestPage").swiperight(function() {
        $.mobile.changePage("#guestsPage", { transition: "slide", reverse: true, changeHash: false });
    });

    $("#eventsPage").swiperight(function() {
        $.mobile.changePage("#loginPage", { transition: "slide", reverse: true, changeHash: false });
    });
