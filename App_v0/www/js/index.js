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
    $(document).ajaxStop($.unblockUI);

    var authenticate = function() {
        var form = $("#authenticationForm");
        //disable the button so we can't resubmit while we wait
        //$("#btnConnexion",form).attr("disabled","disabled");
        var username = $("#username", form).val();
        var password = $("#password", form).val();

        if(username != "" && password != "") {
            $.blockUI();
            $.ajax({
                type: 'POST',
                url: 'http://demo.agoraevent.fr/api/Authentication/authenticate',
                //url: 'http://localhost:60200/api/Authentication/authenticate',
                crossDomain: true,
                data:  {login: username, password : password},
                dataType: 'json',
                success: function (result) {
                    ApiToken = result;
                    $.mobile.changePage( "#eventsPage", { transition: "slide", changeHash: false });
                },
                error: function (request,error) {
                    if(request.status == 401){
                        alert("Combinaison identifiants / mot de passe invalide");
                    }
                }
            });

            /*
            $.ajax({
                type: 'GET',
                url: 'http://localhost:58001/api/Event/',
                crossDomain: true,
                dataType: "json",
                success: function (result) {
                    var obj = jQuery.parseJSON(result);
                    ajax.parseEvents(obj);
                    $.mobile.changePage( "#eventsPage", { transition: "slide", changeHash: false });
                },
                error: function (request,error) {
                    alert('Network error has occurred please try again!');
                }
            });
            */
        }
        else {
            //if the email and password is empty
            alert("Veuillez renseigner les champs d'authentification");
        }
    };

    var guestsList = {
        id : null,
        list : null
    }

    var ApiToken = null;

    var ajax = {
        parseEvents:function(result){
            $('#eventsList').empty();
            $.each(result, function(i, row) {
                console.log(JSON.stringify(row));
                $('#eventsList').append('<li><a href="" data-id="' + row.ID + '"><h3>' + row.Title + '</h3><p>' + row.StartDate + '</p></a></li>');
            });
            $('#eventsList').listview('refresh');
        },
        parseGuests:function(result){
            $('#guestsList').empty();
            guestsList.list = result;
            $.each(result, function(i, row) {
                console.log(JSON.stringify(row));
                $('#guestsList').append('<li><a href="" data-id="' + row.ID + '"><h3>' + row.LastName + '</h3><p>' + row.FirstName + '</p></a></li>');
            });
        },
        getEventsList: function(){
            $.blockUI();
            $.ajax({
                type: 'GET',
                url: 'http://demo.agoraevent.fr/api/Events/',
                //url: 'http://localhost:60200/api/Events/',
                crossDomain: true,
                headers: {'AgoraEvent-Token': ApiToken},
                success: function (result) {
                    ajax.parseEvents(result);
                },
                error: function (request, error) {
                    alert("Error in finding event list");
                }
            });
        }
    }

    $(document).on('pagebeforeshow', '#eventsPage', function(){
        ajax.getEventsList();
    });

    $(document).on('pagebeforeshow', '#guestsPage', function(){
        $('#guestsList').listview('refresh');
    });

    $( document ).on( "ready", function(){
        $('#btnConnexion').on('click', authenticate);
    });

    $(document).on('vclick', '#eventsList li a', function(){
        var id = $(this).attr('data-id');
        $.blockUI();
        $.ajax({
            type: 'GET',
            url: 'http://demo.agoraevent.fr/api/methods/events/' + id + '/ParticipantStatus/',
            //url: 'http://localhost:60200/api/methods/events/' + id + '/ParticipantStatus/',
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

    $(document).on('pagebeforeshow', '#infoGuestPage', function(){
        $('#guestData').empty();
        $.each(guestsList.list, function(i, row) {
            if(row.ID == guestsList.id) {
                $('#guestData').append('<li>Nom: '+row.FirstName+'</li>');
                $('#guestData').append('<li>Prenom : '+row.LastName+'</li>');
                $('#guestData').append('<li>Email : '+row.Email+'</li>');
                $('#guestData').append('<li>Status : '+row.StatusName+'</li>');
                $('#guestData').listview('refresh');
            }
        });
    });

    $(document).on('vclick', '#guestsList li a', function(){
        guestsList.id = $(this).attr('data-id');
        $.mobile.changePage( "#infoGuestPage", { transition: "slide", changeHash: false });
    });

    $(document).on('vclick', '#qrCode', function(){
        var scanner = cordova.require("com.phonegap.plugins.barcodescanner.barcodescanner");

        scanner.scan(
            function (result) {
                alert("We got a barcode\n" +
                "Result: " + result.text + "\n" +
                "Format: " + result.format + "\n" +
                "Cancelled: " + result.cancelled);
            },
            function (error) {
                alert("Scanning failed: " + error);
            }
        );
    });
}
)(jQuery);